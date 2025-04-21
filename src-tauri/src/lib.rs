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
    let total_size = response.content_length().unwrap_or(0);

    // Ensure parent directories exist
    let path = std::path::Path::new(&save_path);
    if let Some(parent) = path.parent() {
        if !parent.exists() {
            if let Err(err) = std::fs::create_dir_all(parent) {
                return Err(format!("Failed to create directories: {}", err));
            }
        }
    }

    // Create file to write downloaded data
    let mut file = match File::create(&save_path) {
        Ok(file) => file,
        Err(err) => return Err(format!("Failed to create file: {}", err)),
    };

    // 由于Tauri v2的reqwest版本可能没有bytes_stream，我们使用标准方法代替
    // 下载整个内容
    let content = match response.bytes().await {
        Ok(bytes) => bytes,
        Err(err) => return Err(format!("Failed to get response content: {}", err)),
    };

    // 更新已下载的量
    let downloaded = content.len() as u64;

    // 写入文件
    if let Err(err) = file.write_all(&content) {
        return Err(format!("Failed to write to file: {}", err));
    }

    // 模拟进度事件 - 因为我们一次性下载了整个文件，所以只发送一个100%完成的进度事件
    let percent = 100.0;

    // 创建进度对象
    let progress = DownloadProgress {
        downloaded,
        total: if total_size > 0 {
            total_size
        } else {
            downloaded
        },
        percent,
    };

    // 发送进度事件到前端
    if let Err(_) = window.emit("download-progress", &progress) {
        println!("Failed to emit progress event");
    }

    // Verify file size
    let file_size = match std::fs::metadata(&save_path) {
        Ok(metadata) => Some(metadata.len()),
        Err(_) => Some(downloaded),
    };

    Ok(DownloadResult {
        success: true,
        message: "File downloaded successfully".to_string(),
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
