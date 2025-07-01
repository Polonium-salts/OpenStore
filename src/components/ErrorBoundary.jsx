import React from 'react';
import styled from 'styled-components';

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
  background-color: var(--app-bg-color, #f5f5f7);
  color: var(--app-text-color, #1d1d1f);
  text-align: center;
`;

const ErrorTitle = styled.h1`
  font-size: 24px;
  margin-bottom: 16px;
  color: #ff3b30;
`;

const ErrorMessage = styled.p`
  font-size: 16px;
  margin-bottom: 20px;
  max-width: 600px;
  line-height: 1.5;
`;

const RetryButton = styled.button`
  padding: 12px 24px;
  background-color: #007aff;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #0056cc;
  }
`;

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // 更新 state 使下一次渲染能够显示降级后的 UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // 记录错误信息
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // 检查是否是 macOS 环境下的 react-dom 错误
    const isMacOS = /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
    const isReactDOMError = error.stack && error.stack.includes('react-dom');
    
    if (isMacOS && isReactDOMError) {
      console.warn('Detected react-dom error on macOS, applying compatibility fixes');
      
      // 尝试应用 macOS 兼容性修复
      setTimeout(() => {
        try {
          // 强制重新渲染
          this.setState({ hasError: false, error: null, errorInfo: null });
        } catch (retryError) {
          console.error('Failed to recover from error:', retryError);
        }
      }, 1000);
    }
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  handleRetry = () => {
    // 重置错误状态
    this.setState({ hasError: false, error: null, errorInfo: null });
    
    // 刷新页面作为最后的恢复手段
    if (this.state.error && this.state.error.stack && this.state.error.stack.includes('react-dom')) {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      const isMacOS = /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
      const isReactDOMError = this.state.error && this.state.error.stack && this.state.error.stack.includes('react-dom');
      
      return (
        <ErrorContainer>
          <ErrorTitle>
            {isMacOS && isReactDOMError ? 'macOS 兼容性错误' : '应用程序错误'}
          </ErrorTitle>
          <ErrorMessage>
            {isMacOS && isReactDOMError 
              ? '检测到 macOS 环境下的渲染兼容性问题。这通常是由于 WebView 环境导致的，点击重试按钮尝试恢复。'
              : '应用程序遇到了一个错误。请尝试刷新页面或重启应用程序。'
            }
          </ErrorMessage>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{ marginBottom: '20px', textAlign: 'left', maxWidth: '600px' }}>
              <summary>错误详情 (开发模式)</summary>
              <pre style={{ 
                background: '#f0f0f0', 
                padding: '10px', 
                borderRadius: '4px', 
                fontSize: '12px',
                overflow: 'auto',
                maxHeight: '200px'
              }}>
                {this.state.error.toString()}
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
          <RetryButton onClick={this.handleRetry}>
            重试
          </RetryButton>
        </ErrorContainer>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;