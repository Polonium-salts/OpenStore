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
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const JsonObjectList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ArrayItemContainer = styled.div`
  border: 1px solid ${props => props.theme === 'dark' ? '#444' : '#e8e8ed'};
  border-radius: 6px;
  padding: 12px 12px 0 12px;
  margin-bottom: 12px;
  position: relative;
`;

const ArrayControls = styled.div`
  display: flex;
  gap: 8px;
`;

const Button = styled.button`
  padding: 6px 12px;
  border-radius: 6px;
  border: none;
  font-size: 13px;
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
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const AppHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
`;

const AppTitle = styled.div`
  font-weight: 500;
  color: ${props => props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f'};
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 8px;
  margin-bottom: 8px;
`;

const FormField = styled.div`
  margin-bottom: 10px;
`;

const FieldLabel = styled.label`
  display: block;
  font-size: 12px;
  margin-bottom: 4px;
  color: ${props => props.theme === 'dark' ? '#aaa' : '#666'};
`;

const Input = styled.input`
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid ${props => props.theme === 'dark' ? '#444' : '#e8e8ed'};
  background-color: ${props => props.theme === 'dark' ? '#1d1d1f' : 'white'};
  color: ${props => props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f'};
  width: 100%;
  font-size: 13px;
  
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
  width: 100%;
  font-size: 13px;
  
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

const ToolBar = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
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

const ErrorMessage = styled.div`
  color: #FF3B30;
  font-size: 14px;
  margin-top: 8px;
  margin-bottom: 8px;
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
  const [showPreview, setShowPreview] = useState(false);
  
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

  // 解析下载链接并提取有用信息
  const parseDownloadUrl = (downloadUrl) => {
    try {
      // 使用URL对象解析链接
      const url = new URL(downloadUrl);
      
      // 从路径中获取文件名
      let fileName = url.pathname.split('/').pop().split('?')[0];
      if (!fileName) {
        fileName = 'unknown_file';
      }
      
      // 对URL解码以处理特殊字符
      try {
        fileName = decodeURIComponent(fileName);
      } catch (e) {
        // 解码失败，保持原始文件名
        console.warn('文件名解码失败:', e);
      }
      
      // 提取文件扩展名
      const extension = fileName.includes('.') ? fileName.split('.').pop().toLowerCase() : '';
      
      // 猜测文件类型
      let fileType = 'unknown';
      let category = 'software';
      
      if (['exe', 'msi', 'zip', 'rar', '7z', 'deb', 'rpm', 'dmg', 'pkg', 'appimage'].includes(extension)) {
        fileType = 'software';
        category = 'software';
      } else if (['apk', 'ipa'].includes(extension)) {
        fileType = 'mobile_app';
        category = 'software';
      } else if (['iso'].includes(extension)) {
        fileType = 'system';
        category = 'software';
      } else if (['gguf', 'ggml', 'bin', 'safetensors', 'pt'].includes(extension)) {
        fileType = 'ai_model';
        category = 'ai-models';
      } else if (['gba', 'gbc', 'nes', 'rom', 'n64', 'z64', 'sfc', 'smc'].includes(extension)) {
        fileType = 'game_rom';
        category = 'games';
      } else if (['exe', 'msi'].includes(extension) && (fileName.toLowerCase().includes('game') || fileName.toLowerCase().includes('setup'))) {
        fileType = 'game';
        category = 'games';
      }
      
      // 尝试从URL的路径部分提取可能的应用名称
      let appName = fileName.replace(/\.[^/.]+$/, '')  // 移除扩展名
                            .replace(/[-_.]/g, ' ')     // 替换连字符、下划线和点为空格
                            .replace(/\s+/g, ' ')       // 替换多个空格为单个空格
                            .trim();                    // 移除前后空格
      
      // 如果文件名包含版本号，尝试清理
      appName = appName.replace(/\sv?[\d.]+(\s|$)/i, ' ').trim();
      
      // 尝试获取版本号
      const versionMatch = fileName.match(/[vV]?(\d+\.\d+(\.\d+)?)/);
      const version = versionMatch ? versionMatch[1] : '';
      
      // 生成多种备用图标URL选项
      const iconUrls = [
        `https://icon.horse/icon/${url.hostname}`,
        `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=128`,
        `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${url.hostname}&size=128`
      ];
      
      // 返回解析结果
      return {
        fileName,
        appName,
        version,
        domain: url.hostname,
        iconUrl: iconUrls[0], // 主图标URL
        iconUrlFallbacks: iconUrls, // 备用图标URL
        fileType,
        extension,
        category
      };
    } catch (error) {
      console.error('解析URL失败:', error);
      return null;
    }
  };

  // 从下载链接自动获取软件信息
  const handleAutoFill = async (index, downloadUrl) => {
    try {
      setLoading(true);
      setError('');

      // 检查URL格式
      if (!downloadUrl || !downloadUrl.trim()) {
        throw new Error('下载链接不能为空');
      }
      
      // 确保URL以http或https开头
      if (!downloadUrl.match(/^https?:\/\//i)) {
        // 尝试修复URL
        downloadUrl = 'https://' + downloadUrl.replace(/^:?\/+/, '');
      }

      // 尝试解析下载链接
      const urlInfo = parseDownloadUrl(downloadUrl);
      if (!urlInfo) {
        throw new Error('无法解析下载链接，请确保链接格式正确');
      }
      
      // 更新应用信息
      const newData = [...jsonData];
      newData[index] = {
        ...newData[index],
        downloadUrl,
        name: urlInfo.appName || '未命名应用',
        version: urlInfo.version || '',
        id: Date.now(),
        description: `${urlInfo.fileName} - 从 ${urlInfo.domain} 下载`,
        icon: urlInfo.iconUrl,
        price: 0,
        category: urlInfo.category
      };

      setJsonData(newData);
      setError('');
    } catch (err) {
      setError('自动填写失败: ' + err.message);
      console.error('自动填写错误详情:', err);
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

  // 显示图标加载状态提示
  const renderIconStatus = (loading) => {
    return (
      <div 
        style={{ 
          position: 'fixed', 
          bottom: '20px', 
          right: '20px',
          padding: '8px 16px',
          background: loading ? '#0066CC' : '#34C759',
          color: 'white',
          borderRadius: '4px',
          fontSize: '13px',
          transition: 'opacity 0.3s',
          opacity: loading ? 1 : 0,
          pointerEvents: 'none'
        }}
      >
        {loading ? '处理中...' : '填写完成'}
      </div>
    );
  }

  return (
    <EditorContainer theme={theme}>
      <Title>
        {title}
        <ArrayControls>
          <Button 
            variant="primary" 
            onClick={handleAddApp}
            disabled={loading}
          >
            添加应用
          </Button>
          <Button 
            onClick={() => setShowPreview(!showPreview)}
            disabled={loading}
          >
            {showPreview ? '隐藏预览' : '显示预览'}
          </Button>
        </ArrayControls>
      </Title>
      
      <ToolBar>
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
      </ToolBar>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      
      {renderIconStatus(loading)}
      
      <JsonObjectList>
        {jsonData.map((app, index) => (
          <ArrayItemContainer key={index} theme={theme}>
            <AppHeader>
              <AppTitle theme={theme}>
                {app.name || `应用 #${index + 1}`}
              </AppTitle>
              <DeleteButton onClick={() => handleDeleteApp(index)} title="删除">×</DeleteButton>
            </AppHeader>
            
            <FormGrid>
              <FormField>
                <FieldLabel theme={theme}>下载链接</FieldLabel>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
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
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    自动
                  </Button>
                </div>
              </FormField>

              <FormField>
                <FieldLabel theme={theme}>应用ID</FieldLabel>
                <Input
                  type="number"
                  value={app.id}
                  onChange={(e) => handleUpdateProperty(index, 'id', e.target.value)}
                  theme={theme}
                  placeholder="ID"
                />
              </FormField>
              
              <FormField>
                <FieldLabel theme={theme}>名称</FieldLabel>
                <Input
                  type="text"
                  value={app.name}
                  onChange={(e) => handleUpdateProperty(index, 'name', e.target.value)}
                  theme={theme}
                  placeholder="应用名称"
                />
              </FormField>
              
              <FormField>
                <FieldLabel theme={theme}>图标URL</FieldLabel>
                <Input
                  type="text"
                  value={app.icon}
                  onChange={(e) => handleUpdateProperty(index, 'icon', e.target.value)}
                  theme={theme}
                  placeholder="图标URL地址"
                />
              </FormField>
              
              <FormField>
                <FieldLabel theme={theme}>价格</FieldLabel>
                <Input
                  type="number"
                  value={app.price}
                  onChange={(e) => handleUpdateProperty(index, 'price', e.target.value)}
                  theme={theme}
                  placeholder="0"
                />
              </FormField>
              
              <FormField>
                <FieldLabel theme={theme}>分类</FieldLabel>
                <Select
                  value={app.category || 'software'}
                  onChange={(e) => handleUpdateProperty(index, 'category', e.target.value)}
                  theme={theme}
                >
                  <option value="software">软件</option>
                  <option value="games">游戏</option>
                  <option value="ai-models">AI大模型</option>
                </Select>
              </FormField>
              
              <FormField>
                <FieldLabel theme={theme}>版本</FieldLabel>
                <Input
                  type="text"
                  value={app.version || ''}
                  onChange={(e) => handleUpdateProperty(index, 'version', e.target.value)}
                  theme={theme}
                  placeholder="应用版本号"
                />
              </FormField>
              
              <FormField>
                <FieldLabel theme={theme}>开发者</FieldLabel>
                <Input
                  type="text"
                  value={app.developer || ''}
                  onChange={(e) => handleUpdateProperty(index, 'developer', e.target.value)}
                  theme={theme}
                  placeholder="开发者名称"
                />
              </FormField>
            </FormGrid>
            
            <FormField>
              <FieldLabel theme={theme}>描述</FieldLabel>
              <Input
                type="text"
                value={app.description}
                onChange={(e) => handleUpdateProperty(index, 'description', e.target.value)}
                theme={theme}
                placeholder="应用描述"
              />
            </FormField>
            
            <FormField>
              <FieldLabel theme={theme}>截图URL</FieldLabel>
              <Input
                type="text"
                value={app.screenshot || ''}
                onChange={(e) => handleUpdateProperty(index, 'screenshot', e.target.value)}
                theme={theme}
                placeholder="截图URL地址"
              />
            </FormField>
          </ArrayItemContainer>
        ))}
      </JsonObjectList>
      
      {showPreview && (
        <JsonPreview theme={theme}>
          {JSON.stringify(jsonData, null, 2)}
        </JsonPreview>
      )}
    </EditorContainer>
  );
};

export default JsonEditor; 