import React, { useState, forwardRef, useImperativeHandle, useEffect, useRef, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { TauriDownloaderUtil } from './TauriDownloader';
import { Badge, Button, Form } from 'react-bootstrap';
import { formatDateTime, formatDuration } from '../utils/timeUtils';

const Container = styled.div`
  width: 100%;
  background-color: ${props => props.theme === 'dark' ? '#2a2a2d' : 'white'};
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px ${props => props.theme === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)'};
`;

const Header = styled.div`
  padding: 16px;
  background-color: ${props => props.theme === 'dark' ? '#1d1d1f' : '#f5f5f7'};
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid ${props => props.theme === 'dark' ? '#3a3a3d' : '#e8e8ed'};
`;

const Title = styled.div`
  font-weight: 500;
  color: ${props => props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f'};
`;

const DownloadList = styled.div`
  overflow-y: auto;
  max-height: 400px;
  padding: 10px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px;
  color: ${props => props.theme === 'dark' ? '#999' : '#666'};
  font-size: 14px;
`;

const DownloadItem = styled.div`
  padding: 12px;
  border-radius: 6px;
  background-color: ${props => props.theme === 'dark' ? '#1d1d1f' : '#f5f5f7'};
  margin-bottom: 8px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const DownloadHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const DownloadName = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${props => props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f'};
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  max-width: 250px;
`;

const DownloadStatus = styled.div`
  font-size: 12px;
  color: ${props => {
    switch (props.status) {
      case 'completed': return '#34C759';
      case 'error': 
      case 'failed': return '#FF3B30';
      case 'retrying': return '#FF9500';
      case 'cancelled': return '#666';
      default: return props.theme === 'dark' ? '#999' : '#666';
    }
  }};
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 4px;
  background-color: ${props => props.theme === 'dark' ? '#3a3a3d' : '#e8e8ed'};
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 8px;
`;

const Progress = styled.div`
  height: 100%;
  background-color: #0066CC;
  width: ${props => props.value}%;
  transition: width 0.3s ease;
`;

const StyledButton = styled.button`
  padding: 4px 12px;
  border-radius: 4px;
  border: 1px solid #d9d9d9;
  background-color: white;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
  
  &:hover {
    border-color: #165dff;
    color: #165dff;
  }
`;

const DownloadInfo = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 4px;
  font-size: 12px;
`;

const InfoItem = styled.div`
  display: flex;
  align-items: center;
`;

const InfoLabel = styled.span`
  color: #8c8c8c;
  margin-right: 4px;
`;

const InfoValue = styled.span`
  color: #333;
  font-weight: 500;
`;

const ErrorContainer = styled.div`
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ErrorMessage = styled.div`
  color: #d9363e;
  font-size: 12px;
`;

const DownloadManagerStyles = styled.div`
  .download-manager {
    position: fixed;
    right: 20px;
    bottom: 20px;
    z-index: 1000;
  }

  .download-toggle {
    position: absolute;
    right: 0;
    bottom: 0;
  }

  .download-panel {
    position: absolute;
    bottom: 60px;
    right: 0;
    width: 400px;
    background-color: ${props => props.theme === 'dark' ? '#2c2c2c' : '#fff'};
    border-radius: 8px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
    display: none;
    flex-direction: column;
    max-height: 500px;
    border: 1px solid ${props => props.theme === 'dark' ? '#444' : '#e0e0e0'};
  }

  .download-panel.show {
    display: flex;
  }

  .download-header {
    padding: 12px 15px;
    border-bottom: 1px solid ${props => props.theme === 'dark' ? '#444' : '#e0e0e0'};
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .download-actions {
    display: flex;
    align-items: center;
  }

  .close-btn {
    margin-left: 10px;
    padding: 0 5px;
  }
`;

const DownloadManager = forwardRef((props, ref) => {
  const [downloads, setDownloads] = useState([]);
  const [showDownloads, setShowDownloads] = useState(false);
  const downloadStartTimes = useRef({});
  const downloadSpeeds = useRef({});
  const downloadMemoryCache = useRef({});

  // 使用记忆化的活动下载数量计算以避免不必要的重新渲染
  const activeDownloadsCount = useMemo(() => {
    return downloads.filter(d => d.status === 'downloading').length;
  }, [downloads]);

  // 使用记忆化的完成下载数量计算
  const completedDownloadsCount = useMemo(() => {
    return downloads.filter(d => d.status === 'completed').length;
  }, [downloads]);

  useEffect(() => {
    // Initialize the download event handlers
    const onDownloadStart = (event) => {
      const { id, url, name, size } = event.detail;
      
      // Store start time for speed calculation
      downloadStartTimes.current[id] = Date.now();
      downloadSpeeds.current[id] = [];
      
      setDownloads(prev => [
        {
          id,
          url,
          name: name || url.split('/').pop(),
          progress: 0,
          status: 'downloading',
          size: size || 0,
          speed: '-',
          eta: '-',
          startTime: new Date().toLocaleTimeString()
        },
        ...prev
      ]);
    };

    // 创建Web Worker处理计算以避免主线程阻塞
    let worker = null;
    let workerBlobURL = null;
    
    try {
      // 创建Web Worker的代码
      const workerCode = `
        // 处理下载速度计算
        function calculateSpeedAverage(speeds) {
          if (!speeds || speeds.length === 0) return '-';
          
          // 转换所有速度为统一单位 (字节/秒)
          const bytesPerSecArray = speeds.map(speed => {
            let value = speed.value;
            if (speed.unit.includes('KB')) value *= 1024;
            else if (speed.unit.includes('MB')) value *= 1024 * 1024;
            else if (speed.unit.includes('GB')) value *= 1024 * 1024 * 1024;
            return value;
          });
          
          // 计算平均值
          const sum = bytesPerSecArray.reduce((acc, val) => acc + val, 0);
          const avgBps = sum / bytesPerSecArray.length;
          
          // 格式化为可读格式
          return formatSpeed(avgBps);
        }
        
        // 格式化速度单位
        function formatSpeed(bytesPerSecond) {
          if (bytesPerSecond < 1024) {
            return bytesPerSecond.toFixed(1) + 'B/s';
          } else if (bytesPerSecond < 1024 * 1024) {
            return (bytesPerSecond / 1024).toFixed(1) + 'KB/s';
          } else if (bytesPerSecond < 1024 * 1024 * 1024) {
            return (bytesPerSecond / (1024 * 1024)).toFixed(1) + 'MB/s';
          } else {
            return (bytesPerSecond / (1024 * 1024 * 1024)).toFixed(1) + 'GB/s';
          }
        }
        
        // 计算ETA (预计完成时间)
        function calculateETA(downloadedBytes, totalBytes, currentSpeed) {
          if (!currentSpeed || currentSpeed === '-' || !totalBytes || !downloadedBytes) {
            return '-';
          }
          
          // 解析速度值和单位
          const speedMatch = currentSpeed.match(/([\\d.]+)\\s*(B|KB|MB|GB)\\/s/);
          if (!speedMatch) return '-';
          
          const speedValue = parseFloat(speedMatch[1]);
          const speedUnit = speedMatch[2];
          
          // 转换为字节/秒
          let bytesPerSecond = speedValue;
          if (speedUnit === 'KB') bytesPerSecond *= 1024;
          else if (speedUnit === 'MB') bytesPerSecond *= 1024 * 1024;
          else if (speedUnit === 'GB') bytesPerSecond *= 1024 * 1024 * 1024;
          
          if (bytesPerSecond <= 0) return '-';
          
          // 计算剩余时间
          const remainingBytes = totalBytes - downloadedBytes;
          const remainingSeconds = remainingBytes / bytesPerSecond;
          
          if (remainingSeconds < 60) {
            return \`\${Math.round(remainingSeconds)}秒\`;
          } else if (remainingSeconds < 3600) {
            return \`\${Math.floor(remainingSeconds / 60)}分\${Math.round(remainingSeconds % 60)}秒\`;
          } else {
            return \`\${Math.floor(remainingSeconds / 3600)}时\${Math.floor((remainingSeconds % 3600) / 60)}分\`;
          }
        }
        
        // 响应主线程消息
        self.onmessage = function(e) {
          const { type, data } = e.data;
          
          switch (type) {
            case 'calculateSpeed':
              const avgSpeed = calculateSpeedAverage(data.speeds);
              self.postMessage({ type: 'speedResult', id: data.id, speed: avgSpeed });
              break;
              
            case 'calculateETA':
              const eta = calculateETA(data.downloadedBytes, data.totalBytes, data.speed);
              self.postMessage({ type: 'etaResult', id: data.id, eta });
              break;
              
            default:
              console.log('Worker received unknown message type:', type);
          }
        };
      `;
      
      // 创建Blob和Worker
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      workerBlobURL = URL.createObjectURL(blob);
      worker = new Worker(workerBlobURL);
      
      // 处理Worker的消息
      worker.onmessage = function(e) {
        const { type, id, speed, eta } = e.data;
        
        if (type === 'speedResult') {
          setDownloads(prev => prev.map(download => 
            download.id === id ? { ...download, calculatedSpeed: speed } : download
          ));
        } else if (type === 'etaResult') {
          setDownloads(prev => prev.map(download => 
            download.id === id ? { ...download, calculatedEta: eta } : download
          ));
        }
      };
      
    } catch (error) {
      console.error('无法创建Web Worker:', error);
    }
    
    const onDownloadProgress = (event) => {
      const { id, progress, downloadedBytes, totalBytes, speed } = event.detail;
      
      // 仅在有Worker时使用Worker计算
      if (worker) {
        // 请求计算ETA
        worker.postMessage({
          type: 'calculateETA',
          data: { id, downloadedBytes, totalBytes, speed }
        });
        
        // 存储速度记录用于平均计算
        if (speed && speed !== '-') {
          const numericSpeed = parseFloat(speed.replace(/[^0-9.]/g, ''));
          const unit = speed.replace(/[0-9.]/g, '');
          
          if (!isNaN(numericSpeed)) {
            const speedsArray = downloadSpeeds.current[id] || [];
            downloadSpeeds.current[id] = [
              ...speedsArray.slice(-5), // 只保留最近5个速度记录
              { value: numericSpeed, unit }
            ];
            
            // 请求计算平均速度
            worker.postMessage({
              type: 'calculateSpeed',
              data: { id, speeds: downloadSpeeds.current[id] }
            });
          }
        }
      }
      
      // 更新下载信息
      setDownloads(prev => {
        return prev.map(download => {
          if (download.id === id) {
            // 优化UI更新频率，避免过度渲染
            const shouldUpdateDetail = 
              !download.lastUpdateTime || 
              (Date.now() - download.lastUpdateTime > 500); // 每500ms更新一次详细数据
            
            if (shouldUpdateDetail) {
              return {
                ...download,
                progress: progress || 0,
                downloadedBytes,
                totalBytes,
                speed: speed || download.speed,
                lastUpdateTime: Date.now()
              };
            } else {
              // 只更新进度，其他信息保持不变以减少重绘
              return {
                ...download,
                progress: progress || download.progress
              };
            }
          }
          return download;
        });
      });
    };

    const onDownloadComplete = (event) => {
      const { id } = event.detail;
      const startTime = downloadStartTimes.current[id];
      
      setDownloads(prev => {
        return prev.map(download => {
          if (download.id === id) {
            // Calculate download time
            let downloadTime = '-';
            if (startTime) {
              const elapsedMs = Date.now() - startTime;
              if (elapsedMs < 1000) {
                downloadTime = `${elapsedMs}毫秒`;
              } else if (elapsedMs < 60000) {
                downloadTime = `${Math.round(elapsedMs / 1000)}秒`;
              } else if (elapsedMs < 3600000) {
                downloadTime = `${Math.floor(elapsedMs / 60000)}分${Math.round((elapsedMs % 60000) / 1000)}秒`;
              } else {
                downloadTime = `${Math.floor(elapsedMs / 3600000)}时${Math.floor((elapsedMs % 3600000) / 60000)}分`;
              }
            }
            
            // Calculate average speed
            let averageSpeed = '-';
            const speeds = downloadSpeeds.current[id];
            if (speeds && speeds.length > 0) {
              // Convert all speeds to bytes/s for averaging
              const standardizedSpeeds = speeds.map(speed => {
                let valueInBytes = speed.value;
                if (speed.unit.includes('KB')) {
                  valueInBytes *= 1024;
                } else if (speed.unit.includes('MB')) {
                  valueInBytes *= 1024 * 1024;
                } else if (speed.unit.includes('GB')) {
                  valueInBytes *= 1024 * 1024 * 1024;
                }
                return valueInBytes;
              });
              
              // Calculate average
              const avgBytesPerSec = standardizedSpeeds.reduce((sum, speed) => sum + speed, 0) / standardizedSpeeds.length;
              
              // Format back to human-readable
              averageSpeed = formatSpeed(avgBytesPerSec);
            }
            
            return {
              ...download,
              status: 'completed',
              progress: 100,
              completionTime: new Date().toLocaleTimeString(),
              downloadTime,
              averageSpeed
            };
          }
          return download;
        });
      });
    };

    const onDownloadError = (event) => {
      const { id, error } = event.detail;
      
      setDownloads(prev => {
        return prev.map(download => {
          if (download.id === id) {
            return {
              ...download,
              status: 'error',
              error: error || '下载失败，请重试'
            };
          }
          return download;
        });
      });
    };

    // Register event listeners
    TauriDownloaderUtil.on('download-start', onDownloadStart);
    TauriDownloaderUtil.on('download-progress', onDownloadProgress);
    TauriDownloaderUtil.on('download-complete', onDownloadComplete);
    TauriDownloaderUtil.on('download-error', onDownloadError);

    // Cleanup
    return () => {
      TauriDownloaderUtil.off('download-start', onDownloadStart);
      TauriDownloaderUtil.off('download-progress', onDownloadProgress);
      TauriDownloaderUtil.off('download-complete', onDownloadComplete);
      TauriDownloaderUtil.off('download-error', onDownloadError);
      
      // 清理Worker资源
      if (worker) {
        worker.terminate();
      }
      
      if (workerBlobURL) {
        URL.revokeObjectURL(workerBlobURL);
      }
    };
  }, []);

  // 重写下载方法
  const startDownload = useCallback((url, name) => {
    try {
      return TauriDownloaderUtil.download(url, name);
    } catch (error) {
      console.error('下载启动失败:', error);
      throw error;
    }
  }, []);

  // 监控内存使用
  useEffect(() => {
    const monitorMemoryUsage = async () => {
      if ('performance' in window && 'memory' in performance) {
        const memoryInfo = performance.memory;
        console.log('内存使用情况:', {
          totalJSHeapSize: memoryInfo.totalJSHeapSize / (1024 * 1024) + 'MB',
          usedJSHeapSize: memoryInfo.usedJSHeapSize / (1024 * 1024) + 'MB',
          jsHeapSizeLimit: memoryInfo.jsHeapSizeLimit / (1024 * 1024) + 'MB'
        });
      }
    };
    
    // 每5秒检查一次内存使用
    const intervalId = setInterval(monitorMemoryUsage, 5000);
    
    return () => clearInterval(intervalId);
  }, []);

  // 优化的重试下载函数
  const retryDownload = useCallback((download) => {
    try {
      startDownload(download.url, download.name);
      
      // 更新下载状态
      setDownloads(prev => prev.map(item => 
        item.id === download.id 
          ? { ...item, status: 'retrying', retryCount: (item.retryCount || 0) + 1 } 
          : item
      ));
    } catch (error) {
      console.error('重试下载失败:', error);
      setDownloads(prev => prev.map(item => 
        item.id === download.id 
          ? { ...item, status: 'failed', error: error.message } 
          : item
      ));
    }
  }, [startDownload]);

  // 清除内存缓存
  const clearMemoryCache = useCallback(() => {
    downloadMemoryCache.current = {};
    if (window.gc) {
      window.gc(); // 在一些浏览器中触发垃圾回收（仅调试模式）
    }
  }, []);

  // 更新 clearCompleted 以同时清理内存缓存
  const clearCompleted = useCallback(() => {
    const completedDownloads = downloads.filter(download => download.status === 'completed');
    setDownloads(prev => prev.filter(download => download.status !== 'completed'));
    
    // 清理完成下载的内存缓存
    completedDownloads.forEach(download => {
      if (downloadMemoryCache.current[download.id]) {
        delete downloadMemoryCache.current[download.id];
      }
    });
  }, [downloads]);

  // Expose methods to parent components
  useImperativeHandle(ref, () => ({
    startDownload: (app) => {
      // Create download object
      const download = {
        id: Date.now().toString(),
        name: app.name,
        url: app.downloadUrl,
        progress: 0,
        status: 'downloading',
        speed: '计算中...',
        error: null,
        startTime: Date.now()
      };

      // Add to downloads list
      setDownloads(prev => [...prev, download]);
      
      // Show downloads panel
      setShowDownloads(true);
      
      // Start the download using TauriDownloader
      try {
        TauriDownloaderUtil.downloadFile(app.downloadUrl, app.name);
      } catch (error) {
        console.error('Download error:', error);
        setDownloads(prev => prev.map(d => 
          d.url === app.downloadUrl ? { ...d, status: 'error', error: error.message } : d
        ));
      }
    }
  }));

  // 清除所有下载记录
  const clearAllDownloads = () => {
    setDownloads([]);
  };

  // 渲染时使用React.memo优化列表渲染性能
  const DownloadItemMemo = React.memo(({ download, theme, onRetry, onCancel }) => {
  return (
      <DownloadItem theme={theme}>
              <DownloadHeader>
          <DownloadName theme={theme} title={download.name}>
            {download.name}
          </DownloadName>
                <DownloadStatus theme={theme} status={download.status}>
                  {download.status === 'downloading' ? '下载中' :
                   download.status === 'completed' ? '已完成' :
             download.status === 'retrying' ? '重试中' :
             download.status === 'cancelled' ? '已取消' :
                   '下载失败'}
                </DownloadStatus>
              </DownloadHeader>
              
              {download.status === 'downloading' && (
          <>
                <ProgressBar theme={theme}>
              <Progress value={download.progress || 0} />
                </ProgressBar>
            
            <DownloadInfo theme={theme}>
              <InfoItem>
                <InfoLabel>进度:</InfoLabel>
                <InfoValue>{download.progress ? download.progress.toFixed(1) : 0}%</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>速度:</InfoLabel>
                <InfoValue>{download.calculatedSpeed || download.speed || '计算中...'}</InfoValue>
              </InfoItem>
              {(download.calculatedEta || download.eta) && (
                <InfoItem>
                  <InfoLabel>剩余:</InfoLabel>
                  <InfoValue>{download.calculatedEta || download.eta}</InfoValue>
                </InfoItem>
              )}
            </DownloadInfo>
          </>
        )}
        
        {download.status === 'completed' && (
          <DownloadInfo theme={theme}>
            <InfoItem>
              <InfoLabel>完成于:</InfoLabel>
              <InfoValue>{download.completionTime || new Date().toLocaleTimeString()}</InfoValue>
            </InfoItem>
            {download.downloadTime && (
              <InfoItem>
                <InfoLabel>用时:</InfoLabel>
                <InfoValue>{download.downloadTime}</InfoValue>
              </InfoItem>
            )}
            {download.averageSpeed && (
              <InfoItem>
                <InfoLabel>平均速度:</InfoLabel>
                <InfoValue>{download.averageSpeed}</InfoValue>
              </InfoItem>
            )}
          </DownloadInfo>
        )}
        
        {(download.status === 'error' || download.status === 'failed') && (
          <ErrorContainer>
            <ErrorMessage>{download.error || '下载失败'}</ErrorMessage>
            <StyledButton onClick={() => onRetry(download)}>
              重试
            </StyledButton>
          </ErrorContainer>
              )}
              
              {download.status === 'downloading' && (
          <StyledButton 
                  variant="danger" 
            onClick={() => onCancel(download)}
          >
            取消
          </StyledButton>
        )}
      </DownloadItem>
    );
  });

  return (
    <DownloadManagerStyles theme={props.theme}>
      <div className="download-manager">
        <div className="download-toggle">
          <Button 
            variant={showDownloads ? "primary" : "outline-primary"}
            onClick={() => setShowDownloads(!showDownloads)}
          >
            <i className="bi bi-download"></i>
            {activeDownloadsCount > 0 && (
              <Badge bg="danger">{activeDownloadsCount}</Badge>
            )}
                </Button>
        </div>

        <div className={`download-panel ${showDownloads ? 'show' : ''}`}>
          <div className="download-header">
            <h5>下载管理 ({downloads.length})</h5>
            <div className="download-actions">
              {completedDownloadsCount > 0 && (
                <StyledButton onClick={clearCompleted}>
                  清除已完成
                </StyledButton>
              )}
              <Button 
                variant="link" 
                className="close-btn"
                onClick={() => setShowDownloads(false)}
              >
                <i className="bi bi-x-lg"></i>
              </Button>
            </div>
          </div>
          
          <DownloadList>
            {downloads.length === 0 ? (
              <EmptyState theme={props.theme}>
                暂无下载任务
              </EmptyState>
            ) : (
              downloads.map(download => (
                <DownloadItemMemo 
                  key={download.id} 
                  download={download}
                  theme={props.theme}
                  onRetry={retryDownload}
                  onCancel={(download) => {
                    setDownloads(prev => prev.map(item => 
                      item.id === download.id ? { ...item, status: 'cancelled' } : item
                    ));
                  }}
                />
          ))
        )}
      </DownloadList>
        </div>
      </div>
    </DownloadManagerStyles>
  );
});

export default DownloadManager; 