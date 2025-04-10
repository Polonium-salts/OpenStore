import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const EditorContainer = styled.div`
  background-color: ${props => props.theme === 'dark' ? '#2a2a2d' : 'white'};
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 3px ${props => props.theme === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)'};
  margin-bottom: 20px;
`;

const Title = styled.h3`
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
`;

const JsonObjectList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ArrayItemContainer = styled.div`
  border: 1px solid ${props => props.theme === 'dark' ? '#444' : '#e8e8ed'};
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 12px;
  position: relative;
`;

const ArrayControls = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: 8px;
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
    if (props.variant === 'success') return '#34C759';
    return props.theme === 'dark' ? '#3a3a3d' : '#f5f5f7';
  }};
  color: ${props => (props.variant ? 'white' : props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f')};

  &:hover {
    opacity: 0.8;
  }
`;

const PropertyRow = styled.div`
  display: flex;
  margin-bottom: 8px;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
`;

const PropertyKey = styled.div`
  font-weight: 500;
  width: 120px;
  color: ${props => props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f'};
`;

const Input = styled.input`
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid ${props => props.theme === 'dark' ? '#444' : '#e8e8ed'};
  background-color: ${props => props.theme === 'dark' ? '#1d1d1f' : 'white'};
  color: ${props => props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f'};
  flex: 1;
  min-width: 200px;
  
  &:focus {
    outline: none;
    border-color: #0066CC;
  }
`;

const Select = styled.select`
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid ${props => props.theme === 'dark' ? '#444' : '#e8e8ed'};
  background-color: ${props => props.theme === 'dark' ? '#1d1d1f' : 'white'};
  color: ${props => props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f'};
  
  &:focus {
    outline: none;
    border-color: #0066CC;
  }
`;

const JsonPreview = styled.pre`
  background-color: ${props => props.theme === 'dark' ? '#1d1d1f' : '#f5f5f7'};
  color: ${props => props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f'};
  padding: 12px;
  border-radius: 6px;
  overflow: auto;
  max-height: 200px;
  font-family: monospace;
  font-size: 12px;
  margin-top: 16px;
`;

const DeleteButton = styled.button`
  background-color: transparent;
  border: none;
  color: #FF3B30;
  cursor: pointer;
  font-size: 18px;
  padding: 0 8px;
  
  &:hover {
    opacity: 0.7;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 16px;
`;

const ErrorMessage = styled.div`
  color: #FF3B30;
  font-size: 14px;
  margin-top: 8px;
`;

// 为软件源定义应用模板
const appTemplate = {
  id: 0,
  name: '',
  icon: '',
  description: '',
  price: 0,
  downloadUrl: '',
  version: '',
  developer: '',
  screenshot: '',
  category: 'software' // 默认分类为软件
};

const JsonEditor = ({ initialData = [], onChange, theme, title = 'JSON编辑器' }) => {
  const [jsonData, setJsonData] = useState(initialData);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    // 如果初始数据为空，添加一个空的应用对象
    if (initialData.length === 0) {
      setJsonData([{ ...appTemplate }]);
    } else {
      setJsonData(initialData);
    }
  }, [initialData]);

  // 当JSON数据改变时通知父组件
  useEffect(() => {
    if (onChange) {
      onChange(jsonData);
    }
  }, [jsonData, onChange]);

  // 添加新应用
  const handleAddApp = () => {
    setJsonData([...jsonData, { 
      ...appTemplate,
      id: Date.now() // 使用时间戳作为临时ID
    }]);
  };

  // 删除应用
  const handleDeleteApp = (index) => {
    const newData = [...jsonData];
    newData.splice(index, 1);
    setJsonData(newData);
  };

  // 更新应用属性
  const handleUpdateProperty = (index, property, value) => {
    const newData = [...jsonData];
    
    // 处理不同类型的值
    if (property === 'id' || property === 'price') {
      const numValue = parseFloat(value);
      newData[index][property] = isNaN(numValue) ? 0 : numValue;
    } else {
      newData[index][property] = value;
    }
    
    setJsonData(newData);
  };

  // 导出JSON数据
  const handleExport = () => {
    try {
      // 验证必填字段
      const isValid = jsonData.every(app => (
        app.id && app.name && app.icon && app.description && 
        typeof app.price !== 'undefined' && app.downloadUrl
      ));
      
      if (!isValid) {
        setError('所有应用必须包含id、name、icon、description、price和downloadUrl字段');
        return;
      }
      
      const dataStr = JSON.stringify(jsonData, null, 2);
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
      
      const exportLink = document.createElement('a');
      exportLink.setAttribute('href', dataUri);
      exportLink.setAttribute('download', 'app-source.json');
      exportLink.click();
      setError('');
    } catch (err) {
      setError('导出失败: ' + err.message);
    }
  };

  // 处理粘贴JSON数据
  const handlePaste = (e) => {
    try {
      e.preventDefault();
      const clipboardData = e.clipboardData.getData('text');
      const parsedData = JSON.parse(clipboardData);
      
      if (!Array.isArray(parsedData)) {
        setError('粘贴的数据必须是JSON数组');
        return;
      }
      
      setJsonData(parsedData);
      setError('');
    } catch (err) {
      setError('无法解析粘贴的数据: ' + err.message);
    }
  };

  // 从下载链接自动获取软件信息
  const handleAutoFill = async (index, downloadUrl) => {
    try {
      setLoading(true);
      setError('');

      // 尝试从下载链接获取软件信息
      const response = await fetch(downloadUrl, {
        method: 'HEAD'
      });

      if (!response.ok) {
        throw new Error('无法访问下载链接');
      }

      // 从响应头中获取文件名和大小信息
      const contentDisposition = response.headers.get('content-disposition');
      const contentLength = response.headers.get('content-length');
      
      let fileName = '';
      if (contentDisposition) {
        const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
        if (matches && matches[1]) {
          fileName = matches[1].replace(/['"]/g, '');
        }
      }

      if (!fileName) {
        // 如果响应头中没有文件名，从URL中提取
        fileName = downloadUrl.split('/').pop().split('?')[0];
      }

      // 从文件名中提取可能的版本号
      const versionMatch = fileName.match(/[vV]?(\d+\.\d+(\.\d+)?)/);
      const version = versionMatch ? versionMatch[1] : '';

      // 更新应用信息
      const newData = [...jsonData];
      newData[index] = {
        ...newData[index],
        downloadUrl,
        name: fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
        version,
        id: Date.now(),
        description: `${fileName} - 大小: ${formatFileSize(contentLength)}`,
        icon: `https://icon.horse/icon/${new URL(downloadUrl).hostname}`,
        price: 0
      };

      setJsonData(newData);
      setError('');
    } catch (err) {
      setError('自动填写失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 格式化文件大小
  const formatFileSize = (bytes) => {
    if (!bytes) return '未知';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = parseInt(bytes);
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  };

  return (
    <EditorContainer theme={theme}>
      <Title>{title}</Title>
      
      <ArrayControls>
        <Button 
          variant="primary" 
          onClick={handleAddApp}
          disabled={loading}
        >
          添加应用
        </Button>
        <Button 
          onClick={handleExport}
          disabled={loading}
        >
          导出JSON
        </Button>
        <Button 
          onPaste={handlePaste}
          disabled={loading}
        >
          粘贴JSON (Ctrl+V)
        </Button>
      </ArrayControls>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      
      <JsonObjectList>
        {jsonData.map((app, index) => (
          <ArrayItemContainer key={index} theme={theme}>
            <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
              <DeleteButton onClick={() => handleDeleteApp(index)} title="删除">×</DeleteButton>
            </div>
            
            <PropertyRow>
              <PropertyKey theme={theme}>下载链接</PropertyKey>
              <Input
                type="url"
                value={app.downloadUrl}
                onChange={(e) => handleUpdateProperty(index, 'downloadUrl', e.target.value)}
                theme={theme}
                placeholder="软件下载链接"
              />
              <Button
                onClick={() => handleAutoFill(index, app.downloadUrl)}
                disabled={!app.downloadUrl || loading}
                variant="success"
              >
                自动填写
              </Button>
            </PropertyRow>

            <PropertyRow>
              <PropertyKey theme={theme}>ID</PropertyKey>
              <Input
                type="number"
                value={app.id}
                onChange={(e) => handleUpdateProperty(index, 'id', e.target.value)}
                theme={theme}
              />
            </PropertyRow>
            
            <PropertyRow>
              <PropertyKey theme={theme}>名称</PropertyKey>
              <Input
                type="text"
                value={app.name}
                onChange={(e) => handleUpdateProperty(index, 'name', e.target.value)}
                theme={theme}
                placeholder="应用名称"
              />
            </PropertyRow>
            
            <PropertyRow>
              <PropertyKey theme={theme}>图标URL</PropertyKey>
              <Input
                type="text"
                value={app.icon}
                onChange={(e) => handleUpdateProperty(index, 'icon', e.target.value)}
                theme={theme}
                placeholder="图标URL地址"
              />
            </PropertyRow>
            
            <PropertyRow>
              <PropertyKey theme={theme}>描述</PropertyKey>
              <Input
                type="text"
                value={app.description}
                onChange={(e) => handleUpdateProperty(index, 'description', e.target.value)}
                theme={theme}
                placeholder="应用描述"
              />
            </PropertyRow>
            
            <PropertyRow>
              <PropertyKey theme={theme}>价格</PropertyKey>
              <Input
                type="number"
                value={app.price}
                onChange={(e) => handleUpdateProperty(index, 'price', e.target.value)}
                theme={theme}
                placeholder="0"
              />
            </PropertyRow>
            
            <PropertyRow>
              <PropertyKey theme={theme}>版本</PropertyKey>
              <Input
                type="text"
                value={app.version || ''}
                onChange={(e) => handleUpdateProperty(index, 'version', e.target.value)}
                theme={theme}
                placeholder="应用版本号"
              />
            </PropertyRow>
            
            <PropertyRow>
              <PropertyKey theme={theme}>开发者</PropertyKey>
              <Input
                type="text"
                value={app.developer || ''}
                onChange={(e) => handleUpdateProperty(index, 'developer', e.target.value)}
                theme={theme}
                placeholder="开发者名称"
              />
            </PropertyRow>
            
            <PropertyRow>
              <PropertyKey theme={theme}>截图URL</PropertyKey>
              <Input
                type="text"
                value={app.screenshot || ''}
                onChange={(e) => handleUpdateProperty(index, 'screenshot', e.target.value)}
                theme={theme}
                placeholder="截图URL地址"
              />
            </PropertyRow>
            
            <PropertyRow>
              <PropertyKey theme={theme}>分类</PropertyKey>
              <Select
                value={app.category || 'software'}
                onChange={(e) => handleUpdateProperty(index, 'category', e.target.value)}
                theme={theme}
              >
                <option value="software">软件</option>
                <option value="games">游戏</option>
                <option value="ai-models">AI大模型</option>
              </Select>
            </PropertyRow>
          </ArrayItemContainer>
        ))}
      </JsonObjectList>
      
      <JsonPreview theme={theme}>
        {JSON.stringify(jsonData, null, 2)}
      </JsonPreview>
    </EditorContainer>
  );
};

export default JsonEditor; 