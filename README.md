# OpenStore - 跨平台应用商店

![OpenStore Logo](./docs/img/YMCL-Icon.png)


一个基于 Tauri 和 React 构建的现代化跨平台应用商店，采用 macOS App Store 风格的用户界面设计。

## ✨ 核心特性

- 🎨 **现代化设计** - 基于 macOS App Store 的简洁美观界面
- 📱 **响应式布局** - 完美适配不同屏幕尺寸
- 🗂️ **分类导航** - 清晰的应用分类和导航系统
- ⭐ **精选应用** - 突出展示推荐应用
- 🔍 **智能搜索** - 快速查找所需应用
- 📥 **多线程下载** - 高效的并发下载管理
- 🌍 **多语言支持** - 支持中文、英文、日文
- 🔧 **源管理** - 灵活的应用源配置
- 📊 **下载进度** - 实时显示下载状态和进度
- 🛡️ **错误处理** - 完善的错误边界和异常处理

## 🖼️ 界面截图

![Windows界面](./docs/img/1.png)
*Windows 版本界面*


## 🛠️ 技术栈

### 前端技术
- **React 18** - 现代化的用户界面框架
- **Styled Components** - CSS-in-JS 样式解决方案
- **React Router** - 单页应用路由管理
- **React i18next** - 国际化支持
- **React Toastify** - 消息通知系统
- **Vite** - 快速的构建工具

### 后端技术
- **Tauri 2.x** - 基于 Rust 的跨平台应用框架
- **Rust** - 高性能系统编程语言
- **Express.js** - 代理服务器
- **Axios** - HTTP 客户端

### 开发工具
- **Tauri CLI** - 应用构建和开发工具
- **Vite** - 前端构建工具
- **ESLint** - 代码质量检查

## 🚀 快速开始

### 系统要求

- **Node.js** >= 16.0.0
- **Rust** >= 1.64.0
- **Tauri CLI** >= 2.0.0

### 安装步骤

1. **克隆仓库**
```bash
git clone https://github.com/yourusername/OpenStore.git
cd OpenStore
```

2. **安装依赖**
```bash
npm install
```

3. **安装 Tauri CLI**
```bash
npm install -g @tauri-apps/cli
```

4. **开发模式运行**
```bash
npm run tauri dev
```

5. **构建生产版本**
```bash
npm run tauri build
```

## 📁 项目结构

```
OpenStore/
├── src/                          # React 前端源码
│   ├── components/               # React 组件
│   │   ├── AppCard.jsx          # 应用卡片组件
│   │   ├── AppDetails.jsx       # 应用详情组件
│   │   ├── AppGrid.jsx          # 应用网格布局
│   │   ├── AppStore.jsx         # 主应用商店组件
│   │   ├── DownloadManager.jsx  # 下载管理器
│   │   ├── DownloadProgress.jsx # 下载进度组件
│   │   ├── Header.jsx           # 头部组件
│   │   ├── Navigation.jsx       # 导航组件
│   │   ├── Settings.jsx         # 设置组件
│   │   ├── SourceManager.jsx    # 源管理组件
│   │   └── ...
│   ├── services/                # 业务服务
│   │   ├── downloadService.js   # 下载服务
│   │   ├── sourceService.js     # 源服务
│   │   ├── iconService.js       # 图标服务
│   │   └── messageService.js    # 消息服务
│   ├── utils/                   # 工具函数
│   ├── locales/                 # 国际化文件
│   │   ├── en-US.json          # 英文
│   │   ├── zh-CN.json          # 中文
│   │   └── ja-JP.json          # 日文
│   ├── data/                    # 模拟数据
│   ├── assets/                  # 静态资源
│   ├── App.jsx                  # 主应用组件
│   └── main.jsx                 # 入口文件
├── src-tauri/                   # Tauri 后端 (Rust)
│   ├── src/
│   │   ├── main.rs             # 主程序入口
│   │   ├── lib.rs              # 库文件
│   │   └── multi_thread_downloader.rs # 多线程下载器
│   ├── icons/                   # 应用图标
│   ├── Cargo.toml              # Rust 依赖配置
│   └── tauri.conf.json         # Tauri 配置文件
├── docs/                        # 文档和静态文件
├── public/                      # 公共资源
├── package.json                 # Node.js 依赖配置
└── vite.config.js              # Vite 配置文件
```

## 🔧 配置说明

### 应用源配置

在 `app-source.json` 文件中配置应用源：

```json
{
  "sources": [
    {
      "name": "官方源",
      "url": "https://api.example.com/apps",
      "enabled": true
    }
  ]
}
```

### 代理服务器

项目包含一个代理服务器用于处理 CORS 和 API 请求：

```bash
# 启动代理服务器
cd src/server
npm install
npm start
```

服务器默认运行在端口 3001。

## 🐛 故障排除

### 常见问题

1. **下载进度不显示**
   - 检查下载服务是否正常运行
   - 确认网络连接状态
   - 查看控制台错误信息

2. **React 属性警告**
   ```
   Warning: React does not recognize the `backgroundImage` prop
   ```
   - 这是 styled-components 的已知问题
   - 不影响功能，可以忽略

3. **文件大小信息不正确**
   - 检查服务器返回的 Content-Length 头
   - 确认下载源的响应格式

4. **构建失败**
   - 确保 Rust 和 Node.js 版本符合要求
   - 清理缓存：`npm run clean && npm install`
   - 重新安装 Tauri CLI

### 调试模式

启用调试模式查看详细日志：

```bash
# 设置环境变量
export RUST_LOG=debug
npm run tauri dev
```

## 🤝 贡献指南

我们欢迎所有形式的贡献！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 开发规范

- 遵循现有的代码风格
- 添加适当的注释
- 确保所有测试通过
- 更新相关文档

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [Tauri](https://tauri.app/) - 优秀的跨平台应用框架
- [React](https://reactjs.org/) - 强大的用户界面库
- [Styled Components](https://styled-components.com/) - 灵活的样式解决方案
- [Vite](https://vitejs.dev/) - 快速的构建工具

## 📞 联系我们

- 项目主页：[GitHub](https://github.com/yourusername/OpenStore)
- 问题反馈：[Issues](https://github.com/yourusername/OpenStore/issues)
- 讨论交流：[Discussions](https://github.com/yourusername/OpenStore/discussions)

---

**OpenStore** - 让应用分发更简单 🚀