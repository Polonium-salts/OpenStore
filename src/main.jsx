import React from "react";
import ReactDOM from "react-dom/client";
// 首先导入主题过渡CSS，确保它在其他样式之前加载
import "./theme-transitions.css";
import App from "./App";
import "./index.css";
import "./i18n"; // Import i18n configuration
import TranslationProvider from "./components/TranslationProvider";

// 当DOM加载完成时执行
document.addEventListener('DOMContentLoaded', () => {
  // 应用主题加载优化
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  
  // 添加GPU加速类
  document.body.classList.add('gpu-accelerated');
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <TranslationProvider>
      <App />
    </TranslationProvider>
  </React.StrictMode>,
);
