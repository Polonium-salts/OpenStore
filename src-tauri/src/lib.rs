// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use tauri::Manager;
use tauri_plugin_http::reqwest;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use chrono;
use tauri::Emitter;
use std::path::PathBuf;
use tokio::fs::{File, OpenOptions};
use tokio::io::AsyncWriteExt;
use std::time::{Duration, Instant};
use tokio::sync::broadcast;

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
    copy_count: u32, // 副本数量
    is_copy: bool,   // 是否为副本
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
    Resume(String),
}

// 下载管理器类型别名
type DownloadManager = Arc<Mutex<HashMap<String, DownloadTask>>>;
type DownloadControlSender = Arc<Mutex<HashMap<String, broadcast::Sender<DownloadControl>>>>;
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
        manager.values().find(|task| task.url == url && !task.is_copy).cloned()
    };
    
    // 如果存在相同URL的任务，自动创建副本
    if let Some(original_task) = existing_task {
        let copy_ids = create_copy_download(app, original_task.id, 1).await?;
        // 返回第一个副本的ID
        return Ok(copy_ids.into_iter().next().unwrap_or_else(|| {
            format!("copy_{}", chrono::Utc::now().timestamp_millis())
        }));
    }
    
    // 生成唯一ID
    let task_id = format!("download_{}", chrono::Utc::now().timestamp_millis());
    
    // 确定下载路径
    let final_path = if let Some(path) = download_path {
        PathBuf::from(path)
    } else {
        // 默认下载到用户下载目录
        dirs::download_dir().unwrap_or_else(|| PathBuf::from("./downloads"))
    };
    
    // 确定文件名
    let final_file_name = file_name.unwrap_or_else(|| {
        url.split('/').last().unwrap_or("download").to_string()
    });
    
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
    app.emit("download_task_created", &task).map_err(|e| e.to_string())?;
    
    Ok(task_id)
}

// 开始下载
#[tauri::command]
async fn start_download(
    app: tauri::AppHandle,
    task_id: String,
) -> Result<(), String> {
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
    app.emit("download_status_changed", task.clone()).map_err(|e| e.to_string())?;
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
async fn pause_download(
    app: tauri::AppHandle,
    task_id: String,
) -> Result<(), String> {
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
                app.emit("download_status_changed", updated_task).map_err(|e| e.to_string())?;
            }
        }
    }
    
    Ok(())
}

// 取消下载
#[tauri::command]
async fn cancel_download(
    app: tauri::AppHandle,
    task_id: String,
) -> Result<(), String> {
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
        app.emit("download_status_changed", task).map_err(|e| e.to_string())?;
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
async fn get_download_tasks(
    app: tauri::AppHandle,
) -> Result<Vec<DownloadTask>, String> {
    let download_manager: tauri::State<DownloadManager> = app.state();
    
    let manager = download_manager.lock().unwrap();
    let tasks: Vec<DownloadTask> = manager.values().cloned().collect();
    
    Ok(tasks)
}

// 删除下载任务
#[tauri::command]
async fn remove_download_task(
    app: tauri::AppHandle,
    task_id: String,
) -> Result<(), String> {
    let download_manager: tauri::State<DownloadManager> = app.state();
    
    let mut manager = download_manager.lock().unwrap();
    manager.remove(&task_id);
    
    Ok(())
}

// 恢复下载
#[tauri::command]
async fn resume_download(
    app: tauri::AppHandle,
    task_id: String,
) -> Result<(), String> {
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
    
    // 创建HTTP客户端，添加用户代理、超时设置、SSL证书验证跳过和禁用代理
    let client = reqwest::Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
        .timeout(Duration::from_secs(30))
        .danger_accept_invalid_certs(true)
        .no_proxy()
        .build()?;
    
    // 发送HEAD请求获取文件大小，带重试机制
    println!("发送HEAD请求获取文件大小: {}", task.url);
    let mut total_size = 0;
    let mut retries = 3;
    
    while retries > 0 {
        match client.head(&task.url).send().await {
            Ok(resp) => {
                total_size = resp.content_length().unwrap_or(0);
                println!("从HEAD请求获取文件大小: {} bytes", total_size);
                break;
            }
            Err(e) => {
                retries -= 1;
                if retries == 0 {
                    println!("HEAD请求失败，将在GET请求中尝试获取文件大小: {}", e);
                    // 不返回错误，继续执行GET请求
                    break;
                }
                println!("HEAD请求失败，剩余重试次数: {}, 错误: {}", retries, e);
                tokio::time::sleep(Duration::from_secs(2)).await;
            }
        }
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
    let mut retries = 3;
    let mut response = None;
    
    while retries > 0 {
        let mut request = client.get(&task.url);
        
        // 如果文件已存在且有内容，使用Range请求头进行断点续传
        if existing_size > 0 {
            request = request.header("Range", format!("bytes={}-", existing_size));
        }
        
        match request.send().await {
            Ok(resp) => {
                response = Some(resp);
                break;
            }
            Err(e) => {
                retries -= 1;
                if retries == 0 {
                    return Err(format!("GET请求失败: {}", e).into());
                }
                println!("GET请求失败，剩余重试次数: {}, 错误: {}", retries, e);
                tokio::time::sleep(Duration::from_secs(2)).await;
            }
        }
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
    
    while let Some(chunk) = response.chunk().await? {
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
        
        // 每100ms或每下载64KB更新一次进度
        let now = Instant::now();
        let downloaded_since_last = downloaded - last_downloaded;
        if now.duration_since(last_update) >= Duration::from_millis(100) || downloaded_since_last >= 65536 {
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
    
    Ok(())
}

// 创建副本下载
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let download_manager: DownloadManager = Arc::new(Mutex::new(HashMap::new()));
    let control_senders: DownloadControlSender = Arc::new(Mutex::new(HashMap::new()));
    
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_opener::init())
        .manage(download_manager)
        .manage(control_senders)
        .invoke_handler(tauri::generate_handler![
            greet,
            create_download_task,
            start_download,
            pause_download,
            cancel_download,
            resume_download,
            get_download_tasks,
            remove_download_task,
            create_copy_download
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
