# GitHub Actions 构建工作流

本目录包含用于自动化构建 OpenStore 应用的 GitHub Actions 工作流文件。

## 📁 工作流文件

### 1. `build.yml` - 完整构建和发布

**触发条件：**
- 推送到 `main` 或 `master` 分支
- 创建标签（如 `v1.0.0`）
- Pull Request
- 手动触发

**构建平台：**
- **macOS**: 生成 `.dmg` 安装包
- **Linux**: 生成 `.AppImage` 可执行文件

**功能特性：**
- 多平台并行构建
- 自动缓存依赖
- 构建产物上传
- 标签推送时自动创建 Release

### 2. `quick-build.yml` - 快速构建测试

**触发条件：**
- 手动触发（可选择平台）

**支持平台：**
- Ubuntu 20.04
- macOS Latest
- Windows Latest

**用途：**
- 开发测试
- 单平台快速验证
- 调试构建问题

## 🚀 使用方法

### 自动构建

1. **推送代码触发：**
   ```bash
   git push origin main
   ```

2. **标签发布：**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

### 手动构建

1. 进入 GitHub 仓库页面
2. 点击 "Actions" 标签
3. 选择 "Quick Build" 工作流
4. 点击 "Run workflow"
5. 选择目标平台
6. 点击 "Run workflow" 确认

## 📦 构建产物

### macOS
- **格式**: `.dmg` 磁盘映像
- **位置**: `src-tauri/target/universal-apple-darwin/release/bundle/dmg/`
- **安装**: 双击 `.dmg` 文件，拖拽到 Applications 文件夹

### Linux
- **格式**: `.AppImage` 可执行文件
- **位置**: `src-tauri/target/x86_64-unknown-linux-gnu/release/bundle/appimage/`
- **运行**: 
  ```bash
  chmod +x OpenStore.AppImage
  ./OpenStore.AppImage
  ```

## 🔧 环境要求

### macOS 构建
- Xcode Command Line Tools
- Rust 工具链
- Node.js 18+

### Linux 构建
- 系统依赖：
  ```bash
  sudo apt-get install -y libgtk-3-dev libwebkit2gtk-4.0-dev \
    libappindicator3-dev librsvg2-dev patchelf
  ```
- Rust 工具链
- Node.js 18+

## 🐛 故障排除

### 常见问题

1. **构建失败 - 依赖问题**
   - 检查 `package.json` 中的依赖版本
   - 清理缓存：删除 `node_modules` 和 `package-lock.json`

2. **Rust 编译错误**
   - 检查 `src-tauri/Cargo.toml` 配置
   - 确保 Rust 版本兼容

3. **macOS 签名问题**
   - 当前配置未包含代码签名
   - 如需分发，需要配置开发者证书

4. **Linux 依赖缺失**
   - 确保所有系统依赖已安装
   - 检查 WebKit2GTK 版本兼容性

### 调试步骤

1. **本地复现：**
   ```bash
   npm ci
   npm run build
   npm run tauri build
   ```

2. **查看构建日志：**
   - GitHub Actions 页面查看详细日志
   - 关注 Rust 编译和 Node.js 构建步骤

3. **测试单个平台：**
   - 使用 `quick-build.yml` 工作流
   - 选择特定平台进行测试

## 📝 自定义配置

### 修改构建目标

编辑 `build.yml` 中的 matrix 配置：

```yaml
matrix:
  platform: [macos-latest, ubuntu-20.04]
  include:
    - platform: macos-latest
      target: universal-apple-darwin  # 或 x86_64-apple-darwin
      bundle: dmg
    - platform: ubuntu-20.04
      target: x86_64-unknown-linux-gnu
      bundle: appimage  # 或 deb
```

### 添加 Windows 支持

```yaml
- platform: windows-latest
  target: x86_64-pc-windows-msvc
  bundle: msi
```

### 配置自动发布

确保仓库设置中启用了 Actions 权限：
- Settings → Actions → General
- Workflow permissions → Read and write permissions

## 🔗 相关链接

- [Tauri Actions 文档](https://github.com/tauri-apps/tauri-action)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Tauri 构建指南](https://tauri.app/v1/guides/building/)