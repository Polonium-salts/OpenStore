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
