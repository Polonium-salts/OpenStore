// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use serde::{Deserialize, Serialize};
use tauri::Emitter;
use tauri::Window;

#[derive(Debug, Serialize, Deserialize)]
pub struct DownloadResult {
    success: bool,
    message: String,
    path: Option<String>,
    file_size: Option<u64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FileMetadata {
    pub exists: bool,
    pub size: Option<u64>,
    pub is_file: bool,
    pub is_dir: bool,
    pub modified: Option<String>,
    pub created: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DownloadProgress {
    pub downloaded: u64,
    pub total: u64,
    pub percent: f32,
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn download_file(url: String, save_path: String) -> Result<DownloadResult, String> {
    use tauri_plugin_http::reqwest;

    // Create a reqwest client
    let client = reqwest::Client::new();

    // Send GET request to download the file
    let response = match client.get(&url).send().await {
        Ok(res) => res,
        Err(err) => return Err(format!("Failed to send request: {}", err)),
    };

    // Check if the request was successful
    if !response.status().is_success() {
        return Err(format!(
            "Failed to download file: Status code {}",
            response.status()
        ));
    }

    // Get content length if available
    let content_length = response.content_length();

    // Get the content as bytes
    let content = match response.bytes().await {
        Ok(bytes) => bytes,
        Err(err) => return Err(format!("Failed to get response content: {}", err)),
    };

    // Ensure parent directories exist
    let path = std::path::Path::new(&save_path);
    if let Some(parent) = path.parent() {
        if !parent.exists() {
            if let Err(err) = std::fs::create_dir_all(parent) {
                return Err(format!("Failed to create directories: {}", err));
            }
        }
    }

    // Write the content to the file
    if let Err(err) = std::fs::write(&save_path, &content) {
        return Err(format!("Failed to write file: {}", err));
    }

    // Verify file was written correctly
    let file_size = match std::fs::metadata(&save_path) {
        Ok(metadata) => Some(metadata.len()),
        Err(_) => content_length,
    };

    // Check if file size matches content length
    if let Some(expected_size) = content_length {
        if let Some(actual_size) = file_size {
            if expected_size != actual_size {
                return Ok(DownloadResult {
                    success: true,
                    message: format!(
                        "File downloaded but size mismatch. Expected: {}, Actual: {}",
                        expected_size, actual_size
                    ),
                    path: Some(save_path),
                    file_size: Some(actual_size),
                });
            }
        }
    }

    Ok(DownloadResult {
        success: true,
        message: "File downloaded successfully".to_string(),
        path: Some(save_path),
        file_size,
    })
}

#[tauri::command]
async fn download_file_with_progress(
    url: String,
    save_path: String,
    _can_abort: Option<bool>,
    window: Window,
) -> Result<DownloadResult, String> {
    use std::fs::File;
    use std::io::Write;
    use tauri_plugin_http::reqwest;
    use futures_util::StreamExt;
    use std::time::{Duration, Instant};

    println!("开始下载文件: {} -> {}", url, save_path);

    // 创建 reqwest 客户端
    let client = reqwest::Client::new();

    // 发送 GET 请求下载文件
    let response = match client.get(&url).send().await {
        Ok(res) => res,
        Err(err) => return Err(format!("请求发送失败: {}", err)),
    };

    // 检查请求是否成功
    if !response.status().is_success() {
        return Err(format!(
            "文件下载失败: 状态码 {}",
            response.status()
        ));
    }

    // 获取内容长度（如果可用）
    let total_size = response.content_length().unwrap_or(0);
    println!("文件总大小: {} 字节", total_size);

    // 确保父目录存在
    let path = std::path::Path::new(&save_path);
    if let Some(parent) = path.parent() {
        if !parent.exists() {
            if let Err(err) = std::fs::create_dir_all(parent) {
                return Err(format!("创建目录失败: {}", err));
            }
        }
    }

    // 创建文件以写入下载的数据
    let mut file = match File::create(&save_path) {
        Ok(file) => file,
        Err(err) => return Err(format!("创建文件失败: {}", err)),
    };

    // 初始化进度跟踪变量
    let mut downloaded: u64 = 0;
    let start = Instant::now();
    let mut last_emit_time = Instant::now();
    let mut last_downloaded: u64 = 0;
    let mut current_speed: f64 = 0.0;
    
    // 获取流式响应
    let mut stream = response.bytes_stream();
    
    // 逐块下载并写入文件
    while let Some(item) = stream.next().await {
        let chunk = match item {
            Ok(chunk) => chunk,
            Err(err) => return Err(format!("读取数据块失败: {}", err)),
        };
        
        // 写入文件
        if let Err(err) = file.write_all(&chunk) {
            return Err(format!("写入文件失败: {}", err));
        }
        
        // 更新已下载的量
        downloaded += chunk.len() as u64;
        
        // 计算当前进度
        let percent = if total_size > 0 {
            (downloaded as f32 / total_size as f32) * 100.0
        } else {
            0.0
        };
        
        // 每200毫秒发送一次进度更新，避免发送太多事件
        let now = Instant::now();
        if now.duration_since(last_emit_time) >= Duration::from_millis(200) {
            // 计算下载速度 (bytes/second)
            let time_diff = now.duration_since(last_emit_time).as_secs_f64();
            let bytes_diff = (downloaded - last_downloaded) as f64;
            
            if time_diff > 0.0 {
                let instant_speed = bytes_diff / time_diff;
                
                // 平滑速度计算 (加权平均)
                if current_speed > 0.0 {
                    current_speed = current_speed * 0.7 + instant_speed * 0.3;
                } else {
                    current_speed = instant_speed;
                }
            }
            
            // 创建进度对象
            let progress = DownloadProgress {
                downloaded,
                total: total_size,
                percent,
            };
            
            // 附加额外信息
            let mut payload = serde_json::to_value(progress).unwrap_or_default();
            if let serde_json::Value::Object(ref mut map) = payload {
                map.insert("speed".into(), serde_json::json!(current_speed as u64));
                
                // 计算剩余时间 (秒)
                if current_speed > 0.0 && total_size > downloaded {
                    let remaining_bytes = total_size - downloaded;
                    let remaining_time = remaining_bytes as f64 / current_speed;
                    map.insert("eta".into(), serde_json::json!(remaining_time as u64));
                }
            }
            
            // 发送进度事件到前端
            if let Err(_) = window.emit("download-progress", &payload) {
                println!("发送进度事件失败");
            }
            
            // 更新最后发射时间和下载量
            last_emit_time = now;
            last_downloaded = downloaded;
        }
    }
    
    // 发送最终的100%进度更新
    let final_progress = DownloadProgress {
        downloaded,
        total: if total_size > 0 { total_size } else { downloaded },
        percent: 100.0,
    };
    
    // 发送完成事件
    if let Err(_) = window.emit("download-progress", &final_progress) {
        println!("发送最终进度事件失败");
    }
    
    // 计算平均下载速度
    let total_time = start.elapsed().as_secs_f64();
    let avg_speed = if total_time > 0.0 {
        (downloaded as f64 / total_time) as u64
    } else {
        0
    };
    
    println!("下载完成: {} 字节，平均速度: {} 字节/秒", downloaded, avg_speed);

    // 验证文件大小
    let file_size = match std::fs::metadata(&save_path) {
        Ok(metadata) => Some(metadata.len()),
        Err(_) => Some(downloaded),
    };

    Ok(DownloadResult {
        success: true,
        message: "文件下载成功".to_string(),
        path: Some(save_path),
        file_size,
    })
}

#[tauri::command]
async fn verify_file_exists(path: String) -> Result<bool, String> {
    let file_path = std::path::Path::new(&path);
    if file_path.exists() && file_path.is_file() {
        // 检查文件大小是否大于0
        match std::fs::metadata(&path) {
            Ok(metadata) => {
                if metadata.len() > 0 {
                    return Ok(true);
                } else {
                    return Ok(false); // 文件存在但大小为0
                }
            }
            Err(e) => {
                return Err(format!("无法获取文件元数据: {}", e));
            }
        }
    } else {
        return Ok(false); // 文件不存在
    }
}

#[tauri::command]
async fn get_file_metadata(path: String) -> Result<FileMetadata, String> {
    let file_path = std::path::Path::new(&path);
    let exists = file_path.exists();
    let is_file = file_path.is_file();
    let is_dir = file_path.is_dir();

    let mut size = None;
    let mut modified = None;
    let mut created = None;

    if exists {
        match std::fs::metadata(&path) {
            Ok(metadata) => {
                size = Some(metadata.len());

                if let Ok(modified_time) = metadata.modified() {
                    if let Ok(modified_str) = format_system_time(modified_time) {
                        modified = Some(modified_str);
                    }
                }

                if let Ok(created_time) = metadata.created() {
                    if let Ok(created_str) = format_system_time(created_time) {
                        created = Some(created_str);
                    }
                }
            }
            Err(e) => {
                return Err(format!("无法获取文件元数据: {}", e));
            }
        }
    }

    Ok(FileMetadata {
        exists,
        size,
        is_file,
        is_dir,
        modified,
        created,
    })
}

// 辅助函数：将系统时间格式化为字符串
fn format_system_time(time: std::time::SystemTime) -> Result<String, String> {
    match time.duration_since(std::time::UNIX_EPOCH) {
        Ok(duration) => Ok(duration.as_secs().to_string()),
        Err(e) => Err(format!("时间转换错误: {}", e)),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_http::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            download_file,
            download_file_with_progress,
            verify_file_exists,
            get_file_metadata
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
