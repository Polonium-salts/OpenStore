import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import "./i18n"; // Import i18n configuration
import TranslationProvider from "./components/TranslationProvider";
import ErrorBoundary from "./components/ErrorBoundary";

// macOS 兼容性检查和修复
const isMacOS = /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
if (isMacOS) {
  console.log('Detected macOS environment, applying compatibility fixes');
  
  // 确保 DOM 完全加载
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
} else {
  initApp();
}

function initApp() {
  try {
    const rootElement = document.getElementById("root");
    if (!rootElement) {
      throw new Error('Root element not found');
    }
    
    // 为 macOS 添加额外的错误处理
    const root = ReactDOM.createRoot(rootElement);
    
    root.render(
      <ErrorBoundary>
        <React.StrictMode>
          <TranslationProvider>
            <App />
          </TranslationProvider>
        </React.StrictMode>
      </ErrorBoundary>
    );
  } catch (error) {
    console.error('Failed to initialize React app:', error);
    
    // 降级处理：显示基本错误信息
    const rootElement = document.getElementById("root");
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 20px;
          text-align: center;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        ">
          <h1 style="color: #ff3b30; margin-bottom: 16px;">应用启动失败</h1>
          <p style="margin-bottom: 20px; max-width: 600px; line-height: 1.5;">
            应用程序无法正常启动。${isMacOS ? '这可能是 macOS 环境下的兼容性问题。' : ''}
            请尝试刷新页面或重启应用程序。
          </p>
          <button onclick="window.location.reload()" style="
            padding: 12px 24px;
            background-color: #007aff;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
          ">刷新页面</button>
          <details style="margin-top: 20px; text-align: left; max-width: 600px;">
            <summary>错误详情</summary>
            <pre style="
              background: #f0f0f0;
              padding: 10px;
              border-radius: 4px;
              font-size: 12px;
              overflow: auto;
              max-height: 200px;
            ">${error.toString()}</pre>
          </details>
        </div>
      `;
    }
  }
}
