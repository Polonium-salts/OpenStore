# 多平台下载JSON格式规范

## 概述

本文档描述了OpenStore应用商店支持多平台下载的JSON数据格式。新格式允许为每个应用提供针对不同操作系统和架构的安装包。

## 格式结构

### 基本应用信息

```json
{
  "id": 1234567890,
  "name": "应用名称",
  "icon": "应用图标URL",
  "description": "应用描述",
  "price": 0,
  "version": "1.0.0",
  "developer": "开发者名称",
  "screenshot": "截图URL",
  "category": "software"
}
```

### 多平台下载配置

新增 `downloads` 字段，包含不同平台的下载选项：

```json
{
  "downloads": {
    "windows": {
      "x64": {
        "url": "下载链接",
        "size": "文件大小",
        "filename": "文件名"
      },
      "x86": {
        "url": "下载链接",
        "size": "文件大小",
        "filename": "文件名"
      },
      "arm64": {
        "url": "下载链接",
        "size": "文件大小",
        "filename": "文件名"
      }
    },
    "macos": {
      "universal": {
        "url": "下载链接",
        "size": "文件大小",
        "filename": "文件名"
      },
      "intel": {
        "url": "下载链接",
        "size": "文件大小",
        "filename": "文件名"
      },
      "apple_silicon": {
        "url": "下载链接",
        "size": "文件大小",
        "filename": "文件名"
      }
    },
    "linux": {
      "x64_deb": {
        "url": "下载链接",
        "size": "文件大小",
        "filename": "文件名"
      },
      "x64_rpm": {
        "url": "下载链接",
        "size": "文件大小",
        "filename": "文件名"
      },
      "x64_tar": {
        "url": "下载链接",
        "size": "文件大小",
        "filename": "文件名"
      },
      "arm64_deb": {
        "url": "下载链接",
        "size": "文件大小",
        "filename": "文件名"
      },
      "arm64_rpm": {
        "url": "下载链接",
        "size": "文件大小",
        "filename": "文件名"
      },
      "arm64_tar": {
        "url": "下载链接",
        "size": "文件大小",
        "filename": "文件名"
      }
    }
  }
}
```

### 系统要求

新增 `systemRequirements` 字段，描述各平台的系统要求：

```json
{
  "systemRequirements": {
    "windows": "Windows 10 或更高版本",
    "macos": "macOS 10.15 或更高版本",
    "linux": "Ubuntu 18.04+, Debian 10+, RHEL 8+, Fedora 32+"
  }
}
```

## 支持的平台和架构

### Windows
- `x64`: 64位 Windows 系统
- `x86`: 32位 Windows 系统
- `arm64`: ARM64 架构 Windows 系统

### macOS
- `universal`: 通用二进制文件（支持 Intel 和 Apple Silicon）
- `intel`: Intel 芯片 Mac
- `apple_silicon`: Apple Silicon (M1/M2) 芯片 Mac

### Linux
- `x64_deb`: x64 架构的 DEB 包（Debian/Ubuntu）
- `x64_rpm`: x64 架构的 RPM 包（RHEL/CentOS/Fedora）
- `x64_tar`: x64 架构的 TAR 包（通用）
- `arm64_deb`: ARM64 架构的 DEB 包
- `arm64_rpm`: ARM64 架构的 RPM 包
- `arm64_tar`: ARM64 架构的 TAR 包

## 向后兼容性

为了保持向后兼容性，系统仍然支持旧的 `downloadUrl` 格式：

```json
{
  "downloadUrl": "https://example.com/app.exe"
}
```

当应用数据中同时存在 `downloads` 和 `downloadUrl` 字段时，优先使用 `downloads` 字段。

## 完整示例

```json
{
  "id": 1744430044515,
  "name": "Visual Studio Code",
  "icon": "https://code.visualstudio.com/assets/images/code-stable.png",
  "description": "轻量级但功能强大的源代码编辑器",
  "price": 0,
  "version": "1.99.0",
  "developer": "Microsoft",
  "screenshot": "https://code.visualstudio.com/assets/docs/getstarted/userinterface/hero.png",
  "category": "software",
  "downloads": {
    "windows": {
      "x64": {
        "url": "https://vscode.download.prss.microsoft.com/dbazure/download/stable/4437686ffebaf200fa4a6e6e67f735f3edf24ada/VSCodeUserSetup-x64-1.99.0.exe",
        "size": "95.2 MB",
        "filename": "VSCodeUserSetup-x64-1.99.0.exe"
      },
      "x86": {
        "url": "https://vscode.download.prss.microsoft.com/dbazure/download/stable/4437686ffebaf200fa4a6e6e67f735f3edf24ada/VSCodeUserSetup-ia32-1.99.0.exe",
        "size": "89.1 MB",
        "filename": "VSCodeUserSetup-ia32-1.99.0.exe"
      }
    },
    "macos": {
      "universal": {
        "url": "https://vscode.download.prss.microsoft.com/dbazure/download/stable/4437686ffebaf200fa4a6e6e67f735f3edf24ada/VSCode-darwin-universal.zip",
        "size": "187.3 MB",
        "filename": "VSCode-darwin-universal.zip"
      }
    },
    "linux": {
      "x64_deb": {
        "url": "https://vscode.download.prss.microsoft.com/dbazure/download/stable/4437686ffebaf200fa4a6e6e67f735f3edf24ada/code_1.99.0-1731513102_amd64.deb",
        "size": "94.8 MB",
        "filename": "code_1.99.0-1731513102_amd64.deb"
      }
    }
  },
  "systemRequirements": {
    "windows": "Windows 10 或更高版本",
    "macos": "macOS 10.15 或更高版本",
    "linux": "Ubuntu 18.04+, Debian 10+, RHEL 8+, Fedora 32+"
  }
}
```

## 使用说明

1. **平台检测**: 系统会自动检测用户的操作系统，并优先显示对应平台的下载选项
2. **架构选择**: 用户可以在界面中选择适合自己系统架构的版本
3. **文件信息**: 每个下载选项都包含文件大小和文件名信息，帮助用户做出选择
4. **系统要求**: 显示各平台的最低系统要求，确保兼容性

## 迁移指南

### 从旧格式迁移

1. 保留原有的基本字段（id, name, icon, description, price, version, developer, screenshot, category）
2. 移除 `downloadUrl` 字段
3. 添加 `downloads` 字段，按平台和架构组织下载链接
4. 添加 `systemRequirements` 字段（可选）
5. 为每个下载选项提供 `url`, `size`, `filename` 信息

### 注意事项

- 确保所有下载链接都是有效的
- 文件大小应该准确，建议使用 MB 或 GB 单位
- 文件名应该包含版本号和架构信息
- 系统要求描述应该简洁明了
- 如果某个平台不支持，可以省略对应的平台配置

## 技术实现

新的多平台下载功能通过以下组件实现：

1. **PlatformDownloadSelector**: 平台选择器组件，提供用户界面
2. **AppDetails**: 应用详情页面，集成平台选择器
3. **向后兼容**: 自动处理旧格式的应用数据

系统会自动检测应用数据格式，如果包含 `downloads` 字段则使用新的多平台界面，否则使用传统的单一下载按钮。