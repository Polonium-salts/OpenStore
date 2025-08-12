# OpenStore 构建问题修复指南

## 🚨 当前问题

根据终端输出，构建过程中出现以下错误：
```
failed to bundle project: `timeout: global`
Error failed to bundle project: `timeout: global`
```

这是由于 NSIS 下载超时导致的网络连接问题。

## 🔧 解决方案

### 方案一：仅构建 MSI 安装包（推荐）

我已经修改了 `src-tauri/tauri.conf.json` 配置文件：
- 将 `targets` 从 `"all"` 改为 `["msi"]`
- 添加了 Windows 特定的打包配置

这样可以避免 NSIS 下载问题，只生成 MSI 安装包。

### 方案二：手动下载 NSIS

如果需要生成 NSIS 安装包，可以手动下载：

1. 下载 NSIS：https://github.com/tauri-apps/binary-releases/releases/download/nsis-3/nsis-3.zip
2. 解压到 Tauri 缓存目录
3. 重新运行构建命令

### 方案三：使用代理或 VPN

如果网络连接有问题，可以：
1. 配置代理服务器
2. 使用 VPN 连接
3. 切换到更稳定的网络环境

### 方案四：禁用所有打包器

临时解决方案，只生成可执行文件：

```json
"bundle": {
  "active": false
}
```

## 🚀 重新构建

修改配置后，重新运行构建命令：

```bash
npm run tauri build
```

## 📋 其他优化建议

1. **代码分割警告**：考虑移除动态导入或使用 `build.rollupOptions.output.manualChunks`
2. **包大小警告**：主 JS 文件过大（770KB），建议进行代码分割
3. **未使用函数**：`create_custom_downloader` 函数未被使用，可以考虑移除

## 🔍 验证构建结果

构建成功后，检查以下文件：
- `src-tauri/target/release/open.exe` - 可执行文件
- `src-tauri/target/release/bundle/msi/open_0.1.0_x64_en-US.msi` - MSI 安装包

## 📞 如果问题仍然存在

1. 检查网络连接
2. 清理构建缓存：`npm run tauri build -- --clean`
3. 更新 Tauri CLI：`npm install -g @tauri-apps/cli@latest`
4. 查看详细日志：`npm run tauri build -- --verbose`