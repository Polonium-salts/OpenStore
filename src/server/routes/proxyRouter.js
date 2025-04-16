const express = require('express');
const axios = require('axios');
const router = express.Router();

// Proxy middleware to handle CORS and forward requests
const proxyMiddleware = async (req, res) => {
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
      data: req.body
    });

    res.status(response.status).send(response.data);
  } catch (error) {
    console.error('Proxy error:', error.message);
    res.status(error.response?.status || 500).json({
      error: 'Proxy request failed',
      message: error.message
    });
  }
};

// Handle all HTTP methods
router.all('/proxy', proxyMiddleware);

// Proxy endpoint for search
router.get('/api/search', async (req, res) => {
  try {
    const { query } = req.query;
    const response = await axios.get(`https://api.example.com/search?q=${query}`);
    res.json(response.data);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Failed to perform search' });
  }
});

// Proxy endpoint for product details
router.get('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await axios.get(`https://api.example.com/products/${id}`);
    res.json(response.data);
  } catch (error) {
    console.error('Product details error:', error);
    res.status(500).json({ error: 'Failed to fetch product details' });
  }
});

module.exports = router; 