const express = require('express');
const axios = require('axios');
const router = express.Router();

// Proxy middleware to handle requests
const proxyRequest = async (req, res) => {
  try {
    const targetUrl = req.query.url;
    
    if (!targetUrl) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    const response = await axios({
      method: req.method,
      url: targetUrl,
      headers: {
        ...req.headers,
        host: new URL(targetUrl).host
      },
      data: req.body,
      responseType: 'stream'
    });

    // Set response headers
    res.status(response.status);
    Object.keys(response.headers).forEach(header => {
      res.setHeader(header, response.headers[header]);
    });

    // Pipe the response
    response.data.pipe(res);
  } catch (error) {
    console.error('Proxy error:', error.message);
    res.status(error.response?.status || 500).json({
      error: 'Proxy request failed',
      message: error.message
    });
  }
};

// Handle all HTTP methods
router.all('/', proxyRequest);

module.exports = router; 