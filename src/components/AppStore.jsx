import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Sidebar from './Sidebar';
import Header from './Header';
import FeaturedApps from './FeaturedApps';
import AppGrid from './AppGrid';
import Settings from './Settings';
import Extensions from './Extensions';
import SourceInfo from './SourceInfo';
import { featuredApps, topApps, newApps, workApps, gameApps, aiApps } from '../data/mockApps';
import { toast } from 'react-hot-toast';

const StoreContainer = styled.div`
  display: flex;
  height: 100vh;
  overflow: hidden;
  max-width: 1600px; 
  margin: 0 auto;
  width: 100%;
  background-color: ${props => props.theme === 'dark' ? '#1a1a1a' : 'white'};
  color: ${props => props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f'};
  transition: background-color 0.3s ease, color 0.3s ease;
`;

const MainContent = styled.div`
  flex: 1;
  overflow-y: auto;
  background-color: ${props => props.theme === 'dark' ? '#1a1a1a' : 'white'};
  transition: background-color 0.3s ease;
`;

const ContentArea = styled.div`
  padding: 12px 20px;
  max-width: 1400px;
  margin: 0 auto;
`;

// SourceConfig component to manage software sources
const SourceConfig = styled.div`
  padding: 20px;
  background-color: ${props => props.theme === 'dark' ? '#2a2a2d' : 'white'};
  border-radius: 12px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px ${props => props.theme === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.05)'};
`;

const SourceTitle = styled.h2`
  font-size: 24px;
  margin-bottom: 16px;
  color: ${props => props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f'};
`;

const SourceList = styled.div`
  margin-bottom: 20px;
`;

const SourceItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  background-color: ${props => props.theme === 'dark' ? '#3a3a3d' : '#f5f5f7'};
  margin-bottom: 8px;
`;

const SourceName = styled.div`
  font-weight: 500;
`;

const SourceUrl = styled.div`
  color: ${props => props.theme === 'dark' ? '#999' : '#666'};
  font-size: 14px;
`;

const SourceControls = styled.div`
  display: flex;
  gap: 8px;
`;

const SourceButton = styled.button`
  background-color: ${props => props.theme === 'dark' ? '#444' : '#e0e0e0'};
  color: ${props => props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f'};
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: ${props => props.theme === 'dark' ? '#555' : '#d0d0d0'};
  }
  
  &.delete {
    background-color: ${props => props.theme === 'dark' ? '#aa3a38' : '#ffdddd'};
    color: ${props => props.theme === 'dark' ? '#fff' : '#aa3a38'};
    
    &:hover {
      background-color: ${props => props.theme === 'dark' ? '#cc4a48' : '#ffcccc'};
    }
  }
`;

const AddSourceForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 12px;
  background-color: ${props => props.theme === 'dark' ? '#3a3a3d' : '#f5f5f7'};
  padding: 16px;
  border-radius: 8px;
`;

const FormTitle = styled.h3`
  font-size: 18px;
  margin-bottom: 8px;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const InputLabel = styled.label`
  font-size: 14px;
  color: ${props => props.theme === 'dark' ? '#bbb' : '#666'};
`;

const Input = styled.input`
  padding: 10px;
  border-radius: 6px;
  border: 1px solid ${props => props.theme === 'dark' ? '#555' : '#ddd'};
  background-color: ${props => props.theme === 'dark' ? '#2a2a2d' : 'white'};
  color: ${props => props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f'};
  
  &:focus {
    outline: none;
    border-color: #0066CC;
  }
`;

const FormActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
`;

const AppStore = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentCategory, setCurrentCategory] = useState('dev-tools');
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'light';
  });
  const [language, setLanguage] = useState(() => {
    const savedLanguage = localStorage.getItem('language');
    return savedLanguage || 'zh';
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    return savedState ? JSON.parse(savedState) : false;
  });
  
  // 设置状态
  const [animation, setAnimation] = useState(() => {
    const savedSetting = localStorage.getItem('animation');
    return savedSetting ? JSON.parse(savedSetting) : true;
  });
  const [downloadLocation, setDownloadLocation] = useState(() => {
    const savedSetting = localStorage.getItem('downloadLocation');
    return savedSetting || '/Downloads';
  });
  const [autoUpdate, setAutoUpdate] = useState(() => {
    const savedSetting = localStorage.getItem('autoUpdate');
    return savedSetting ? JSON.parse(savedSetting) : true;
  });
  const [wifiOnlyUpdate, setWifiOnlyUpdate] = useState(() => {
    const savedSetting = localStorage.getItem('wifiOnlyUpdate');
    return savedSetting ? JSON.parse(savedSetting) : true;
  });
  const [hardwareAcceleration, setHardwareAcceleration] = useState(() => {
    const savedSetting = localStorage.getItem('hardwareAcceleration');
    return savedSetting ? JSON.parse(savedSetting) : true;
  });
  const [sendUsageStats, setSendUsageStats] = useState(() => {
    const savedSetting = localStorage.getItem('sendUsageStats');
    return savedSetting ? JSON.parse(savedSetting) : true;
  });
  
  // 软件源相关状态
  const [sources, setSources] = useState(() => {
    const savedSources = localStorage.getItem('softwareSources');
    return savedSources ? JSON.parse(savedSources) : [
      { id: 1, name: '官方源', url: 'https://repo.openstore.com/official', enabled: true },
      { id: 2, name: '国内镜像', url: 'https://mirror.openstore.com/cn', enabled: true }
    ];
  });
  const [jsonSources, setJsonSources] = useState(() => {
    const savedJsonSources = localStorage.getItem('jsonSources');
    return savedJsonSources ? JSON.parse(savedJsonSources) : [];
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSource, setNewSource] = useState({ name: '', url: '', enabled: true });
  const [editingSource, setEditingSource] = useState(null);

  // 当设置更改时保存到本地存储
  useEffect(() => {
    localStorage.setItem('theme', theme);
    localStorage.setItem('language', language);
    localStorage.setItem('sidebarCollapsed', JSON.stringify(sidebarCollapsed));
    localStorage.setItem('animation', JSON.stringify(animation));
    localStorage.setItem('downloadLocation', downloadLocation);
    localStorage.setItem('autoUpdate', JSON.stringify(autoUpdate));
    localStorage.setItem('wifiOnlyUpdate', JSON.stringify(wifiOnlyUpdate));
    localStorage.setItem('hardwareAcceleration', JSON.stringify(hardwareAcceleration));
    localStorage.setItem('sendUsageStats', JSON.stringify(sendUsageStats));
    localStorage.setItem('softwareSources', JSON.stringify(sources));
    localStorage.setItem('jsonSources', JSON.stringify(jsonSources));
  }, [
    theme, language, sidebarCollapsed, animation, 
    downloadLocation, autoUpdate, wifiOnlyUpdate,
    hardwareAcceleration, sendUsageStats, sources, jsonSources
  ]);

  // 监听软件源编辑器发出的更新事件
  useEffect(() => {
    const handleSourceUpdate = (event) => {
      if (event.detail && event.detail.sources) {
        setJsonSources(event.detail.sources);
      }
    };

    const handleSourceImport = (event) => {
      if (event.detail && event.detail.source) {
        // 从导入的源更新应用显示
        console.log('接收到导入源事件:', event.detail.source);
      }
    };

    window.addEventListener('source-updated', handleSourceUpdate);
    window.addEventListener('source-json-imported', handleSourceImport);

    return () => {
      window.removeEventListener('source-updated', handleSourceUpdate);
      window.removeEventListener('source-json-imported', handleSourceImport);
    };
  }, []);

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const handleCategorySelect = (category) => {
    setCurrentCategory(category);
  };
  
  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    if (newTheme === 'system') {
      const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(isDarkMode ? 'dark' : 'light');
    }
  };
  
  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
  };
  
  const handleSidebarToggle = (collapsed) => {
    setSidebarCollapsed(collapsed);
  };

  // 设置的处理函数
  const handleAnimationChange = (value) => {
    setAnimation(value);
  };
  
  const handleDownloadLocationChange = (value) => {
    setDownloadLocation(value);
  };
  
  const handleAutoUpdateChange = (value) => {
    setAutoUpdate(value);
  };
  
  const handleWifiOnlyUpdateChange = (value) => {
    setWifiOnlyUpdate(value);
  };
  
  const handleHardwareAccelerationChange = (value) => {
    setHardwareAcceleration(value);
  };
  
  const handleSendUsageStatsChange = (value) => {
    setSendUsageStats(value);
  };
  
  const handleClearCache = () => {
    console.log('清除缓存');
  };

  // 软件源相关处理函数
  const handleAddSource = (e) => {
    e.preventDefault();
    if (editingSource) {
      // 更新现有源
      setSources(sources.map(source => 
        source.id === editingSource.id 
          ? { ...newSource, id: source.id } 
          : source
      ));
      setEditingSource(null);
    } else {
      // 添加新源
      const newId = Math.max(0, ...sources.map(s => s.id)) + 1;
      setSources([...sources, { ...newSource, id: newId }]);
    }
    setNewSource({ name: '', url: '', enabled: true });
    setShowAddForm(false);
  };

  const handleDeleteSource = (id) => {
    setSources(sources.filter(source => source.id !== id));
  };

  const handleEditSource = (source) => {
    setNewSource({ ...source });
    setEditingSource(source);
    setShowAddForm(true);
  };

  const handleToggleSource = (id) => {
    setSources(sources.map(source => 
      source.id === id 
        ? { ...source, enabled: !source.enabled } 
        : source
    ));
  };

  const handleCancelAdd = () => {
    setShowAddForm(false);
    setNewSource({ name: '', url: '', enabled: true });
    setEditingSource(null);
  };

  // 导入本地JSON源文件
  const importSourceFromJson = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target.result;
        const jsonData = JSON.parse(content);
        
        // 验证JSON结构，确保包含必要的信息
        if (jsonData.items && Array.isArray(jsonData.items)) {
          // 从JSON文件名或内容提取源名称
          const sourceName = jsonData.name || file.name.replace('.json', '') || '导入的源';
          
          // 从items中提取来源URL
          const sourceUrl = jsonData.items.length > 0 && jsonData.items[0].downloadUrl 
            ? new URL(jsonData.items[0].downloadUrl).origin 
            : 'https://imported.source';
          
          // 创建新源
          const newId = Math.max(0, ...sources.map(s => s.id)) + 1;
          const newSource = {
            id: newId,
            name: sourceName,
            url: sourceUrl,
            enabled: true,
            jsonData: content // 保存完整JSON内容以供应用使用
          };
          
          setSources([...sources, newSource]);
          
          // 通知用户成功导入
          toast.success(`成功导入源：${sourceName}，包含 ${jsonData.items.length} 个项目`);
          
          // 触发事件将JSON数据同步到应用
          window.dispatchEvent(new CustomEvent('source-json-imported', { 
            detail: { source: newSource } 
          }));
        } else {
          toast.error('导入失败：无效的JSON格式，缺少items数组');
        }
      } catch (err) {
        toast.error(`导入失败：${err.message}`);
      }
    };
    reader.readAsText(file);
    // 清空input以允许再次导入相同文件
    e.target.value = '';
  };

  // 根据搜索词过滤应用
  const filterApps = (apps) => {
    if (!searchTerm) return apps;
    
    return apps.filter(app => 
      (app.name && app.name.toLowerCase().includes(searchTerm.toLowerCase())) || 
      (app.description && app.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (app.developer && app.developer.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  // 根据软件源过滤应用
  const getAppsBySource = (apps) => {
    // 获取已启用的软件源
    const enabledSources = sources
      .filter(source => source.enabled)
      .map(source => source.name === '官方源' ? 'official' : 
                     source.name === '国内镜像' ? 'cn-mirror' : 
                     (source.name && source.name.toLowerCase()));
    
    // 根据启用的软件源过滤应用
    return apps.filter(app => app.source && enabledSources.includes(app.source));
  };

  // 获取经过软件源和搜索词过滤的应用列表
  const getFilteredApps = (apps) => {
    // 首先获取常规应用
    const filteredRegularApps = filterApps(getAppsBySource(apps));
    
    // 然后从JSON源获取应用
    const jsonApps = getAppsFromJsonSources();
    
    // 合并并根据搜索词过滤
    return [...filteredRegularApps, ...filterApps(jsonApps)];
  };
  
  // 从JSON源文件获取应用
  const getAppsFromJsonSources = () => {
    // 获取来自JSON源的应用
    const apps = [];
    
    // 获取有效的软件源列表（包括从导入的JSON源文件和标准源）
    const validSources = [
      ...sources.filter(source => source.enabled && source.jsonData), // 从导入的JSON源
      ...jsonSources // 从软件源编辑器
    ];
    
    // 遍历每个源并提取应用
    for (const source of validSources) {
      try {
        // 解析源数据
        let jsonData;
        if (source.jsonData) {
          // 直接从source对象获取JSON数据
          jsonData = JSON.parse(source.jsonData);
        } else if (source.content) {
          // 从jsonSources对象获取JSON数据
          jsonData = JSON.parse(source.content);
        } else {
          continue;
        }
        
        // 确保items存在且是数组
        if (!jsonData.items || !Array.isArray(jsonData.items)) {
          continue;
        }
        
        // 转换items为应用格式
        const sourceApps = jsonData.items.map(item => ({
          id: `${source.id}-${item.name || 'unknown'}`.replace(/\s+/g, '-').toLowerCase(),
          name: item.name || '未命名应用',
          developer: item.author || '未知开发者',
          description: item.description || '',
          version: item.version || '1.0',
          rating: 4.5,
          reviews: 10,
          size: item.size || '未知',
          releaseDate: item.releaseDate || '未知',
          price: 'Free',
          category: item.category || 'software',
          thumbnail: item.iconUrl || 'https://via.placeholder.com/150',
          source: `json-${source.id}`,
          downloadUrl: item.downloadUrl,
          tags: item.tags || []
        }));
        
        apps.push(...sourceApps);
      } catch (error) {
        console.error('解析JSON源文件失败:', error);
      }
    }
    
    return apps;
  };

  const handleSourceChange = (index, field, value) => {
    const newSources = [...sources];
    newSources[index][field] = value;
    setSources(newSources);
  };

  // 导出软件源为JSON文件
  const exportSourceToJson = (source) => {
    try {
      // 如果已有JSON数据，直接使用
      let jsonData;
      if (source.jsonData) {
        jsonData = source.jsonData;
      } else {
        // 创建基本JSON结构
        const jsonObj = {
          name: source.name,
          url: source.url,
          description: `通过OpenStore导出的软件源`,
          version: "1.0",
          items: []
        };
        jsonData = JSON.stringify(jsonObj, null, 2);
      }
      
      // 创建下载链接
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${source.name.replace(/\s+/g, '_')}.json`;
      document.body.appendChild(a);
      a.click();
      
      // 清理
      setTimeout(() => {
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
      
      toast.success(`成功导出软件源：${source.name}`);
    } catch (error) {
      toast.error(`导出失败：${error.message}`);
    }
  };

  // 下载JSON源模板
  const downloadSourceTemplate = async () => {
    try {
      // 从模板文件获取数据
      const response = await fetch('/src/data/sourceTemplate.json');
      const templateData = await response.text();
      
      // 创建下载链接
      const blob = new Blob([templateData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'source_template.json';
      document.body.appendChild(a);
      a.click();
      
      // 清理
      setTimeout(() => {
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
      
      toast.success('成功下载JSON源模板');
    } catch (error) {
      console.error('下载模板失败:', error);
      
      // 如果获取文件失败，直接生成模板
      const template = {
        name: "自定义软件源",
        url: "https://example.com/repo",
        description: "这是一个自定义软件源示例",
        version: "1.0",
        items: [
          {
            name: "示例应用1",
            author: "开发者1",
            description: "这是一个示例应用",
            version: "1.0.0",
            size: "10MB",
            releaseDate: "2024-06-01",
            category: "software",
            iconUrl: "https://via.placeholder.com/150",
            downloadUrl: "https://example.com/repo/app1.zip",
            tags: ["工具", "效率"]
          },
          {
            name: "示例应用2",
            author: "开发者2",
            description: "这是另一个示例应用",
            version: "2.1.0",
            size: "20MB",
            releaseDate: "2024-05-15",
            category: "game",
            iconUrl: "https://via.placeholder.com/150",
            downloadUrl: "https://example.com/repo/app2.zip",
            tags: ["游戏", "休闲"]
          }
        ]
      };
      
      const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'source_template.json';
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
      
      toast.success('成功生成JSON源模板');
    }
  };

  // 根据所选类别渲染内容
  const renderCategoryContent = () => {
    switch (currentCategory) {
      case 'dev-tools':
        return (
          <>
            <AppGrid 
              title="推荐应用" 
              apps={getFilteredApps([...topApps, ...newApps])} 
              theme={theme}
            />
          </>
        );
      case 'software':
        return (
          <>
            <AppGrid 
              title="软件" 
              apps={getFilteredApps([...topApps, ...workApps].filter(app => 
                app.category === 'software'
              ))} 
              theme={theme}
            />
          </>
        );
      case 'games':
        return (
          <>
            <AppGrid title="游戏" apps={getFilteredApps(gameApps)} theme={theme} />
          </>
        );
      case 'ai-models':
        return (
          <>
            <AppGrid title="AI大模型" apps={getFilteredApps(aiApps)} theme={theme} />
          </>
        );
      case 'extensions':
        return <Extensions theme={effectiveTheme} />;
      case 'sources':
        return (
          <SourceConfig theme={theme}>
            <SourceTitle theme={theme}>软件源管理</SourceTitle>
            <div style={{ marginBottom: '15px', color: theme === 'dark' ? '#bbb' : '#666' }}>
              您可以添加、导入和管理软件源。导入JSON源文件可以快速添加自定义软件源及其包含的应用程序。
              <a 
                href="#" 
                onClick={(e) => { e.preventDefault(); downloadSourceTemplate(); }}
                style={{ color: '#0066CC', marginLeft: '6px' }}
              >
                查看源文件格式示例
              </a>
            </div>
            <div style={{ marginBottom: '15px', display: 'flex', gap: '10px' }}>
              <SourceButton 
                theme={theme}
                onClick={() => setShowAddForm(true)}
                style={{backgroundColor: '#0066CC', color: 'white'}}
              >
                添加新软件源
              </SourceButton>
              <label>
                <input
                  type="file"
                  accept=".json"
                  onChange={importSourceFromJson}
                  style={{ display: 'none' }}
                />
                <SourceButton 
                  as="span"
                  theme={theme}
                  style={{backgroundColor: '#28a745', color: 'white'}}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '5px' }}>
                    <path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z"/>
                  </svg>
                  导入JSON源文件
                </SourceButton>
              </label>
              <SourceButton 
                theme={theme}
                onClick={downloadSourceTemplate}
                style={{backgroundColor: '#6c757d', color: 'white'}}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '5px' }}>
                  <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                </svg>
                下载源模板
              </SourceButton>
            </div>
            <SourceList>
              {sources.map(source => (
                <SourceItem key={source.id} theme={theme}>
                  <div>
                    <SourceName>{source.name} {!source.enabled && '(已禁用)'}</SourceName>
                    <SourceUrl theme={theme}>{source.url}</SourceUrl>
                  </div>
                  <SourceControls>
                    <SourceButton 
                      theme={theme}
                      onClick={() => handleToggleSource(source.id)}
                    >
                      {source.enabled ? '禁用' : '启用'}
                    </SourceButton>
                    <SourceButton 
                      theme={theme}
                      onClick={() => handleEditSource(source)}
                    >
                      编辑
                    </SourceButton>
                    <SourceButton 
                      theme={theme}
                      onClick={() => exportSourceToJson(source)}
                      style={{backgroundColor: '#28a745', color: 'white'}}
                    >
                      导出
                    </SourceButton>
                    <SourceButton 
                      theme={theme}
                      className="delete"
                      onClick={() => handleDeleteSource(source.id)}
                    >
                      删除
                    </SourceButton>
                  </SourceControls>
                </SourceItem>
              ))}
            </SourceList>
            
            {/* 显示导入的JSON源详细信息 */}
            {sources.filter(source => source.jsonData).length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <SourceTitle theme={theme}>已导入的JSON源详情</SourceTitle>
                {sources.filter(source => source.jsonData).map(source => (
                  <SourceInfo key={source.id} source={source} theme={theme} />
                ))}
              </div>
            )}
            
            {showAddForm ? (
              <AddSourceForm theme={theme} onSubmit={handleAddSource}>
                <FormTitle>{editingSource ? '编辑软件源' : '添加新软件源'}</FormTitle>
                <InputGroup>
                  <InputLabel theme={theme}>名称</InputLabel>
                  <Input 
                    theme={theme}
                    type="text" 
                    value={newSource.name}
                    onChange={(e) => setNewSource({...newSource, name: e.target.value})}
                    required
                  />
                </InputGroup>
                <InputGroup>
                  <InputLabel theme={theme}>URL</InputLabel>
                  <Input 
                    theme={theme}
                    type="url" 
                    value={newSource.url}
                    onChange={(e) => setNewSource({...newSource, url: e.target.value})}
                    required
                  />
                </InputGroup>
                <FormActions>
                  <SourceButton 
                    theme={theme}
                    type="button"
                    onClick={handleCancelAdd}
                  >
                    取消
                  </SourceButton>
                  <SourceButton 
                    theme={theme}
                    type="submit"
                    style={{backgroundColor: '#0066CC', color: 'white'}}
                  >
                    {editingSource ? '更新' : '添加'}
                  </SourceButton>
                </FormActions>
              </AddSourceForm>
            ) : (
              <SourceButton 
                theme={theme}
                onClick={() => setShowAddForm(true)}
                style={{backgroundColor: '#0066CC', color: 'white'}}
              >
                添加新软件源
              </SourceButton>
            )}
          </SourceConfig>
        );
      case 'settings':
        return (
          <Settings 
            theme={theme}
            language={language}
            onThemeChange={handleThemeChange}
            onLanguageChange={handleLanguageChange}
            animation={animation}
            downloadLocation={downloadLocation}
            autoUpdate={autoUpdate}
            wifiOnlyUpdate={wifiOnlyUpdate}
            hardwareAcceleration={hardwareAcceleration}
            sendUsageStats={sendUsageStats}
            onAnimationChange={handleAnimationChange}
            onDownloadLocationChange={handleDownloadLocationChange}
            onAutoUpdateChange={handleAutoUpdateChange}
            onWifiOnlyUpdateChange={handleWifiOnlyUpdateChange}
            onHardwareAccelerationChange={handleHardwareAccelerationChange}
            onSendUsageStatsChange={handleSendUsageStatsChange}
            onClearCache={handleClearCache}
          />
        );
      default:
        return (
          <SourceConfig theme={theme}>
            <SourceTitle theme={theme}>软件源管理</SourceTitle>
            <p>请在侧边栏选择软件源或设置。</p>
          </SourceConfig>
        );
    }
  };

  // 计算实际主题
  const effectiveTheme = theme === 'system' 
    ? (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') 
    : theme;

  return (
    <StoreContainer theme={effectiveTheme}>
      <Sidebar 
        onCategorySelect={handleCategorySelect} 
        currentCategory={currentCategory}
        theme={effectiveTheme}
        collapsed={sidebarCollapsed}
        onToggleCollapse={handleSidebarToggle}
      />
      <MainContent theme={effectiveTheme}>
        <Header 
          onSearch={handleSearch} 
          theme={effectiveTheme}
          language={language}
        />
        <ContentArea>
          {renderCategoryContent()}
        </ContentArea>
      </MainContent>
    </StoreContainer>
  );
};

export default AppStore; 