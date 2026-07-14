// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use tauri::Emitter;
use std::collections::HashMap;
use std::sync::Mutex;

/// Managed state: maps download URL -> tokio watch Sender<bool> (true = cancel requested)
struct DownloadRegistry(Mutex<HashMap<String, tokio::sync::watch::Sender<bool>>>);

#[derive(serde::Serialize, Clone)]
struct ProgressPayload {
    repo_url: String,
    status: String, // "cloning", "downloading_zip", "completed", "failed", "pulling"
    message: String,
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn check_git_installed() -> bool {
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("cmd")
            .args(&["/c", "git --version"])
            .stdout(std::process::Stdio::null())
            .stderr(std::process::Stdio::null())
            .status()
            .map(|status| status.success())
            .unwrap_or(false)
    }
    #[cfg(not(target_os = "windows"))]
    {
        std::process::Command::new("git")
            .arg("--version")
            .stdout(std::process::Stdio::null())
            .stderr(std::process::Stdio::null())
            .status()
            .map(|status| status.success())
            .unwrap_or(false)
    }
}

#[tauri::command]
fn get_default_download_dir(app: tauri::AppHandle) -> Result<String, String> {
    use tauri::Manager;
    let download_dir = app.path().download_dir().map_err(|e| e.to_string())?;

    let mut git_apps_dir = download_dir;
    git_apps_dir.push("GitAppStore");

    // Create directory if it doesn't exist
    if !git_apps_dir.exists() {
        std::fs::create_dir_all(&git_apps_dir).map_err(|e| e.to_string())?;
    }

    Ok(git_apps_dir.to_string_lossy().to_string())
}

#[tauri::command]
async fn clone_repository(
    app: tauri::AppHandle,
    repo_url: String,
    target_dir: String,
    folder_name: String,
    github_token: Option<String>,
    use_zip: bool,
) -> Result<String, String> {
    let mut path = std::path::PathBuf::from(&target_dir);
    let parent_path = path.clone();
    path.push(&folder_name);

    let path_str = path.to_string_lossy().to_string();
    let parent_path_str = parent_path.to_string_lossy().to_string();

    let git_installed = check_git_installed();

    if !use_zip && git_installed {
        let _ = app.emit(
            "download-progress",
            ProgressPayload {
                repo_url: repo_url.clone(),
                status: "cloning".to_string(),
                message: "正在使用 Git 克隆仓库...".to_string(),
            },
        );

        // Inject GitHub Personal Access Token if provided
        let clone_url = if let Some(ref token) = github_token {
            if !token.trim().is_empty() && repo_url.starts_with("https://github.com/") {
                repo_url.replace(
                    "https://github.com/",
                    &format!("https://oauth2:{}@github.com/", token),
                )
            } else {
                repo_url.clone()
            }
        } else {
            repo_url.clone()
        };

        // Create target directory parent if not exists
        let _ = std::fs::create_dir_all(&parent_path);

        let output = if cfg!(target_os = "windows") {
            std::process::Command::new("cmd")
                .args(&[
                    "/c",
                    &format!("git clone \"{}\" \"{}\"", clone_url, path_str),
                ])
                .output()
        } else {
            std::process::Command::new("git")
                .args(&["clone", &clone_url, &path_str])
                .output()
        };

        match output {
            Ok(out) => {
                if out.status.success() {
                    let _ = app.emit(
                        "download-progress",
                        ProgressPayload {
                            repo_url: repo_url.clone(),
                            status: "completed".to_string(),
                            message: "克隆成功！".to_string(),
                        },
                    );
                    Ok(path_str)
                } else {
                    let stderr = String::from_utf8_lossy(&out.stderr).to_string();
                    let _ = app.emit(
                        "download-progress",
                        ProgressPayload {
                            repo_url: repo_url.clone(),
                            status: "failed".to_string(),
                            message: format!("Git 克隆失败: {}", stderr),
                        },
                    );
                    Err(stderr)
                }
            }
            Err(e) => {
                let err_msg = format!("无法运行 git 进程: {}", e);
                let _ = app.emit(
                    "download-progress",
                    ProgressPayload {
                        repo_url: repo_url.clone(),
                        status: "failed".to_string(),
                        message: err_msg.clone(),
                    },
                );
                Err(err_msg)
            }
        }
    } else {
        // Fallback to PowerShell web download & unzip
        let _ = app.emit(
            "download-progress",
            ProgressPayload {
                repo_url: repo_url.clone(),
                status: "downloading_zip".to_string(),
                message: "系统未检测到 Git 或选择 ZIP 方式下载，正在请求 ZIP 压缩包...".to_string(),
            },
        );

        let parts: Vec<&str> = repo_url.split("github.com/").collect();
        if parts.len() < 2 {
            return Err("无效的 GitHub 仓库 URL".to_string());
        }
        let repo_path_parts: Vec<&str> = parts[1].split('/').collect();
        if repo_path_parts.len() < 2 {
            return Err("无效的 GitHub 仓库 URL".to_string());
        }
        let owner = repo_path_parts[0];
        let repo = repo_path_parts[1].trim_end_matches(".git");

        let zip_url = format!("https://api.github.com/repos/{}/{}/zipball", owner, repo);

        let mut temp_zip = parent_path.clone();
        temp_zip.push(format!("{}_{}.zip", owner, repo));
        let temp_zip_str = temp_zip.to_string_lossy().to_string();

        let _ = std::fs::create_dir_all(&parent_path);

        let auth_header = if let Some(ref token) = github_token {
            if !token.trim().is_empty() {
                format!("'Authorization'='Bearer {}'; ", token)
            } else {
                "".to_string()
            }
        } else {
            "".to_string()
        };

        let mut temp_extract_dir = parent_path.clone();
        temp_extract_dir.push(format!("{}_{}_temp_extract", owner, repo));
        let temp_extract_str = temp_extract_dir.to_string_lossy().to_string();

        // PowerShell script to download, extract, delete zip, rename first extracted directory, clean up temp dir.
        let ps_script = format!(
            "$ProgressPreference = 'SilentlyContinue'; \
             if (Test-Path '{temp_extract_str}') {{ Remove-Item -Recurse -Force '{temp_extract_str}' }} \
             New-Item -ItemType Directory -Path '{temp_extract_str}' -Force | Out-Null; \
             $headers = @{{ 'User-Agent'='GitAppStore'; {auth_header} }}; \
             Invoke-WebRequest -Headers $headers -Uri '{zip_url}' -OutFile '{temp_zip_str}'; \
             Expand-Archive -Path '{temp_zip_str}' -DestinationPath '{temp_extract_str}' -Force; \
             Remove-Item '{temp_zip_str}' -Force; \
             $extracted = Get-ChildItem -Path '{temp_extract_str}' -Directory | Select-Object -First 1; \
             $finalPath = '{path_str}'; \
             if (Test-Path $finalPath) {{ Remove-Item -Recurse -Force $finalPath }} \
             Move-Item -Path $extracted.FullName -Destination $finalPath -Force; \
             Remove-Item -Recurse -Force '{temp_extract_str}';"
        );

        let output = std::process::Command::new("powershell")
            .args(&["-ExecutionPolicy", "Bypass", "-Command", &ps_script])
            .output();

        match output {
            Ok(out) => {
                if out.status.success() {
                    let _ = app.emit(
                        "download-progress",
                        ProgressPayload {
                            repo_url: repo_url.clone(),
                            status: "completed".to_string(),
                            message: "ZIP 下载并解压完成。".to_string(),
                        },
                    );
                    Ok(path_str)
                } else {
                    let stderr = String::from_utf8_lossy(&out.stderr).to_string();
                    let _ = app.emit(
                        "download-progress",
                        ProgressPayload {
                            repo_url: repo_url.clone(),
                            status: "failed".to_string(),
                            message: format!("ZIP 下载/解压失败: {}", stderr),
                        },
                    );
                    Err(stderr)
                }
            }
            Err(e) => {
                let err_msg = format!("执行 PowerShell 命令失败: {}", e);
                let _ = app.emit(
                    "download-progress",
                    ProgressPayload {
                        repo_url: repo_url.clone(),
                        status: "failed".to_string(),
                        message: err_msg.clone(),
                    },
                );
                Err(err_msg)
            }
        }
    }
}

#[tauri::command]
async fn pull_repository(
    app: tauri::AppHandle,
    repo_path: String,
    repo_url: String,
    github_token: Option<String>,
) -> Result<String, String> {
    let path = std::path::PathBuf::from(&repo_path);
    let git_dir = path.join(".git");

    if git_dir.exists() && check_git_installed() {
        let _ = app.emit(
            "download-progress",
            ProgressPayload {
                repo_url: repo_url.clone(),
                status: "pulling".to_string(),
                message: "正在使用 git pull 检查更新...".to_string(),
            },
        );

        let output = if cfg!(target_os = "windows") {
            std::process::Command::new("cmd")
                .args(&["/c", "git pull"])
                .current_dir(&repo_path)
                .output()
        } else {
            std::process::Command::new("git")
                .arg("pull")
                .current_dir(&repo_path)
                .output()
        };

        match output {
            Ok(out) => {
                if out.status.success() {
                    let msg = String::from_utf8_lossy(&out.stdout).to_string();
                    let _ = app.emit(
                        "download-progress",
                        ProgressPayload {
                            repo_url: repo_url.clone(),
                            status: "completed".to_string(),
                            message: format!("更新成功: {}", msg),
                        },
                    );
                    Ok(msg)
                } else {
                    let stderr = String::from_utf8_lossy(&out.stderr).to_string();
                    let _ = app.emit(
                        "download-progress",
                        ProgressPayload {
                            repo_url: repo_url.clone(),
                            status: "failed".to_string(),
                            message: format!("更新失败: {}", stderr),
                        },
                    );
                    Err(stderr)
                }
            }
            Err(e) => {
                let err_msg = format!("执行 git pull 失败: {}", e);
                let _ = app.emit(
                    "download-progress",
                    ProgressPayload {
                        repo_url: repo_url.clone(),
                        status: "failed".to_string(),
                        message: err_msg.clone(),
                    },
                );
                Err(err_msg)
            }
        }
    } else {
        // Zip fallback update: download again to overwrite
        if let Some(parent) = path.parent() {
            if let Some(folder_name) = path.file_name() {
                let parent_dir = parent.to_string_lossy().to_string();
                let folder_name_str = folder_name.to_string_lossy().to_string();

                return clone_repository(
                    app,
                    repo_url,
                    parent_dir,
                    folder_name_str,
                    github_token,
                    true,
                )
                .await;
            }
        }
        Err("未能获取仓库路径或名称".to_string())
    }
}

#[tauri::command]
fn uninstall_repository(repo_path: String) -> Result<(), String> {
    let path = std::path::PathBuf::from(&repo_path);
    if path.exists() {
        if path.is_dir() {
            #[cfg(target_os = "windows")]
            {
                // PowerShell recursive force remove is much more robust on Windows
                let ps_cmd = format!("Remove-Item -Recurse -Force \"{}\"", repo_path);
                let output = std::process::Command::new("powershell")
                    .args(&["-Command", &ps_cmd])
                    .output();
                match output {
                    Ok(out) => {
                        if out.status.success() {
                            Ok(())
                        } else {
                            Err(String::from_utf8_lossy(&out.stderr).to_string())
                        }
                    }
                    Err(e) => Err(e.to_string()),
                }
            }
            #[cfg(not(target_os = "windows"))]
            {
                std::fs::remove_dir_all(&path).map_err(|e| e.to_string())
            }
        } else {
            std::fs::remove_file(&path).map_err(|e| e.to_string())
        }
    } else {
        Ok(())
    }
}

#[tauri::command]
fn open_in_explorer(path: String) -> Result<(), String> {
    let output = if cfg!(target_os = "windows") {
        std::process::Command::new("explorer").arg(&path).output()
    } else if cfg!(target_os = "macos") {
        std::process::Command::new("open").arg(&path).output()
    } else {
        std::process::Command::new("xdg-open").arg(&path).output()
    };

    match output {
        Ok(_) => Ok(()),
        Err(e) => Err(format!("无法打开文件夹: {}", e)),
    }
}

#[tauri::command]
fn open_in_vscode(path: String) -> Result<(), String> {
    let output = if cfg!(target_os = "windows") {
        std::process::Command::new("cmd")
            .args(&["/c", "code", &path])
            .output()
    } else {
        std::process::Command::new("code").arg(&path).output()
    };

    match output {
        Ok(out) => {
            if out.status.success() {
                Ok(())
            } else {
                Err(String::from_utf8_lossy(&out.stderr).to_string())
            }
        }
        Err(e) => Err(format!("无法启动 VS Code: {}", e)),
    }
}

#[tauri::command]
async fn run_installer(
    app: tauri::AppHandle,
    filename: String,
) -> Result<(), String> {
    use tauri::Manager;

    let download_dir = app.path().download_dir().map_err(|e| e.to_string())?;
    let mut path = download_dir;
    path.push("GitAppStore");
    path.push(&filename);

    if !path.exists() {
        return Err(format!("安装包文件不存在：{}", path.display()));
    }

    let path_str = path.to_string_lossy().to_string();

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("cmd")
            .args(&["/c", "start", "", &path_str])
            .spawn()
            .map_err(|e| format!("无法启动安装包: {}", e))?;
    }
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&path_str)
            .spawn()
            .map_err(|e| format!("无法启动安装包: {}", e))?;
    }
    #[cfg(not(any(target_os = "windows", target_os = "macos")))]
    {
        std::process::Command::new("xdg-open")
            .arg(&path_str)
            .spawn()
            .map_err(|e| format!("无法启动安装包: {}", e))?;
    }

    Ok(())
}

#[derive(serde::Serialize, Clone)]
struct AssetProgressPayload {
    url: String,
    downloaded: u64,
    total: u64,
    percent: u32,
    status: String,
}

#[tauri::command]
async fn download_release_asset(
    app: tauri::AppHandle,
    url: String,
    filename: String,
) -> Result<String, String> {
    use tauri::Manager;
    use tauri_plugin_notification::NotificationExt;
    use futures_util::StreamExt;
    use std::io::Write;

    // 1. Get the download directory
    let download_dir = app.path().download_dir().map_err(|e| e.to_string())?;

    let mut target_path = download_dir;
    target_path.push("GitAppStore");

    // Create directory if it doesn't exist
    if !target_path.exists() {
        std::fs::create_dir_all(&target_path).map_err(|e| e.to_string())?;
    }

    target_path.push(&filename);
    let target_path_str = target_path.to_string_lossy().to_string();

    // 2. Register a cancellation watch channel for this URL
    let (cancel_tx, cancel_rx) = tokio::sync::watch::channel(false);
    {
        let registry = app.state::<DownloadRegistry>();
        let mut map = registry.0.lock().unwrap();
        map.insert(url.clone(), cancel_tx);
    }

    // Helper: cleanup on cancel or error
    let cleanup = |url: &str, path: &std::path::PathBuf, app: &tauri::AppHandle| {
        let _ = std::fs::remove_file(path);
        let registry = app.state::<DownloadRegistry>();
        let mut map = registry.0.lock().unwrap();
        map.remove(url);
    };

    // 3. Download the file using reqwest stream
    let client = reqwest::Client::builder()
        .user_agent("GitAppStore")
        .build()
        .map_err(|e| e.to_string())?;

    let response = client.get(&url).send().await.map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        return Err(format!("HTTP 错误，状态码: {}", response.status()));
    }

    let total_size = response.content_length().unwrap_or(0);
    
    // Create the file
    let mut file = std::fs::File::create(&target_path).map_err(|e| e.to_string())?;
    let mut downloaded: u64 = 0;
    let mut stream = response.bytes_stream();
    
    // Initial emit
    let _ = app.emit("asset-download-progress", AssetProgressPayload {
        url: url.clone(),
        downloaded: 0,
        total: total_size,
        percent: 0,
        status: "downloading".to_string(),
    });

    let mut last_emitted_percent = 0;

    while let Some(chunk_result) = stream.next().await {
        // Check for cancellation before processing each chunk
        if *cancel_rx.borrow() {
            cleanup(&url, &target_path, &app);
            let _ = app.emit("asset-download-progress", AssetProgressPayload {
                url: url.clone(),
                downloaded,
                total: total_size,
                percent: last_emitted_percent,
                status: "cancelled".to_string(),
            });
            return Err("已取消下载".to_string());
        }

        let chunk = chunk_result.map_err(|e| e.to_string())?;
        file.write_all(&chunk).map_err(|e| e.to_string())?;
        downloaded += chunk.len() as u64;

        if total_size > 0 {
            let percent = (downloaded as f64 / total_size as f64 * 100.0) as u32;
            // Throttle emissions to avoid flooding the IPC bridge (emit every 1% change)
            if percent > last_emitted_percent {
                last_emitted_percent = percent;
                let _ = app.emit("asset-download-progress", AssetProgressPayload {
                    url: url.clone(),
                    downloaded,
                    total: total_size,
                    percent,
                    status: "downloading".to_string(),
                });
            }
        }
    }

    // Final emit
    let _ = app.emit("asset-download-progress", AssetProgressPayload {
        url: url.clone(),
        downloaded: total_size,
        total: total_size,
        percent: 100,
        status: "completed".to_string(),
    });

    // Remove from registry
    {
        let registry = app.state::<DownloadRegistry>();
        let mut map = registry.0.lock().unwrap();
        map.remove(&url);
    }

    // 5. Send notification
    let _ = app
        .notification()
        .builder()
        .title("下载完成")
        .body(format!("{} 已成功下载并保存至下载文件夹。", filename))
        .show();

    Ok(target_path_str)
}

#[tauri::command]
async fn cancel_download(
    app: tauri::AppHandle,
    url: String,
) -> Result<(), String> {
    use tauri::Manager;
    let registry = app.state::<DownloadRegistry>();
    let map = registry.0.lock().unwrap();
    if let Some(tx) = map.get(&url) {
        let _ = tx.send(true);
        Ok(())
    } else {
        Err("未找到对应的下载任务".to_string())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(DownloadRegistry(Mutex::new(HashMap::new())))
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            check_git_installed,
            get_default_download_dir,
            clone_repository,
            pull_repository,
            uninstall_repository,
            open_in_explorer,
            open_in_vscode,
            run_installer,
            download_release_asset,
            cancel_download
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
