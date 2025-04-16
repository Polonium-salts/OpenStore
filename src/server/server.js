const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Proxy endpoint
app.post('/proxy', async (req, res) => {
  try {
    const { url, method = 'GET', headers = {}, data } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const response = await axios({
      url,
      method,
      headers,
      data,
      validateStatus: false // Don't throw on non-2xx status codes
    });

    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Proxy error:', error.message);
    res.status(500).json({
      error: 'Proxy request failed',
      message: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
}); 