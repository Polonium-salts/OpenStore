# OpenStore 软件源 API 接口文档

## 概述

OpenStore 支持通过 API 接口动态获取软件源数据。API 接口应返回标准格式的 JSON 数据，包含应用程序列表及其详细信息。

## API 接口规范

### 软件源数据接口

#### 请求方式
- **方法**: GET
- **Content-Type**: application/json
- **超时时间**: 10秒

### 直接下载接口

#### 接口格式
```
https://源地址/分类/软件id
```

#### 请求方式
- **方法**: GET
- **响应**: 直接返回软件安装包文件
- **超时时间**: 根据文件大小调整，建议30-300秒

#### 路径参数说明

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| 源地址 | string | ✅ | 软件源的基础URL地址 |
| 分类 | string | ✅ | 软件分类，如 software、games、tools 等 |
| 软件id | string | ✅ | 软件的唯一标识符 |

#### 示例
```
# 下载微信软件
https://api.example.com/software/wechat

# 下载游戏
https://api.example.com/games/minecraft

# 下载工具
https://api.example.com/tools/vscode
```

#### 响应说明
- **成功**: 直接返回二进制文件流，Content-Type 为 application/octet-stream
- **失败**: 返回 HTTP 错误状态码和错误信息

#### 错误状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 成功，返回文件 |
| 404 | 软件不存在 |
| 403 | 无权限访问 |
| 500 | 服务器内部错误 |
| 503 | 服务暂时不可用 |

### 响应格式

API 接口必须返回以下格式的 JSON 数据：

```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "price": "string",
      "downloadUrl": "string",
      "version": "string",
      "author": "string",
      "category": "string",
      "icon": "string",
      "screenshots": ["string"],
      "tags": ["string"],
      "size": "string",
      "rating": "number",
      "downloads": "number",
      "lastUpdated": "string",
      "requirements": "string",
      "changelog": "string"
    }
  ],
  "message": "string",
  "total": "number",
  "timestamp": "string"
}
```

### 字段说明

#### 根级字段

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| success | boolean | ✅ | 请求是否成功，必须为 true |
| data | array | ✅ | 应用程序数据数组 |
| message | string | ❌ | 响应消息 |
| total | number | ❌ | 应用程序总数 |
| timestamp | string | ❌ | 响应时间戳 |

#### 应用程序字段 (data 数组中的对象)

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| id | string | ✅ | 应用程序唯一标识符 |
| name | string | ✅ | 应用程序名称 |
| description | string | ✅ | 应用程序描述 |
| price | string | ✅ | 价格信息（如 "免费"、"¥9.99" 等） |
| downloadUrl | string | ❌ | 传统下载链接（兼容性保留） |
| directDownloadPath | string | ❌ | 直接下载路径，格式：/分类/软件id |
| version | string | ❌ | 版本号 |
| author | string | ❌ | 开发者/作者 |
| category | string | ❌ | 应用分类 |
| icon | string | ❌ | 图标 URL |
| screenshots | array | ❌ | 截图 URL 数组 |
| tags | array | ❌ | 标签数组 |
| size | string | ❌ | 文件大小 |
| rating | number | ❌ | 评分 (0-5) |
| downloads | number | ❌ | 下载次数 |
| lastUpdated | string | ❌ | 最后更新时间 |
| requirements | string | ❌ | 系统要求 |
| changelog | string | ❌ | 更新日志 |

### 数据限制

- **应用数量限制**: 单次响应最多返回 1000 个应用程序
- **响应时间**: API 响应时间应在 10 秒内
- **数据大小**: 建议单次响应数据大小不超过 10MB

### 错误处理

当 API 返回错误时，应使用以下格式：

```json
{
  "success": false,
  "message": "错误描述",
  "error_code": "ERROR_CODE",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### 示例响应

#### 成功响应示例

```json
{
  "success": true,
  "data": [
    {
      "id": "app001",
      "name": "示例应用",
      "description": "这是一个示例应用程序",
      "price": "免费",
      "downloadUrl": "https://example.com/download/app001.exe",
      "directDownloadPath": "/tools/app001",
      "version": "1.0.0",
      "author": "示例开发者",
      "category": "工具",
      "icon": "https://example.com/icons/app001.png",
      "screenshots": [
        "https://example.com/screenshots/app001_1.png",
        "https://example.com/screenshots/app001_2.png"
      ],
      "tags": ["工具", "效率"],
      "size": "5.2 MB",
      "rating": 4.5,
      "downloads": 1250,
      "lastUpdated": "2024-01-01",
      "requirements": "Windows 10 或更高版本",
      "changelog": "修复了一些已知问题"
    }
  ],
  "message": "获取成功",
  "total": 1,
  "timestamp": "2024-01-01T12:00:00Z"
}
```

#### 错误响应示例

```json
{
  "success": false,
  "message": "服务器内部错误",
  "error_code": "INTERNAL_ERROR",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

## 直接下载功能实现

### 客户端实现

当应用数据包含 `directDownloadPath` 字段时，OpenStore 客户端会：

1. **优先使用直接下载**: 如果存在 `directDownloadPath`，优先使用此路径进行下载
2. **构建完整URL**: 将软件源基础URL与 `directDownloadPath` 组合
3. **回退机制**: 如果直接下载失败，回退到传统的 `downloadUrl`

### 服务端实现建议

软件源服务端需要实现以下路由：

```javascript
// Express.js 示例
app.get('/:category/:appId', async (req, res) => {
  const { category, appId } = req.params;
  
  try {
    // 查找应用信息
    const app = await findApp(category, appId);
    if (!app) {
      return res.status(404).json({ error: '应用不存在' });
    }
    
    // 获取文件路径
    const filePath = getAppFilePath(app);
    
    // 设置响应头
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${app.filename}"`);
    
    // 发送文件
    res.sendFile(filePath);
  } catch (error) {
    res.status(500).json({ error: '服务器内部错误' });
  }
});
```

### 兼容性说明

- **向后兼容**: 保留 `downloadUrl` 字段确保旧版本客户端正常工作
- **渐进增强**: 新版本客户端优先使用直接下载功能
- **错误处理**: 直接下载失败时自动回退到传统下载方式

## 数据增强

OpenStore 会对 API 返回的数据进行以下增强处理：

1. **默认分类**: 如果应用程序没有指定分类，系统会自动分配为 "其他" 分类
2. **智能图标**: 如果应用程序没有提供图标，系统会根据应用名称智能匹配合适的图标
3. **数据验证**: 系统会验证所有必需字段是否存在，并过滤无效数据
4. **下载URL处理**: 自动处理直接下载路径，构建完整的下载URL

## 安全要求

1. **HTTPS**: 建议使用 HTTPS 协议确保数据传输安全
2. **CORS**: 如果 API 部署在不同域名，需要正确配置 CORS 头
3. **频率限制**: 建议实施适当的频率限制防止滥用
4. **数据验证**: 服务端应验证所有输入数据的有效性

## 最佳实践

1. **缓存策略**: 实施适当的缓存策略提高响应速度
2. **分页支持**: 对于大量数据，建议支持分页查询
3. **版本控制**: 建议在 API 路径中包含版本号
4. **监控日志**: 记录 API 访问日志便于监控和调试
5. **文档更新**: 保持 API 文档与实际实现同步

## 测试工具

可以使用以下工具测试 API 接口：

- **Postman**: 用于 API 测试和调试
- **curl**: 命令行工具测试
- **浏览器**: 直接访问 GET 接口

### curl 测试示例

```bash
curl -X GET "https://your-api-domain.com/api/v1/apps" \
     -H "Accept: application/json" \
     -H "User-Agent: OpenStore/1.0"
```

## 联系方式

如有任何问题或建议，请联系开发团队。

---

**文档版本**: 1.0  
**最后更新**: 2024-01-01  
**维护者**: OpenStore 开发团队