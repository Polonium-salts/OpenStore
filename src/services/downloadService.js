// 下载服务 - 支持直接下载路径和回退机制

/**
 * 创建带有回退机制的下载任务
 * @param {Object} app - 应用对象
 * @param {Function} createDownloadTask - 创建下载任务的函数
 * @returns {Promise<string>} 任务ID
 */
export const createDownloadWithFallback = async (app, createDownloadTask) => {
  let downloadUrl = app.downloadUrl;
  let fallbackUrl = app.originalDownloadUrl;
  
  console.log('开始创建下载任务:', {
    appId: app.id,
    primaryUrl: downloadUrl,
    fallbackUrl: fallbackUrl,
    hasDirectPath: !!app.directDownloadPath
  });
  
  try {
    // 首先尝试使用主要下载URL（可能是直接下载路径）
    const taskId = await createDownloadTask({
      url: downloadUrl,
      fileName: app.filename || app.name,
      downloadPath: null,
      appId: app.id,
      fallbackUrl: fallbackUrl
    });
    
    console.log('下载任务创建成功:', taskId);
    return taskId;
  } catch (error) {
    console.error('主要下载URL失败:', error);
    
    // 如果有回退URL，尝试使用回退URL
    if (fallbackUrl && fallbackUrl !== downloadUrl) {
      console.log('尝试使用回退URL:', fallbackUrl);
      try {
        const taskId = await createDownloadTask({
          url: fallbackUrl,
          fileName: app.filename || app.name,
          downloadPath: null,
          appId: app.id,
          isFailover: true
        });
        
        console.log('回退下载任务创建成功:', taskId);
        return taskId;
      } catch (fallbackError) {
        console.error('回退下载URL也失败:', fallbackError);
        throw new Error(`下载失败: 主要URL和回退URL都无法访问`);
      }
    } else {
      throw error;
    }
  }
};

/**
 * 验证下载URL是否可访问
 * @param {string} url - 下载URL
 * @returns {Promise<boolean>} 是否可访问
 */
export const validateDownloadUrl = async (url) => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error('URL验证失败:', url, error);
    return false;
  }
};

/**
 * 构建直接下载URL
 * @param {Object} app - 应用对象
 * @returns {string|null} 直接下载URL或null
 */
export const buildDirectDownloadUrl = (app) => {
  if (!app.directDownloadPath || !app.source || !app.source.url) {
    return null;
  }
  
  try {
    // 从源URL中提取基础URL
    const sourceUrl = new URL(app.source.url);
    const baseUrl = `${sourceUrl.protocol}//${sourceUrl.host}`;
    
    // 构建直接下载URL
    const directUrl = baseUrl + app.directDownloadPath;
    console.log('构建直接下载URL:', {
      sourceUrl: app.source.url,
      baseUrl: baseUrl,
      directPath: app.directDownloadPath,
      directUrl: directUrl
    });
    
    return directUrl;
  } catch (error) {
    console.error('构建直接下载URL失败:', error);
    return null;
  }
};

/**
 * 处理下载错误并尝试回退
 * @param {string} taskId - 任务ID
 * @param {Object} app - 应用对象
 * @param {Function} retryDownload - 重试下载函数
 * @returns {Promise<boolean>} 是否成功回退
 */
export const handleDownloadFailure = async (taskId, app, retryDownload) => {
  if (!app.originalDownloadUrl || app.originalDownloadUrl === app.downloadUrl) {
    return false;
  }
  
  console.log('下载失败，尝试回退到原始URL:', app.originalDownloadUrl);
  
  try {
    await retryDownload(taskId, app.originalDownloadUrl);
    return true;
  } catch (error) {
    console.error('回退下载也失败:', error);
    return false;
  }
};

/**
 * 获取下载文件名
 * @param {Object} app - 应用对象
 * @returns {string} 文件名
 */
export const getDownloadFileName = (app) => {
  if (app.filename) {
    return app.filename;
  }
  
  // 从URL中提取文件名
  if (app.downloadUrl) {
    try {
      const url = new URL(app.downloadUrl);
      const pathname = url.pathname;
      const filename = pathname.split('/').pop();
      if (filename && filename.includes('.')) {
        return filename;
      }
    } catch (error) {
      console.error('从URL提取文件名失败:', error);
    }
  }
  
  // 使用应用名称作为默认文件名
  return `${app.name}.exe`;
};