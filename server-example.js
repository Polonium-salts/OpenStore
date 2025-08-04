// Express.js 服务器示例 - 支持直接下载路径
const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(express.json());
app.use(express.static('public'));

// 模拟软件源数据
const softwareData = {
  '1750946046173': {
    name: '微信',
    downloadUrl: 'https://dldir1v6.qq.com/weixin/Universal/Windows/WeChatWin.exe',
    category: 'software',
    version: '4.0.1'
  }
  // 可以添加更多软件数据
};

// 直接下载路由 - 支持 https://源地址/分类/软件id 格式
app.get('/:category/:softwareId', async (req, res) => {
  try {
    const { category, softwareId } = req.params;
    
    console.log(`直接下载请求: 分类=${category}, 软件ID=${softwareId}`);
    
    // 验证软件是否存在
    const software = softwareData[softwareId];
    if (!software) {
      return res.status(404).json({
        error: 'Software not found',
        message: `软件 ${softwareId} 不存在`
      });
    }
    
    // 验证分类是否匹配
    if (software.category !== category) {
      return res.status(400).json({
        error: 'Category mismatch',
        message: `软件 ${softwareId} 不属于分类 ${category}`
      });
    }
    
    // 获取下载URL
    const downloadUrl = software.downloadUrl;
    if (!downloadUrl) {
      return res.status(404).json({
        error: 'Download URL not found',
        message: `软件 ${software.name} 没有可用的下载链接`
      });
    }
    
    console.log(`重定向到下载链接: ${downloadUrl}`);
    
    // 设置响应头
    res.setHeader('Content-Disposition', `attachment; filename="${software.name}.exe"`);
    res.setHeader('X-Software-Name', software.name);
    res.setHeader('X-Software-Version', software.version);
    
    // 重定向到实际下载链接
    res.redirect(302, downloadUrl);
    
  } catch (error) {
    console.error('直接下载处理错误:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: '服务器内部错误'
    });
  }
});

// API路由 - 获取软件列表
app.get('/api/apps', (req, res) => {
  const { category } = req.query;
  
  let apps = Object.entries(softwareData).map(([id, data]) => ({
    id,
    ...data,
    directDownloadPath: `/${data.category}/${id}`
  }));
  
  if (category) {
    apps = apps.filter(app => app.category === category);
  }
  
  res.json(apps);
});

// API路由 - 获取单个软件信息
app.get('/api/apps/:id', (req, res) => {
  const { id } = req.params;
  const software = softwareData[id];
  
  if (!software) {
    return res.status(404).json({
      error: 'Software not found'
    });
  }
  
  res.json({
    id,
    ...software,
    directDownloadPath: `/${software.category}/${id}`
  });
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    features: {
      directDownload: true,
      apiAccess: true
    }
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: '服务器内部错误'
  });
});

// 404 处理
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: '请求的资源不存在'
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`软件源服务器运行在端口 ${PORT}`);
  console.log(`直接下载格式: http://localhost:${PORT}/分类/软件ID`);
  console.log(`API接口: http://localhost:${PORT}/api/apps`);
  console.log(`健康检查: http://localhost:${PORT}/health`);
});

module.exports = app;