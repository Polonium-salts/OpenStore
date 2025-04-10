const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const app = express();

// 启用 CORS
app.use(cors());

// 代理下载请求
app.get('/proxy-download', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Download failed with status ${response.status}`);
    }

    // 获取原始响应头
    const headers = response.headers;
    
    // 设置响应头
    res.setHeader('Content-Type', headers.get('content-type'));
    res.setHeader('Content-Length', headers.get('content-length'));
    res.setHeader('Content-Disposition', headers.get('content-disposition'));

    // 将下载流传输到客户端
    response.body.pipe(res);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
}); 