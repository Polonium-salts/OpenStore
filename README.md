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



[Error] Warning: React does not recognize the `backgroundImage` prop on a DOM element. If you intentionally want it to appear in the DOM as a custom attribute, spell it as lowercase `backgroundimage` instead. If you accidentally passed it from a parent component, remove it from the DOM element.
div
@http://localhost:1420/node_modules/.vite/deps/styled-components.js?v=feb7f4bf:1261:179
App@http://localhost:1420/src/App.jsx?t=1751425169009:490:31
TranslationProvider@http://localhost:1420/src/components/TranslationProvider.jsx:26:47
ErrorBoundary@http://localhost:1420/src/components/ErrorBoundary.jsx:61:10
	printWarning (chunk-OY5C42Z6.js:521)
	error (chunk-OY5C42Z6.js:505)
	validateProperty$1 (chunk-OY5C42Z6.js:3433)
	warnUnknownProperties (chunk-OY5C42Z6.js:3465)
	validateProperties$2 (chunk-OY5C42Z6.js:3484)
	validatePropertiesInDevelopment (chunk-OY5C42Z6.js:7378)
	setInitialProperties (chunk-OY5C42Z6.js:7567)
	finalizeInitialChildren (chunk-OY5C42Z6.js:8392)
	completeWork (chunk-OY5C42Z6.js:16341)
	completeUnitOfWork (chunk-OY5C42Z6.js:19277)
	performUnitOfWork (chunk-OY5C42Z6.js:19259)
	workLoopSync (chunk-OY5C42Z6.js:19190)
	renderRootSync (chunk-OY5C42Z6.js:19169)
	performConcurrentWorkOnRoot (chunk-OY5C42Z6.js:18728:98)
	performConcurrentWorkOnRoot
	workLoop (chunk-OY5C42Z6.js:197)
	flushWork (chunk-OY5C42Z6.js:176)
	performWorkUntilDeadline (chunk-OY5C42Z6.js:384)
[Error] Warning: React does not recognize the `backgroundOpacity` prop on a DOM element. If you intentionally want it to appear in the DOM as a custom attribute, spell it as lowercase `backgroundopacity` instead. If you accidentally passed it from a parent component, remove it from the DOM element.
div
@http://localhost:1420/node_modules/.vite/deps/styled-components.js?v=feb7f4bf:1261:179
App@http://localhost:1420/src/App.jsx?t=1751425169009:490:31
TranslationProvider@http://localhost:1420/src/components/TranslationProvider.jsx:26:47
ErrorBoundary@http://localhost:1420/src/components/ErrorBoundary.jsx:61:10
	printWarning (chunk-OY5C42Z6.js:521)
	error (chunk-OY5C42Z6.js:505)
	validateProperty$1 (chunk-OY5C42Z6.js:3433)
	warnUnknownProperties (chunk-OY5C42Z6.js:3465)
	validateProperties$2 (chunk-OY5C42Z6.js:3484)
	validatePropertiesInDevelopment (chunk-OY5C42Z6.js:7378)
	setInitialProperties (chunk-OY5C42Z6.js:7567)
	finalizeInitialChildren (chunk-OY5C42Z6.js:8392)
	completeWork (chunk-OY5C42Z6.js:16341)
	completeUnitOfWork (chunk-OY5C42Z6.js:19277)
	performUnitOfWork (chunk-OY5C42Z6.js:19259)
	workLoopSync (chunk-OY5C42Z6.js:19190)
	renderRootSync (chunk-OY5C42Z6.js:19169)
	performConcurrentWorkOnRoot (chunk-OY5C42Z6.js:18728:98)
	performConcurrentWorkOnRoot
	workLoop (chunk-OY5C42Z6.js:197)
	flushWork (chunk-OY5C42Z6.js:176)
	performWorkUntilDeadline (chunk-OY5C42Z6.js:384)