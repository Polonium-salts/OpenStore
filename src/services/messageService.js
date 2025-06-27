// 消息服务 - 管理消息的存储和检索
class MessageService {
  constructor() {
    this.storageKey = 'openstore_messages';
    this.listeners = new Set();
    this.maxMessages = 200; // 增加最大存储消息数量
    this.categories = {
      SYSTEM: 'system',
      DOWNLOAD: 'download', 
      INSTALL: 'install',
      UPDATE: 'update',
      ERROR: 'error',
      WARNING: 'warning',
      SUCCESS: 'success',
      INFO: 'info',
      APP_POPUP: 'app_popup', // 新增：应用弹窗
      NOTIFICATION: 'notification' // 新增：通知类型
    };
  }

  // 获取所有消息
  getMessages() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load messages:', error);
      return [];
    }
  }

  // 保存消息到本地存储
  saveMessages(messages) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(messages));
    } catch (error) {
      console.error('Failed to save messages:', error);
    }
  }

  // 添加新消息
  addMessage(messageData) {
    const messages = this.getMessages();
    
    const newMessage = {
      id: Date.now() + Math.random(),
      title: messageData.title || this.getDefaultTitle(messageData.type),
      content: messageData.message || messageData.content || '',
      type: messageData.type || 'info',
      time: new Date(),
      read: false,
      source: messageData.source || 'system',
      actions: messageData.actions || [],
      metadata: {
        ...messageData.metadata,
        // 软件弹窗相关的元数据
        appId: messageData.appId,
        appName: messageData.appName,
        appVersion: messageData.appVersion,
        downloadUrl: messageData.downloadUrl,
        installPath: messageData.installPath,
        progress: messageData.progress,
        status: messageData.status,
        priority: messageData.priority || 'normal', // low, normal, high, urgent
        category: messageData.category,
        tags: messageData.tags || [],
        relatedFiles: messageData.relatedFiles || [],
        errorCode: messageData.errorCode,
        stackTrace: messageData.stackTrace
      },
      // 新增字段
      priority: messageData.priority || 'normal',
      category: messageData.category,
      persistent: messageData.persistent || false, // 是否持久化保存
      expiresAt: messageData.expiresAt, // 过期时间
      groupId: messageData.groupId // 消息分组ID
    };

    // 检查是否为重复消息（基于groupId或内容）
    if (this.isDuplicateMessage(newMessage, messages)) {
      return null;
    }

    // 添加到消息列表开头
    messages.unshift(newMessage);
    
    // 限制消息数量（但保留持久化消息）
    this.limitMessages(messages);
    
    this.saveMessages(messages);
    this.notifyListeners('messageAdded', newMessage);
    
    return newMessage.id;
  }

  // 标记消息为已读
  markAsRead(messageId) {
    const messages = this.getMessages();
    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    
    if (messageIndex !== -1) {
      messages[messageIndex].read = true;
      this.saveMessages(messages);
      this.notifyListeners('messageUpdated', messages[messageIndex]);
      return true;
    }
    
    return false;
  }

  // 标记所有消息为已读
  markAllAsRead() {
    const messages = this.getMessages();
    let updated = false;
    
    messages.forEach(msg => {
      if (!msg.read) {
        msg.read = true;
        updated = true;
      }
    });
    
    if (updated) {
      this.saveMessages(messages);
      this.notifyListeners('allMessagesRead');
    }
    
    return updated;
  }

  // 删除消息
  deleteMessage(messageId) {
    const messages = this.getMessages();
    const filteredMessages = messages.filter(msg => msg.id !== messageId);
    
    if (filteredMessages.length !== messages.length) {
      this.saveMessages(filteredMessages);
      this.notifyListeners('messageDeleted', messageId);
      return true;
    }
    
    return false;
  }

  // 清空所有消息
  clearAllMessages() {
    this.saveMessages([]);
    this.notifyListeners('allMessagesCleared');
  }

  // 获取未读消息数量
  getUnreadCount() {
    const messages = this.getMessages();
    return messages.filter(msg => !msg.read).length;
  }

  // 根据类型过滤消息
  getMessagesByType(type) {
    const messages = this.getMessages();
    return messages.filter(msg => msg.type === type);
  }

  // 根据来源过滤消息
  getMessagesBySource(source) {
    const messages = this.getMessages();
    return messages.filter(msg => msg.source === source);
  }

  // 获取未读消息
  getUnreadMessages() {
    const messages = this.getMessages();
    return messages.filter(msg => !msg.read);
  }

  // 添加监听器
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // 通知所有监听器
  notifyListeners(event, data) {
    this.listeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Message listener error:', error);
      }
    });
  }

  // 检查重复消息
  isDuplicateMessage(newMessage, existingMessages) {
    if (newMessage.groupId) {
      return existingMessages.some(msg => msg.groupId === newMessage.groupId);
    }
    
    // 检查相同类型和内容的消息（5分钟内）
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return existingMessages.some(msg => 
      msg.type === newMessage.type &&
      msg.title === newMessage.title &&
      msg.content === newMessage.content &&
      new Date(msg.time) > fiveMinutesAgo
    );
  }

  // 限制消息数量（保留持久化消息）
  limitMessages(messages) {
    const persistentMessages = messages.filter(msg => msg.persistent);
    const regularMessages = messages.filter(msg => !msg.persistent);
    
    // 保留所有持久化消息 + 最新的常规消息
    const maxRegularMessages = this.maxMessages - persistentMessages.length;
    if (regularMessages.length > maxRegularMessages) {
      regularMessages.splice(maxRegularMessages);
    }
    
    // 重新组合消息列表
    messages.length = 0;
    messages.push(...persistentMessages, ...regularMessages);
    
    // 按时间排序
    messages.sort((a, b) => new Date(b.time) - new Date(a.time));
  }

  // 获取默认标题
  getDefaultTitle(type) {
    const titles = {
      success: '操作成功',
      error: '操作失败',
      warning: '警告',
      info: '信息',
      download: '下载通知',
      update: '更新通知',
      system: '系统通知',
      install: '安装通知',
      app_popup: '应用弹窗',
      notification: '系统通知'
    };
    return titles[type] || '通知';
  }

  // 从通知数据创建消息
  createMessageFromNotification(notificationData) {
    const messageData = {
      title: notificationData.title,
      content: notificationData.message,
      type: notificationData.type,
      source: 'notification',
      metadata: {
        duration: notificationData.duration,
        autoClose: notificationData.autoClose,
        originalNotificationId: notificationData.id
      }
    };

    // 根据通知类型添加相应的操作按钮
    if (notificationData.type === 'download') {
      messageData.actions = [
        { label: '查看下载', type: 'primary', action: 'viewDownload' }
      ];
    } else if (notificationData.type === 'error') {
      messageData.actions = [
        { label: '重试', type: 'primary', action: 'retry' },
        { label: '忽略', type: 'secondary', action: 'dismiss' }
      ];
    } else if (notificationData.type === 'update') {
      messageData.actions = [
        { label: '立即更新', type: 'primary', action: 'update' },
        { label: '稍后提醒', type: 'secondary', action: 'remind' }
      ];
    }

    return this.addMessage(messageData);
  }

  // 添加应用相关的弹窗消息
  addAppPopupMessage(appData, popupData) {
    return this.addMessage({
      title: popupData.title || `${appData.name} - ${this.getDefaultTitle('app_popup')}`,
      content: popupData.message || popupData.content,
      type: popupData.type || 'app_popup',
      source: 'app_popup',
      appId: appData.id,
      appName: appData.name,
      appVersion: appData.version,
      category: popupData.category || 'app',
      priority: popupData.priority || 'normal',
      persistent: popupData.persistent || false,
      groupId: popupData.groupId || `app_${appData.id}_${popupData.type}`,
      actions: popupData.actions || this.getDefaultAppActions(popupData.type),
      metadata: {
        ...popupData.metadata,
        appIcon: appData.icon,
        appDescription: appData.description,
        popupType: popupData.type
      }
    });
  }

  // 添加下载相关的消息
  addDownloadMessage(downloadData) {
    return this.addMessage({
      title: downloadData.title || `下载 ${downloadData.appName || '应用'}`,
      content: downloadData.message || this.getDownloadStatusMessage(downloadData.status, downloadData.progress),
      type: 'download',
      source: 'download_manager',
      appId: downloadData.appId,
      appName: downloadData.appName,
      downloadUrl: downloadData.url,
      category: 'download',
      priority: downloadData.status === 'error' ? 'high' : 'normal',
      groupId: `download_${downloadData.appId}`,
      actions: this.getDownloadActions(downloadData.status),
      metadata: {
        progress: downloadData.progress,
        status: downloadData.status,
        speed: downloadData.speed,
        remainingTime: downloadData.remainingTime,
        fileSize: downloadData.fileSize,
        downloadedSize: downloadData.downloadedSize
      }
    });
  }

  // 添加安装相关的消息
  addInstallMessage(installData) {
    return this.addMessage({
      title: installData.title || `安装 ${installData.appName || '应用'}`,
      content: installData.message || this.getInstallStatusMessage(installData.status, installData.progress),
      type: 'install',
      source: 'installer',
      appId: installData.appId,
      appName: installData.appName,
      installPath: installData.installPath,
      category: 'install',
      priority: installData.status === 'error' ? 'high' : 'normal',
      groupId: `install_${installData.appId}`,
      actions: this.getInstallActions(installData.status),
      metadata: {
        progress: installData.progress,
        status: installData.status,
        installPath: installData.installPath,
        installedFiles: installData.installedFiles,
        errorCode: installData.errorCode
      }
    });
  }

  // 获取应用默认操作
  getDefaultAppActions(popupType) {
    switch (popupType) {
      case 'update_available':
        return [
          { label: '立即更新', type: 'primary', action: 'update' },
          { label: '稍后提醒', type: 'secondary', action: 'remind' }
        ];
      case 'install_complete':
        return [
          { label: '启动应用', type: 'primary', action: 'launch' },
          { label: '查看详情', type: 'secondary', action: 'details' }
        ];
      case 'error':
        return [
          { label: '重试', type: 'primary', action: 'retry' },
          { label: '查看日志', type: 'secondary', action: 'viewLog' }
        ];
      default:
        return [
          { label: '确定', type: 'primary', action: 'dismiss' }
        ];
    }
  }

  // 获取下载操作
  getDownloadActions(status) {
    switch (status) {
      case 'downloading':
        return [
          { label: '暂停', type: 'secondary', action: 'pause' },
          { label: '取消', type: 'secondary', action: 'cancel' }
        ];
      case 'paused':
        return [
          { label: '继续', type: 'primary', action: 'resume' },
          { label: '取消', type: 'secondary', action: 'cancel' }
        ];
      case 'completed':
        return [
          { label: '安装', type: 'primary', action: 'install' },
          { label: '打开文件夹', type: 'secondary', action: 'openFolder' }
        ];
      case 'error':
        return [
          { label: '重试', type: 'primary', action: 'retry' },
          { label: '删除', type: 'secondary', action: 'delete' }
        ];
      default:
        return [];
    }
  }

  // 获取安装操作
  getInstallActions(status) {
    switch (status) {
      case 'installing':
        return [
          { label: '取消安装', type: 'secondary', action: 'cancel' }
        ];
      case 'completed':
        return [
          { label: '启动应用', type: 'primary', action: 'launch' },
          { label: '创建快捷方式', type: 'secondary', action: 'createShortcut' }
        ];
      case 'error':
        return [
          { label: '重试安装', type: 'primary', action: 'retry' },
          { label: '查看错误', type: 'secondary', action: 'viewError' }
        ];
      default:
        return [];
    }
  }

  // 获取下载状态消息
  getDownloadStatusMessage(status, progress) {
    switch (status) {
      case 'downloading':
        return `正在下载... ${progress || 0}%`;
      case 'paused':
        return `下载已暂停 (${progress || 0}%)`;
      case 'completed':
        return '下载完成，可以开始安装';
      case 'error':
        return '下载失败，请检查网络连接';
      default:
        return '准备下载...';
    }
  }

  // 获取安装状态消息
  getInstallStatusMessage(status, progress) {
    switch (status) {
      case 'installing':
        return `正在安装... ${progress || 0}%`;
      case 'completed':
        return '安装完成，应用已准备就绪';
      case 'error':
        return '安装失败，请重试或联系支持';
      default:
        return '准备安装...';
    }
  }

  // 根据优先级获取消息
  getMessagesByPriority(priority) {
    const messages = this.getMessages();
    return messages.filter(msg => msg.priority === priority);
  }

  // 获取分组消息
  getMessagesByGroup(groupId) {
    const messages = this.getMessages();
    return messages.filter(msg => msg.groupId === groupId);
  }

  // 更新消息进度
  updateMessageProgress(messageId, progress, status) {
    const messages = this.getMessages();
    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    
    if (messageIndex !== -1) {
      messages[messageIndex].metadata.progress = progress;
      if (status) {
        messages[messageIndex].metadata.status = status;
        messages[messageIndex].content = this.getProgressMessage(messages[messageIndex].type, status, progress);
      }
      
      this.saveMessages(messages);
      this.notifyListeners('messageUpdated', messages[messageIndex]);
      return true;
    }
    
    return false;
  }

  // 获取进度消息
  getProgressMessage(type, status, progress) {
    if (type === 'download') {
      return this.getDownloadStatusMessage(status, progress);
    } else if (type === 'install') {
      return this.getInstallStatusMessage(status, progress);
    }
    return `${status} ${progress || 0}%`;
  }

  // 清理过期消息（可选功能）
  cleanupOldMessages(daysToKeep = 30) {
    const messages = this.getMessages();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const filteredMessages = messages.filter(msg => {
      // 保留持久化消息
      if (msg.persistent) return true;
      
      // 检查过期时间
      if (msg.expiresAt && new Date(msg.expiresAt) < new Date()) {
        return false;
      }
      
      // 检查创建时间
      const messageDate = new Date(msg.time);
      return messageDate > cutoffDate;
    });
    
    if (filteredMessages.length !== messages.length) {
      this.saveMessages(filteredMessages);
      this.notifyListeners('messagesCleanedUp', {
        removed: messages.length - filteredMessages.length,
        remaining: filteredMessages.length
      });
    }
  }
}

// 创建单例实例
const messageService = new MessageService();

export default messageService;

// 导出便捷函数
export const addMessage = (message) => messageService.addMessage(message);
export const getMessages = () => messageService.getMessages();
export const markAsRead = (id) => messageService.markAsRead(id);
export const markAllAsRead = () => messageService.markAllAsRead();
export const deleteMessage = (id) => messageService.deleteMessage(id);
export const clearAllMessages = () => messageService.clearAllMessages();
export const getUnreadCount = () => messageService.getUnreadCount();
export const getMessagesByType = (type) => messageService.getMessagesByType(type);
export const getMessagesBySource = (source) => messageService.getMessagesBySource(source);
export const getUnreadMessages = () => messageService.getUnreadMessages();
export const addListener = (callback) => messageService.addListener(callback);
export const createMessageFromNotification = (notificationData) => messageService.createMessageFromNotification(notificationData);

// 软件弹窗相关的便捷函数
export const addAppPopupMessage = (appData, popupData) => messageService.addAppPopupMessage(appData, popupData);
export const addDownloadMessage = (downloadData) => messageService.addDownloadMessage(downloadData);
export const addInstallMessage = (installData) => messageService.addInstallMessage(installData);
export const getMessagesByPriority = (priority) => messageService.getMessagesByPriority(priority);
export const getMessagesByGroup = (groupId) => messageService.getMessagesByGroup(groupId);
export const updateMessageProgress = (messageId, progress, status) => messageService.updateMessageProgress(messageId, progress, status);
export const cleanupOldMessages = (daysToKeep) => messageService.cleanupOldMessages(daysToKeep);