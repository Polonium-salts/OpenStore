import React, { useState, useEffect, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import { useTranslation } from 'react-i18next';
import messageService from '../services/messageService';

// 动画定义
const slideIn = keyframes`
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

const slideOut = keyframes`
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
`;

// 样式组件
const NotificationContainer = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 400px;
  pointer-events: none;
`;

const NotificationItem = styled.div`
  background: ${props => {
    switch (props.type) {
      case 'success': return props.theme === 'dark' ? '#1a472a' : '#d4edda';
      case 'error': return props.theme === 'dark' ? '#5a1a1a' : '#f8d7da';
      case 'warning': return props.theme === 'dark' ? '#5a4a1a' : '#fff3cd';
      case 'info': return props.theme === 'dark' ? '#1a3a5a' : '#d1ecf1';
      default: return props.theme === 'dark' ? '#2a2a2d' : '#ffffff';
    }
  }};
  color: ${props => {
    switch (props.type) {
      case 'success': return props.theme === 'dark' ? '#68d391' : '#155724';
      case 'error': return props.theme === 'dark' ? '#fc8181' : '#721c24';
      case 'warning': return props.theme === 'dark' ? '#f6e05e' : '#856404';
      case 'info': return props.theme === 'dark' ? '#63b3ed' : '#0c5460';
      default: return props.theme === 'dark' ? '#ffffff' : '#000000';
    }
  }};
  border: 1px solid ${props => {
    switch (props.type) {
      case 'success': return props.theme === 'dark' ? '#2d5a3d' : '#c3e6cb';
      case 'error': return props.theme === 'dark' ? '#6d2d2d' : '#f5c6cb';
      case 'warning': return props.theme === 'dark' ? '#6d5d2d' : '#ffeaa7';
      case 'info': return props.theme === 'dark' ? '#2d4d6d' : '#bee5eb';
      default: return props.theme === 'dark' ? '#404040' : '#e0e0e0';
    }
  }};
  border-radius: 8px;
  padding: 12px 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: ${props => props.isExiting ? slideOut : slideIn} 0.3s ease-out;
  pointer-events: auto;
  position: relative;
  min-width: 300px;
  max-width: 400px;
  word-wrap: break-word;
`;

const NotificationHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${props => props.hasMessage ? '8px' : '0'};
`;

const NotificationTitle = styled.div`
  font-weight: 600;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const NotificationIcon = styled.span`
  font-size: 16px;
`;

const NotificationMessage = styled.div`
  font-size: 13px;
  line-height: 1.4;
  opacity: 0.9;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  opacity: 0.7;
  transition: opacity 0.2s ease;
  
  &:hover {
    opacity: 1;
  }
`;

const ProgressBar = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: ${props => {
    switch (props.type) {
      case 'success': return props.theme === 'dark' ? '#68d391' : '#28a745';
      case 'error': return props.theme === 'dark' ? '#fc8181' : '#dc3545';
      case 'warning': return props.theme === 'dark' ? '#f6e05e' : '#ffc107';
      case 'info': return props.theme === 'dark' ? '#63b3ed' : '#17a2b8';
      default: return props.theme === 'dark' ? '#ffffff' : '#6c757d';
    }
  }};
  border-radius: 0 0 8px 8px;
  transition: width 0.1s linear;
  width: ${props => props.progress}%;
`;

// 通知类型图标
const getIcon = (type) => {
  switch (type) {
    case 'success': return '✓';
    case 'error': return '✕';
    case 'warning': return '⚠';
    case 'info': return 'ℹ';
    default: return '•';
  }
};

// 通知类型标题
const getTitle = (type, t) => {
  switch (type) {
    case 'success': return t('notification.success', '成功');
    case 'error': return t('notification.error', '错误');
    case 'warning': return t('notification.warning', '警告');
    case 'info': return t('notification.info', '信息');
    default: return t('notification.notification', '通知');
  }
};

// 单个通知组件
const Notification = ({ notification, onRemove, theme }) => {
  const { t } = useTranslation();
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => onRemove(notification.id), 300);
  }, [notification.id, onRemove]);

  useEffect(() => {
    if (notification.autoClose !== false) {
      const duration = notification.duration || 5000;
      const interval = 50;
      const step = (interval / duration) * 100;
      
      const timer = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev - step;
          if (newProgress <= 0) {
            clearInterval(timer);
            handleClose();
            return 0;
          }
          return newProgress;
        });
      }, interval);

      return () => clearInterval(timer);
    }
  }, [notification, handleClose]);

  return (
    <NotificationItem
      type={notification.type}
      theme={theme}
      isExiting={isExiting}
    >
      <NotificationHeader hasMessage={!!notification.message}>
        <NotificationTitle>
          <NotificationIcon>{getIcon(notification.type)}</NotificationIcon>
          {notification.title || getTitle(notification.type, t)}
        </NotificationTitle>
        <CloseButton onClick={handleClose}>
          ✕
        </CloseButton>
      </NotificationHeader>
      {notification.message && (
        <NotificationMessage>{notification.message}</NotificationMessage>
      )}
      {notification.autoClose !== false && (
        <ProgressBar
          type={notification.type}
          theme={theme}
          progress={progress}
        />
      )}
    </NotificationItem>
  );
};

// 主通知系统组件
const NotificationSystem = ({ theme = 'light' }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      type: 'info',
      autoClose: true,
      duration: 5000,
      ...notification
    };
    
    // 将通知保存到消息中心
    try {
      messageService.createMessageFromNotification(newNotification);
    } catch (error) {
      console.error('Failed to save notification to message center:', error);
    }
    
    setNotifications(prev => [...prev, newNotification]);
    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // 暴露方法到全局
  useEffect(() => {
    window.showNotification = addNotification;
    window.clearNotifications = clearAll;
    
    // 便捷方法
    window.showSuccess = (message, title, options = {}) => 
      addNotification({ type: 'success', message, title, ...options });
    
    window.showError = (message, title, options = {}) => 
      addNotification({ type: 'error', message, title, ...options });
    
    window.showWarning = (message, title, options = {}) => 
      addNotification({ type: 'warning', message, title, ...options });
    
    window.showInfo = (message, title, options = {}) => 
      addNotification({ type: 'info', message, title, ...options });

    return () => {
      delete window.showNotification;
      delete window.clearNotifications;
      delete window.showSuccess;
      delete window.showError;
      delete window.showWarning;
      delete window.showInfo;
    };
  }, [addNotification, clearAll]);

  if (notifications.length === 0) {
    return null;
  }

  return (
    <NotificationContainer>
      {notifications.map(notification => (
        <Notification
          key={notification.id}
          notification={notification}
          onRemove={removeNotification}
          theme={theme}
        />
      ))}
    </NotificationContainer>
  );
};

export default NotificationSystem;

// 导出便捷函数供其他组件使用
export const showNotification = (notification) => {
  if (window.showNotification) {
    return window.showNotification(notification);
  }
  console.warn('NotificationSystem not initialized');
};

export const showSuccess = (message, title, options) => {
  if (window.showSuccess) {
    return window.showSuccess(message, title, options);
  }
  console.warn('NotificationSystem not initialized');
};

export const showError = (message, title, options) => {
  if (window.showError) {
    return window.showError(message, title, options);
  }
  console.warn('NotificationSystem not initialized');
};

export const showWarning = (message, title, options) => {
  if (window.showWarning) {
    return window.showWarning(message, title, options);
  }
  console.warn('NotificationSystem not initialized');
};

export const showInfo = (message, title, options) => {
  if (window.showInfo) {
    return window.showInfo(message, title, options);
  }
  console.warn('NotificationSystem not initialized');
};

export const clearNotifications = () => {
  if (window.clearNotifications) {
    window.clearNotifications();
  }
};