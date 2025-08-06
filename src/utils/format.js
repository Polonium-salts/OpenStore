/**
 * 文件大小和速度格式化工具函数
 */

/**
 * 格式化字节数为可读的文件大小
 * @param {number} bytes - 字节数
 * @param {number} decimals - 小数位数，默认为1
 * @returns {string} 格式化后的文件大小，如 "150.5 MB"
 */
export const formatBytes = (bytes, decimals = 1) => {
  if (bytes === 0 || isNaN(bytes) || bytes == null) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  // 确保索引不超出数组范围
  const sizeIndex = Math.min(i, sizes.length - 1);
  const size = bytes / Math.pow(k, sizeIndex);
  
  return `${size.toFixed(decimals)} ${sizes[sizeIndex]}`;
};

/**
 * 格式化下载速度
 * @param {number} bytesPerSecond - 每秒字节数
 * @returns {string} 格式化后的下载速度，如 "2.5 MB/s"
 */
export const formatSpeed = (bytesPerSecond) => {
  if (bytesPerSecond === 0 || isNaN(bytesPerSecond) || bytesPerSecond == null) {
    return '0 B/s';
  }
  
  return `${formatBytes(bytesPerSecond)}/s`;
};

/**
 * 格式化下载进度显示
 * @param {number} downloadedBytes - 已下载字节数
 * @param {number} totalBytes - 总字节数
 * @returns {string} 格式化后的进度显示，如 "150 MB/500 MB"
 */
export const formatProgress = (downloadedBytes, totalBytes) => {
  const downloaded = formatBytes(downloadedBytes);
  const total = formatBytes(totalBytes);
  return `${downloaded}/${total}`;
};

/**
 * 计算下载百分比
 * @param {number} downloadedBytes - 已下载字节数
 * @param {number} totalBytes - 总字节数
 * @returns {number} 百分比（0-100），处理除零情况
 */
export const calculatePercentage = (downloadedBytes, totalBytes) => {
  if (!totalBytes || totalBytes === 0) return 0;
  if (!downloadedBytes || downloadedBytes === 0) return 0;
  
  const percentage = (downloadedBytes / totalBytes) * 100;
  return Math.min(Math.max(percentage, 0), 100); // 确保在0-100范围内
};

/**
 * 计算预计剩余时间
 * @param {number} totalBytes - 总字节数
 * @param {number} downloadedBytes - 已下载字节数
 * @param {number} speedBytesPerSecond - 当前速度（字节/秒）
 * @returns {string} 格式化后的预计剩余时间
 */
export const calculateETA = (totalBytes, downloadedBytes, speedBytesPerSecond) => {
  if (!totalBytes || !speedBytesPerSecond || totalBytes <= downloadedBytes) {
    return '计算中...';
  }
  
  const remainingBytes = totalBytes - downloadedBytes;
  const remainingSeconds = Math.ceil(remainingBytes / speedBytesPerSecond);
  
  if (remainingSeconds < 60) {
    return `${remainingSeconds}秒`;
  } else if (remainingSeconds < 3600) {
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    return `${minutes}分${seconds}秒`;
  } else {
    const hours = Math.floor(remainingSeconds / 3600);
    const minutes = Math.floor((remainingSeconds % 3600) / 60);
    return `${hours}时${minutes}分`;
  }
};