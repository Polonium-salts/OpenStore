/**
 * 文件处理服务 - 处理下载完成后的文件自动运行和解压
 */

/**
 * 检查文件类型
 * @param {string} fileName 文件名
 * @returns {string} 文件类型 exe|zip|rar|7z|unknown
 */
export const getFileType = (fileName) => {
  if (!fileName) return 'unknown';
  
  const lowerName = fileName.toLowerCase();
  
  if (lowerName.endsWith('.exe')) return 'exe';
  if (lowerName.endsWith('.zip')) return 'zip';
  if (lowerName.endsWith('.rar')) return 'rar';
  if (lowerName.endsWith('.7z')) return '7z';
  if (lowerName.endsWith('.msi')) return 'msi';
  
  return 'unknown';
};

/**
 * 获取下载文件路径
 * @param {string} fileName 文件名
 * @returns {Promise<string>} 下载文件路径
 */
export const getDownloadPath = async (fileName) => {
  try {
    // 模拟获取下载路径的过程
    // 在实际Tauri项目中，可以使用tauri API获取下载目录
    // 例如: const downloadDir = await invoke('get_download_dir');
    const downloadDir = 'C:\\Users\\Downloads'; // 示例路径
    return `${downloadDir}\\${fileName}`;
  } catch (error) {
    console.error('获取下载路径失败:', error);
    return null;
  }
};

/**
 * 执行文件
 * @param {string} filePath 文件路径
 * @returns {Promise<boolean>} 是否成功执行
 */
export const executeFile = async (filePath) => {
  try {
    console.log(`执行文件: ${filePath}`);
    // 在实际Tauri项目中，可以使用tauri的Command API执行命令
    // 例如: await invoke('execute_file', { path: filePath });
    
    // 使用opener插件打开文件
    // await window.__TAURI__.shell.open(filePath);
    
    // 这里仅作为示例，实际需要实现文件执行逻辑
    return true;
  } catch (error) {
    console.error('执行文件失败:', error);
    return false;
  }
};

/**
 * 解压文件
 * @param {string} filePath 压缩文件路径
 * @param {string} type 压缩文件类型 (zip|rar|7z)
 * @returns {Promise<{success: boolean, extractPath: string|null}>} 解压结果
 */
export const extractFile = async (filePath, type) => {
  try {
    console.log(`解压文件: ${filePath}, 类型: ${type}`);
    // 在实际Tauri项目中，可以使用tauri的Command API执行解压命令
    // 例如: await invoke('extract_file', { path: filePath, type });
    
    // 获取提取目录名（去除扩展名）
    const extractDir = filePath.substring(0, filePath.lastIndexOf('.'));
    
    // 这里仅作为示例，实际需要实现解压逻辑
    return {
      success: true,
      extractPath: extractDir
    };
  } catch (error) {
    console.error('解压文件失败:', error);
    return {
      success: false,
      extractPath: null
    };
  }
};

/**
 * 处理下载完成的文件
 * @param {Object} download 下载对象
 * @param {Object} options 处理选项
 * @param {boolean} options.autoRun 是否自动运行
 * @param {boolean} options.autoExtract 是否自动解压
 * @param {Function} onLog 日志回调函数
 * @returns {Promise<Object>} 处理结果
 */
export const processDownloadedFile = async (download, options = {}, onLog = null) => {
  const { autoRun = true, autoExtract = true } = options;
  const result = {
    success: false,
    filePath: null,
    extractPath: null,
    executed: false
  };
  
  // 记录日志
  const log = (message, type = 'info') => {
    console.log(`[文件处理] ${message}`);
    if (onLog) onLog(message, type);
  };
  
  try {
    // 1. 获取文件类型
    const fileType = getFileType(download.name);
    log(`文件类型: ${fileType}`);
    
    // 2. 获取下载路径
    const filePath = await getDownloadPath(download.name);
    if (!filePath) {
      log('无法获取下载文件路径', 'error');
      return result;
    }
    
    result.filePath = filePath;
    log(`文件路径: ${filePath}`);
    
    // 3. 根据文件类型和选项决定处理方式
    if (['zip', 'rar', '7z'].includes(fileType) && autoExtract) {
      // 自动解压
      log(`开始解压 ${fileType} 文件...`);
      const extractResult = await extractFile(filePath, fileType);
      
      if (extractResult.success) {
        result.extractPath = extractResult.extractPath;
        log(`解压成功，解压目录: ${extractResult.extractPath}`, 'success');
        
        // 如果设置了自动运行，且解压成功，尝试找到可执行文件并运行
        if (autoRun) {
          log('尝试查找可执行文件...');
          // 这里需要实现查找解压目录中的可执行文件逻辑
          // 简化处理，假设找到一个可执行文件
          const executablePath = `${extractResult.extractPath}\\setup.exe`;
          
          log(`尝试运行: ${executablePath}`);
          const execResult = await executeFile(executablePath);
          
          if (execResult) {
            result.executed = true;
            log('成功运行安装程序', 'success');
          } else {
            log('无法运行安装程序', 'warning');
          }
        }
      } else {
        log('解压失败', 'error');
      }
    } else if (['exe', 'msi'].includes(fileType) && autoRun) {
      // 直接运行可执行文件
      log(`尝试运行 ${fileType} 文件...`);
      const execResult = await executeFile(filePath);
      
      if (execResult) {
        result.executed = true;
        log('成功运行程序', 'success');
      } else {
        log('无法运行程序', 'error');
      }
    } else {
      log(`不支持自动处理 ${fileType} 类型的文件，或已禁用自动处理`);
    }
    
    result.success = true;
    return result;
  } catch (error) {
    log(`文件处理过程出错: ${error.message}`, 'error');
    return result;
  }
}; 