// use std::collections::HashMap; // 暂时未使用
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use serde::{Deserialize, Serialize};
use tauri::Emitter;
use tauri_plugin_http::reqwest;
use tokio::fs::{File, OpenOptions};
use tokio::io::{AsyncSeekExt, AsyncWriteExt};
use tokio::sync::broadcast;
use tokio::task::JoinHandle;

/// 多线程下载配置
#[derive(Debug, Clone)]
pub struct MultiThreadConfig {
    /// 并发连接数
    pub max_connections: usize,
    /// 每个分块的最小大小（字节）
    pub min_chunk_size: u64,
    /// 最大重试次数
    pub max_retries: u32,
    /// 连接超时时间（秒）
    pub timeout_seconds: u64,
}

impl Default for MultiThreadConfig {
    fn default() -> Self {
        Self {
            max_connections: 8,
            min_chunk_size: 1024 * 1024, // 1MB
            max_retries: 5,
            timeout_seconds: 30,
        }
    }
}

/// 下载分块信息
#[derive(Debug, Clone)]
struct DownloadChunk {
    /// 分块索引
    index: usize,
    /// 起始字节位置
    start: u64,
    /// 结束字节位置
    end: u64,
    /// 已下载字节数
    downloaded: u64,
    /// 分块状态
    status: ChunkStatus,
    /// 重试次数
    retries: u32,
}

#[derive(Debug, Clone, PartialEq)]
enum ChunkStatus {
    Pending,
    Downloading,
    Completed,
    Failed,
}

/// 多线程下载器
pub struct MultiThreadDownloader {
    config: MultiThreadConfig,
    client: reqwest::Client,
}

/// 下载进度信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadProgress {
    pub task_id: String,
    pub total_size: u64,
    pub downloaded_size: u64,
    pub progress: f64,
    pub speed: String,
    pub active_connections: usize,
    pub eta: Option<String>,
}

/// 下载控制信号
#[derive(Debug, Clone)]
pub enum DownloadControl {
    Pause,
    Cancel,
    Resume,
}

impl MultiThreadDownloader {
    /// 创建新的多线程下载器
    pub fn new(config: MultiThreadConfig) -> Self {
        let client = reqwest::Client::builder()
            .timeout(Duration::from_secs(config.timeout_seconds))
            .pool_max_idle_per_host(config.max_connections)
            .pool_idle_timeout(Duration::from_secs(90))
            .tcp_keepalive(Duration::from_secs(60))
            .http2_prior_knowledge()
            .build()
            .expect("Failed to create HTTP client");

        Self { config, client }
    }

    /// 检查服务器是否支持范围请求
    async fn supports_range_requests(&self, url: &str) -> Result<(bool, u64), Box<dyn std::error::Error + Send + Sync>> {
        let response = self.client.head(url).send().await?;
        
        let supports_range = response
            .headers()
            .get("accept-ranges")
            .map(|v| v.to_str().unwrap_or("").contains("bytes"))
            .unwrap_or(false);

        let content_length = response
            .headers()
            .get("content-length")
            .and_then(|v| v.to_str().ok())
            .and_then(|v| v.parse::<u64>().ok())
            .unwrap_or(0);

        Ok((supports_range, content_length))
    }

    /// 计算下载分块
    fn calculate_chunks(&self, total_size: u64) -> Vec<DownloadChunk> {
        if total_size < self.config.min_chunk_size {
            // 文件太小，使用单线程下载
            return vec![DownloadChunk {
                index: 0,
                start: 0,
                end: total_size - 1,
                downloaded: 0,
                status: ChunkStatus::Pending,
                retries: 0,
            }];
        }

        let chunk_size = std::cmp::max(
            total_size / self.config.max_connections as u64,
            self.config.min_chunk_size,
        );

        let mut chunks = Vec::new();
        let mut start = 0;
        let mut index = 0;

        while start < total_size {
            let end = std::cmp::min(start + chunk_size - 1, total_size - 1);
            chunks.push(DownloadChunk {
                index,
                start,
                end,
                downloaded: 0,
                status: ChunkStatus::Pending,
                retries: 0,
            });
            start = end + 1;
            index += 1;
        }

        chunks
    }

    /// 下载单个分块
    async fn download_chunk(
        &self,
        url: &str,
        chunk: &mut DownloadChunk,
        file_path: &PathBuf,
        control_rx: &mut broadcast::Receiver<DownloadControl>,
    ) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        chunk.status = ChunkStatus::Downloading;
        
        let range_header = format!("bytes={}-{}", chunk.start + chunk.downloaded, chunk.end);
        
        let mut retries = 0;
        while retries <= self.config.max_retries {
            // 检查控制信号
            if let Ok(control) = control_rx.try_recv() {
                match control {
                    DownloadControl::Pause | DownloadControl::Cancel => {
                        return Ok(());
                    }
                    DownloadControl::Resume => {
                        // 继续下载
                    }
                }
            }

            let request = self.client
                .get(url)
                .header("Range", &range_header);

            match request.send().await {
                Ok(response) => {
                    if response.status().is_success() || response.status() == reqwest::StatusCode::PARTIAL_CONTENT {
                        match self.write_chunk_data(response, chunk, file_path, control_rx).await {
                            Ok(_) => {
                                chunk.status = ChunkStatus::Completed;
                                return Ok(());
                            }
                            Err(e) => {
                                println!("写入分块数据失败: {}", e);
                                retries += 1;
                                if retries <= self.config.max_retries {
                                    tokio::time::sleep(Duration::from_secs(retries as u64)).await;
                                }
                            }
                        }
                    } else {
                        println!("分块下载失败，状态码: {}", response.status());
                        retries += 1;
                        if retries <= self.config.max_retries {
                            tokio::time::sleep(Duration::from_secs(retries as u64)).await;
                        }
                    }
                }
                Err(e) => {
                    println!("分块请求失败: {}", e);
                    retries += 1;
                    if retries <= self.config.max_retries {
                        tokio::time::sleep(Duration::from_secs(retries as u64)).await;
                    }
                }
            }
        }

        chunk.status = ChunkStatus::Failed;
        chunk.retries = retries;
        Err(format!("分块 {} 下载失败，已重试 {} 次", chunk.index, retries).into())
    }

    /// 写入分块数据到文件
    async fn write_chunk_data(
        &self,
        mut response: reqwest::Response,
        chunk: &mut DownloadChunk,
        file_path: &PathBuf,
        control_rx: &mut broadcast::Receiver<DownloadControl>,
    ) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let mut file = OpenOptions::new()
            .write(true)
            .create(true)
            .open(file_path)
            .await?;

        // 定位到分块起始位置
        file.seek(std::io::SeekFrom::Start(chunk.start + chunk.downloaded)).await?;

        let mut buffer = Vec::with_capacity(8192); // 8KB 缓冲区
        
        while let Some(bytes) = response.chunk().await? {
            // 检查控制信号
            if let Ok(control) = control_rx.try_recv() {
                match control {
                    DownloadControl::Pause | DownloadControl::Cancel => {
                        return Ok(());
                    }
                    DownloadControl::Resume => {
                        // 继续下载
                    }
                }
            }

            buffer.extend_from_slice(&bytes);
            
            // 当缓冲区达到一定大小时写入文件
            if buffer.len() >= 8192 {
                file.write_all(&buffer).await?;
                chunk.downloaded += buffer.len() as u64;
                buffer.clear();
            }
        }

        // 写入剩余数据
        if !buffer.is_empty() {
            file.write_all(&buffer).await?;
            chunk.downloaded += buffer.len() as u64;
        }

        file.flush().await?;
        Ok(())
    }

    /// 多线程下载文件
    pub async fn download(
        &self,
        app: tauri::AppHandle,
        task_id: String,
        url: String,
        file_path: PathBuf,
        control_rx: broadcast::Receiver<DownloadControl>,
    ) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        println!("开始多线程下载: {}", url);

        // 检查服务器支持和获取文件大小
        let (supports_range, total_size) = self.supports_range_requests(&url).await?;
        
        if total_size == 0 {
            return Err("无法获取文件大小".into());
        }

        println!("文件大小: {} bytes, 支持范围请求: {}", total_size, supports_range);

        // 创建文件
        if let Some(parent) = file_path.parent() {
            tokio::fs::create_dir_all(parent).await?;
        }
        
        // 预分配文件空间
        let file = File::create(&file_path).await?;
        file.set_len(total_size).await?;
        drop(file);

        let chunks = if supports_range {
            self.calculate_chunks(total_size)
        } else {
            // 不支持范围请求，使用单线程下载
            vec![DownloadChunk {
                index: 0,
                start: 0,
                end: total_size - 1,
                downloaded: 0,
                status: ChunkStatus::Pending,
                retries: 0,
            }]
        };

        println!("分块数量: {}", chunks.len());

        let chunks = Arc::new(Mutex::new(chunks));
        let mut handles: Vec<JoinHandle<Result<(), Box<dyn std::error::Error + Send + Sync>>>> = Vec::new();
        
        // 创建进度监控任务
        let progress_chunks = chunks.clone();
        let progress_app = app.clone();
        let progress_task_id = task_id.clone();
        let progress_handle = tokio::spawn(async move {
            let mut last_update = Instant::now();
            let mut last_downloaded = 0u64;
            let mut speed_samples: Vec<u64> = Vec::new();
            const MAX_SPEED_SAMPLES: usize = 10;

            loop {
                tokio::time::sleep(Duration::from_millis(500)).await;
                
                let (total_downloaded, active_connections, all_completed) = {
                    let chunks_guard = progress_chunks.lock().unwrap();
                    let total_downloaded: u64 = chunks_guard.iter().map(|c| c.downloaded).sum();
                    let active_connections = chunks_guard.iter().filter(|c| c.status == ChunkStatus::Downloading).count();
                    let all_completed = chunks_guard.iter().all(|c| c.status == ChunkStatus::Completed);
                    (total_downloaded, active_connections, all_completed)
                };

                let now = Instant::now();
                let time_elapsed = now.duration_since(last_update).as_secs_f64();
                
                if time_elapsed > 0.0 {
                    let current_speed = ((total_downloaded - last_downloaded) as f64 / time_elapsed) as u64;
                    speed_samples.push(current_speed);
                    if speed_samples.len() > MAX_SPEED_SAMPLES {
                        speed_samples.remove(0);
                    }
                }

                let avg_speed = if !speed_samples.is_empty() {
                    speed_samples.iter().sum::<u64>() / speed_samples.len() as u64
                } else {
                    0
                };

                let progress = (total_downloaded as f64 / total_size as f64) * 100.0;
                let speed_str = format_speed(avg_speed);
                
                let eta = if avg_speed > 0 {
                    let remaining_bytes = total_size - total_downloaded;
                    let eta_seconds = remaining_bytes / avg_speed;
                    Some(format_duration(eta_seconds))
                } else {
                    None
                };

                let progress_info = DownloadProgress {
                    task_id: progress_task_id.clone(),
                    total_size,
                    downloaded_size: total_downloaded,
                    progress,
                    speed: speed_str,
                    active_connections,
                    eta,
                };

                let _ = progress_app.emit("multi_thread_download_progress", &progress_info);
                
                last_update = now;
                last_downloaded = total_downloaded;

                if all_completed {
                    break;
                }
            }
        });

        // 启动下载任务
        let max_concurrent = if supports_range {
            std::cmp::min(self.config.max_connections, chunks.lock().unwrap().len())
        } else {
            1
        };

        for _i in 0..max_concurrent {
            let downloader = self.clone();
            let url_clone = url.clone();
            let file_path_clone = file_path.clone();
            let chunks_clone = chunks.clone();
            let mut control_rx_clone = control_rx.resubscribe();
            
            let handle = tokio::spawn(async move {
                loop {
                    // 获取下一个待下载的分块
                    let mut chunk_to_download = None;
                    {
                        let mut chunks_guard = chunks_clone.lock().unwrap();
                        for chunk in chunks_guard.iter_mut() {
                            if chunk.status == ChunkStatus::Pending {
                                chunk_to_download = Some(chunk.clone());
                                chunk.status = ChunkStatus::Downloading;
                                break;
                            }
                        }
                    }

                    match chunk_to_download {
                        Some(mut chunk) => {
                            match downloader.download_chunk(&url_clone, &mut chunk, &file_path_clone, &mut control_rx_clone).await {
                                Ok(_) => {
                                    // 更新分块状态
                                    let mut chunks_guard = chunks_clone.lock().unwrap();
                                    if let Some(original_chunk) = chunks_guard.iter_mut().find(|c| c.index == chunk.index) {
                                        *original_chunk = chunk;
                                    }
                                }
                                Err(e) => {
                                    println!("分块下载失败: {}", e);
                                    // 更新分块状态为失败
                                    let mut chunks_guard = chunks_clone.lock().unwrap();
                                    if let Some(original_chunk) = chunks_guard.iter_mut().find(|c| c.index == chunk.index) {
                                        original_chunk.status = ChunkStatus::Failed;
                                        original_chunk.retries = chunk.retries;
                                    }
                                    return Err(e);
                                }
                            }
                        }
                        None => {
                            // 没有更多分块需要下载
                            break;
                        }
                    }
                }
                Ok(())
            });
            
            handles.push(handle);
        }

        // 等待所有下载任务完成
        let mut download_success = true;
        for handle in handles {
            if let Err(e) = handle.await? {
                println!("下载任务失败: {}", e);
                download_success = false;
            }
        }

        // 停止进度监控
        progress_handle.abort();

        if download_success {
            println!("多线程下载完成: {}", file_path.display());
            let _ = app.emit("multi_thread_download_completed", &task_id);
        } else {
            return Err("部分分块下载失败".into());
        }

        Ok(())
    }
}

// 实现 Clone trait 以支持在多个任务中使用
impl Clone for MultiThreadDownloader {
    fn clone(&self) -> Self {
        Self {
            config: self.config.clone(),
            client: self.client.clone(),
        }
    }
}

/// 格式化速度显示
fn format_speed(bytes_per_sec: u64) -> String {
    const UNITS: &[&str] = &["B/s", "KB/s", "MB/s", "GB/s"];
    let mut size = bytes_per_sec as f64;
    let mut unit_index = 0;
    
    while size >= 1024.0 && unit_index < UNITS.len() - 1 {
        size /= 1024.0;
        unit_index += 1;
    }
    
    format!("{:.1} {}", size, UNITS[unit_index])
}

/// 格式化时间显示
fn format_duration(seconds: u64) -> String {
    let hours = seconds / 3600;
    let minutes = (seconds % 3600) / 60;
    let secs = seconds % 60;
    
    if hours > 0 {
        format!("{}h {}m {}s", hours, minutes, secs)
    } else if minutes > 0 {
        format!("{}m {}s", minutes, secs)
    } else {
        format!("{}s", secs)
    }
}

/// 创建默认的多线程下载器实例
pub fn create_default_downloader() -> MultiThreadDownloader {
    MultiThreadDownloader::new(MultiThreadConfig::default())
}

/// 创建自定义配置的多线程下载器实例
pub fn create_custom_downloader(max_connections: usize, min_chunk_size: u64) -> MultiThreadDownloader {
    let config = MultiThreadConfig {
        max_connections,
        min_chunk_size,
        ..Default::default()
    };
    MultiThreadDownloader::new(config)
}