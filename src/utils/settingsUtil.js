/**
 * 设置工具模块
 * 用于管理应用的各种设置，包括下载设置、界面设置等
 */

// 获取localStorage中的设置，若不存在则返回默认值
const getLocalStorageItem = (key, defaultValue) => {
  try {
    const item = localStorage.getItem(key);
    return item !== null ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.error(`获取设置失败: ${key}`, e);
    return defaultValue;
  }
};

// 设置localStorage中的值
const setLocalStorageItem = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error(`保存设置失败: ${key}`, e);
    return false;
  }
};

// 下载设置相关
const ACCELERATED_DOWNLOAD_KEY = 'useAcceleratedDownload';
const DOWNLOAD_SETTINGS_KEY = 'downloadSettings';

/**
 * 检查是否启用加速下载
 * @returns {Promise<boolean>} 是否启用加速下载
 */
export const isAcceleratedDownloadEnabled = async () => {
  return getLocalStorageItem(ACCELERATED_DOWNLOAD_KEY, false);
};

/**
 * 设置加速下载状态
 * @param {boolean} enabled - 是否启用加速下载
 * @returns {Promise<boolean>} 设置是否成功
 */
export const setAcceleratedDownloadEnabled = async (enabled) => {
  return setLocalStorageItem(ACCELERATED_DOWNLOAD_KEY, enabled);
};

/**
 * 获取下载设置
 * @returns {Promise<Object>} 下载设置对象
 */
export const getDownloadSettings = async () => {
  return getLocalStorageItem(DOWNLOAD_SETTINGS_KEY, {
    useProxy: true,
    proxyUrl: 'http://localhost:3000/proxy-download',
    retryCount: 3,
    timeout: 30000,
    cacheEnabled: true,
    useMultiThread: true,
    threadCount: 8,
    chunkSize: 1024 * 1024,
    enableSpeedTest: true,
    autoRun: false
  });
};

/**
 * 设置下载配置
 * @param {Object} settings - 下载设置对象
 * @returns {Promise<boolean>} 设置是否成功
 */
export const setDownloadSettings = async (settings) => {
  const currentSettings = await getDownloadSettings();
  return setLocalStorageItem(DOWNLOAD_SETTINGS_KEY, {
    ...currentSettings,
    ...settings
  });
};

/**
 * 重置下载设置为默认值
 * @returns {Promise<boolean>} 重置是否成功
 */
export const resetDownloadSettings = async () => {
  return setLocalStorageItem(DOWNLOAD_SETTINGS_KEY, {
    useProxy: true,
    proxyUrl: 'http://localhost:3000/proxy-download',
    retryCount: 3,
    timeout: 30000,
    cacheEnabled: true,
    useMultiThread: true,
    threadCount: 8,
    chunkSize: 1024 * 1024,
    enableSpeedTest: true,
    autoRun: false
  });
};

// 主题设置相关
const THEME_KEY = 'appTheme';

/**
 * 获取应用主题
 * @returns {Promise<string>} 主题名称 ('light' 或 'dark')
 */
export const getTheme = async () => {
  return getLocalStorageItem(THEME_KEY, 'light');
};

/**
 * 设置应用主题
 * @param {string} theme - 主题名称 ('light' 或 'dark')
 * @returns {Promise<boolean>} 设置是否成功
 */
export const setTheme = async (theme) => {
  return setLocalStorageItem(THEME_KEY, theme);
};

// 性能监控相关设置
const PERFORMANCE_SETTINGS_KEY = 'performanceSettings';

/**
 * 获取性能监控设置
 * @returns {Promise<Object>} 性能监控设置
 */
export const getPerformanceSettings = async () => {
  return getLocalStorageItem(PERFORMANCE_SETTINGS_KEY, {
    enableMemoryMonitoring: false,
    logPerformanceIssues: true,
    autoOptimizeOnSlowDevice: true
  });
};

/**
 * 设置性能监控配置
 * @param {Object} settings - 性能监控设置
 * @returns {Promise<boolean>} 设置是否成功
 */
export const setPerformanceSettings = async (settings) => {
  const currentSettings = await getPerformanceSettings();
  return setLocalStorageItem(PERFORMANCE_SETTINGS_KEY, {
    ...currentSettings,
    ...settings
  });
};

// 导出统一的设置接口
export default {
  isAcceleratedDownloadEnabled,
  setAcceleratedDownloadEnabled,
  getDownloadSettings,
  setDownloadSettings,
  resetDownloadSettings,
  getTheme,
  setTheme,
  getPerformanceSettings,
  setPerformanceSettings
};