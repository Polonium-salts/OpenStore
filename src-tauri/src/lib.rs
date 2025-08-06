// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use chrono;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use tauri::Emitter;
use tauri::Manager;
use tauri::tray::{TrayIconBuilder, TrayIconEvent};
use tauri::menu::{Menu, MenuItem};
use tauri_plugin_http::reqwest;
use tokio::fs::{File, OpenOptions};
use tokio::io::AsyncWriteExt;
use tokio::sync::broadcast;

// 导入多线程下载器模块
mod multi_thread_downloader;
use multi_thread_downloader::{MultiThreadDownloader, MultiThreadConfig};
use std::sync::OnceLock;

// 全局多线程下载器实例
static MULTI_THREAD_DOWNLOADER: OnceLock<MultiThreadDownloader> = OnceLock::new();
type MultiThreadControlSender = Arc<Mutex<HashMap<String, broadcast::Sender<multi_thread_downloader::DownloadControl>>>>;

#[derive(Debug, Clone, Serialize, Deserialize)]
struct DownloadTask {
    id: String,
    url: String,
    file_name: String,
    file_path: String,
    total_size: u64,
    downloaded_size: u64,
    status: DownloadStatus,
    progress: f64,
    speed: String,
    created_at: u64,
    copy_count: u32,             // 副本数量
    is_copy: bool,               // 是否为副本
    original_id: Option<String>, // 原始任务ID（仅副本有值）
}

#[derive(Debug, Clone, Serialize, Deserialize)]
enum DownloadStatus {
    Pending,
    Downloading,
    Paused,
    Completed,
    Cancelled,
    Failed,
    Error,
}

// 下载控制信号
#[derive(Debug, Clone)]
enum DownloadControl {
    Pause(String),
    Cancel(String),
    #[allow(dead_code)]
    Resume(String),
}

// 下载管理器类型别名
type DownloadManager = Arc<Mutex<HashMap<String, DownloadTask>>>;
type DownloadControlSender = Arc<Mutex<HashMap<String, broadcast::Sender<DownloadControl>>>>;

// 获取多线程下载器实例
fn get_multi_thread_downloader() -> &'static MultiThreadDownloader {
    MULTI_THREAD_DOWNLOADER.get_or_init(|| {
        multi_thread_downloader::create_default_downloader()
    })
}
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

// 创建下载任务
#[tauri::command]
async fn create_download_task(
    app: tauri::AppHandle,
    url: String,
    file_name: Option<String>,
    download_path: Option<String>,
) -> Result<String, String> {
    let download_manager: tauri::State<DownloadManager> = app.state();
    let control_senders: tauri::State<DownloadControlSender> = app.state();

    // 检查是否已存在相同URL的下载任务
    let existing_task = {
        let manager = download_manager.lock().unwrap();
        manager
            .values()
            .find(|task| task.url == url && !task.is_copy)
            .cloned()
    };

    // 如果存在相同URL的任务，自动创建副本
    if let Some(original_task) = existing_task {
        let copy_ids = create_copy_download(app, original_task.id, 1).await?;
        // 返回第一个副本的ID
        return Ok(copy_ids
            .into_iter()
            .next()
            .unwrap_or_else(|| format!("copy_{}", chrono::Utc::now().timestamp_millis())));
    }

    // 生成唯一ID
    let task_id = format!("download_{}", chrono::Utc::now().timestamp_millis());

    // 确定下载路径
    let final_path = if let Some(path) = download_path {
        PathBuf::from(path)
    } else {
        // 使用设置的下载目录，如果没有设置则使用默认下载目录
        let download_dir = get_download_directory().await.unwrap_or_else(|_| {
            dirs::download_dir()
                .unwrap_or_else(|| PathBuf::from("./downloads"))
                .to_string_lossy()
                .to_string()
        });
        PathBuf::from(download_dir)
    };

    // 确定文件名
    let final_file_name =
        file_name.unwrap_or_else(|| url.split('/').last().unwrap_or("download").to_string());

    let file_path = final_path.join(&final_file_name);

    // 创建下载任务
    let task = DownloadTask {
        id: task_id.clone(),
        url,
        file_name: final_file_name,
        file_path: file_path.to_string_lossy().to_string(),
        status: DownloadStatus::Pending,
        progress: 0.0,
        total_size: 0,
        downloaded_size: 0,
        speed: "0.0 B/s".to_string(),
        created_at: chrono::Utc::now().timestamp_millis() as u64,
        copy_count: 0,
        is_copy: false,
        original_id: None,
    };

    // 创建控制信号发送器
    let (tx, _) = broadcast::channel(10);
    {
        let mut senders = control_senders.lock().unwrap();
        senders.insert(task_id.clone(), tx);
    }

    // 添加到管理器
    {
        let mut manager = download_manager.lock().unwrap();
        manager.insert(task_id.clone(), task.clone());
    }

    // 发送任务创建事件
    app.emit("download_task_created", &task)
        .map_err(|e| e.to_string())?;

    Ok(task_id)
}

// 开始下载
#[tauri::command]
async fn start_download(app: tauri::AppHandle, task_id: String) -> Result<(), String> {
    println!("收到开始下载请求，任务ID: {}", task_id);
    let download_manager: tauri::State<DownloadManager> = app.state();

    // 获取任务信息
    let task = {
        let manager = download_manager.lock().unwrap();
        let task = manager.get(&task_id).cloned();
        println!("从管理器中获取任务: {:?}", task.is_some());
        task
    };

    let mut task = task.ok_or("下载任务不存在")?;
    println!("任务当前状态: {:?}", task.status);

    if matches!(task.status, DownloadStatus::Downloading) {
        return Err("任务已在下载中".to_string());
    }

    // 更新状态为下载中
    task.status = DownloadStatus::Downloading;
    {
        let mut manager = download_manager.lock().unwrap();
        manager.insert(task_id.clone(), task.clone());
    }
    println!("任务状态已更新为下载中");

    // 发送状态更新事件
    app.emit("download_status_changed", task.clone())
        .map_err(|e| e.to_string())?;
    println!("已发送状态更新事件");

    // 启动下载任务
    let app_clone = app.clone();
    let task_clone = task.clone();
    println!("启动异步下载任务");
    tokio::spawn(async move {
        if let Err(e) = perform_download(app_clone.clone(), task_clone.clone()).await {
            eprintln!("下载失败: {}", e);

            // 更新任务状态为失败
            let download_manager: tauri::State<DownloadManager> = app_clone.state();
            let control_senders: tauri::State<DownloadControlSender> = app_clone.state();

            let failed_task = {
                let mut manager = download_manager.lock().unwrap();
                if let Some(task) = manager.get_mut(&task_clone.id) {
                    task.status = DownloadStatus::Failed;
                    task.clone()
                } else {
                    // 如果任务不存在，创建一个失败状态的任务
                    let mut failed_task = task_clone.clone();
                    failed_task.status = DownloadStatus::Failed;
                    manager.insert(task_clone.id.clone(), failed_task.clone());
                    failed_task
                }
            };

            // 清理控制信号发送器
            {
                let mut senders = control_senders.lock().unwrap();
                senders.remove(&task_clone.id);
            }

            // 发送失败事件
            let _ = app_clone.emit("download_status_changed", &failed_task);
            let _ = app_clone.emit("download_failed", &failed_task);
        } else {
            // 下载成功，清理控制信号发送器
            let control_senders: tauri::State<DownloadControlSender> = app_clone.state();
            {
                let mut senders = control_senders.lock().unwrap();
                senders.remove(&task_clone.id);
            }
        }
    });

    println!("start_download函数执行完成");
    Ok(())
}

// 暂停下载
#[tauri::command]
async fn pause_download(app: tauri::AppHandle, task_id: String) -> Result<(), String> {
    let download_manager: tauri::State<DownloadManager> = app.state();
    let control_senders: tauri::State<DownloadControlSender> = app.state();

    // 发送暂停信号
    {
        let senders = control_senders.lock().unwrap();
        if let Some(sender) = senders.get(&task_id) {
            let _ = sender.send(DownloadControl::Pause(task_id.clone()));
        }
    }

    // 更新任务状态
    {
        let mut manager = download_manager.lock().unwrap();
        if let Some(task) = manager.get_mut(&task_id) {
            if matches!(task.status, DownloadStatus::Downloading) {
                task.status = DownloadStatus::Paused;
                // 发送更新后的任务状态
                let updated_task = task.clone();
                drop(manager); // 释放锁
                app.emit("download_status_changed", updated_task)
                    .map_err(|e| e.to_string())?;
            }
        }
    }

    Ok(())
}

// 取消下载
#[tauri::command]
async fn cancel_download(app: tauri::AppHandle, task_id: String) -> Result<(), String> {
    let download_manager: tauri::State<DownloadManager> = app.state();
    let control_senders: tauri::State<DownloadControlSender> = app.state();

    // 发送取消信号
    {
        let senders = control_senders.lock().unwrap();
        if let Some(sender) = senders.get(&task_id) {
            let _ = sender.send(DownloadControl::Cancel(task_id.clone()));
        }
    }

    let (updated_task, file_path_to_remove) = {
        let mut manager = download_manager.lock().unwrap();
        if let Some(task) = manager.get_mut(&task_id) {
            task.status = DownloadStatus::Cancelled;
            let updated_task = task.clone();
            let file_path = task.file_path.clone();
            (Some(updated_task), Some(file_path))
        } else {
            (None, None)
        }
    };

    // 发送状态更新事件
    if let Some(task) = updated_task {
        app.emit("download_status_changed", task)
            .map_err(|e| e.to_string())?;
    }

    let file_path_to_remove = file_path_to_remove;

    // 删除未完成的文件
    if let Some(file_path) = file_path_to_remove {
        if let Ok(path) = PathBuf::from(&file_path).canonicalize() {
            let _ = std::fs::remove_file(path);
        }
    }

    Ok(())
}

// 获取所有下载任务
#[tauri::command]
async fn get_download_tasks(app: tauri::AppHandle) -> Result<Vec<DownloadTask>, String> {
    let download_manager: tauri::State<DownloadManager> = app.state();

    let manager = download_manager.lock().unwrap();
    let tasks: Vec<DownloadTask> = manager.values().cloned().collect();

    Ok(tasks)
}

// 删除下载任务
#[tauri::command]
async fn remove_download_task(app: tauri::AppHandle, task_id: String) -> Result<(), String> {
    let download_manager: tauri::State<DownloadManager> = app.state();

    // 获取任务信息以获得文件路径
    let file_path = {
        let manager = download_manager.lock().unwrap();
        manager.get(&task_id).map(|task| task.file_path.clone())
    };

    // 从管理器中删除任务
    {
        let mut manager = download_manager.lock().unwrap();
        manager.remove(&task_id);
    }

    // 如果任务存在且有文件路径，尝试删除文件
    if let Some(path) = file_path {
        if std::path::Path::new(&path).exists() {
            match std::fs::remove_file(&path) {
                Ok(_) => {
                    println!("已删除文件: {}", path);
                }
                Err(e) => {
                    eprintln!("删除文件失败: {} - {}", path, e);
                    // 不返回错误，因为任务已经从管理器中删除了
                }
            }
        }
    }

    Ok(())
}

// 获取下载进度
#[tauri::command]
async fn get_download_progress(app: tauri::AppHandle, task_id: String) -> Result<Option<DownloadTask>, String> {
    let download_manager: tauri::State<DownloadManager> = app.state();
    
    let manager = download_manager.lock().unwrap();
    let task = manager.get(&task_id).cloned();
    
    Ok(task)
}

// 恢复下载
#[tauri::command]
async fn resume_download(app: tauri::AppHandle, task_id: String) -> Result<(), String> {
    let download_manager: tauri::State<DownloadManager> = app.state();
    let control_senders: tauri::State<DownloadControlSender> = app.state();

    // 检查任务是否存在且状态为暂停
    let task = {
        let manager = download_manager.lock().unwrap();
        if let Some(task) = manager.get(&task_id) {
            if !matches!(task.status, DownloadStatus::Paused) {
                return Err("任务不是暂停状态，无法恢复".to_string());
            }
            task.clone()
        } else {
            return Err("任务不存在".to_string());
        }
    };

    // 创建新的控制信号发送器（因为暂停时可能已经清理了）
    let (tx, _) = broadcast::channel(10);
    {
        let mut senders = control_senders.lock().unwrap();
        senders.insert(task_id.clone(), tx);
    }

    // 更新任务状态为下载中
    {
        let mut manager = download_manager.lock().unwrap();
        if let Some(current_task) = manager.get_mut(&task_id) {
            current_task.status = DownloadStatus::Downloading;
            let _ = app.emit("download_status_changed", current_task.clone());
        }
    }

    // 重新启动下载任务
    let app_clone = app.clone();
    let task_clone = task.clone();
    println!("恢复下载任务: {}", task_id);
    tokio::spawn(async move {
        if let Err(e) = perform_download(app_clone.clone(), task_clone.clone()).await {
            eprintln!("恢复下载失败: {}", e);

            // 更新任务状态为失败
            let download_manager: tauri::State<DownloadManager> = app_clone.state();
            let control_senders: tauri::State<DownloadControlSender> = app_clone.state();

            let failed_task = {
                let mut manager = download_manager.lock().unwrap();
                if let Some(task) = manager.get_mut(&task_clone.id) {
                    task.status = DownloadStatus::Failed;
                    task.clone()
                } else {
                    let mut failed_task = task_clone.clone();
                    failed_task.status = DownloadStatus::Failed;
                    manager.insert(task_clone.id.clone(), failed_task.clone());
                    failed_task
                }
            };

            // 清理控制信号发送器
            {
                let mut senders = control_senders.lock().unwrap();
                senders.remove(&task_clone.id);
            }

            // 发送失败事件
            let _ = app_clone.emit("download_status_changed", &failed_task);
            let _ = app_clone.emit("download_failed", &failed_task);
        } else {
            // 下载成功，清理控制信号发送器
            let control_senders: tauri::State<DownloadControlSender> = app_clone.state();
            {
                let mut senders = control_senders.lock().unwrap();
                senders.remove(&task_clone.id);
            }
        }
    });

    Ok(())
}

// 执行下载的核心函数
async fn perform_download(
    app: tauri::AppHandle,
    mut task: DownloadTask,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let download_manager: tauri::State<DownloadManager> = app.state();
    let control_senders: tauri::State<DownloadControlSender> = app.state();

    // 获取控制信号接收器
    let mut control_rx = {
        let senders = control_senders.lock().unwrap();
        if let Some(sender) = senders.get(&task.id) {
            sender.subscribe()
        } else {
            return Err("无法获取控制信号接收器".into());
        }
    };

    println!("开始执行下载任务: {} - {}", task.id, task.url);

    // 验证URL格式
    if !task.url.starts_with("http://") && !task.url.starts_with("https://") {
        return Err("无效的URL格式，必须以http://或https://开头".into());
    }
    
    // 解析URL以获取主机信息
    let url = reqwest::Url::parse(&task.url)
        .map_err(|e| format!("URL解析失败: {}", e))?;
    let host = url.host_str().unwrap_or("未知主机");
    println!("目标主机: {}", host);

    // 创建HTTP客户端，优化连接设置以提升下载速度
    let client = reqwest::Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        .timeout(Duration::from_secs(180))  // 增加超时时间到3分钟
        .connect_timeout(Duration::from_secs(45))  // 连接超时45秒
        .pool_idle_timeout(Duration::from_secs(120))  // 连接池空闲超时
        .pool_max_idle_per_host(6)  // 减少每个主机最大空闲连接数
        .danger_accept_invalid_certs(true)
        .no_proxy()
        .tcp_keepalive(Duration::from_secs(30))  // 减少TCP keepalive时间
        .tcp_nodelay(true)  // 禁用Nagle算法以减少延迟
        .redirect(reqwest::redirect::Policy::limited(10))  // 限制重定向次数
        .build().map_err(|e| format!("创建HTTP客户端失败: {}", e))?;
        
    println!("HTTP客户端创建成功，开始网络连接测试...");

    // 发送HEAD请求获取文件大小，带重试机制
    println!("发送HEAD请求获取文件大小: {}", task.url);
    let mut total_size = 0;
    let mut retries = 5;
    let mut head_success = false;

    while retries > 0 {
        match client.head(&task.url).send().await {
            Ok(resp) => {
                let status = resp.status();
                if status.is_success() {
                    total_size = resp.content_length().unwrap_or(0);
                    println!("HEAD请求成功，文件大小: {} bytes", total_size);
                    head_success = true;
                    break;
                } else {
                    println!("HEAD请求返回错误状态码: {}", status);
                    retries -= 1;
                    if retries > 0 {
                        let wait_time = 3 - retries + 1; // 递增等待时间
                        tokio::time::sleep(Duration::from_secs(wait_time)).await;
                    }
                }
            }
            Err(e) => {
                retries -= 1;
                println!("HEAD请求失败 (剩余{}次重试): {}", retries, e);
                
                if retries == 0 {
                    println!("HEAD请求完全失败，将在GET请求中尝试获取文件大小");
                    break;
                }
                
                // 根据错误类型调整等待时间
                let wait_time = if e.is_timeout() {
                    5 // 超时错误等待更长时间
                } else if e.is_connect() {
                    3 // 连接错误
                } else {
                    2 // 其他错误
                };
                tokio::time::sleep(Duration::from_secs(wait_time)).await;
            }
        }
    }
    
    if !head_success {
        println!("HEAD请求未成功，将尝试直接使用GET请求");
    }

    // 更新任务信息
    task.total_size = total_size;
    {
        let mut manager = download_manager.lock().unwrap();
        manager.insert(task.id.clone(), task.clone());
    }

    // 发送初始状态更新事件，确保前端显示正确的总大小
    let _ = app.emit("download_progress", &task);

    // 创建下载目录
    let file_path = PathBuf::from(&task.file_path);
    if let Some(parent) = file_path.parent() {
        tokio::fs::create_dir_all(parent).await?;
    }

    // 检查文件是否已存在，获取已下载的大小
    let existing_size = if file_path.exists() {
        tokio::fs::metadata(&file_path).await?.len()
    } else {
        0
    };

    // 开始下载，带重试机制
    let mut retries = 5;
    let mut response = None;
    let mut last_error = String::new();

    while retries > 0 {
        let mut request = client.get(&task.url);

        // 如果文件已存在且有内容，使用Range请求头进行断点续传
        if existing_size > 0 {
            request = request.header("Range", format!("bytes={}-", existing_size));
            println!("使用断点续传，从字节 {} 开始下载", existing_size);
        }

        match request.send().await {
            Ok(resp) => {
                let status = resp.status();
                if status.is_success() || status == reqwest::StatusCode::PARTIAL_CONTENT {
                    println!("GET请求成功，状态码: {}", status);
                    response = Some(resp);
                    break;
                } else {
                    last_error = format!("服务器返回错误状态码: {}", status);
                    println!("{}", last_error);
                    
                    // 对于某些状态码，不需要重试
                    if status == reqwest::StatusCode::NOT_FOUND 
                        || status == reqwest::StatusCode::FORBIDDEN 
                        || status == reqwest::StatusCode::UNAUTHORIZED {
                        return Err(format!("下载失败: {}", last_error).into());
                    }
                    
                    retries -= 1;
                    if retries > 0 {
                        let wait_time = 6 - retries; // 递增等待时间
                        tokio::time::sleep(Duration::from_secs(wait_time)).await;
                    }
                }
            }
            Err(e) => {
                retries -= 1;
                last_error = format!("网络请求错误: {}", e);
                println!("GET请求失败 (剩余{}次重试): {}", retries, last_error);
                
                if retries == 0 {
                    return Err(format!("GET请求失败: {}", last_error).into());
                }
                
                // 根据错误类型调整等待时间
                let wait_time = if e.is_timeout() {
                    8 // 超时错误等待更长时间
                } else if e.is_connect() {
                    5 // 连接错误
                } else {
                    3 // 其他错误
                };
                tokio::time::sleep(Duration::from_secs(wait_time)).await;
            }
        }
    }
    
    if response.is_none() {
        return Err(format!("GET请求完全失败: {}", last_error).into());
    }

    let mut response = response.unwrap();

    // 如果HEAD请求没有获取到文件大小，尝试从GET响应中获取
    if total_size == 0 {
        if let Some(content_length) = response.content_length() {
            total_size = content_length;
            println!("从GET请求获取文件大小: {} bytes", total_size);

            // 更新任务信息
            task.total_size = total_size;
            {
                let mut manager = download_manager.lock().unwrap();
                manager.insert(task.id.clone(), task.clone());
            }

            // 发送更新事件
            let _ = app.emit("download_progress", &task);
        }
    }

    // 根据是否断点续传选择文件打开模式
    let mut file = if existing_size > 0 {
        OpenOptions::new().append(true).open(&file_path).await?
    } else {
        File::create(&file_path).await?
    };

    let mut downloaded = existing_size;
    let mut last_update = Instant::now();
    let mut last_downloaded = downloaded;
    let mut speed_samples: Vec<u64> = Vec::new();
    const MAX_SPEED_SAMPLES: usize = 5; // 保持最近5个速度样本用于平滑
    let mut _last_activity = Instant::now(); // 记录最后活动时间
    const _ACTIVITY_TIMEOUT: Duration = Duration::from_secs(120); // 2分钟无活动超时

    // 发送初始进度事件
    task.status = DownloadStatus::Downloading;
    task.progress = if total_size > 0 {
        (downloaded as f64 / total_size as f64) * 100.0
    } else {
        0.0
    };
    task.downloaded_size = downloaded;
    task.speed = "0.0 B/s".to_string();
    {
        let mut manager = download_manager.lock().unwrap();
        manager.insert(task.id.clone(), task.clone());
    }
    let _ = app.emit("download_progress", &task);

    let mut consecutive_errors = 0;
    const MAX_CONSECUTIVE_ERRORS: u32 = 3;
    let mut total_retries = 0;
    const MAX_TOTAL_RETRIES: u32 = 10;
    
    while let Some(chunk_result) = response.chunk().await.transpose() {
        let chunk = match chunk_result {
            Ok(chunk) => chunk,
            Err(e) => {
                consecutive_errors += 1;
                total_retries += 1;
                println!("下载块时出错 (连续第{}次，总第{}次): {}", consecutive_errors, total_retries, e);
                
                // 如果总重试次数过多，直接失败
                if total_retries >= MAX_TOTAL_RETRIES {
                    return Err(format!("下载失败，已达到最大重试次数: {}", e).into());
                }
                
                if consecutive_errors >= MAX_CONSECUTIVE_ERRORS {
                    println!("尝试重新建立连接...");
                    
                    // 尝试重新建立连接
                    let mut reconnect_retries = 5;
                    while reconnect_retries > 0 {
                        let wait_time = std::cmp::min(2_u64.pow(5 - reconnect_retries), 30); // 指数退避，最大30秒
                        tokio::time::sleep(Duration::from_secs(wait_time)).await;
                        
                        let mut request = client.get(&task.url);
                        if downloaded > 0 {
                            request = request.header("Range", format!("bytes={}-", downloaded));
                        }
                        
                        match request.send().await {
                            Ok(new_response) => {
                                println!("重新连接成功，继续下载");
                                response = new_response;
                                consecutive_errors = 0;
                                _last_activity = Instant::now();
                                break;
                            }
                            Err(reconnect_err) => {
                                reconnect_retries -= 1;
                                println!("重连失败 (剩余{}次): {}", reconnect_retries, reconnect_err);
                                if reconnect_retries == 0 {
                                    return Err(format!("网络连接中断，重连失败: {}", reconnect_err).into());
                                }
                            }
                        }
                    }
                    continue;
                }
                
                // 短暂等待后重试
                let wait_time = std::cmp::min(consecutive_errors as u64, 10); // 最大等待10秒
                tokio::time::sleep(Duration::from_secs(wait_time)).await;
                continue;
            }
        };
        
        // 重置错误计数器和活动时间
        consecutive_errors = 0;
        _last_activity = Instant::now();
        
        // 如果块为空，可能是连接问题，跳过这次循环
        if chunk.is_empty() {
            println!("收到空数据块，可能连接异常");
            tokio::time::sleep(Duration::from_millis(100)).await;
            continue;
        }
        
        // 非阻塞检查控制信号
        if let Ok(control) = control_rx.try_recv() {
            match control {
                DownloadControl::Pause(id) if id == task.id => {
                    // 更新任务状态为暂停
                    let updated_task = {
                        let mut manager = download_manager.lock().unwrap();
                        if let Some(current_task) = manager.get_mut(&task.id) {
                            current_task.status = DownloadStatus::Paused;
                            current_task.downloaded_size = downloaded;
                            current_task.progress = if total_size > 0 {
                                (downloaded as f64 / total_size as f64) * 100.0
                            } else {
                                0.0
                            };
                            current_task.clone()
                        } else {
                            return Ok(());
                        }
                    };
                    let _ = app.emit("download_status_changed", &updated_task);
                    return Ok(());
                }
                DownloadControl::Cancel(id) if id == task.id => {
                    // 更新任务状态为取消
                    let updated_task = {
                        let mut manager = download_manager.lock().unwrap();
                        if let Some(current_task) = manager.get_mut(&task.id) {
                            current_task.status = DownloadStatus::Cancelled;
                            current_task.clone()
                        } else {
                            return Ok(());
                        }
                    };
                    let _ = tokio::fs::remove_file(&file_path).await;
                    let _ = app.emit("download_status_changed", &updated_task);
                    return Ok(());
                }
                DownloadControl::Resume(id) if id == task.id => {
                    // 恢复下载，继续执行
                    println!("收到恢复下载信号: {}", task.id);
                    // 更新任务状态为下载中
                    let updated_task = {
                        let mut manager = download_manager.lock().unwrap();
                        if let Some(current_task) = manager.get_mut(&task.id) {
                            current_task.status = DownloadStatus::Downloading;
                            current_task.clone()
                        } else {
                            return Ok(());
                        }
                    };
                    let _ = app.emit("download_status_changed", &updated_task);
                    // 继续下载循环
                }
                _ => {}
            }
        }

        file.write_all(&chunk).await?;
        downloaded += chunk.len() as u64;

        // 优化进度更新频率：每50ms或每下载128KB更新一次进度
        let now = Instant::now();
        let downloaded_since_last = downloaded - last_downloaded;
        if now.duration_since(last_update) >= Duration::from_millis(50)
            || downloaded_since_last >= 131072  // 128KB
        {
            let speed = {
                let time_elapsed = now.duration_since(last_update).as_secs_f64();
                let current_speed = if time_elapsed > 0.0 {
                    ((downloaded - last_downloaded) as f64 / time_elapsed) as u64
                } else {
                    0
                };

                // 添加当前速度到样本中
                speed_samples.push(current_speed);
                if speed_samples.len() > MAX_SPEED_SAMPLES {
                    speed_samples.remove(0);
                }

                // 计算平均速度
                let avg_speed = if !speed_samples.is_empty() {
                    speed_samples.iter().sum::<u64>() / speed_samples.len() as u64
                } else {
                    0
                };

                format_speed(avg_speed)
            };

            let progress = if total_size > 0 {
                (downloaded as f64 / total_size as f64) * 100.0
            } else {
                0.0
            };

            task.downloaded_size = downloaded;
            task.progress = progress;
            task.speed = speed;

            // 更新任务状态
            {
                let mut manager = download_manager.lock().unwrap();
                manager.insert(task.id.clone(), task.clone());
            }

            // 发送进度事件
            let _ = app.emit("download_progress", &task);

            last_update = now;
            last_downloaded = downloaded;
        }
    }

    // 下载完成 - 发送最终进度更新
    task.status = DownloadStatus::Completed;
    task.progress = 100.0;
    task.downloaded_size = downloaded;
    task.speed = "0.0 B/s".to_string();

    {
        let mut manager = download_manager.lock().unwrap();
        manager.insert(task.id.clone(), task.clone());
    }

    // 发送最终进度事件和完成事件
    let _ = app.emit("download_progress", &task);
    let _ = app.emit("download_completed", &task);

    // 检查是否为安装程序文件，如果是则提供运行选项
    if is_installer_file(&task.file_path) {
        let _ = app.emit("installer_ready", &task);
    }

    Ok(())
}

// 判断是否为安装程序文件
fn is_installer_file(file_path: &str) -> bool {
    let path = std::path::Path::new(file_path);
    if let Some(extension) = path.extension() {
        let ext = extension.to_string_lossy().to_lowercase();
        matches!(ext.as_str(), "exe" | "msi" | "dmg" | "pkg" | "deb" | "rpm" | "appimage")
    } else {
        false
    }
}

// 运行安装程序
#[tauri::command]
async fn run_installer(app_handle: tauri::AppHandle, file_path: String) -> Result<(), String> {
    use tauri_plugin_opener::OpenerExt;
    
    let path = std::path::Path::new(&file_path);
    if !path.exists() {
        return Err("安装程序文件不存在".to_string());
    }
    
    if !is_installer_file(&file_path) {
        return Err("不是有效的安装程序文件".to_string());
    }
    
    // 使用opener插件打开安装程序
    app_handle.opener().open_path(&file_path, None::<String>)
        .map_err(|e| format!("运行安装程序失败: {}", e))?;
    
    Ok(())
}

// 打开文件（可以运行应用程序）
#[tauri::command]
async fn open_file(app_handle: tauri::AppHandle, path: String) -> Result<(), String> {
    use tauri_plugin_opener::OpenerExt;
    
    let file_path = std::path::Path::new(&path);
    if !file_path.exists() {
        return Err("文件不存在".to_string());
    }
    
    // 使用opener插件打开文件，这将使用系统默认程序打开文件
    // 对于可执行文件，这将运行它们
    app_handle.opener().open_path(&path, None::<String>)
        .map_err(|e| format!("打开文件失败: {}", e))?;
    
    Ok(())
}

// 检测应用是否已安装
#[tauri::command]
async fn is_app_installed(file_path: String) -> Result<bool, String> {
    let path = std::path::Path::new(&file_path);
    
    // 如果是安装程序文件，检查是否已安装
    if is_installer_file(&file_path) {
        // 对于安装程序，我们假设如果文件存在就是未安装状态
        // 实际应用中可以通过检查注册表或特定路径来判断
        return Ok(false);
    }
    
    // 对于可执行文件，检查文件是否存在
    if path.exists() {
        let extension = path.extension()
            .and_then(|ext| ext.to_str())
            .unwrap_or("");
        
        match extension.to_lowercase().as_str() {
            "exe" | "msi" | "app" => {
                // 对于可执行文件，如果文件存在则认为已安装
                Ok(true)
            }
            _ => {
                // 其他文件类型，如果存在则认为可以打开
                Ok(true)
            }
        }
    } else {
        Ok(false)
    }
}

// 检查文件是否存在
#[tauri::command]
async fn file_exists(path: String) -> Result<bool, String> {
    let file_path = std::path::Path::new(&path);
    Ok(file_path.exists())
}

// 根据文件类型和安装状态获取建议的操作
#[tauri::command]
async fn get_file_action(file_path: String) -> Result<String, String> {
    let path = std::path::Path::new(&file_path);
    
    if !path.exists() {
        return Ok("下载".to_string());
    }
    
    if is_installer_file(&file_path) {
        return Ok("安装".to_string());
    }
    
    let extension = path.extension()
        .and_then(|ext| ext.to_str())
        .unwrap_or("");
    
    match extension.to_lowercase().as_str() {
        "exe" | "app" => Ok("运行".to_string()),
        "msi" => Ok("安装".to_string()),
        _ => Ok("打开".to_string()),
    }
}

// 创建副本下载
#[tauri::command]
async fn get_download_directory() -> Result<String, String> {
    // 从配置文件中获取用户设置的下载目录
    let config_dir = dirs::config_dir()
        .ok_or("无法获取配置目录")?;
    
    let app_config_dir = config_dir.join("OpenStore");
    let config_file = app_config_dir.join("download_config.json");
    
    if config_file.exists() {
        match tokio::fs::read_to_string(&config_file).await {
            Ok(content) => {
                if let Ok(config) = serde_json::from_str::<serde_json::Value>(&content) {
                    if let Some(path) = config.get("download_directory").and_then(|v| v.as_str()) {
                        return Ok(path.to_string());
                    }
                }
            }
            Err(_) => {}
        }
    }
    
    // 如果没有配置文件或读取失败，返回默认下载目录
    let download_dir = dirs::download_dir()
        .unwrap_or_else(|| PathBuf::from("./downloads"))
        .to_string_lossy()
        .to_string();
    Ok(download_dir)
}

#[tauri::command]
async fn set_download_directory(path: String) -> Result<(), String> {
    // 验证路径是否存在且为目录
    let path_buf = PathBuf::from(&path);
    if !path_buf.exists() {
        return Err("指定的路径不存在".to_string());
    }
    if !path_buf.is_dir() {
        return Err("指定的路径不是目录".to_string());
    }
    
    // 保存下载目录到配置文件
    let config_dir = dirs::config_dir()
        .ok_or("无法获取配置目录")?;
    
    let app_config_dir = config_dir.join("OpenStore");
    
    // 确保配置目录存在
    tokio::fs::create_dir_all(&app_config_dir).await
        .map_err(|e| format!("创建配置目录失败: {}", e))?;
    
    let config_file = app_config_dir.join("download_config.json");
    let config = serde_json::json!({
        "download_directory": path
    });
    
    tokio::fs::write(&config_file, serde_json::to_string_pretty(&config).unwrap()).await
        .map_err(|e| format!("保存配置失败: {}", e))?;
    
    Ok(())
}

#[tauri::command]
async fn create_copy_download(
    app: tauri::AppHandle,
    original_task_id: String,
    copy_count: u32,
) -> Result<Vec<String>, String> {
    let download_manager: tauri::State<DownloadManager> = app.state();
    let control_senders: tauri::State<DownloadControlSender> = app.state();

    // 获取原始任务
    let original_task = {
        let manager = download_manager.lock().unwrap();
        manager.get(&original_task_id).cloned()
    };

    let original_task = original_task.ok_or("原始下载任务不存在")?;

    let mut created_task_ids = Vec::new();

    for i in 1..=copy_count {
        // 生成副本任务ID
        let copy_task_id = format!("{}_copy_{}", original_task_id, i);

        // 生成副本文件名（在原文件名基础上添加副本标识）
        let file_name_parts: Vec<&str> = original_task.file_name.rsplitn(2, '.').collect();
        let copy_file_name = if file_name_parts.len() == 2 {
            format!("{}_副本{}.{}", file_name_parts[1], i, file_name_parts[0])
        } else {
            format!("{}_副本{}", original_task.file_name, i)
        };

        // 生成副本文件路径
        let original_path = PathBuf::from(&original_task.file_path);
        let copy_file_path = if let Some(parent) = original_path.parent() {
            parent.join(&copy_file_name)
        } else {
            PathBuf::from(&copy_file_name)
        };

        // 创建副本任务
        let copy_task = DownloadTask {
            id: copy_task_id.clone(),
            url: original_task.url.clone(),
            file_name: copy_file_name,
            file_path: copy_file_path.to_string_lossy().to_string(),
            status: DownloadStatus::Pending,
            progress: 0.0,
            total_size: original_task.total_size,
            downloaded_size: 0,
            speed: "0.0 B/s".to_string(),
            created_at: chrono::Utc::now().timestamp_millis() as u64,
            copy_count: 0,
            is_copy: true,
            original_id: Some(original_task_id.clone()),
        };

        // 创建控制信号发送器
        let (tx, _) = broadcast::channel(10);
        {
            let mut senders = control_senders.lock().unwrap();
            senders.insert(copy_task_id.clone(), tx);
        }

        // 添加到管理器
        {
            let mut manager = download_manager.lock().unwrap();
            manager.insert(copy_task_id.clone(), copy_task.clone());
        }

        // 发送任务创建事件
        let _ = app.emit("download_task_created", &copy_task);

        created_task_ids.push(copy_task_id);
    }

    // 更新原始任务的副本数量
    {
        let mut manager = download_manager.lock().unwrap();
        if let Some(original) = manager.get_mut(&original_task_id) {
            original.copy_count += copy_count;
            let _ = app.emit("download_status_changed", original.clone());
        }
    }

    Ok(created_task_ids)
}

// 格式化速度显示
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

// 系统托盘相关命令
#[tauri::command]
async fn show_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
async fn hide_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.hide().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
async fn quit_app(app: tauri::AppHandle) -> Result<(), String> {
    app.exit(0);
    Ok(())
}

// ==================== 多线程下载相关命令 ====================

/// 使用多线程下载器开始下载
#[tauri::command]
async fn start_multi_thread_download(
    app: tauri::AppHandle,
    task_id: String,
    url: String,
    file_path: String,
) -> Result<(), String> {
    let downloader = get_multi_thread_downloader();
    let file_path = PathBuf::from(file_path);
    
    // 创建控制通道
    let (control_tx, control_rx) = broadcast::channel(10);
    
    // 存储控制发送器
    {
        let control_senders: tauri::State<MultiThreadControlSender> = app.state();
        let mut senders = control_senders.lock().unwrap();
        senders.insert(task_id.clone(), control_tx);
    }
    
    // 启动下载任务
    let downloader_clone = downloader.clone();
    let app_clone = app.clone();
    let task_id_clone = task_id.clone();
    
    tokio::spawn(async move {
        let app_for_cleanup = app_clone.clone();
        match downloader_clone.download(app_clone, task_id_clone.clone(), url, file_path, control_rx).await {
            Ok(_) => {
                println!("多线程下载完成: {}", task_id_clone);
            }
            Err(e) => {
                println!("多线程下载失败: {} - {}", task_id_clone, e);
                let _ = app_for_cleanup.emit("multi_thread_download_error", &format!("{{\"task_id\": \"{}\", \"error\": \"{}\"}}", task_id_clone, e));
            }
        }
        
        // 清理控制发送器
        let control_senders: tauri::State<MultiThreadControlSender> = app_for_cleanup.state();
        let mut senders = control_senders.lock().unwrap();
        senders.remove(&task_id_clone);
    });
    
    Ok(())
}

/// 暂停多线程下载
#[tauri::command]
async fn pause_multi_thread_download(
    app: tauri::AppHandle,
    task_id: String,
) -> Result<(), String> {
    let control_senders: tauri::State<MultiThreadControlSender> = app.state();
    let senders = control_senders.lock().unwrap();
    
    if let Some(sender) = senders.get(&task_id) {
        let _ = sender.send(multi_thread_downloader::DownloadControl::Pause);
        println!("发送暂停信号给多线程下载任务: {}", task_id);
    } else {
        return Err(format!("未找到多线程下载任务: {}", task_id));
    }
    
    Ok(())
}

/// 取消多线程下载
#[tauri::command]
async fn cancel_multi_thread_download(
    app: tauri::AppHandle,
    task_id: String,
) -> Result<(), String> {
    let control_senders: tauri::State<MultiThreadControlSender> = app.state();
    let mut senders = control_senders.lock().unwrap();
    
    if let Some(sender) = senders.get(&task_id) {
        let _ = sender.send(multi_thread_downloader::DownloadControl::Cancel);
        println!("发送取消信号给多线程下载任务: {}", task_id);
        senders.remove(&task_id);
    } else {
        return Err(format!("未找到多线程下载任务: {}", task_id));
    }
    
    Ok(())
}

/// 恢复多线程下载
#[tauri::command]
async fn resume_multi_thread_download(
    app: tauri::AppHandle,
    task_id: String,
) -> Result<(), String> {
    let control_senders: tauri::State<MultiThreadControlSender> = app.state();
    let senders = control_senders.lock().unwrap();
    
    if let Some(sender) = senders.get(&task_id) {
        let _ = sender.send(multi_thread_downloader::DownloadControl::Resume);
        println!("发送恢复信号给多线程下载任务: {}", task_id);
    } else {
        return Err(format!("未找到多线程下载任务: {}", task_id));
    }
    
    Ok(())
}

/// 创建自定义配置的多线程下载器
#[tauri::command]
async fn create_custom_multi_thread_downloader(
    max_connections: usize,
    min_chunk_size: u64,
) -> Result<String, String> {
    // 验证参数
    if max_connections == 0 || max_connections > 32 {
        return Err("并发连接数必须在1-32之间".to_string());
    }
    
    if min_chunk_size < 1024 {
        return Err("最小分块大小不能小于1KB".to_string());
    }
    
    // 创建自定义下载器（注意：这里只是验证参数，实际的下载器配置在下载时应用）
    let config = MultiThreadConfig {
        max_connections,
        min_chunk_size,
        max_retries: 5,
        timeout_seconds: 30,
    };
    
    Ok(format!("自定义多线程下载器配置创建成功: 连接数={}, 分块大小={}KB", 
              config.max_connections, 
              config.min_chunk_size / 1024))
}

/// 获取多线程下载器信息
#[tauri::command]
async fn get_multi_thread_downloader_info() -> Result<String, String> {
    Ok(format!("{{\"max_connections\": 8, \"min_chunk_size\": 1048576, \"max_retries\": 5, \"timeout_seconds\": 30}}"))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let download_manager: DownloadManager = Arc::new(Mutex::new(HashMap::new()));
    let control_senders: DownloadControlSender = Arc::new(Mutex::new(HashMap::new()));
    let multi_thread_control_senders: MultiThreadControlSender = Arc::new(Mutex::new(HashMap::new()));

    tauri::Builder::default()
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(download_manager)
        .manage(control_senders)
        .manage(multi_thread_control_senders)
        .setup(|app| {
            // 创建系统托盘菜单
            let show = MenuItem::with_id(app, "show", "显示窗口", true, None::<&str>)?;
            let hide = MenuItem::with_id(app, "hide", "隐藏窗口", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "退出应用", true, None::<&str>)?;
            
            let menu = Menu::with_items(app, &[
                &show,
                &hide,
                &quit,
            ])?;

            let _tray = TrayIconBuilder::with_id("main")
                .tooltip("OpenStore")
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .on_tray_icon_event(|tray, event| {
                    match event {
                        TrayIconEvent::Click { button, button_state, .. } => {
                            if button == tauri::tray::MouseButton::Left && button_state == tauri::tray::MouseButtonState::Up {
                                // 左键点击托盘图标显示/隐藏窗口
                                let app = tray.app_handle();
                                if let Some(window) = app.get_webview_window("main") {
                                    if window.is_visible().unwrap_or(false) {
                                        let _ = window.hide();
                                    } else {
                                        let _ = window.show();
                                        let _ = window.set_focus();
                                    }
                                }
                            }
                        }
                        TrayIconEvent::DoubleClick { .. } => {
                            // 双击显示窗口
                            let app = tray.app_handle();
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                        _ => {}
                    }
                })
                .on_menu_event(|app, event| {
                    match event.id().as_ref() {
                        "show" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                        "hide" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.hide();
                            }
                        }
                        "quit" => {
                            app.exit(0);
                        }
                        _ => {}
                    }
                })
                .build(app)?;

            Ok(())
        })
        .on_window_event(|window, event| match event {
            tauri::WindowEvent::CloseRequested { api, .. } => {
                // 阻止窗口关闭，改为隐藏到托盘
                window.hide().unwrap();
                api.prevent_close();
            }
            _ => {}
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            create_download_task,
            start_download,
            pause_download,
            cancel_download,
            resume_download,
            get_download_tasks,
            remove_download_task,
            get_download_progress,
            create_copy_download,
            get_download_directory,
            set_download_directory,
            run_installer,
            open_file,
            is_app_installed,
            file_exists,
            get_file_action,
            show_window,
            hide_window,
            quit_app,
            start_multi_thread_download,
            pause_multi_thread_download,
            cancel_multi_thread_download,
            resume_multi_thread_download,
            create_custom_multi_thread_downloader,
            get_multi_thread_downloader_info
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
