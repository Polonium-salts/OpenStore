# 消息中心功能使用指南

## 概述

OpenStore 的消息中心功能已经完善，现在可以存储和管理各种软件弹窗信息，包括应用通知、下载状态、安装进度等。

## 功能特性

### 1. 消息类型支持

- **系统消息** (`system`): 系统级别的通知和公告
- **应用弹窗** (`app_popup`): 应用相关的弹窗消息
- **下载消息** (`download`): 下载状态和进度信息
- **安装消息** (`install`): 安装进度和状态信息
- **更新消息** (`update`): 软件更新相关信息
- **错误消息** (`error`): 错误和异常信息
- **通知消息** (`notification`): 一般性通知信息

### 2. 消息存储增强

- **最大存储量**: 支持存储最多 200 条消息
- **持久化消息**: 支持标记重要消息为持久化，不会被自动清理
- **消息分组**: 支持按 `groupId` 对相关消息进行分组
- **优先级管理**: 支持设置消息优先级 (low, normal, high)
- **过期时间**: 支持设置消息过期时间
- **防重复**: 自动检测和防止重复消息

### 3. 丰富的元数据

每条消息可以包含以下元数据：
- 应用信息 (`appId`, `appName`, `appVersion`)
- 下载信息 (`downloadUrl`, `progress`, `speed`, `fileSize`)
- 安装信息 (`installPath`, `installedFiles`, `errorCode`)
- 自定义元数据 (`metadata` 对象)

## API 使用方法

### 1. 添加应用弹窗消息

```javascript
import { addAppPopupMessage } from '../services/messageService';

const appData = {
  id: 'app-001',
  name: '示例应用',
  version: '1.0.0',
  icon: '/icons/app.png',
  description: '这是一个示例应用'
};

const popupData = {
  type: 'update_available',
  title: '发现新版本',
  message: '应用有新版本可用，是否立即更新？',
  priority: 'normal',
  category: 'app'
};

addAppPopupMessage(appData, popupData);
```

### 2. 添加下载消息

```javascript
import { addDownloadMessage } from '../services/messageService';

const downloadData = {
  appId: 'app-001',
  appName: '示例应用',
  url: 'https://example.com/app.exe',
  status: 'downloading',
  progress: 45,
  speed: '2.5 MB/s',
  fileSize: '156.7 MB',
  downloadedSize: '70.5 MB'
};

addDownloadMessage(downloadData);
```

### 3. 添加安装消息

```javascript
import { addInstallMessage } from '../services/messageService';

const installData = {
  appId: 'app-001',
  appName: '示例应用',
  installPath: 'C:\\Program Files\\Example App',
  status: 'installing',
  progress: 75
};

addInstallMessage(installData);
```

### 4. 更新消息进度

```javascript
import { updateMessageProgress } from '../services/messageService';

// 更新下载进度
updateMessageProgress('message-id', 80, 'downloading');

// 更新安装进度
updateMessageProgress('message-id', 90, 'installing');
```

### 5. 按条件查询消息

```javascript
import { 
  getMessagesByType, 
  getMessagesByPriority, 
  getMessagesByGroup 
} from '../services/messageService';

// 获取所有下载消息
const downloadMessages = getMessagesByType('download');

// 获取高优先级消息
const highPriorityMessages = getMessagesByPriority('high');

// 获取特定分组的消息
const groupMessages = getMessagesByGroup('download_app-001');
```

## 消息操作支持

### 应用相关操作
- `launch`: 启动应用
- `details`: 查看应用详情
- `update`: 立即更新
- `remind`: 稍后提醒
- `viewLog`: 查看错误日志

### 下载相关操作
- `pause`: 暂停下载
- `resume`: 继续下载
- `cancel`: 取消下载
- `install`: 开始安装
- `openFolder`: 打开文件夹
- `retry`: 重试下载
- `delete`: 删除文件

### 安装相关操作
- `launch`: 启动应用
- `createShortcut`: 创建快捷方式
- `cancel`: 取消安装
- `retry`: 重试安装
- `viewError`: 查看错误详情

## 测试功能

在应用头部有一个"测试通知"按钮，点击后会随机生成以下类型的测试消息：

1. **通知消息**: 传统的弹窗通知
2. **应用弹窗**: 应用更新、安装完成、错误等消息
3. **下载消息**: 各种下载状态的消息
4. **安装消息**: 各种安装状态的消息

## 消息过滤

消息中心支持按以下类型过滤消息：
- 全部
- 未读
- 系统
- 应用
- 下载
- 安装
- 更新
- 错误

## 自动清理

系统会自动清理过期消息，但会保留：
- 标记为持久化的消息
- 未过期的消息
- 最近 30 天内的消息（可配置）

## 最佳实践

1. **合理使用优先级**: 只对真正重要的消息设置高优先级
2. **设置合适的过期时间**: 避免消息堆积
3. **使用分组功能**: 将相关消息分组管理
4. **提供有意义的操作**: 确保消息的操作按钮有实际功能
5. **避免重复消息**: 利用 `groupId` 防止重复消息

## 注意事项

- 消息存储在 localStorage 中，清除浏览器数据会丢失消息
- 持久化消息不会被自动清理，需要手动管理
- 消息操作需要在具体的业务逻辑中实现
- 建议定期调用 `cleanupOldMessages()` 清理过期消息