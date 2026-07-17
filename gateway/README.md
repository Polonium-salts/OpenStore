# OpenStore 统一网关 API 接口文档

OpenStore Gateway 是一个使用 **TypeScript** 与 **Hono** 框架构建的高性能跨平台软件数据清洗与聚合网关。它负责拉取不同平台源（如 WinGet、Homebrew）的原始脏数据，并通过内置的适配器转换为 OpenStore 标准化、强类型的扁平 JSON 数据。

---

## 1. 快速开始 (Running the Server)

要在本地运行并测试网关服务，请在 `gateway/` 目录下执行：

```bash
# 1. 安装依赖
npm install

# 2. 启动开发环境（带热重载与 TS 实时解析）
npm run dev

# 3. 生产打包编译
npm run build

# 4. 生产环境启动
npm start
```

服务启动后，默认在本地 `3000` 端口进行监听：`http://localhost:3000`

---

## 2. 统一 API 规范 (RESTful Interface)

### 软件详情获取

查询指定软件标识符的跨平台标准化安装包信息。如果该软件在 WinGet 和 Homebrew 两个数据源中均存在，网关将在后台执行深度合并（Deep Merge），将不同平台的下载链接合并在同一次响应中返回。

- **请求路径**: `GET /api/apps/:id`
- **路径参数**:
  - `id` (string): 软件标识符。如 `vscode`。
- **内容格式**: `application/json`

#### 成功响应示例 (`GET /api/apps/vscode`):
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "app_id": "microsoft.visualstudiocode",
    "name": "Visual Studio Code",
    "version": "1.80.0",
    "description": "功能强大的现代化跨平台代码编辑器。",
    "icon_url": "https://cdn.openstore.com/icons/microsoft.visualstudiocode.png",
    "developer": "Microsoft",
    "license": "Freeware",
    "sources": ["winget", "homebrew"],
    "platforms": {
      "windows": {
        "available": true,
        "download_url": "https://az764295.vo.msecnd.net/stable/30a19c2203c238e3f92de1bc7709a96c32d4bd2c/VSCodeSetup-x64-1.80.0.exe",
        "installer_type": "exe",
        "sha256": "a3b6f272a8d38f972b9a7c36a28d54bd2c6e6e2f1f3d8a9f62626e2e28a5433a",
        "silent_args": "/VERYSILENT /SUPPRESSMSGBOXES /MERGETASKS=!runcode,desktopicon"
      },
      "macos": {
        "available": true,
        "download_url": "https://az764295.vo.msecnd.net/stable/30a19c2203c238e3f92de1bc7709a96c32d4bd2c/VSCode-darwin-universal.zip",
        "installer_type": "zip",
        "sha256": "c4d791bc8d38f972b9a7c36a28d54bd2c6e6e2f1f3d8a9f62626e2e28a5433a",
        "silent_args": "cp -r \"Visual Studio Code.app\" /Applications/"
      },
      "linux": {
        "available": false,
        "download_url": null,
        "installer_type": null,
        "sha256": null,
        "silent_args": null
      }
    }
  }
}
```

#### 错误响应示例 (如查询不存在的软件 `GET /api/apps/not_exist_app`):
```json
{
  "code": 404,
  "message": "未找到 ID 为 not_exist_app 的应用",
  "data": null
}
```

---

## 3. 数据载荷结构定义 (JSON Data Schema)

| 字段名 | 类型 | 说明 |
| :--- | :--- | :--- |
| **code** | `number` | 状态码，`200` 表示成功，`404` 或 `500` 表示发生异常。 |
| **message** | `string` | 辅助状态信息，成功时为 `"success"`，失败时返回具体错误信息。 |
| **data** | `object \| null` | 核心载荷数据。未找到时返回 `null`。 |

### `data` 节点属性表 (OpenStoreApp)

| 属性名 | 类型 | 说明 |
| :--- | :--- | :--- |
| **app_id** | `string` | 软件的统一全局 ID，如 `microsoft.visualstudiocode`。 |
| **name** | `string` | 软件名称，如 `Visual Studio Code`。 |
| **version** | `string` | 软件的版本号，如 `1.80.0`。 |
| **description** | `string` | 扁平化的主要软件描述，便于卡片视图直接展示。 |
| **icon_url** | `string` | 统一的软件图标 CDN 加速地址。 |
| **developer** | `string` | 开发商或发布单位名称。 |
| **license** | `string` | 许可证类型，如 `MIT`, `Freeware` 等。 |
| **sources** | `string[]` | 数据来源数组列表，如 `["winget", "homebrew"]`。 |
| **platforms** | `object` | 包含 `windows`, `macos`, `linux` 三个平台节点的对象。 |

### `platforms.<os>` 节点属性表 (PlatformDetails)

| 属性名 | 类型 | 说明 |
| :--- | :--- | :--- |
| **available** | `boolean` | 是否在该平台下可用。若为 `false`，则其他属性皆为 `null`。 |
| **download_url** | `string \| null` | 安装包或可执行文件的直接下载地址。 |
| **installer_type** | `string \| null` | 安装包格式类型。例如：`exe` (Inno/NSIS), `msi`, `dmg`, `zip`, `deb`, `appimage` 等。 |
| **sha256** | `string \| null` | 文件安全哈希校验值，供客户端下载后防伪验证。 |
| **silent_args** | `string \| null` | **静默安装参数**。客户端（如 Rust 执行器）在后台静默安装此应用时应当传入的命令行参数或执行脚本。 |

---

## 4. 适配器转换映射逻辑 (Adapters Mapping)

### WinGet 适配器 (`adapters/winget.ts`)
- **平台匹配**：写入到 `platforms.windows`。
- **静默安装提取**：提取 WinGet Manifest 中的第一个有效 Installer 元素，将 `InstallerSwitches.Silent` 映射为 `silent_args`。如果为空，默认填充 `"/S"` 参数。

### Homebrew 适配器 (`adapters/homebrew.ts`)
- **平台匹配**：写入到 `platforms.macos`（默认以 Cask 包形式处理）。
- **包格式提取**：如果 URL 以 `.zip` 结尾，则 `installer_type` 设为 `zip`；如果以 `.dmg` 结尾，设为 `dmg`。
- **静默参数注入**：提供适合 macOS 系统的快捷命令（如挂载 dmg 拷贝应用至 `/Applications/` 目录的指令）。
