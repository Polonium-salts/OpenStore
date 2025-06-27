import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { useTranslation } from 'react-i18next';

// 动画定义
const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const scaleIn = keyframes`
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
`;

// 样式组件
const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10001;
  animation: ${fadeIn} 0.2s ease-out;
`;

const Dialog = styled.div`
  background: ${props => props.theme === 'dark' ? '#2a2a2d' : '#ffffff'};
  color: ${props => props.theme === 'dark' ? '#ffffff' : '#000000'};
  border-radius: 12px;
  padding: 24px;
  min-width: 320px;
  max-width: 480px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  animation: ${scaleIn} 0.2s ease-out;
  border: 1px solid ${props => props.theme === 'dark' ? '#404040' : '#e0e0e0'};
`;

const Title = styled.h3`
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 600;
  color: ${props => props.theme === 'dark' ? '#ffffff' : '#000000'};
`;

const Message = styled.p`
  margin: 0 0 24px 0;
  font-size: 14px;
  line-height: 1.5;
  color: ${props => props.theme === 'dark' ? '#cccccc' : '#666666'};
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
`;

const Button = styled.button`
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid;
  min-width: 80px;
  
  ${props => props.variant === 'primary' ? `
    background: #007AFF;
    color: white;
    border-color: #007AFF;
    
    &:hover {
      background: #0056CC;
      border-color: #0056CC;
    }
    
    &:active {
      background: #004499;
      border-color: #004499;
    }
  ` : `
    background: ${props.theme === 'dark' ? '#404040' : '#f8f9fa'};
    color: ${props.theme === 'dark' ? '#ffffff' : '#000000'};
    border-color: ${props.theme === 'dark' ? '#606060' : '#dee2e6'};
    
    &:hover {
      background: ${props.theme === 'dark' ? '#505050' : '#e9ecef'};
      border-color: ${props.theme === 'dark' ? '#707070' : '#adb5bd'};
    }
    
    &:active {
      background: ${props.theme === 'dark' ? '#606060' : '#dee2e6'};
      border-color: ${props.theme === 'dark' ? '#808080' : '#6c757d'};
    }
  `}
`;

// 确认对话框组件
const ConfirmDialog = ({ 
  isOpen, 
  title, 
  message, 
  confirmText, 
  cancelText, 
  onConfirm, 
  onCancel, 
  theme = 'light',
  type = 'default' // default, danger, warning
}) => {
  const { t } = useTranslation();
  
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onCancel]);
  
  if (!isOpen) return null;
  
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };
  
  return (
    <Overlay onClick={handleOverlayClick}>
      <Dialog theme={theme}>
        <Title theme={theme}>
          {title || t('dialog.confirm', '确认')}
        </Title>
        <Message theme={theme}>
          {message}
        </Message>
        <ButtonContainer>
          <Button 
            theme={theme} 
            onClick={onCancel}
          >
            {cancelText || t('dialog.cancel', '取消')}
          </Button>
          <Button 
            theme={theme} 
            variant="primary" 
            onClick={onConfirm}
            style={{
              background: type === 'danger' ? '#dc3545' : type === 'warning' ? '#ffc107' : '#007AFF',
              borderColor: type === 'danger' ? '#dc3545' : type === 'warning' ? '#ffc107' : '#007AFF',
              color: type === 'warning' ? '#000' : '#fff'
            }}
          >
            {confirmText || t('dialog.confirm', '确认')}
          </Button>
        </ButtonContainer>
      </Dialog>
    </Overlay>
  );
};

// 确认对话框管理器
class ConfirmDialogManager {
  constructor() {
    this.dialogs = [];
    this.currentId = 0;
    this.renderCallback = null;
  }
  
  setRenderCallback(callback) {
    this.renderCallback = callback;
  }
  
  show(options) {
    return new Promise((resolve) => {
      const id = ++this.currentId;
      const dialog = {
        id,
        ...options,
        onConfirm: () => {
          this.remove(id);
          resolve(true);
        },
        onCancel: () => {
          this.remove(id);
          resolve(false);
        }
      };
      
      this.dialogs.push(dialog);
      this.update();
    });
  }
  
  remove(id) {
    this.dialogs = this.dialogs.filter(dialog => dialog.id !== id);
    this.update();
  }
  
  update() {
    if (this.renderCallback) {
      this.renderCallback(this.dialogs);
    }
  }
  
  clear() {
    this.dialogs = [];
    this.update();
  }
}

// 全局实例
const confirmDialogManager = new ConfirmDialogManager();

// 确认对话框容器组件
const ConfirmDialogContainer = ({ theme }) => {
  const [dialogs, setDialogs] = useState([]);
  
  useEffect(() => {
    confirmDialogManager.setRenderCallback(setDialogs);
    return () => confirmDialogManager.setRenderCallback(null);
  }, []);
  
  return (
    <>
      {dialogs.map(dialog => (
        <ConfirmDialog
          key={dialog.id}
          isOpen={true}
          theme={theme}
          {...dialog}
        />
      ))}
    </>
  );
};

export default ConfirmDialogContainer;

// 导出便捷函数
export const showConfirm = (message, title, options = {}) => {
  return confirmDialogManager.show({
    message,
    title,
    ...options
  });
};

export const showConfirmDanger = (message, title, options = {}) => {
  return confirmDialogManager.show({
    message,
    title,
    type: 'danger',
    ...options
  });
};

export const showConfirmWarning = (message, title, options = {}) => {
  return confirmDialogManager.show({
    message,
    title,
    type: 'warning',
    ...options
  });
};

export const clearConfirmDialogs = () => {
  confirmDialogManager.clear();
};

// 替换原生confirm的便捷函数
export const confirm = (message) => {
  return showConfirm(message);
};