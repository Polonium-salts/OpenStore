import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { appDataDir } from '@tauri-apps/api/path';

// Component for managing native Tauri downloads
const NativeDownloadManager = ({ onDownloadStart, onDownloadComplete, onDownloadError, onDownloadProgress }) => {
  const [downloads, setDownloads] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      setIsInitialized(true);
    };

    initialize();
  }, []);

  // Add a file to the download queue
  const addDownload = async (url, fileName, savePath = null) => {
    try {
      // Generate a unique ID for this download
      const downloadId = Date.now();
      
      // If no save path is provided, use the app data directory
      if (!savePath) {
        const dataDir = await appDataDir();
        savePath = `${dataDir}downloads/${fileName}`;
      }
      
      // Create a new download object
      const newDownload = {
        id: downloadId,
        url,
        fileName,
        savePath,
        status: 'pending',
        progress: 0
      };
      
      // Add to downloads state
      setDownloads(prev => [...prev, newDownload]);
      
      // Notify download started
      if (onDownloadStart) {
        onDownloadStart(newDownload);
      }
      
      // Start the download using Tauri command
      const result = await invoke('download_file', {
        url,
        savePath
      });
      
      if (result.success) {
        // Update download status to completed
        setDownloads(prev => 
          prev.map(d => d.id === downloadId ? { ...d, status: 'completed', progress: 100 } : d)
        );
        
        // Notify download completed
        if (onDownloadComplete) {
          onDownloadComplete({
            ...newDownload,
            status: 'completed',
            progress: 100,
            path: result.path
          });
        }
      } else {
        throw new Error(result.message || 'Download failed');
      }
      
      return result;
    } catch (error) {
      console.error('Download error:', error);
      
      // Update download status to failed
      setDownloads(prev => 
        prev.map(d => d.url === url ? { ...d, status: 'failed', error: error.toString() } : d)
      );
      
      // Notify download error
      if (onDownloadError) {
        onDownloadError({
          url,
          fileName,
          error: error.toString()
        });
      }
      
      throw error;
    }
  };

  return null; // This component doesn't render anything
};

// Singleton pattern for download manager
let instance = null;
let listeners = {
  onStart: [],
  onComplete: [],
  onError: [],
  onProgress: []
};

// Add event listener
const addDownloadListener = (event, callback) => {
  if (listeners[event]) {
    listeners[event].push(callback);
  }
};

// Remove event listener
const removeDownloadListener = (event, callback) => {
  if (listeners[event]) {
    listeners[event] = listeners[event].filter(cb => cb !== callback);
  }
};

// Trigger event for all listeners
const triggerEvent = (event, data) => {
  if (listeners[event]) {
    listeners[event].forEach(callback => {
      try {
        callback(data);
      } catch (e) {
        console.error(`Error in ${event} listener:`, e);
      }
    });
  }
};

// Download a file using Tauri plugins
const downloadFile = async (url, fileName, savePath = null) => {
  try {
    // Create download object
    const download = { id: Date.now(), url, fileName, savePath };
    
    // Notify download started
    triggerEvent('onStart', download);
    
    // Use Tauri command to download file
    const result = await invoke('download_file', {
      url,
      savePath: savePath || `${await appDataDir()}downloads/${fileName}`
    });
    
    if (result.success) {
      // Notify download completed
      triggerEvent('onComplete', {
        ...download,
        status: 'completed',
        path: result.path
      });
      return { success: true, path: result.path };
    } else {
      throw new Error(result.message || 'Download failed');
    }
  } catch (error) {
    console.error('Download error:', error);
    
    // Notify download error
    triggerEvent('onError', {
      url,
      fileName,
      error: error.toString()
    });
    
    return { success: false, error: error.toString() };
  }
};

// Export the component and helper functions
export { 
  NativeDownloadManager,
  downloadFile,
  addDownloadListener,
  removeDownloadListener
}; 