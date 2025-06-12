import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import TranslationProvider from './components/TranslationProvider';
import './i18n';

// 添加全局错误边界
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // 更新状态，下一次渲染将显示回退UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // 记录错误信息
    console.error('React Error Boundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // 自定义回退UI
      return (
        <div style={{ 
          padding: '20px', 
          fontFamily: 'system-ui, -apple-system, sans-serif', 
          color: 'var(--app-text-color, #1d1d1f)',
          maxWidth: '800px',
          margin: '0 auto',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>应用程序出现问题</h1>
          <p style={{ marginBottom: '12px' }}>
            应用程序加载过程中遇到了一个问题。请尝试以下操作:
          </p>
          <ul style={{ marginBottom: '24px', listStyleType: 'disc', paddingLeft: '20px' }}>
            <li style={{ marginBottom: '8px' }}>刷新页面</li>
            <li style={{ marginBottom: '8px' }}>清除浏览器缓存和Cookie</li>
            <li style={{ marginBottom: '8px' }}>检查控制台错误信息</li>
          </ul>
          <div style={{ 
            padding: '12px', 
            backgroundColor: 'rgba(0,0,0,0.05)', 
            borderRadius: '4px',
            fontSize: '14px',
            fontFamily: 'monospace',
            overflow: 'auto'
          }}>
            {this.state.error && this.state.error.toString()}
          </div>
          <button 
            onClick={() => window.location.reload()} 
            style={{
              marginTop: '24px',
              padding: '8px 16px',
              backgroundColor: '#0066CC',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              alignSelf: 'flex-start'
            }}
          >
            刷新页面
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// 提前初始化关键CSS变量，避免第一次渲染时的闪烁
if (typeof window !== 'undefined') {
  const storedTheme = localStorage.getItem('theme') || 'light';
  
  if (storedTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.style.setProperty('--app-bg-color', '#1d1d1f');
    document.documentElement.style.setProperty('--app-text-color', '#f5f5f7');
    }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
  <BrowserRouter>
    <TranslationProvider>
      <App />
    </TranslationProvider>
  </BrowserRouter>
  </ErrorBoundary>
); 