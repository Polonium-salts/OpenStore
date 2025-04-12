import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import JsonEditor from './JsonEditor';

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

const SourceManager = ({ theme, onSourcesChange }) => {
  const [sources, setSources] = useState([]);
  const [newSource, setNewSource] = useState({ name: '', url: '' });
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('sources');
  const [editorData, setEditorData] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

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
      // 检查并转换GitHub链接为raw链接
      const githubRegex = /github\.com\/([^\/]+)\/([^\/]+)\/blob\/(main|master)\/(.+\.json)/i;
      const match = url.match(githubRegex);
      
      if (match) {
        // 将GitHub普通链接转换为raw链接
        const rawUrl = `https://raw.githubusercontent.com/${match[1]}/${match[2]}/${match[3]}/${match[4]}`;
        console.log('已将GitHub链接转换为raw链接:', rawUrl);
        url = rawUrl;
      }

      const response = await fetch(url);
      const data = await response.json();
      
      // 验证JSON结构
      if (!Array.isArray(data) || !data.every(app => 
        app.id && app.name && app.icon && app.description && 
        typeof app.price !== 'undefined' && app.downloadUrl
      )) {
        throw new Error('软件源格式无效');
      }
      
      // 检查每个应用是否有category字段，如果没有则添加默认值
      const processedData = data.map(app => {
        if (!app.category) {
          console.warn(`应用 ${app.name} 没有分类字段，默认设置为软件类别`);
          return { ...app, category: 'software' };
        }
        return app;
      });
      
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
      throw new Error('无法访问软件源或格式无效');
    }
  };

  // 添加新软件源
  const handleAddSource = async (e) => {
    e.preventDefault();
    setError('');

    if (!newSource.name || !newSource.url) {
      setError('请填写完整的软件源信息');
      return;
    }

    try {
      // 检查是否为GitHub链接并可能需要转换
      const isGithubUrl = /github\.com\/([^\/]+)\/([^\/]+)\/blob\/(main|master)\/(.+\.json)/i.test(newSource.url);
      const originalUrl = isGithubUrl ? newSource.url : null;
      
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
      
      const updatedSources = [...sources, {
        id: Date.now(),
        name: newSource.name,
        url: sourceUrl,
        originalUrl: isLocalProcessed ? (originalUrl || newSource.url) : originalUrl,
        enabled: true,
        isLocalBlob: isLocalProcessed,
        blobSourceId: blobSourceId,
        isGithubConverted: isGithubUrl
      }];
      
      saveSources(updatedSources);
      setNewSource({ name: '', url: '' });
      
      // 如果是GitHub链接，显示转换提示
      if (isGithubUrl) {
        setError('已自动转换为GitHub raw链接，软件源添加成功！');
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // 删除软件源
  const handleDeleteSource = (sourceId) => {
    const updatedSources = sources.filter(source => source.id !== sourceId);
    saveSources(updatedSources);
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
  const handleCreateSourceFromEditor = () => {
    try {
      // 验证必填字段
      const isValid = editorData.every(app => (
        app.id && app.name && app.icon && app.description && 
        typeof app.price !== 'undefined' && app.downloadUrl
      ));
      
      if (!isValid) {
        setError('所有应用必须包含id、name、icon、description、price和downloadUrl字段');
        return;
      }
      
      // 创建一个Blob对象
      const blob = new Blob([JSON.stringify(editorData, null, 2)], { type: 'application/json' });
      
      // 创建一个临时URL
      const url = URL.createObjectURL(blob);
      
      // 在本地存储我们需要追踪这个blob URL
      const blobSources = JSON.parse(localStorage.getItem('blobSources') || '[]');
      const newBlobSource = {
        id: Date.now(),
        url,
        data: editorData,
        createdAt: new Date().toISOString()
      };
      
      localStorage.setItem('blobSources', JSON.stringify([...blobSources, newBlobSource]));
      
      // 添加新软件源
      const updatedSources = [...sources, {
        id: Date.now(),
        name: `本地源 ${new Date().toLocaleString()}`,
        url,
        enabled: true,
        isLocalBlob: true,
        blobSourceId: newBlobSource.id
      }];
      
      saveSources(updatedSources);
      setActiveTab('sources');
      setError('');
    } catch (err) {
      setError('创建软件源失败: ' + err.message);
    }
  };

  // 加载特定软件源的数据到编辑器
  const loadSourceToEditor = async (source) => {
    try {
      setError('');
      let data;
      
      if (source.isLocalBlob) {
        // 从本地存储获取blob数据
        const blobSources = JSON.parse(localStorage.getItem('blobSources') || '[]');
        const blobSource = blobSources.find(bs => bs.id === source.blobSourceId);
        
        if (blobSource) {
          data = blobSource.data;
        } else {
          throw new Error('无法找到本地源数据');
        }
      } else {
        // 从URL获取数据
        const response = await fetch(source.url);
        data = await response.json();
      }
      
      setEditorData(data);
      setActiveTab('editor');
    } catch (err) {
      setError('加载软件源数据失败: ' + err.message);
    }
  };

  // 处理文件上传
  const handleFileUpload = async (file) => {
    if (!file) return;
    
    // 验证文件类型
    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      setError('请上传有效的 JSON 文件');
      return;
    }
    
    try {
      // 读取文件内容
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const content = e.target.result;
          const data = JSON.parse(content);
          
          // 验证JSON结构
          if (!Array.isArray(data) || !data.every(app => 
            app.id && app.name && app.icon && app.description && 
            typeof app.price !== 'undefined' && app.downloadUrl
          )) {
            setError('JSON文件格式无效，请确保包含所有必需字段');
            return;
          }
          
          // 处理数据
          const processedData = data.map(app => {
            if (!app.category) {
              return { ...app, category: 'software' };
            }
            return app;
          });
          
          // 创建Blob对象
          const blob = new Blob([JSON.stringify(processedData, null, 2)], { type: 'application/json' });
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
          const sourceName = `上传的源: ${file.name.replace('.json', '')}`;
          const updatedSources = [...sources, {
            id: Date.now(),
            name: sourceName,
            url,
            enabled: true,
            isLocalBlob: true,
            blobSourceId: newBlobSource.id
          }];
          
          saveSources(updatedSources);
          setError('');
          
          if (onSourcesChange) {
            onSourcesChange();
          }
        } catch (err) {
          setError('解析JSON文件失败: ' + err.message);
        }
      };
      
      reader.onerror = () => {
        setError('读取文件失败');
      };
      
      reader.readAsText(file);
    } catch (err) {
      setError('处理文件失败: ' + err.message);
    }
  };
  
  // 处理文件选择
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileUpload(file);
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
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };
  
  const handleFileUploadClick = () => {
    fileInputRef.current.click();
  };

  return (
    <Container theme={theme}>
      <Title>软件源管理</Title>
      
      <Tabs>
        <Tab 
          active={activeTab === 'sources'} 
          onClick={() => setActiveTab('sources')}
          theme={theme}
        >
          软件源列表
        </Tab>
        <Tab 
          active={activeTab === 'editor'} 
          onClick={() => setActiveTab('editor')}
          theme={theme}
        >
          JSON编辑器
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
              点击或拖拽 JSON 文件至此处上传软件源
            </FileUploadText>
            <FileUploadInput 
              type="file" 
              ref={fileInputRef}
              accept=".json,application/json" 
              onChange={handleFileSelect}
            />
          </FileUploadContainer>
          
          <Divider theme={theme} />
          
          <AddSourceForm onSubmit={handleAddSource} theme={theme}>
            <FormGroup>
              <Label theme={theme}>软件源名称</Label>
              <Input
                type="text"
                value={newSource.name}
                onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                placeholder="输入软件源名称"
                theme={theme}
              />
            </FormGroup>
            
            <FormGroup>
              <Label theme={theme}>软件源URL</Label>
              <Input
                type="url"
                value={newSource.url}
                onChange={(e) => setNewSource({ ...newSource, url: e.target.value })}
                placeholder="输入软件源JSON文件URL"
                theme={theme}
              />
              <HintText theme={theme}>支持直接输入GitHub文件链接，系统会自动转换为原始内容链接</HintText>
            </FormGroup>
            
            <ButtonGroup>
              <Button type="submit" variant="primary">
                添加软件源
              </Button>
              <Button 
                type="button" 
                onClick={() => {
                  setActiveTab('editor');
                  setEditorData([]);
                }}
              >
                创建新软件源
              </Button>
            </ButtonGroup>
          </AddSourceForm>

          <SourceList>
            {sources.map(source => (
              <SourceItem key={source.id} theme={theme}>
                <SourceHeader>
                  <SourceName>{source.name} {source.isLocalBlob && '(本地)'}</SourceName>
                  <ButtonGroup>
                    <Button
                      onClick={() => loadSourceToEditor(source)}
                      theme={theme}
                    >
                      编辑
                    </Button>
                    <Button
                      onClick={() => handleToggleSource(source.id)}
                      theme={theme}
                    >
                      {source.enabled ? '禁用' : '启用'}
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => handleDeleteSource(source.id)}
                    >
                      删除
                    </Button>
                  </ButtonGroup>
                </SourceHeader>
                <SourceUrl theme={theme}>{source.url}</SourceUrl>
              </SourceItem>
            ))}
          </SourceList>
        </>
      )}
      
      {activeTab === 'editor' && (
        <>
          <JsonEditor 
            initialData={editorData} 
            onChange={handleJsonChange} 
            theme={theme}
            title="软件源JSON编辑器"
          />
          
          <ButtonGroup>
            <Button 
              variant="primary" 
              onClick={handleCreateSourceFromEditor}
            >
              保存为软件源
            </Button>
            <Button 
              onClick={() => setActiveTab('sources')}
            >
              返回软件源列表
            </Button>
          </ButtonGroup>
        </>
      )}
    </Container>
  );
};

export default SourceManager; 