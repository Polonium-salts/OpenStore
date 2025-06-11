import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import "./i18n"; // Import i18n configuration
import TranslationProvider from "./components/TranslationProvider";
// Import stagewise toolbar for React
import { StagewiseToolbar } from '@stagewise/toolbar-react';

// Initialize main app
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <TranslationProvider>
      <App />
    </TranslationProvider>
  </React.StrictMode>,
);

// Initialize stagewise toolbar in development mode only
if (process.env.NODE_ENV === 'development') {
  const stagewiseConfig = {
    plugins: []
  };
  
  // Create a separate root for the toolbar to avoid interfering with the main app
  const toolbarContainer = document.createElement('div');
  toolbarContainer.id = 'stagewise-toolbar-root';
  document.body.appendChild(toolbarContainer);
  
  ReactDOM.createRoot(toolbarContainer).render(
    <StagewiseToolbar config={stagewiseConfig} />
  );
}
