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
const NATIVE_DOWNLOAD_KEY = 'useNativeDownload';
const NATIVE_DOWNLOAD_SETTINGS_KEY = 'nativeDownloadSettings';

/**
 * 获取下载设置
 * @returns {Object} 下载设置对象
 */
export const getNativeDownloadSettings = async () => {
  try {
    // 尝试从本地存储获取设置
    const settingsJson = localStorage.getItem('downloadSettings');
    
    if (settingsJson) {
      return JSON.parse(settingsJson);
    }
    
    // 默认设置
    const defaultSettings = {
      downloadPath: null, // 使用应用数据目录
      useNativeDownload: true,
      autoRun: false,
      autoExtract: false,
      useAcceleratedDownload: false,
      notifyOnCompletion: true
    };
    
    // 存储默认设置
    localStorage.setItem('downloadSettings', JSON.stringify(defaultSettings));
    
    return defaultSettings;
  } catch (error) {
    console.error('获取下载设置失败:', error);
    
    // 返回基本默认设置
    return {
      downloadPath: null,
      useNativeDownload: true
    };
  }
};

/**
 * 获取下载是否启用原生下载
 * @returns {boolean} 是否启用
 */
export const isNativeDownloadEnabled = () => {
  try {
    const settingsJson = localStorage.getItem('downloadSettings');
    if (settingsJson) {
      const settings = JSON.parse(settingsJson);
      return settings.useNativeDownload !== false;
    }
    
    return true; // 默认启用
  } catch (error) {
    console.error('检查原生下载设置失败:', error);
    return true; // 出错时默认启用
  }
};

/**
 * 保存下载设置
 * @param {Object} settings 要保存的设置对象
 * @returns {boolean} 是否保存成功
 */
export const saveNativeDownloadSettings = (settings) => {
  try {
    const currentSettingsJson = localStorage.getItem('downloadSettings');
    const currentSettings = currentSettingsJson ? JSON.parse(currentSettingsJson) : {};
    
    // 合并设置
    const newSettings = {
      ...currentSettings,
      ...settings
    };
    
    localStorage.setItem('downloadSettings', JSON.stringify(newSettings));
    return true;
  } catch (error) {
    console.error('保存下载设置失败:', error);
    return false;
  }
};

/**
 * 获取下载目录
 * @returns {string|null} 下载目录路径，如果未设置返回null
 */
export const getDownloadDirectory = () => {
  try {
    const settingsJson = localStorage.getItem('downloadSettings');
    if (settingsJson) {
      const settings = JSON.parse(settingsJson);
      return settings.downloadPath;
    }
    
    return null;
  } catch (error) {
    console.error('获取下载目录失败:', error);
    return null;
  }
};

/**
 * 获取下载设置
 * @returns {Object} 下载设置
 */
export const getDownloadSettings = () => {
  try {
    const settingsJson = localStorage.getItem('downloadSettings');
    if (settingsJson) {
      return JSON.parse(settingsJson);
    }
    
    // 默认设置
    return {
      downloadPath: null,
      useProxy: false,
      proxyUrl: null
    };
  } catch (error) {
    console.error('获取下载设置失败:', error);
    return {
      downloadPath: null,
      useProxy: false,
      proxyUrl: null
    };
  }
};

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
 * 设置原生下载状态
 * @param {boolean} enabled - 是否启用原生下载
 * @returns {Promise<boolean>} 设置是否成功
 */
export const setNativeDownloadEnabled = async (enabled) => {
  return setLocalStorageItem(NATIVE_DOWNLOAD_KEY, enabled);
};

/**
 * 设置原生下载配置
 * @param {Object} settings - 原生下载设置对象
 * @returns {Promise<boolean>} 设置是否成功
 */
export const setNativeDownloadSettings = async (settings) => {
  const currentSettings = await getNativeDownloadSettings();
  return setLocalStorageItem(NATIVE_DOWNLOAD_SETTINGS_KEY, {
    ...currentSettings,
    ...settings
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

/**
 * 设置下载配置
 * @param {Object} settings - 下载设置对象
 * @returns {boolean} 设置是否成功
 */
export const setDownloadSettings = (settings) => {
  try {
    const currentSettingsJson = localStorage.getItem('downloadSettings');
    const currentSettings = currentSettingsJson ? JSON.parse(currentSettingsJson) : {};
    
    // 合并设置
    const newSettings = {
      ...currentSettings,
      ...settings
    };
    
    localStorage.setItem('downloadSettings', JSON.stringify(newSettings));
    return true;
  } catch (error) {
    console.error('保存下载设置失败:', error);
    return false;
  }
};

/**
 * 重置下载设置为默认值
 * @returns {boolean} 重置是否成功
 */
export const resetDownloadSettings = () => {
  try {
    // 默认设置
    const defaultSettings = {
      downloadPath: null,
      useNativeDownload: true,
      autoRun: false,
      autoExtract: false,
      useAcceleratedDownload: false,
      notifyOnCompletion: true,
      useProxy: false,
      proxyUrl: null
    };
    
    localStorage.setItem('downloadSettings', JSON.stringify(defaultSettings));
    return true;
  } catch (error) {
    console.error('重置下载设置失败:', error);
    return false;
  }
};

// 导出统一的设置接口
export default {
  isAcceleratedDownloadEnabled,
  setAcceleratedDownloadEnabled,
  getDownloadSettings,
  isNativeDownloadEnabled,
  setNativeDownloadEnabled,
  getNativeDownloadSettings,
  setNativeDownloadSettings,
  saveNativeDownloadSettings,
  getDownloadDirectory,
  getTheme,
  setTheme,
  getPerformanceSettings,
  setPerformanceSettings,
  setDownloadSettings,
  resetDownloadSettings
}; 