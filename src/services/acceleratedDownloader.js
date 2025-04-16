/**
 * 下载加速器服务 - 通过多线程分片下载加速文件下载
 */

/**
 * 默认配置
 */
const DEFAULT_CONFIG = {
  chunkCount: 8,           // 默认分片数
  chunkSize: 1024 * 1024,  // 默认分片大小 (1MB)
  retryCount: 3,           // 失败重试次数
  retryDelay: 1000,        // 重试延迟(ms)
  timeout: 60000,          // 超时时间(ms) - 增加了超时时间
  useMultiThread: true,    // 默认启用多线程
  enableSpeedTest: true,   // 启用下载速度测试
  progressInterval: 500,   // 进度更新间隔(ms) - 减少了间隔以提供更及时的进度更新
};

/**
 * 下载任务状态
 */
export const DownloadStatus = {
  PENDING: 'pending',
  ANALYZING: 'analyzing',
  DOWNLOADING: 'downloading',
  MERGING: 'merging',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELED: 'canceled',
  PAUSED: 'paused',
};

/**
 * 创建多线程下载任务
 * @param {string} url 下载链接
 * @param {string} fileName 文件名
 * @param {Object} options 下载选项
 * @param {Function} callbacks 回调函数
 * @returns {Object} 下载任务对象
 */
export const createAcceleratedDownload = (url, fileName, options = {}, callbacks = {}) => {
  const config = { ...DEFAULT_CONFIG, ...options };
  const {
    onProgress,
    onStatusChange,
    onSpeed,
    onComplete,
    onError,
    onLog,
  } = callbacks;

  let chunks = [];
  let completedChunks = 0;
  let totalSize = 0;
  let downloadedSize = 0;
  let startTime = 0;
  let endTime = 0;
  let lastProgressTime = 0;
  let lastDownloadedSize = 0;
  let currentStatus = DownloadStatus.PENDING;
  let cancelRequested = false;
  let pauseRequested = false;
  let progressTimer = null;
  let downloadId = Date.now();
  
  // 记录日志
  const log = (message, type = 'info') => {
    console.log(`[下载加速器] ${message}`);
    if (onLog) onLog(message, type);
  };
  
  // 更新状态
  const updateStatus = (status) => {
    currentStatus = status;
    if (onStatusChange) onStatusChange(status);
    log(`下载状态: ${status}`, status === DownloadStatus.FAILED ? 'error' : 'info');
  };
  
  // 更新进度
  const updateProgress = () => {
    if (!startTime) return;
    
    const now = Date.now();
    const elapsed = now - lastProgressTime;
    
    if (elapsed >= config.progressInterval) {
      const progress = totalSize ? (downloadedSize / totalSize) * 100 : 0;
      
      // 计算下载速度
      const bytesPerSecond = ((downloadedSize - lastDownloadedSize) / elapsed) * 1000;
      const speed = formatSpeed(bytesPerSecond);
      
      if (onProgress) {
        onProgress({
          progress: Math.min(progress, 99.9), // 保留合并阶段
          downloaded: downloadedSize,
          total: totalSize,
          remainingChunks: chunks.length - completedChunks,
          speed: speed
        });
      }
      
      lastDownloadedSize = downloadedSize;
      lastProgressTime = now;
      
      if (onSpeed && bytesPerSecond > 0) {
        onSpeed(speed);
      }
    }
  };
  
  // 分析文件大小和支持的功能
  const analyzeFile = async () => {
    try {
      updateStatus(DownloadStatus.ANALYZING);
      log(`分析下载链接: ${url}`);
      
      // 添加超时处理
      const controller = new AbortController();
      const signal = controller.signal;
      const timeoutId = setTimeout(() => controller.abort(), config.timeout);
      
      const response = await fetch(url, { 
        method: 'HEAD',
        signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`服务器响应错误: ${response.status} ${response.statusText}`);
      }
      
      // 获取文件大小
      const contentLength = response.headers.get('content-length');
      if (contentLength) {
        totalSize = parseInt(contentLength, 10);
        log(`文件大小: ${formatSize(totalSize)}`);
      } else {
        log('无法获取文件大小，将使用单线程下载', 'warning');
        return false;
      }
      
      // 检查服务器是否支持范围请求
      const acceptRanges = response.headers.get('accept-ranges');
      const supportsRanges = acceptRanges && acceptRanges !== 'none';
      
      if (!supportsRanges) {
        log('服务器不支持范围请求，将使用单线程下载', 'warning');
        return false;
      }
      
      return true;
    } catch (error) {
      log(`分析文件失败: ${error.message}`, 'error');
      return false;
    }
  };
  
  // 分割下载任务
  const splitDownloadTasks = () => {
    if (totalSize <= 0) return false;
    
    // 确保文件有足够大小才分片
    if (totalSize < config.chunkSize * 2) {
      log(`文件较小 (${formatSize(totalSize)})，使用较少分片`);
      config.chunkCount = 2;
    }
    
    const optimalChunkCount = Math.min(
      config.chunkCount,
      Math.ceil(totalSize / config.chunkSize)
    );
    
    const chunkSize = Math.ceil(totalSize / optimalChunkCount);
    chunks = [];
    
    log(`将下载分为 ${optimalChunkCount} 个分块，每块约 ${formatSize(chunkSize)}`);
    
    for (let i = 0; i < optimalChunkCount; i++) {
      const start = i * chunkSize;
      const end = i === optimalChunkCount - 1 ? totalSize - 1 : start + chunkSize - 1;
      
      chunks.push({
        id: i,
        start,
        end,
        downloaded: 0,
        completed: false,
        data: null,
        retries: 0,
      });
    }
    
    log(`已将下载分为 ${chunks.length} 个分块`);
    return true;
  };
  
  // 下载单个分块
  const downloadChunk = async (chunk) => {
    if (cancelRequested) return null;
    if (pauseRequested) return null;
    
    try {
      log(`开始下载分块 ${chunk.id} (${formatSize(chunk.end - chunk.start + 1)})`);
      
      const controller = new AbortController();
      const { signal } = controller;
      
      const timeoutId = setTimeout(() => {
        log(`分块 ${chunk.id} 下载超时`, 'warning');
        controller.abort();
      }, config.timeout);
      
      const response = await fetch(url, {
        headers: {
          Range: `bytes=${chunk.start}-${chunk.end}`,
        },
        signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`分块 ${chunk.id} 下载失败: ${response.status}`);
      }
      
      const reader = response.body.getReader();
      let receivedLength = 0;
      let chunks = [];
      
      while (true) {
        if (cancelRequested) {
          reader.cancel();
          return null;
        }
        
        if (pauseRequested) {
          reader.cancel();
          return null;
        }
        
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }
        
        chunks.push(value);
        receivedLength += value.length;
        downloadedSize += value.length;
        chunk.downloaded = receivedLength;
        
        updateProgress();
      }
      
      log(`分块 ${chunk.id} 下载完成`);
      
      const data = new Uint8Array(receivedLength);
      let position = 0;
      for (const chunk of chunks) {
        data.set(chunk, position);
        position += chunk.length;
      }
      
      return data;
    } catch (error) {
      log(`分块 ${chunk.id} 下载错误: ${error.message}`, 'error');
      
      // 达到最大重试次数
      if (chunk.retries >= config.retryCount) {
        log(`分块 ${chunk.id} 达到最大重试次数 (${config.retryCount})`, 'error');
        return null;
      }
      
      // 增加重试次数
      chunk.retries++;
      log(`重试分块 ${chunk.id} (${chunk.retries}/${config.retryCount})`, 'warning');
      
      // 延迟重试
      await new Promise(resolve => setTimeout(resolve, config.retryDelay));
      return downloadChunk(chunk);
    }
  };
  
  // 合并所有分块
  const mergeChunks = async () => {
    try {
      updateStatus(DownloadStatus.MERGING);
      log('开始合并分块数据');
      
      const totalLength = chunks.reduce((total, chunk) => {
        if (!chunk.data) return total;
        return total + chunk.data.length;
      }, 0);
      
      // 创建合并后的数据
      const mergedData = new Uint8Array(totalLength);
      let position = 0;
      
      for (const chunk of chunks) {
        if (!chunk.data) {
          throw new Error(`分块 ${chunk.id} 数据缺失`);
        }
        
        mergedData.set(chunk.data, position);
        position += chunk.data.length;
        
        // 释放内存
        chunk.data = null;
      }
      
      // 保存文件
      const blob = new Blob([mergedData], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      
      // 触发下载
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
      
      log('文件合并完成并保存');
      
      return true;
    } catch (error) {
      log(`合并文件失败: ${error.message}`, 'error');
      return false;
    }
  };
  
  // 单线程下载
  const performSingleThreadDownload = async () => {
    try {
      log('使用单线程下载模式');
      updateStatus(DownloadStatus.DOWNLOADING);
      
      // 创建下载链接
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      
      // 假设下载成功
      setTimeout(() => {
        document.body.removeChild(a);
      }, 100);
      
      return true;
    } catch (error) {
      log(`单线程下载失败: ${error.message}`, 'error');
      return false;
    }
  };
  
  // 开始下载
  const startDownload = async () => {
    startTime = Date.now();
    lastProgressTime = startTime;
    
    try {
      // 分析文件
      const supportsMultiThread = await analyzeFile();
      
      // 如果不支持多线程下载或用户禁用多线程，使用单线程下载
      if (!supportsMultiThread || !config.useMultiThread) {
        log('使用单线程下载', 'info');
        const result = await performSingleThreadDownload();
        if (result) {
          endTime = Date.now();
          updateStatus(DownloadStatus.COMPLETED);
          
          if (onComplete) {
            onComplete({
              id: downloadId,
              name: fileName,
              size: totalSize,
              duration: endTime - startTime,
            });
          }
        } else {
          updateStatus(DownloadStatus.FAILED);
          if (onError) onError(new Error('单线程下载失败'));
        }
        
        return;
      }
      
      // 分割下载任务
      const tasksSplit = splitDownloadTasks();
      if (!tasksSplit) {
        log('分割下载任务失败，将使用单线程下载', 'warning');
        await performSingleThreadDownload();
        return;
      }
      
      // 开始多线程下载
      updateStatus(DownloadStatus.DOWNLOADING);
      log(`开始多线程下载 (${chunks.length} 线程)`);
      
      // 启动进度更新定时器
      progressTimer = setInterval(updateProgress, 200); // 更高频率的进度更新
      
      // 创建下载任务并并行执行
      const downloadPromises = chunks.map(async (chunk) => {
        const data = await downloadChunk(chunk);
        if (data) {
          chunk.data = data;
          chunk.completed = true;
          completedChunks++;
          
          log(`分块 ${chunk.id} 下载完成 (${completedChunks}/${chunks.length})`);
          updateProgress(); // 立即更新进度
          
          // 所有分块下载完成后合并
          if (completedChunks === chunks.length) {
            clearInterval(progressTimer);
            mergeChunks().then(success => {
              endTime = Date.now();
              
              if (success) {
                const duration = (endTime - startTime) / 1000;
                const speedMBps = (totalSize / 1024 / 1024) / duration;
                log(`下载完成! 总时间: ${duration.toFixed(1)}秒, 平均速度: ${speedMBps.toFixed(2)} MB/s`);
                
                updateStatus(DownloadStatus.COMPLETED);
                if (onComplete) {
                  onComplete({
                    id: downloadId,
                    name: fileName,
                    size: totalSize,
                    duration: endTime - startTime,
                  });
                }
              } else {
                updateStatus(DownloadStatus.FAILED);
                if (onError) onError(new Error('合并文件失败'));
              }
            });
          }
        } else if (cancelRequested) {
          updateStatus(DownloadStatus.CANCELED);
        } else if (pauseRequested) {
          updateStatus(DownloadStatus.PAUSED);
        } else {
          // 分块下载失败
          log(`分块 ${chunk.id} 下载失败`, 'error');
        }
      });
      
      // 等待所有任务完成或失败
      await Promise.all(downloadPromises).catch(error => {
        log(`下载过程出错: ${error.message}`, 'error');
        if (currentStatus !== DownloadStatus.COMPLETED) {
          updateStatus(DownloadStatus.FAILED);
          if (onError) onError(error);
        }
      });
      
    } catch (error) {
      log(`下载过程出错: ${error.message}`, 'error');
      updateStatus(DownloadStatus.FAILED);
      if (onError) onError(error);
    }
  };
  
  // 取消下载
  const cancelDownload = () => {
    if (currentStatus === DownloadStatus.COMPLETED || 
        currentStatus === DownloadStatus.FAILED ||
        currentStatus === DownloadStatus.CANCELED) {
      return;
    }
    
    cancelRequested = true;
    log('取消下载请求已发送');
    
    if (progressTimer) {
      clearInterval(progressTimer);
    }
  };
  
  // 暂停下载
  const pauseDownload = () => {
    if (currentStatus !== DownloadStatus.DOWNLOADING) {
      return;
    }
    
    pauseRequested = true;
    log('暂停下载请求已发送');
  };
  
  // 恢复下载
  const resumeDownload = () => {
    if (currentStatus !== DownloadStatus.PAUSED) {
      return;
    }
    
    pauseRequested = false;
    log('恢复下载');
    startDownload();
  };
  
  // 返回下载任务对象
  return {
    id: downloadId,
    url,
    fileName,
    status: currentStatus,
    start: startDownload,
    cancel: cancelDownload,
    pause: pauseDownload,
    resume: resumeDownload,
    getProgress: () => {
      if (totalSize === 0) return 0;
      return (downloadedSize / totalSize) * 100;
    },
    getStatus: () => currentStatus,
  };
};

/**
 * 格式化文件大小
 * @param {number} bytes 字节数
 * @returns {string} 格式化后的大小
 */
export const formatSize = (bytes) => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * 格式化下载速度
 * @param {number} bytesPerSecond 每秒字节数
 * @returns {string} 格式化后的下载速度
 */
export const formatSpeed = (bytesPerSecond) => {
  return `${formatSize(bytesPerSecond)}/s`;
}; 