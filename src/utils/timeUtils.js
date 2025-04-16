/**
 * 时间和日期处理工具模块
 */

/**
 * 格式化日期时间为可读字符串
 * @param {Date|number|string} date - 日期对象、时间戳或日期字符串
 * @param {boolean} includeTime - 是否包含时间部分
 * @returns {string} 格式化后的日期时间字符串
 */
export const formatDateTime = (date, includeTime = true) => {
  if (!date) return '';
  
  const d = date instanceof Date ? date : new Date(date);
  
  if (isNaN(d.getTime())) {
    console.warn('Invalid date provided to formatDateTime:', date);
    return '';
  }
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  let result = `${year}-${month}-${day}`;
  
  if (includeTime) {
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    result += ` ${hours}:${minutes}:${seconds}`;
  }
  
  return result;
};

/**
 * 格式化持续时间为可读字符串
 * @param {number} milliseconds - 毫秒数
 * @param {boolean} compact - 是否使用紧凑格式
 * @returns {string} 格式化后的持续时间字符串
 */
export const formatDuration = (milliseconds, compact = false) => {
  if (milliseconds == null || isNaN(milliseconds)) {
    return '-';
  }
  
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  const remainingHours = hours % 24;
  const remainingMinutes = minutes % 60;
  const remainingSeconds = seconds % 60;
  
  if (compact) {
    // 紧凑格式: 1d 2h 3m 4s
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (remainingHours > 0) parts.push(`${remainingHours}h`);
    if (remainingMinutes > 0) parts.push(`${remainingMinutes}m`);
    if (remainingSeconds > 0 || parts.length === 0) parts.push(`${remainingSeconds}s`);
    return parts.join(' ');
  } else {
    // 中文格式: 1天2小时3分4秒
    if (days > 0) {
      return `${days}天${remainingHours}小时${remainingMinutes}分${remainingSeconds}秒`;
    } else if (hours > 0) {
      return `${hours}小时${remainingMinutes}分${remainingSeconds}秒`;
    } else if (minutes > 0) {
      return `${minutes}分${remainingSeconds}秒`;
    } else {
      return `${seconds}秒`;
    }
  }
};

/**
 * 计算两个日期之间的差值（天数）
 * @param {Date|number|string} date1 - 第一个日期
 * @param {Date|number|string} date2 - 第二个日期
 * @returns {number} 天数差值
 */
export const daysBetween = (date1, date2) => {
  const d1 = date1 instanceof Date ? date1 : new Date(date1);
  const d2 = date2 instanceof Date ? date2 : new Date(date2);
  
  // 将时间部分归零以仅比较日期
  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);
  
  // 计算毫秒差并转换为天数
  const diffMs = Math.abs(d2 - d1);
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
};

/**
 * 检查日期是否在今天
 * @param {Date|number|string} date - 要检查的日期
 * @returns {boolean} 是否为今天
 */
export const isToday = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  const today = new Date();
  
  return d.getDate() === today.getDate() &&
         d.getMonth() === today.getMonth() &&
         d.getFullYear() === today.getFullYear();
};

/**
 * 获取相对于当前时间的友好描述
 * @param {Date|number|string} date - 日期对象、时间戳或日期字符串
 * @returns {string} 相对时间描述
 */
export const getRelativeTimeString = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const diffMs = now - d;
  
  // 转换为秒
  const diffSec = Math.floor(diffMs / 1000);
  
  if (diffSec < 60) {
    return '刚刚';
  }
  
  // 转换为分钟
  const diffMin = Math.floor(diffSec / 60);
  
  if (diffMin < 60) {
    return `${diffMin}分钟前`;
  }
  
  // 转换为小时
  const diffHour = Math.floor(diffMin / 60);
  
  if (diffHour < 24) {
    return `${diffHour}小时前`;
  }
  
  // 转换为天
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffDay < 30) {
    return `${diffDay}天前`;
  }
  
  // 转换为月
  const diffMonth = Math.floor(diffDay / 30);
  
  if (diffMonth < 12) {
    return `${diffMonth}个月前`;
  }
  
  // 转换为年
  const diffYear = Math.floor(diffMonth / 12);
  return `${diffYear}年前`;
};

/**
 * 格式化文件大小
 * @param {number} bytes 字节数
 * @param {number} decimals 小数位数
 * @returns {string} 格式化后的文件大小
 */
export const formatFileSize = (bytes, decimals = 2) => {
  if (bytes === 0 || isNaN(bytes)) return '0 B';
  
  try {
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
  } catch (err) {
    console.error('格式化文件大小失败:', err);
    return '';
  }
};

/**
 * 格式化下载速度
 * @param {number} bytesPerSecond 每秒字节数
 * @returns {string} 格式化后的下载速度
 */
export const formatSpeed = (bytesPerSecond) => {
  if (bytesPerSecond === 0 || isNaN(bytesPerSecond)) return '0 B/s';
  
  try {
    // 对于非常小的速度，使用 B/s
    if (bytesPerSecond < 1024) {
      return `${Math.round(bytesPerSecond)} B/s`;
    }
    
    // 对于 KB/s 级别的速度
    if (bytesPerSecond < 1024 * 1024) {
      return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`;
    }
    
    // 对于 MB/s 级别的速度
    if (bytesPerSecond < 1024 * 1024 * 1024) {
      return `${(bytesPerSecond / (1024 * 1024)).toFixed(2)} MB/s`;
    }
    
    // 对于 GB/s 级别的速度（很少见）
    return `${(bytesPerSecond / (1024 * 1024 * 1024)).toFixed(2)} GB/s`;
  } catch (err) {
    console.error('格式化下载速度失败:', err);
    return '';
  }
};

/**
 * 计算预计剩余时间
 * @param {number} totalSize 总大小（字节）
 * @param {number} downloadedSize 已下载大小（字节）
 * @param {number} speed 当前速度（字节/秒）
 * @returns {string} 格式化后的预计剩余时间
 */
export const calculateETA = (totalSize, downloadedSize, speed) => {
  if (!totalSize || !speed || totalSize <= downloadedSize) {
    return '计算中...';
  }
  
  try {
    const remainingBytes = totalSize - downloadedSize;
    const remainingSeconds = Math.ceil(remainingBytes / speed);
    
    // 将秒转换为更易读的格式
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
  } catch (err) {
    console.error('计算ETA失败:', err);
    return '计算中...';
  }
};

/**
 * 格式化时间间隔为友好文本
 * @param {Date|number|string} date 日期对象、时间戳或日期字符串
 * @returns {string} 友好的时间间隔描述
 */
export const timeAgo = (date) => {
  if (!date) return '';
  
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    const now = new Date();
    const diffMs = now - dateObj;
    const diffSeconds = Math.floor(diffMs / 1000);
    
    // 判断时间间隔
    if (diffSeconds < 60) {
      return '刚刚';
    } else if (diffSeconds < 3600) {
      const minutes = Math.floor(diffSeconds / 60);
      return `${minutes}分钟前`;
    } else if (diffSeconds < 86400) {
      const hours = Math.floor(diffSeconds / 3600);
      return `${hours}小时前`;
    } else if (diffSeconds < 604800) {
      const days = Math.floor(diffSeconds / 86400);
      return `${days}天前`;
    } else {
      // 超过一周显示具体日期
      return formatDateTime(dateObj, false);
    }
  } catch (err) {
    console.error('计算时间间隔失败:', err);
    return '';
  }
};

export default {
  formatDateTime,
  formatDuration,
  daysBetween,
  isToday,
  getRelativeTimeString,
  formatFileSize,
  formatSpeed,
  calculateETA,
  timeAgo
}; 