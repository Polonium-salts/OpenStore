# OpenStore - Software Source Manager

A cross-platform software source management tool built with Tauri and React, featuring a clean modern UI.

## Features

- Clean, modern design 
- Responsive layout
- Software source management:
  - Add, edit, delete and disable software sources
  - Configure update settings
  - Manage download locations
- Settings:
  - Theme customization (light/dark/system)
  - Language selection
  - Performance optimization
  - Window size settings

## Screenshots

*Screenshots will be added after the initial build*

## Technology Stack

- **Frontend**: React, Styled Components
- **Backend**: Tauri (Rust)
- **Build Tools**: Vite

## Getting Started

### Prerequisites

- Node.js (>= 16.0.0)
- Rust (>= 1.64.0)
- Tauri CLI

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/OpenStore.git
cd OpenStore
```

2. Install dependencies
```bash
npm install
```

3. Run in development mode
```bash
npm run tauri dev
```

4. Build for production
```bash
npm run tauri build
```

## Project Structure

```
OpenStore/
├── src/                   # React frontend
│   ├── assets/            # Static assets
│   ├── components/        # React components
│   ├── App.jsx            # Main App component
│   └── main.jsx           # Entry point
├── src-tauri/             # Tauri backend (Rust)
├── public/                # Public assets
└── package.json           # Project configuration
```

## License

MIT

# OpenStore 应用商店

OpenStore是一个开源应用商店项目，允许用户浏览、下载和管理应用程序。

## 特点

- 浏览不同类别的应用程序
- 支持自定义软件源
- 导入和导出JSON格式的软件源
- 深色/浅色主题支持
- 多语言支持

## 安装

```bash
# 克隆项目
git clone https://github.com/yourusername/openstore.git

# 进入项目目录
cd openstore

# 安装依赖
npm install

# 运行开发服务器
npm start
```

## 软件源JSON格式

OpenStore支持导入自定义JSON格式的软件源。以下是JSON源文件的格式规范：

```json
{
  "name": "软件源名称",
  "url": "软件源URL",
  "description": "软件源描述",
  "version": "1.0",
  "items": [
    {
      "name": "应用名称",
      "author": "开发者",
      "description": "应用描述",
      "version": "1.0.0",
      "size": "大小",
      "releaseDate": "发布日期",
      "category": "分类",
      "iconUrl": "图标URL",
      "downloadUrl": "下载链接",
      "tags": ["标签1", "标签2"]
    }
  ]
}
```

### 字段说明

**源信息：**
- `name`: 软件源名称（必填）
- `url`: 软件源URL（必填）
- `description`: 软件源描述（可选）
- `version`: 软件源版本（可选）

**应用项目：**
- `items`: 应用程序列表，数组类型（必填）
  - `name`: 应用名称（必填）
  - `author`: 开发者名称（可选）
  - `description`: 应用描述（可选）
  - `version`: 应用版本（可选）
  - `size`: 应用大小（可选）
  - `releaseDate`: 发布日期（可选）
  - `category`: 分类（可选，可选值：software、game、ai-model）
  - `iconUrl`: 图标URL（可选）
  - `downloadUrl`: 下载链接（必填）
  - `tags`: 标签数组（可选）

## 许可

MIT
