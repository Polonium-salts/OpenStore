# OpenStore - Cross-Platform App Store

A cross-platform application store built with Tauri and React, featuring a macOS App Store inspired UI.

## Features

- Clean, modern design based on macOS App Store
- Responsive layout
- Category navigation
- Featured apps section
- App grid display
- Search functionality

## Screenshots

*Screenshots will be added after the initial build*

## Technology Stack

- **Frontend**: React, Styled Components
- **Backend**: Tauri (Rust)
- **Build Tools**: Vite

## Getting Started

### Prerequisites

- Node.js (>= 16.0.0)
- Rust (>= 1.64.0)
- Tauri CLI

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/OpenStore.git
cd OpenStore
```

2. Install dependencies
```bash
npm install
```

3. Run in development mode
```bash
npm run tauri dev
```

4. Build for production
```bash
npm run tauri build
```

## Project Structure

```
OpenStore/
├── src/                   # React frontend
│   ├── assets/            # Static assets
│   ├── components/        # React components
│   ├── data/              # Mock data
│   ├── App.jsx            # Main App component
│   └── main.jsx           # Entry point
├── src-tauri/             # Tauri backend (Rust)
├── public/                # Public assets
└── package.json           # Project configuration
```

## License

MIT

# OpenStore Proxy Server

A simple proxy server for handling CORS and API requests in the OpenStore application.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The server will start on port 3001 by default.

## API Endpoints

### Health Check
```
GET /health
```
Returns server status.

### Proxy Request
```
POST /proxy
```
Body parameters:
- `url` (required): The target URL to proxy the request to
- `method` (optional): HTTP method (default: 'GET')
- `headers` (optional): Custom headers to include
- `data` (optional): Request body data

Example request:
```javascript
fetch('http://localhost:3001/proxy', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    url: 'https://api.example.com/data',
    method: 'GET',
    headers: {
      'Authorization': 'Bearer token'
    }
  })
})
```

## Error Handling

The server includes error handling middleware that will return appropriate error responses with status codes and messages.

## License

MIT
请修复无法显示下载进度和下载进度百分比的问题和文件大小信息不正确的问题

	performConcurrentWorkOnRoot
	workLoop (chunk-OY5C42Z6.js:197)
	flushWork (chunk-OY5C42Z6.js:176)
	performWorkUntilDeadline (chunk-OY5C42Z6.js:384)







ReferenceError: Can't find variable: requestIdleCallback
@http://localhost:1420/src/components/Settings.jsx:642:8
div
@http://localhost:1420/node_modules/.vite/deps/styled-components.js?v=feb7f4bf:1261:179
Suspense
div
@http://localhost:1420/node_modules/.vite/deps/styled-components.js?v=feb7f4bf:1261:179
div
@http://localhost:1420/node_modules/.vite/deps/styled-components.js?v=feb7f4bf:1261:179
div
@http://localhost:1420/node_modules/.vite/deps/styled-components.js?v=feb7f4bf:1261:179
App@http://localhost:1420/src/App.jsx:490:31
TranslationProvider@http://localhost:1420/src/components/TranslationProvider.jsx:27:6
ErrorBoundary@http://localhost:1420/src/components/ErrorBoundary.jsx:61:10




Error: Rendered more hooks than during the previous render.
@http://localhost:1420/src/components/Settings.jsx:689:8
div
@http://localhost:1420/node_modules/.vite/deps/styled-components.js?v=feb7f4bf:1261:179
Suspense
div
@http://localhost:1420/node_modules/.vite/deps/styled-components.js?v=feb7f4bf:1261:179
div
@http://localhost:1420/node_modules/.vite/deps/styled-components.js?v=feb7f4bf:1261:179
div
@http://localhost:1420/node_modules/.vite/deps/styled-components.js?v=feb7f4bf:1261:179
App@http://localhost:1420/src/App.jsx:490:31
TranslationProvider@http://localhost:1420/src/components/TranslationProvider.jsx:27:6
ErrorBoundary@http://localhost:1420/src/components/ErrorBoundary.jsx:61:10
