import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import JsonEditor from './JsonEditor';
import { getSmartIcon, validateIconUrl } from '../services/iconService';

const Container = styled.div`
  padding: 20px;
  color: ${props => props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f'};
`;

const Title = styled.h2`
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 20px;
`;

const SourceList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const SourceItem = styled.div`
  background-color: ${props => props.theme === 'dark' ? '#2a2a2d' : 'white'};
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 3px ${props => props.theme === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)'};
`;

const SourceHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const SourceName = styled.h3`
  font-size: 16px;
  font-weight: 500;
`;

const SourceUrl = styled.div`
  font-size: 14px;
  color: ${props => props.theme === 'dark' ? '#999' : '#666'};
  margin-bottom: 12px;
  word-break: break-all;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
`;

const Button = styled.button`
  padding: 6px 12px;
  border-radius: 6px;
  border: none;
  font-size: 14px;
  cursor: pointer;
  background-color: ${props => {
    if (props.variant === 'primary') return '#0066CC';
    if (props.variant === 'danger') return '#FF3B30';
    return props.theme === 'dark' ? '#3a3a3d' : '#f5f5f7';
  }};
  color: ${props => props.variant ? 'white' : props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f'};

  &:hover {
    opacity: 0.8;
  }
`;

const AddSourceForm = styled.form`
  background-color: ${props => props.theme === 'dark' ? '#2a2a2d' : 'white'};
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px ${props => props.theme === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)'};
`;

const FormGroup = styled.div`
  margin-bottom: 16px;
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  margin-bottom: 8px;
  color: ${props => props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f'};
`;

const Input = styled.input`
  width: 100%;
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid ${props => props.theme === 'dark' ? '#3a3a3d' : '#d2d2d7'};
  background-color: ${props => props.theme === 'dark' ? '#1d1d1f' : 'white'};
  color: ${props => props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f'};
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: #0066CC;
  }
`;

const ErrorMessage = styled.div`
  color: #FF3B30;
  font-size: 14px;
  margin-top: 8px;
`;

const Tabs = styled.div`
  display: flex;
  margin-bottom: 20px;
`;

const Tab = styled.div`
  padding: 8px 16px;
  cursor: pointer;
  border-bottom: 2px solid ${props => props.active ? '#0066CC' : 'transparent'};
  color: ${props => props.active ? '#0066CC' : props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f'};
  font-weight: ${props => props.active ? '600' : '400'};
  
  &:hover {
    color: #0066CC;
  }
`;

const FileUploadContainer = styled.div`
  background-color: ${props => props.theme === 'dark' ? '#2a2a2d' : 'white'};
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px ${props => props.theme === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)'};
  border: 2px dashed ${props => props.theme === 'dark' ? '#3a3a3d' : '#d2d2d7'};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover, &.dragover {
    border-color: #0066CC;
    background-color: ${props => props.theme === 'dark' ? 'rgba(0, 102, 204, 0.1)' : 'rgba(0, 102, 204, 0.05)'};
  }
`;

const FileUploadInput = styled.input`
  display: none;
`;

const FileUploadText = styled.div`
  text-align: center;
  margin: 8px 0;
  color: ${props => props.theme === 'dark' ? '#bbb' : '#666'};
`;

const FileUploadHint = styled.div`
  text-align: center;
  margin: 4px 0;
  color: ${props => props.theme === 'dark' ? '#999' : '#888'};
  font-size: 12px;
  font-style: italic;
`;

const FileUploadIcon = styled.div`
  margin-bottom: 12px;
  color: ${props => props.theme === 'dark' ? '#bbb' : '#666'};
  font-size: 24px;
`;

const Divider = styled.div`
  width: 100%;
  height: 1px;
  background-color: ${props => props.theme === 'dark' ? '#3a3a3d' : '#e8e8ed'};
  margin: 20px 0;
  position: relative;
  
  &::before {
    content: 'OR';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: ${props => props.theme === 'dark' ? '#2a2a2d' : 'white'};
    padding: 0 10px;
    color: ${props => props.theme === 'dark' ? '#999' : '#666'};
    font-size: 12px;
  }
`;

const HintText = styled.div`
  font-size: 12px;
  color: ${props => props.theme === 'dark' ? '#999' : '#666'};
  margin-top: 8px;
`;

const EmptyMessage = styled.div`
  text-align: center;
  padding: 40px 0;
  color: ${props => props.theme === 'dark' ? '#999' : '#666'};
  font-size: 14px;
`;

const SourceManager = ({ theme, onSourcesChange }) => {
  const [sources, setSources] = useState([]);
  const [newSource, setNewSource] = useState({ name: '', url: '' });
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('sources');
  const [editorData, setEditorData] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const { t } = useTranslation();

  useEffect(() => {
    // 从本地存储加载软件源
    const loadSources = () => {
      const savedSources = localStorage.getItem('appSources');
      if (savedSources) {
        setSources(JSON.parse(savedSources));
      }
    };
    loadSources();
  }, []);

  // 保存软件源到本地存储
  const saveSources = (updatedSources) => {
    localStorage.setItem('appSources', JSON.stringify(updatedSources));
    setSources(updatedSources);
  };

  // 验证软件源URL
  const validateSourceUrl = async (url) => {
    try {
      // 检查并转换GitHub链接为raw链接 - 更全面的处理
      if (url.includes('github.com') && !url.includes('raw.githubusercontent.com')) {
        // 处理普通文件浏览视图的链接
        const githubRegex = /github\.com\/([^\/]+)\/([^\/]+)\/blob\/([^\/]+)\/(.+\.json)/i;
        const match = url.match(githubRegex);
        
        if (match) {
          // 将GitHub普通链接转换为raw链接
          const rawUrl = `https://raw.githubusercontent.com/${match[1]}/${match[2]}/${match[3]}/${match[4]}`;
          console.log('已将GitHub链接转换为raw链接:', rawUrl);
          url = rawUrl;
        }

        // 处理直接指向代码库的链接 (没有/blob/)
        const repoRegex = /github\.com\/([^\/]+)\/([^\/]+)$/i;
        const repoMatch = url.match(repoRegex);
        
        if (repoMatch) {
          // 尝试默认main分支下的apps.json
          const possibleRawUrl = `https://raw.githubusercontent.com/${repoMatch[1]}/${repoMatch[2]}/main/apps.json`;
          console.log('尝试访问默认位置的JSON:', possibleRawUrl);
          
          // 测试这个URL是否可访问
          try {
            const testResponse = await fetch(possibleRawUrl);
            if (testResponse.ok) {
              url = possibleRawUrl;
              console.log('找到有效的默认JSON位置:', url);
            }
          } catch (e) {
            console.log('默认位置不可访问，尝试其他位置');
            // 尝试master分支
            const alternatePossibleRawUrl = `https://raw.githubusercontent.com/${repoMatch[1]}/${repoMatch[2]}/master/apps.json`;
            url = alternatePossibleRawUrl;
          }
        }
      }

      console.log(t('sourceManager.validating'), url);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`${t('errors.fetchFailed')}: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('获取到软件源数据', data);
      
      // 验证JSON结构
      if (!Array.isArray(data)) {
        throw new Error(t('sourceManager.invalidJson'));
      }
      
      if (!data.every(app => 
        app.id && app.name && app.description && 
        typeof app.price !== 'undefined' && app.downloadUrl
      )) {
        throw new Error(t('sourceManager.invalidJson'));
      }
      
      // 增强应用数据，添加分类和智能图标
      const processedData = await Promise.all(data.map(async (app) => {
        let enhancedApp = { ...app };
        
        // 添加默认类别
        if (!enhancedApp.category) {
          console.log(`应用 ${enhancedApp.name} 没有分类字段，默认设置为软件类别`);
          enhancedApp.category = 'software';
        }
        
        // 智能图标匹配处理
        const hasValidIcon = enhancedApp.icon && 
                            enhancedApp.icon.length > 0 && 
                            !enhancedApp.icon.includes('placeholder');
        
        // 如果没有图标或图标URL无效，使用智能匹配
        if (!hasValidIcon || !(await validateIconUrl(enhancedApp.icon))) {
          enhancedApp.icon = getSmartIcon(enhancedApp);
          console.log(`为应用 ${enhancedApp.name} 自动匹配图标: ${enhancedApp.icon}`);
        }
        
        return enhancedApp;
      }));
      
      // 如果需要处理数据，可以先保存到localStorage
      if (JSON.stringify(data) !== JSON.stringify(processedData)) {
        const blob = new Blob([JSON.stringify(processedData, null, 2)], { type: 'application/json' });
        const processedUrl = URL.createObjectURL(blob);
        
        return { 
          isValid: true, 
          needsProcessing: true, 
          processedUrl,
          processedData
        };
      }
      
      return { isValid: true, needsProcessing: false };
    } catch (err) {
      console.error(t('sourceManager.invalidJson'), err);
      throw new Error(`${t('sourceManager.invalidUrl')}: ${err.message}`);
    }
  };

  // 添加新软件源
  const handleAddSource = async (e) => {
    e.preventDefault();
    
    if (!newSource.name || !newSource.url) {
      setError(t('sourceManager.enterUrl'));
      // 短暂显示错误后自动清除
      setTimeout(() => setError(''), 1500);
      return;
    }

    try {
      // 检查是否为GitHub链接
      const isGithubUrl = newSource.url.includes('github.com') && !newSource.url.includes('raw.githubusercontent.com');
      const originalUrl = isGithubUrl ? newSource.url : null;
      
      // 不显示验证提示
      
      const validation = await validateSourceUrl(newSource.url);
      
      let sourceUrl = newSource.url;
      let isLocalProcessed = false;
      let blobSourceId = null;
      
      // 如果软件源需要处理（添加分类等）
      if (validation.needsProcessing) {
        sourceUrl = validation.processedUrl;
        isLocalProcessed = true;
        
        // 在本地存储中保存处理后的数据
        const blobSources = JSON.parse(localStorage.getItem('blobSources') || '[]');
        const newBlobSource = {
          id: Date.now(),
          url: sourceUrl,
          data: validation.processedData,
          createdAt: new Date().toISOString(),
          originalUrl: originalUrl || newSource.url
        };
        
        blobSourceId = newBlobSource.id;
        localStorage.setItem('blobSources', JSON.stringify([...blobSources, newBlobSource]));
      }
      
      // 创建新软件源对象
      const newSourceObj = {
        id: Date.now(),
        name: newSource.name,
        url: sourceUrl,
        originalUrl: isLocalProcessed ? (originalUrl || newSource.url) : originalUrl,
        enabled: true,
        isLocalBlob: isLocalProcessed,
        blobSourceId: blobSourceId,
        isGithubConverted: isGithubUrl
      };
      
      // 立即更新状态和本地存储
      const updatedSources = [...sources, newSourceObj];
      saveSources(updatedSources);
      setNewSource({ name: '', url: '' });
      
      // 不显示成功提示
      
      // 立即触发软件源变更回调
      if (onSourcesChange) {
        onSourcesChange();
      }
    } catch (err) {
      setError(err.message);
      // 短暂显示错误后自动清除
      setTimeout(() => setError(''), 1500);
    }
  };

  // 删除软件源
  const handleDeleteSource = (sourceId) => {
    if (window.confirm(t('sourceManager.confirmDelete'))) {
      const updatedSources = sources.filter(source => source.id !== sourceId);
      saveSources(updatedSources);
      
      // 如果是本地处理的blob，也同时删除blob数据
      const sourceToDelete = sources.find(source => source.id === sourceId);
      if (sourceToDelete && sourceToDelete.isLocalBlob) {
        const blobSources = JSON.parse(localStorage.getItem('blobSources') || '[]');
        const updatedBlobSources = blobSources.filter(blob => blob.id !== sourceToDelete.blobSourceId);
        localStorage.setItem('blobSources', JSON.stringify(updatedBlobSources));
      }
      
      // 不显示删除成功提示
      
      // 触发软件源变更回调
      if (onSourcesChange) {
        onSourcesChange();
      }
    }
  };

  // 启用/禁用软件源
  const handleToggleSource = (sourceId) => {
    const updatedSources = sources.map(source => 
      source.id === sourceId ? { ...source, enabled: !source.enabled } : source
    );
    saveSources(updatedSources);
  };

  // 处理JSON编辑器数据变更
  const handleJsonChange = (data) => {
    setEditorData(data);
  };

  // 创建新的软件源从JSON编辑器
  const handleCreateSourceFromEditor = async () => {
    try {
      // 验证必填字段
      const isValid = editorData.every(app => (
        app.id && app.name && app.description && 
        typeof app.price !== 'undefined' && app.downloadUrl
      ));
      
      if (!isValid) {
        setError(t('sourceManager.invalidJson'));
        setTimeout(() => setError(''), 1500);
        return;
      }
      
      // 增强应用数据，添加分类和智能图标
      const enhancedData = await Promise.all(editorData.map(async (app) => {
        let enhancedApp = { ...app };
        
        // 添加默认类别
        if (!enhancedApp.category) {
          enhancedApp.category = 'software';
        }
        
        // 智能图标匹配处理
        const hasValidIcon = enhancedApp.icon && 
                            enhancedApp.icon.length > 0 && 
                            !enhancedApp.icon.includes('placeholder');
        
        // 如果没有图标或图标URL无效，使用智能匹配
        if (!hasValidIcon || !(await validateIconUrl(enhancedApp.icon))) {
          enhancedApp.icon = getSmartIcon(enhancedApp);
          console.log(`为应用 ${enhancedApp.name} 自动匹配图标: ${enhancedApp.icon}`);
        }
        
        return enhancedApp;
      }));
      
      // 创建一个Blob对象
      const blob = new Blob([JSON.stringify(enhancedData, null, 2)], { type: 'application/json' });
      
      // 创建一个临时URL
      const url = URL.createObjectURL(blob);
      
      // 在本地存储我们需要追踪这个blob URL
      const blobSources = JSON.parse(localStorage.getItem('blobSources') || '[]');
      const newBlobSource = {
        id: Date.now(),
        url,
        data: enhancedData,
        createdAt: new Date().toISOString()
      };
      
      localStorage.setItem('blobSources', JSON.stringify([...blobSources, newBlobSource]));
      
      // 添加新软件源
      const updatedSources = [...sources, {
        id: Date.now(),
        name: `${t('sourceManager.local')} ${new Date().toLocaleString()}`,
        url,
        enabled: true,
        isLocalBlob: true,
        blobSourceId: newBlobSource.id
      }];
      
      saveSources(updatedSources);
      setActiveTab('sources');
      
      // 不显示成功提示
      
      if (onSourcesChange) {
        onSourcesChange();
      }
    } catch (err) {
      setError(`${t('sourceManager.processError')}: ${err.message}`);
      setTimeout(() => setError(''), 1500);
    }
  };

  // 加载特定软件源的数据到编辑器
  const loadSourceToEditor = async (source) => {
    try {
      // 不设置错误状态
      let data;
      
      if (source.isLocalBlob) {
        // 从本地存储获取blob数据
        const blobSources = JSON.parse(localStorage.getItem('blobSources') || '[]');
        const blobSource = blobSources.find(bs => bs.id === source.blobSourceId);
        
        if (blobSource) {
          data = blobSource.data;
        } else {
          console.error('无法找到本地源数据');
          setError('无法找到本地源数据');
          setTimeout(() => setError(''), 1500);
          return;
        }
      } else {
        try {
          // 从URL获取数据
          const response = await fetch(source.url);
          data = await response.json();
        } catch (error) {
          console.error('加载软件源数据失败:', error);
          setError('加载软件源数据失败');
          setTimeout(() => setError(''), 1500);
          return;
        }
      }
      
      setEditorData(data);
      setActiveTab('editor');
    } catch (err) {
      console.error('加载软件源数据失败:', err);
      setError('加载软件源数据失败');
      setTimeout(() => setError(''), 1500);
    }
  };

  // 处理文件上传
  const handleFileUpload = async (file) => {
    try {
      // 基本文件类型验证，保持简单
      if (!file.name.endsWith('.json')) {
        // 不显示错误，只在控制台记录
        console.error('文件类型无效:', file.name);
        return;
      }
      
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = e.target.result;
          let data;
          
          try {
            data = JSON.parse(content);
          } catch (parseError) {
            console.error(`解析JSON文件失败: ${parseError.message}`);
            return;
          }
          
          // 简化的数据结构验证
          if (!Array.isArray(data)) {
            console.error('JSON结构无效');
            return;
          }
          
          // 快速处理应用数据，避免过多的异步操作
          const processedData = data.map(app => {
            let enhancedApp = { ...app };
            
            // 添加默认类别
            if (!enhancedApp.category) {
              enhancedApp.category = 'software';
            }
            
            // 简化的图标处理逻辑 - 只在没有图标时添加默认图标
            if (!enhancedApp.icon || enhancedApp.icon.length === 0) {
              enhancedApp.icon = getSmartIcon(enhancedApp);
            }
            
            return enhancedApp;
          });
          
          // 创建Blob对象和URL，避免不必要的缩进和格式化
          const blob = new Blob([JSON.stringify(processedData)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          
          // 保存到本地存储
          const blobSources = JSON.parse(localStorage.getItem('blobSources') || '[]');
          const newBlobSource = {
            id: Date.now(),
            url,
            data: processedData,
            createdAt: new Date().toISOString(),
            fileName: file.name
          };
          
          localStorage.setItem('blobSources', JSON.stringify([...blobSources, newBlobSource]));
          
          // 添加新软件源
          const sourceName = `${t('sourceManager.uploadedSource')}: ${file.name.replace('.json', '')}`;
          const updatedSources = [...sources, {
            id: Date.now(),
            name: sourceName,
            url,
            enabled: true,
            isLocalBlob: true,
            blobSourceId: newBlobSource.id
          }];
          
          saveSources(updatedSources);
          
          // 删除上传成功提示
          
          // 触发回调
          if (onSourcesChange) {
            onSourcesChange();
          }

          // 重置文件输入框
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        } catch (err) {
          console.error(`处理文件失败: ${err.message}`);
        }
      };
      
      reader.onerror = () => {
        console.error('读取文件失败');
      };
      
      // 直接读取文件文本内容，避免额外的处理
      reader.readAsText(file);
    } catch (err) {
      console.error(`处理文件失败: ${err.message}`);
    }
  };
  
  // 处理多个文件上传
  const handleMultipleFilesUpload = async (files) => {
    if (!files || files.length === 0) return;
    
    // 将FileList转换为数组
    const fileArray = Array.from(files);
    
    // 只处理json文件
    const jsonFiles = fileArray.filter(file => file.name.endsWith('.json'));
    
    if (jsonFiles.length === 0) {
      setError(t('sourceManager.invalidJson'));
      // 立即清除错误提示，允许继续上传
      setTimeout(() => setError(''), 1000);
      return;
    }
    
    // 创建一个处理上传文件的promises数组
    const uploadPromises = jsonFiles.map(async (file) => {
      return new Promise((resolve) => {
        try {
          const reader = new FileReader();
          
          reader.onload = (e) => {
            try {
              const content = e.target.result;
              let data;
              
              try {
                data = JSON.parse(content);
              } catch (parseError) {
                console.error(`解析文件 ${file.name} 失败:`, parseError);
                resolve({ success: false, fileName: file.name, error: parseError.message });
                return;
              }
              
              // 验证数据结构
              if (!Array.isArray(data)) {
                resolve({ success: false, fileName: file.name, error: 'JSON结构无效' });
                return;
              }
              
              // 处理应用数据
              const processedData = data.map(app => {
                let enhancedApp = { ...app };
                
                // 添加默认类别
                if (!enhancedApp.category) {
                  enhancedApp.category = 'software';
                }
                
                // 处理图标
                if (!enhancedApp.icon || enhancedApp.icon.length === 0) {
                  enhancedApp.icon = getSmartIcon(enhancedApp);
                }
                
                return enhancedApp;
              });
              
              // 创建Blob和URL
              const blob = new Blob([JSON.stringify(processedData)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              
              // 创建blob源
              const newBlobSource = {
                id: Date.now() + Math.random(),
                url,
                data: processedData,
                createdAt: new Date().toISOString(),
                fileName: file.name
              };
              
              resolve({ 
                success: true, 
                blobSource: newBlobSource, 
                fileName: file.name,
                sourceName: `${t('sourceManager.uploadedSource')}: ${file.name.replace('.json', '')}`
              });
            } catch (err) {
              console.error(`处理文件 ${file.name} 失败:`, err);
              resolve({ success: false, fileName: file.name, error: err.message });
            }
          };
          
          reader.onerror = () => {
            resolve({ success: false, fileName: file.name, error: '读取文件失败' });
          };
          
          reader.readAsText(file);
        } catch (err) {
          resolve({ success: false, fileName: file.name, error: err.message });
        }
      });
    });
    
    // 等待所有文件处理完成
    const results = await Promise.all(uploadPromises);
    
    // 收集处理结果
    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;
    
    // 更新blobSources
    const blobSources = JSON.parse(localStorage.getItem('blobSources') || '[]');
    const newBlobSources = results
      .filter(r => r.success)
      .map(r => r.blobSource);
    
    localStorage.setItem('blobSources', JSON.stringify([...blobSources, ...newBlobSources]));
    
    // 更新软件源
    const newSources = results
      .filter(r => r.success)
      .map(r => ({
        id: Date.now() + Math.random(),
        name: r.sourceName,
        url: r.blobSource.url,
        enabled: true,
        isLocalBlob: true,
        blobSourceId: r.blobSource.id
      }));
    
    // 保存更新后的源
    if (newSources.length > 0) {
      const updatedSources = [...sources, ...newSources];
      saveSources(updatedSources);
      
      // 触发回调
      if (onSourcesChange) {
        onSourcesChange();
      }
    }

    // 上传后不显示成功/失败提示，这样用户可以继续上传
    // 重置文件输入框，允许重新选择相同的文件
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 处理文件选择
  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleMultipleFilesUpload(e.target.files);
    }
  };
  
  // 处理拖拽事件
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleMultipleFilesUpload(e.dataTransfer.files);
    }
  };
  
  const handleFileUploadClick = () => {
    fileInputRef.current.click();
  };

  return (
    <Container theme={theme}>
      <Title>{t('sourceManager.title')}</Title>
      
      <Tabs>
        <Tab 
          active={activeTab === 'sources'} 
          onClick={() => setActiveTab('sources')}
          theme={theme}
        >
          {t('sourceManager.title')}
        </Tab>
        <Tab 
          active={activeTab === 'editor'} 
          onClick={() => setActiveTab('editor')}
          theme={theme}
        >
          JSON {t('common.edit')}
        </Tab>
      </Tabs>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      
      {activeTab === 'sources' && (
        <>
          <FileUploadContainer 
            theme={theme}
            className={isDragging ? 'dragover' : ''}
            onClick={handleFileUploadClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <FileUploadIcon>📂</FileUploadIcon>
            <FileUploadText theme={theme}>
              {t('sourceManager.dragDropFiles')}
            </FileUploadText>
            <FileUploadHint theme={theme}>
              支持同时上传多个软件源JSON文件
            </FileUploadHint>
            <FileUploadInput 
              type="file" 
              ref={fileInputRef}
              accept=".json,application/json" 
              onChange={handleFileSelect}
              multiple
            />
          </FileUploadContainer>
          
          <Divider theme={theme} />
          
          <AddSourceForm onSubmit={handleAddSource} theme={theme}>
            <FormGroup>
              <Label theme={theme}>{t('sourceManager.title')}</Label>
              <Input
                type="text"
                value={newSource.name}
                onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                placeholder={t('sourceManager.title')}
                theme={theme}
              />
            </FormGroup>
            
            <FormGroup>
              <Label theme={theme}>{t('sourceManager.enterUrl')}</Label>
              <Input
                type="url"
                value={newSource.url}
                onChange={(e) => setNewSource({ ...newSource, url: e.target.value })}
                placeholder={t('sourceManager.enterUrl')}
                theme={theme}
              />
              <HintText theme={theme}>{t('sourceManager.githubSupport')}</HintText>
            </FormGroup>
            
            <ButtonGroup>
              <Button type="submit" variant="primary">
                {t('sourceManager.addSource')}
              </Button>
              <Button 
                type="button" 
                onClick={() => {
                  setActiveTab('editor');
                  setEditorData([]);
                }}
              >
                {t('sourceManager.createNew')}
              </Button>
            </ButtonGroup>
          </AddSourceForm>

          <SourceList>
            {sources.length === 0 ? (
              <EmptyMessage theme={theme}>{t('sourceManager.noSources')}</EmptyMessage>
            ) : (
              sources.map(source => (
                <SourceItem key={source.id} theme={theme}>
                  <SourceHeader>
                    <SourceName>{source.name} {source.isLocalBlob && `(${t('sourceManager.local')})`}</SourceName>
                    <ButtonGroup>
                      <Button
                        onClick={() => loadSourceToEditor(source)}
                        theme={theme}
                      >
                        {t('common.edit')}
                      </Button>
                      <Button
                        onClick={() => handleToggleSource(source.id)}
                        theme={theme}
                      >
                        {source.enabled ? t('sourceManager.disable') : t('sourceManager.enable')}
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => handleDeleteSource(source.id)}
                      >
                        {t('common.delete')}
                      </Button>
                    </ButtonGroup>
                  </SourceHeader>
                  <SourceUrl theme={theme}>{source.url}</SourceUrl>
                </SourceItem>
              ))
            )}
          </SourceList>
        </>
      )}
      
      {activeTab === 'editor' && (
        <>
          <JsonEditor 
            initialData={editorData} 
            onChange={handleJsonChange} 
            theme={theme}
            title={t('sourceManager.jsonEditor')}
          />
          
          <ButtonGroup>
            <Button 
              variant="primary" 
              onClick={handleCreateSourceFromEditor}
            >
              {t('sourceManager.saveAsSource')}
            </Button>
            <Button 
              onClick={() => setActiveTab('sources')}
            >
              {t('sourceManager.returnToList')}
            </Button>
          </ButtonGroup>
        </>
      )}
    </Container>
  );
};

export default SourceManager; 