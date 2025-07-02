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
  color: #ff6b6b;
  background: rgba(255, 107, 107, 0.1);
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
  border: 1px solid rgba(255, 107, 107, 0.3);
`;

const PlatformSection = styled.div`
  margin: 16px 0;
  padding: 16px;
  border: 1px solid ${props => props.theme === 'dark' ? '#444' : '#ddd'};
  border-radius: 8px;
  background: ${props => props.theme === 'dark' ? '#2a2a2a' : '#f9f9f9'};
`;

const PlatformTitle = styled.h4`
  margin: 0 0 12px 0;
  color: ${props => props.theme === 'dark' ? '#fff' : '#333'};
  font-size: 14px;
  font-weight: 600;
  text-transform: capitalize;
`;

const ArchSection = styled.div`
  margin: 8px 0;
  padding: 12px;
  border: 1px solid ${props => props.theme === 'dark' ? '#555' : '#eee'};
  border-radius: 6px;
  background: ${props => props.theme === 'dark' ? '#333' : '#fff'};
`;

const ArchTitle = styled.h5`
  margin: 0 0 8px 0;
  color: ${props => props.theme === 'dark' ? '#ccc' : '#666'};
  font-size: 12px;
  font-weight: 500;
`;

const DownloadFieldsGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 8px;
  align-items: end;
`;

const MultiPlatformContainer = styled.div`
  margin: 16px 0;
  padding: 16px;
  border: 2px solid ${props => props.theme === 'dark' ? '#4a90e2' : '#007bff'};
  border-radius: 8px;
  background: ${props => props.theme === 'dark' ? '#1a1a1a' : '#f8f9fa'};
`;

const SectionTitle = styled.h3`
  margin: 0 0 16px 0;
  color: ${props => props.theme === 'dark' ? '#4a90e2' : '#007bff'};
  font-size: 16px;
  font-weight: 600;
`;

const CollapseButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme === 'dark' ? '#4a90e2' : '#007bff'};
  cursor: pointer;
  font-size: 14px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  gap: 4px;
  
  &:hover {
    background: ${props => props.theme === 'dark' ? 'rgba(74, 144, 226, 0.1)' : 'rgba(0, 123, 255, 0.1)'};
  }
  
  &:focus {
    outline: none;
    background: ${props => props.theme === 'dark' ? 'rgba(74, 144, 226, 0.2)' : 'rgba(0, 123, 255, 0.2)'};
  }
`;

const CollapsibleContent = styled.div.withConfig({
  shouldForwardProp: (prop) => !['collapsed'].includes(prop)
})`
  overflow: hidden;
  transition: max-height 0.3s ease-out, opacity 0.3s ease-out;
  max-height: ${props => props.collapsed ? '0' : '2000px'};
  opacity: ${props => props.collapsed ? '0' : '1'};
`;

// 为软件源定义应用模板
const appTemplate = {
  id: 0,
  name: '',
  icon: '',
  description: '',
  price: 0,
  downloadUrl: '', // 保持向后兼容
  downloads: {
    windows: {
      x64: { url: '', size: '', filename: '' },
      x86: { url: '', size: '', filename: '' },
      arm64: { url: '', size: '', filename: '' }
    },
    macos: {
      universal: { url: '', size: '', filename: '' },
      intel: { url: '', size: '', filename: '' },
      apple_silicon: { url: '', size: '', filename: '' }
    },
    linux: {
      x64_deb: { url: '', size: '', filename: '' },
      x64_rpm: { url: '', size: '', filename: '' },
      x64_tar: { url: '', size: '', filename: '' },
      arm64_deb: { url: '', size: '', filename: '' },
      arm64_rpm: { url: '', size: '', filename: '' },
      arm64_tar: { url: '', size: '', filename: '' }
    }
  },
  systemRequirements: {
    windows: '',
    macos: '',
    linux: ''
  },
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
  const [collapsedSections, setCollapsedSections] = useState({});
  
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

  // 更新多平台下载信息
  const handleUpdateDownload = (index, platform, arch, field, value) => {
    const newData = [...jsonData];
    if (!newData[index].downloads) {
      newData[index].downloads = {
        windows: {},
        macos: {},
        linux: {}
      };
    }
    if (!newData[index].downloads[platform]) {
      newData[index].downloads[platform] = {};
    }
    if (!newData[index].downloads[platform][arch]) {
      newData[index].downloads[platform][arch] = { url: '', size: '', filename: '' };
    }
    newData[index].downloads[platform][arch][field] = value;
    setJsonData(newData);
  };

  // 更新系统要求
  const handleUpdateSystemRequirement = (index, platform, value) => {
    const newData = [...jsonData];
    if (!newData[index].systemRequirements) {
      newData[index].systemRequirements = {};
    }
    newData[index].systemRequirements[platform] = value;
    setJsonData(newData);
  };

  // 从传统downloadUrl转换为多平台格式
  const convertToMultiPlatform = (index) => {
    const newData = [...jsonData];
    const app = newData[index];
    if (app.downloadUrl && !app.downloads) {
      const parsedInfo = parseDownloadUrl(app.downloadUrl);
      newData[index].downloads = {
        windows: {
          x64: { url: app.downloadUrl, size: '', filename: parsedInfo.filename || '' },
          x86: { url: '', size: '', filename: '' },
          arm64: { url: '', size: '', filename: '' }
        },
        macos: {
          universal: { url: '', size: '', filename: '' },
          intel: { url: '', size: '', filename: '' },
          apple_silicon: { url: '', size: '', filename: '' }
        },
        linux: {
          x64_deb: { url: '', size: '', filename: '' },
          x64_rpm: { url: '', size: '', filename: '' },
          x64_tar: { url: '', size: '', filename: '' },
          arm64_deb: { url: '', size: '', filename: '' },
          arm64_rpm: { url: '', size: '', filename: '' },
          arm64_tar: { url: '', size: '', filename: '' }
        }
      };
      newData[index].systemRequirements = {
        windows: '',
        macos: '',
        linux: ''
      };
      setJsonData(newData);
    }
  };

  // 清空多平台配置
  const clearMultiPlatform = (index) => {
    const newData = [...jsonData];
    delete newData[index].downloads;
    delete newData[index].systemRequirements;
    setJsonData(newData);
  };

  // 批量转换为多平台格式
  const batchConvertToMultiPlatform = () => {
    const newData = [...jsonData];
    newData.forEach((app, index) => {
      if (app.downloadUrl && !app.downloads) {
        const parsedInfo = parseDownloadUrl(app.downloadUrl);
        newData[index].downloads = {
          windows: {
            x64: { url: app.downloadUrl, size: '', filename: parsedInfo.filename || '' },
            x86: { url: '', size: '', filename: '' },
            arm64: { url: '', size: '', filename: '' }
          },
          macos: {
            universal: { url: '', size: '', filename: '' },
            intel: { url: '', size: '', filename: '' },
            apple_silicon: { url: '', size: '', filename: '' }
          },
          linux: {
            x64_deb: { url: '', size: '', filename: '' },
            x64_rpm: { url: '', size: '', filename: '' },
            x64_tar: { url: '', size: '', filename: '' },
            arm64_deb: { url: '', size: '', filename: '' },
            arm64_rpm: { url: '', size: '', filename: '' },
            arm64_tar: { url: '', size: '', filename: '' }
          }
        };
        newData[index].systemRequirements = {
          windows: '',
          macos: '',
          linux: ''
        };
      }
    });
    setJsonData(newData);
  };

  // 切换多平台配置的收缩状态
  const toggleMultiPlatformCollapse = (appIndex) => {
    setCollapsedSections(prev => ({
      ...prev,
      [appIndex]: !prev[appIndex]
    }));
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
        <Button 
          onClick={batchConvertToMultiPlatform}
          variant="info"
          disabled={!jsonData.some(app => app.downloadUrl && !app.downloads)}
        >
          批量转换多平台
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
            
            {/* 多平台下载配置 */}
            <MultiPlatformContainer theme={theme}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <SectionTitle theme={theme}>多平台下载配置</SectionTitle>
                  <CollapseButton 
                    theme={theme} 
                    onClick={() => toggleMultiPlatformCollapse(index)}
                    title={collapsedSections[index] ? '展开' : '收缩'}
                  >
                    {collapsedSections[index] ? '展开 ▼' : '收缩 ▲'}
                  </CollapseButton>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {app.downloadUrl && !app.downloads && (
                    <Button
                      onClick={() => convertToMultiPlatform(index)}
                      variant="success"
                      style={{ fontSize: '12px', padding: '6px 12px' }}
                    >
                      从传统格式转换
                    </Button>
                  )}
                  {app.downloads && (
                    <Button
                      onClick={() => clearMultiPlatform(index)}
                      variant="danger"
                      style={{ fontSize: '12px', padding: '6px 12px' }}
                    >
                      清空配置
                    </Button>
                  )}
                </div>
              </div>
              
              <CollapsibleContent collapsed={collapsedSections[index]}>
                {/* Windows 平台 */}
                <PlatformSection theme={theme}>
                <PlatformTitle theme={theme}>Windows</PlatformTitle>
                {['x64', 'x86', 'arm64'].map(arch => (
                  <ArchSection key={arch} theme={theme}>
                    <ArchTitle theme={theme}>{arch.toUpperCase()}</ArchTitle>
                    <DownloadFieldsGrid>
                      <Input
                        type="text"
                        value={app.downloads?.windows?.[arch]?.url || ''}
                        onChange={(e) => handleUpdateDownload(index, 'windows', arch, 'url', e.target.value)}
                        theme={theme}
                        placeholder="下载链接"
                      />
                      <Input
                        type="text"
                        value={app.downloads?.windows?.[arch]?.size || ''}
                        onChange={(e) => handleUpdateDownload(index, 'windows', arch, 'size', e.target.value)}
                        theme={theme}
                        placeholder="文件大小"
                      />
                      <Input
                        type="text"
                        value={app.downloads?.windows?.[arch]?.filename || ''}
                        onChange={(e) => handleUpdateDownload(index, 'windows', arch, 'filename', e.target.value)}
                        theme={theme}
                        placeholder="文件名"
                      />
                    </DownloadFieldsGrid>
                  </ArchSection>
                ))}
              </PlatformSection>
              
              {/* macOS 平台 */}
              <PlatformSection theme={theme}>
                <PlatformTitle theme={theme}>macOS</PlatformTitle>
                {['universal', 'intel', 'apple_silicon'].map(arch => (
                  <ArchSection key={arch} theme={theme}>
                    <ArchTitle theme={theme}>{arch === 'apple_silicon' ? 'Apple Silicon' : arch.charAt(0).toUpperCase() + arch.slice(1)}</ArchTitle>
                    <DownloadFieldsGrid>
                      <Input
                        type="text"
                        value={app.downloads?.macos?.[arch]?.url || ''}
                        onChange={(e) => handleUpdateDownload(index, 'macos', arch, 'url', e.target.value)}
                        theme={theme}
                        placeholder="下载链接"
                      />
                      <Input
                        type="text"
                        value={app.downloads?.macos?.[arch]?.size || ''}
                        onChange={(e) => handleUpdateDownload(index, 'macos', arch, 'size', e.target.value)}
                        theme={theme}
                        placeholder="文件大小"
                      />
                      <Input
                        type="text"
                        value={app.downloads?.macos?.[arch]?.filename || ''}
                        onChange={(e) => handleUpdateDownload(index, 'macos', arch, 'filename', e.target.value)}
                        theme={theme}
                        placeholder="文件名"
                      />
                    </DownloadFieldsGrid>
                  </ArchSection>
                ))}
              </PlatformSection>
              
              {/* Linux 平台 */}
              <PlatformSection theme={theme}>
                <PlatformTitle theme={theme}>Linux</PlatformTitle>
                {['x64_deb', 'x64_rpm', 'x64_tar', 'arm64_deb', 'arm64_rpm', 'arm64_tar'].map(arch => (
                  <ArchSection key={arch} theme={theme}>
                    <ArchTitle theme={theme}>{arch.replace('_', ' ').toUpperCase()}</ArchTitle>
                    <DownloadFieldsGrid>
                      <Input
                        type="text"
                        value={app.downloads?.linux?.[arch]?.url || ''}
                        onChange={(e) => handleUpdateDownload(index, 'linux', arch, 'url', e.target.value)}
                        theme={theme}
                        placeholder="下载链接"
                      />
                      <Input
                        type="text"
                        value={app.downloads?.linux?.[arch]?.size || ''}
                        onChange={(e) => handleUpdateDownload(index, 'linux', arch, 'size', e.target.value)}
                        theme={theme}
                        placeholder="文件大小"
                      />
                      <Input
                        type="text"
                        value={app.downloads?.linux?.[arch]?.filename || ''}
                        onChange={(e) => handleUpdateDownload(index, 'linux', arch, 'filename', e.target.value)}
                        theme={theme}
                        placeholder="文件名"
                      />
                    </DownloadFieldsGrid>
                  </ArchSection>
                ))}
              </PlatformSection>
              
              {/* 系统要求 */}
              <PlatformSection theme={theme}>
                <PlatformTitle theme={theme}>系统要求</PlatformTitle>
                <FormField>
                  <FieldLabel theme={theme}>Windows 系统要求</FieldLabel>
                  <Input
                    type="text"
                    value={app.systemRequirements?.windows || ''}
                    onChange={(e) => handleUpdateSystemRequirement(index, 'windows', e.target.value)}
                    theme={theme}
                    placeholder="例如：Windows 10 或更高版本"
                  />
                </FormField>
                <FormField>
                  <FieldLabel theme={theme}>macOS 系统要求</FieldLabel>
                  <Input
                    type="text"
                    value={app.systemRequirements?.macos || ''}
                    onChange={(e) => handleUpdateSystemRequirement(index, 'macos', e.target.value)}
                    theme={theme}
                    placeholder="例如：macOS 10.15 或更高版本"
                  />
                </FormField>
                <FormField>
                  <FieldLabel theme={theme}>Linux 系统要求</FieldLabel>
                  <Input
                    type="text"
                    value={app.systemRequirements?.linux || ''}
                    onChange={(e) => handleUpdateSystemRequirement(index, 'linux', e.target.value)}
                    theme={theme}
                    placeholder="例如：Ubuntu 18.04 或兼容发行版"
                  />
                </FormField>
              </PlatformSection>
              </CollapsibleContent>
            </MultiPlatformContainer>
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