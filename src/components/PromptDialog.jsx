import React, { useState, useEffect, useRef } from 'react';
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
  z-index: 10002;
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
  margin: 0 0 16px 0;
  font-size: 14px;
  line-height: 1.5;
  color: ${props => props.theme === 'dark' ? '#cccccc' : '#666666'};
`;

const InputContainer = styled.div`
  margin-bottom: 24px;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  border: 1px solid ${props => props.theme === 'dark' ? '#606060' : '#dee2e6'};
  border-radius: 6px;
  font-size: 14px;
  background: ${props => props.theme === 'dark' ? '#404040' : '#ffffff'};
  color: ${props => props.theme === 'dark' ? '#ffffff' : '#000000'};
  transition: border-color 0.2s ease;
  box-sizing: border-box;
  
  &:focus {
    outline: none;
    border-color: #007AFF;
    box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.2);
  }
  
  &::placeholder {
    color: ${props => props.theme === 'dark' ? '#888888' : '#999999'};
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 12px;
  border: 1px solid ${props => props.theme === 'dark' ? '#606060' : '#dee2e6'};
  border-radius: 6px;
  font-size: 14px;
  background: ${props => props.theme === 'dark' ? '#404040' : '#ffffff'};
  color: ${props => props.theme === 'dark' ? '#ffffff' : '#000000'};
  transition: border-color 0.2s ease;
  box-sizing: border-box;
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
  
  &:focus {
    outline: none;
    border-color: #007AFF;
    box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.2);
  }
  
  &::placeholder {
    color: ${props => props.theme === 'dark' ? '#888888' : '#999999'};
  }
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

// 输入对话框组件
const PromptDialog = ({ 
  isOpen, 
  title, 
  message, 
  defaultValue = '',
  placeholder,
  confirmText, 
  cancelText, 
  onConfirm, 
  onCancel, 
  theme = 'light',
  inputType = 'text', // text, textarea, number, email, etc.
  validation
}) => {
  const { t } = useTranslation();
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  
  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue);
      setError('');
      // 延迟聚焦以确保动画完成
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 100);
    }
  }, [isOpen, defaultValue]);
  
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
  
  const handleSubmit = () => {
    // 验证输入
    if (validation) {
      const validationResult = validation(value);
      if (validationResult !== true) {
        setError(validationResult || t('dialog.invalidInput', '输入无效'));
        return;
      }
    }
    
    setError('');
    onConfirm(value);
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && inputType !== 'textarea') {
      e.preventDefault();
      handleSubmit();
    }
  };
  
  const InputComponent = inputType === 'textarea' ? TextArea : Input;
  
  return (
    <Overlay onClick={handleOverlayClick}>
      <Dialog theme={theme}>
        <Title theme={theme}>
          {title || t('dialog.input', '输入')}
        </Title>
        {message && (
          <Message theme={theme}>
            {message}
          </Message>
        )}
        <InputContainer>
          <InputComponent
            ref={inputRef}
            type={inputType === 'textarea' ? undefined : inputType}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (error) setError('');
            }}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            theme={theme}
          />
          {error && (
            <div style={{ 
              color: '#dc3545', 
              fontSize: '12px', 
              marginTop: '4px' 
            }}>
              {error}
            </div>
          )}
        </InputContainer>
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
            onClick={handleSubmit}
          >
            {confirmText || t('dialog.confirm', '确认')}
          </Button>
        </ButtonContainer>
      </Dialog>
    </Overlay>
  );
};

// 输入对话框管理器
class PromptDialogManager {
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
        onConfirm: (value) => {
          this.remove(id);
          resolve(value);
        },
        onCancel: () => {
          this.remove(id);
          resolve(null);
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
const promptDialogManager = new PromptDialogManager();

// 输入对话框容器组件
const PromptDialogContainer = ({ theme }) => {
  const [dialogs, setDialogs] = useState([]);
  
  useEffect(() => {
    promptDialogManager.setRenderCallback(setDialogs);
    return () => promptDialogManager.setRenderCallback(null);
  }, []);
  
  return (
    <>
      {dialogs.map(dialog => (
        <PromptDialog
          key={dialog.id}
          isOpen={true}
          theme={theme}
          {...dialog}
        />
      ))}
    </>
  );
};

export default PromptDialogContainer;

// 导出便捷函数
export const showPrompt = (message, defaultValue = '', options = {}) => {
  return promptDialogManager.show({
    message,
    defaultValue,
    ...options
  });
};

export const showTextAreaPrompt = (message, defaultValue = '', options = {}) => {
  return promptDialogManager.show({
    message,
    defaultValue,
    inputType: 'textarea',
    ...options
  });
};

export const showNumberPrompt = (message, defaultValue = '', options = {}) => {
  return promptDialogManager.show({
    message,
    defaultValue,
    inputType: 'number',
    validation: (value) => {
      const num = parseFloat(value);
      if (isNaN(num)) {
        return '请输入有效的数字';
      }
      return true;
    },
    ...options
  });
};

export const clearPromptDialogs = () => {
  promptDialogManager.clear();
};

// 替换原生prompt的便捷函数
export const prompt = (message, defaultValue) => {
  return showPrompt(message, defaultValue);
};