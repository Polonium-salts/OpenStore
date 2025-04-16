const express = require('express');
const cors = require('cors');
const axios = require('axios');
const router = express.Router();

// 启用 CORS
router.use(cors());

// 代理下载请求
router.get('/proxy-download', async (req, res) => {
  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  try {
    // 获取文件信息
    const headResponse = await axios.head(url);
    const contentLength = headResponse.headers['content-length'];
    const contentType = headResponse.headers['content-type'];
    const fileName = url.split('/').pop();

    // 设置响应头
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', contentLength);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    // 创建下载流
    const response = await axios({
      method: 'get',
      url: url,
      responseType: 'stream'
    });

    // 处理下载进度
    let downloadedBytes = 0;
    response.data.on('data', (chunk) => {
      downloadedBytes += chunk.length;
      const progress = (downloadedBytes / contentLength) * 100;
      console.log(`Download progress: ${progress.toFixed(2)}%`);
    });

    // 错误处理
    response.data.on('error', (error) => {
      console.error('Download error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Download failed' });
      }
    });

    // 将文件流传输到响应
    response.data.pipe(res);

  } catch (error) {
    console.error('Proxy download error:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Download failed',
        message: error.message
      });
    }
  }
});

module.exports = router; 