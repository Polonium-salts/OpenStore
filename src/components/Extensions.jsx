import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const ExtensionsContainer = styled.div`
  padding: 20px;
  background-color: ${props => props.theme === 'dark' ? '#2a2a2d' : 'white'};
  border-radius: 12px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px ${props => props.theme === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.05)'};
`;

const ExtensionsTitle = styled.h2`
  font-size: 24px;
  margin-bottom: 16px;
  color: ${props => props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f'};
`;

const ExtensionsTabs = styled.div`
  display: flex;
  border-bottom: 1px solid ${props => props.theme === 'dark' ? '#444' : '#e8e8ed'};
  margin-bottom: 20px;
  flex-wrap: wrap;
`;

const Tab = styled.div`
  padding: 10px 20px;
  cursor: pointer;
  color: ${props => props.active ? (props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f') : (props.theme === 'dark' ? '#999' : '#86868b')};
  border-bottom: 2px solid ${props => props.active ? '#0066CC' : 'transparent'};
  transition: color 0.2s, border-color 0.2s;
  font-weight: ${props => props.active ? '600' : 'normal'};
  
  &:hover {
    color: ${props => props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f'};
  }
`;

const EmptyState = styled.div`
  padding: 40px 20px;
  text-align: center;
  color: ${props => props.theme === 'dark' ? '#999' : '#666'};
  font-size: 16px;
`;

const ExtensionContent = styled.div`
  background-color: ${props => props.theme === 'dark' ? '#3a3a3d' : '#f5f5f7'};
  border-radius: 10px;
  padding: 20px;
  min-height: 200px;
`;

// JSON编辑器样式
const JsonEditorContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const EditorWrapper = styled.div`
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px ${props => props.theme === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.05)'};
`;

const EditorHeader = styled.div`
  background-color: ${props => props.theme === 'dark' ? '#2a2a2d' : '#f0f0f0'};
  padding: 10px 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const EditorTitle = styled.div`
  font-weight: 600;
  color: ${props => props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f'};
`;

const EditorControls = styled.div`
  display: flex;
  gap: 8px;
`;

const EditorTextarea = styled.textarea`
  width: 100%;
  min-height: 400px;
  padding: 15px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
  font-size: 14px;
  line-height: 1.5;
  border: none;
  resize: vertical;
  background-color: ${props => props.theme === 'dark' ? '#1e1e1e' : '#ffffff'};
  color: ${props => props.theme === 'dark' ? '#f5f5f7' : '#333'};
  
  &:focus {
    outline: none;
  }
`;

const FileSelector = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
  flex-wrap: wrap;
`;

const FileItem = styled.div`
  background-color: ${props => props.active ? (props.theme === 'dark' ? '#0066CC' : '#e6f2ff') : (props.theme === 'dark' ? '#2a2a2d' : 'white')};
  color: ${props => props.active ? (props.theme === 'dark' ? 'white' : '#0066CC') : (props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f')};
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  box-shadow: 0 1px 3px ${props => props.theme === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.05)'};
  
  &:hover {
    background-color: ${props => props.active ? (props.theme === 'dark' ? '#0066CC' : '#e6f2ff') : (props.theme === 'dark' ? '#3a3a3d' : '#f5f5f7')};
  }
`;

const StatusBar = styled.div`
  padding: 8px 15px;
  background-color: ${props => props.error ? (props.theme === 'dark' ? '#442222' : '#ffeeee') : (props.theme === 'dark' ? '#2a2a2d' : '#f0f0f0')};
  color: ${props => props.error ? '#cc4a48' : (props.theme === 'dark' ? '#bbb' : '#666')};
  font-size: 12px;
  display: flex;
  justify-content: space-between;
`;

const Button = styled.button`
  background-color: ${props => {
    if (props.primary) return '#0066CC';
    if (props.success) return '#28a745';
    if (props.danger) return props.theme === 'dark' ? '#aa3a38' : '#ffdddd';
    return props.theme === 'dark' ? '#444' : '#e0e0e0';
  }};
  color: ${props => {
    if (props.primary || props.success) return 'white';
    if (props.danger) return props.theme === 'dark' ? 'white' : '#aa3a38';
    return props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f';
  }};
  border: none;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: ${props => {
      if (props.primary) return '#0055B3';
      if (props.success) return '#218838';
      if (props.danger) return props.theme === 'dark' ? '#cc4a48' : '#ffcccc';
      return props.theme === 'dark' ? '#555' : '#d0d0d0';
    }};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const FormContainer = styled.div`
  background-color: ${props => props.theme === 'dark' ? '#2a2a2d' : 'white'};
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px ${props => props.theme === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.05)'};
`;

const FormTitle = styled.h3`
  margin-top: 0;
  margin-bottom: 16px;
  font-size: 18px;
  color: ${props => props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f'};
`;

const FormGroup = styled.div`
  margin-bottom: 16px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: ${props => props.theme === 'dark' ? '#bbb' : '#666'};
`;

const Input = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid ${props => props.theme === 'dark' ? '#555' : '#ddd'};
  border-radius: 6px;
  background-color: ${props => props.theme === 'dark' ? '#3a3a3d' : 'white'};
  color: ${props => props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f'};
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: #0066CC;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
`;

const ErrorMessage = styled.div`
  color: #aa3a38;
  font-size: 14px;
  margin-top: 6px;
`;

const TemplateSelector = styled.div`
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const TemplateButton = styled(Button)`
  justify-content: flex-start;
  text-align: left;
`;

const InfoBox = styled.div`
  padding: 15px;
  background-color: ${props => props.theme === 'dark' ? '#2a3054' : '#e6f2ff'};
  border-radius: 8px;
  margin-bottom: 20px;
  color: ${props => props.theme === 'dark' ? '#bbb' : '#444'};
  font-size: 14px;
  line-height: 1.5;
`;

// 无代码编辑器样式
const NoCodeContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FileControls = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const TabContainer = styled.div`
  display: flex;
  border-bottom: 1px solid ${props => props.theme === 'dark' ? '#444' : '#e8e8ed'};
  margin-bottom: 20px;
`;

const EditTab = styled.div`
  padding: 10px 20px;
  cursor: pointer;
  color: ${props => props.active ? (props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f') : (props.theme === 'dark' ? '#999' : '#86868b')};
  border-bottom: 2px solid ${props => props.active ? '#0066CC' : 'transparent'};
  transition: color 0.2s, border-color 0.2s;
  font-weight: ${props => props.active ? '600' : 'normal'};
`;

const ItemsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
`;

const ItemCard = styled.div`
  background-color: ${props => props.theme === 'dark' ? '#2a2a2d' : 'white'};
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 1px 3px ${props => props.theme === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.05)'};
`;

const ItemHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
`;

const ItemTitle = styled.div`
  font-weight: 600;
  font-size: 16px;
  color: ${props => props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f'};
`;

const ItemDetails = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
  margin-bottom: 12px;
  font-size: 14px;
`;

const ItemDetail = styled.div`
  display: flex;
  flex-direction: column;
`;

const DetailLabel = styled.span`
  color: ${props => props.theme === 'dark' ? '#bbb' : '#666'};
  font-size: 12px;
  margin-bottom: 2px;
`;

const DetailValue = styled.span`
  color: ${props => props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f'};
`;

const CardRow = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

const CardTag = styled.span`
  background-color: ${props => props.theme === 'dark' ? '#3a3a3d' : '#f5f5f7'};
  color: ${props => props.theme === 'dark' ? '#bbb' : '#666'};
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
`;

const MetaInfoPanel = styled.div`
  background-color: ${props => props.theme === 'dark' ? '#2a2a2d' : 'white'};
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px ${props => props.theme === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.05)'};
`;

const Extensions = ({ theme = 'light' }) => {
  const [activeTab, setActiveTab] = useState('json-editor');
  
  // JSON编辑器状态
  const [jsonFiles, setJsonFiles] = useState(() => {
    const savedFiles = localStorage.getItem('jsonSourceFiles');
    return savedFiles ? JSON.parse(savedFiles) : [
      { 
        id: 1, 
        name: 'software.json',
        content: JSON.stringify({
          "name": "软件源",
          "version": "1.0",
          "description": "OpenStore软件源",
          "items": [
            {
              "name": "示例软件",
              "version": "1.0.0",
              "description": "这是一个示例软件",
              "downloadUrl": "https://example.com/download/example-app.exe",
              "iconUrl": "https://example.com/icons/example-app.png",
              "category": "software",
              "tags": ["工具", "实用"],
              "author": "OpenStore团队",
              "size": "10MB",
              "releaseDate": "2023-05-15"
            }
          ]
        }, null, 2)
      },
      {
        id: 2,
        name: 'games.json',
        content: JSON.stringify({
          "name": "游戏源",
          "version": "1.0",
          "description": "OpenStore游戏源",
          "items": [
            {
              "name": "示例游戏",
              "version": "1.2.3",
              "description": "这是一个示例游戏",
              "downloadUrl": "https://example.com/download/example-game.exe",
              "iconUrl": "https://example.com/icons/example-game.png",
              "category": "game",
              "tags": ["休闲", "策略"],
              "author": "OpenStore游戏团队",
              "size": "2GB",
              "releaseDate": "2023-06-20"
            }
          ]
        }, null, 2)
      },
      {
        id: 3,
        name: 'llm.json',
        content: JSON.stringify({
          "name": "大语言模型源",
          "version": "1.0",
          "description": "OpenStore大语言模型源",
          "items": [
            {
              "name": "示例LLM",
              "version": "2.0",
              "description": "这是一个示例大语言模型",
              "downloadUrl": "https://example.com/download/example-llm.zip",
              "iconUrl": "https://example.com/icons/example-llm.png",
              "category": "llm",
              "tags": ["AI", "文本生成"],
              "author": "OpenStore AI团队",
              "size": "5GB",
              "releaseDate": "2023-07-10",
              "requirements": {
                "ram": "16GB",
                "gpu": "NVIDIA RTX 3060 或更高"
              }
            }
          ]
        }, null, 2)
      }
    ];
  });
  
  const [activeFileId, setActiveFileId] = useState(1);
  const [activeEditTab, setActiveEditTab] = useState('items');
  const [activeFile, setActiveFile] = useState(null);
  const [parsedData, setParsedData] = useState({ name: '', version: '', description: '', items: [] });
  const [showAddItemForm, setShowAddItemForm] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [formData, setFormData] = useState({ name: '' });
  const [itemFormData, setItemFormData] = useState({
    name: '',
    version: '',
    description: '',
    downloadUrl: '',
    iconUrl: '',
    category: 'software',
    tags: '',
    author: '',
    size: '',
    releaseDate: ''
  });
  const [editingFileId, setEditingFileId] = useState(null);
  const [syncStatus, setSyncStatus] = useState('');
  const [jsonError, setJsonError] = useState('');
  
  // 保存JSON文件到本地存储
  useEffect(() => {
    localStorage.setItem('jsonSourceFiles', JSON.stringify(jsonFiles));
    
    // 触发同步到首页
    try {
      window.dispatchEvent(new CustomEvent('source-updated', { 
        detail: { sources: jsonFiles } 
      }));
      setSyncStatus('源文件已同步到应用');
      setTimeout(() => setSyncStatus(''), 3000);
    } catch (err) {
      console.error('同步源文件失败', err);
    }
  }, [jsonFiles]);
  
  // 当活动文件变化时更新内容
  useEffect(() => {
    const currentFile = jsonFiles.find(file => file.id === activeFileId);
    if (currentFile) {
      setActiveFile(currentFile);
      try {
        const parsed = JSON.parse(currentFile.content);
        // 确保items属性一定是数组
        if (!Array.isArray(parsed.items)) {
          parsed.items = [];
        }
        setParsedData(parsed);
        setJsonError('');
      } catch (err) {
        setJsonError(`JSON格式错误: ${err.message}`);
        setParsedData({ name: '', version: '', description: '', items: [] });
      }
    }
  }, [activeFileId, jsonFiles]);
  
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };
  
  const handleEditTabChange = (tab) => {
    setActiveEditTab(tab);
  };
  
  // 文件处理函数
  const handleFileSelect = (id) => {
    setActiveFileId(id);
  };
  
  const addNewFile = () => {
    setFormData({ name: '' });
    setShowAddForm(true);
  };
  
  const handleEditFile = () => {
    if (activeFile) {
      setFormData({ 
        name: activeFile.name,
        description: parsedData.description || '',
        name_meta: parsedData.name || '',
        version: parsedData.version || ''
      });
      setEditingFileId(activeFile.id);
      setShowEditForm(true);
    }
  };
  
  const deleteFile = () => {
    if (jsonFiles.length <= 1) {
      setJsonError('至少保留一个源文件');
      return;
    }
    
    const newFiles = jsonFiles.filter(file => file.id !== activeFileId);
    setJsonFiles(newFiles);
    setActiveFileId(newFiles[0]?.id || 0);
  };
  
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleItemFormChange = (e) => {
    const { name, value } = e.target;
    setItemFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleFormSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setJsonError('文件名不能为空');
      return;
    }
    
    try {
      if (showAddForm) {
        // 根据文件名确定类别
        let category = 'software';
        if (formData.name.toLowerCase().includes('game')) {
          category = 'game';
        } else if (formData.name.toLowerCase().includes('llm')) {
          category = 'llm';
        }
        
        // 创建新文件内容
        const newFileContent = {
          name: formData.name_meta || `${formData.name.split('.')[0]}源`,
          version: formData.version || "1.0",
          description: formData.description || `OpenStore${category === 'game' ? '游戏' : category === 'llm' ? '大语言模型' : '软件'}源`,
          items: []
        };
        
        // 添加新文件
        const newId = Math.max(0, ...jsonFiles.map(f => f.id)) + 1;
        const newFile = { 
          id: newId, 
          name: formData.name.endsWith('.json') ? formData.name : `${formData.name}.json`,
          content: JSON.stringify(newFileContent, null, 2)
        };
        setJsonFiles([...jsonFiles, newFile]);
        setActiveFileId(newId);
      } else if (showEditForm) {
        // 更新文件元数据
        const updatedContent = {
          ...parsedData,
          name: formData.name_meta || parsedData.name,
          version: formData.version || parsedData.version,
          description: formData.description || parsedData.description
        };
        
        // 更新文件
        setJsonFiles(prevFiles => 
          prevFiles.map(file => 
            file.id === editingFileId ? {
              ...file,
              name: formData.name.endsWith('.json') ? formData.name : `${formData.name}.json`,
              content: JSON.stringify(updatedContent, null, 2)
            } : file
          )
        );
      }
      
      setShowAddForm(false);
      setShowEditForm(false);
      setJsonError('');
    } catch (err) {
      setJsonError(`操作失败: ${err.message}`);
    }
  };
  
  const handleItemFormSubmit = (e) => {
    e.preventDefault();
    
    if (!itemFormData.name.trim()) {
      setJsonError('项目名称不能为空');
      return;
    }
    
    if (!itemFormData.downloadUrl.trim()) {
      setJsonError('下载链接不能为空');
      return;
    }
    
    try {
      // 处理标签
      const tags = itemFormData.tags.split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
      
      // 创建项目对象
      const itemObj = {
        name: itemFormData.name,
        version: itemFormData.version,
        description: itemFormData.description,
        downloadUrl: itemFormData.downloadUrl,
        iconUrl: itemFormData.iconUrl,
        category: itemFormData.category,
        tags: tags,
        author: itemFormData.author,
        size: itemFormData.size,
        releaseDate: itemFormData.releaseDate
      };
      
      // 添加或更新项目
      // 确保parsedData.items是数组
      const items = Array.isArray(parsedData.items) ? parsedData.items : [];
      let updatedItems = [...items];
      
      if (editingItemIndex !== null) {
        // 更新现有项目
        updatedItems[editingItemIndex] = itemObj;
      } else {
        // 添加新项目
        updatedItems.push(itemObj);
      }
      
      // 更新文件内容
      const updatedContent = {
        ...parsedData,
        items: updatedItems
      };
      
      // 保存回文件
      setJsonFiles(prevFiles => 
        prevFiles.map(file => 
          file.id === activeFileId ? {
            ...file,
            content: JSON.stringify(updatedContent, null, 2)
          } : file
        )
      );
      
      setShowAddItemForm(false);
      setEditingItemIndex(null);
      
      // 重置表单
      setItemFormData({
        name: '',
        version: '',
        description: '',
        downloadUrl: '',
        iconUrl: '',
        category: 'software',
        tags: '',
        author: '',
        size: '',
        releaseDate: ''
      });
      
    } catch (err) {
      setJsonError(`操作失败: ${err.message}`);
    }
  };
  
  const handleCancelForm = () => {
    setShowAddForm(false);
    setShowEditForm(false);
    setJsonError('');
  };
  
  const handleCancelItemForm = () => {
    setShowAddItemForm(false);
    setEditingItemIndex(null);
    setJsonError('');
  };
  
  const handleAddItem = () => {
    // 根据当前文件名设置默认分类
    let defaultCategory = 'software';
    if (activeFile.name.toLowerCase().includes('game')) {
      defaultCategory = 'game';
    } else if (activeFile.name.toLowerCase().includes('llm')) {
      defaultCategory = 'llm';
    }
    
    setItemFormData({
      name: '',
      version: '',
      description: '',
      downloadUrl: '',
      iconUrl: '',
      category: defaultCategory,
      tags: '',
      author: '',
      size: '',
      releaseDate: ''
    });
    
    setShowAddItemForm(true);
    setEditingItemIndex(null);
  };
  
  const handleEditItem = (index) => {
    const item = parsedData.items[index];
    
    setItemFormData({
      name: item.name || '',
      version: item.version || '',
      description: item.description || '',
      downloadUrl: item.downloadUrl || '',
      iconUrl: item.iconUrl || '',
      category: item.category || 'software',
      tags: item.tags ? item.tags.join(', ') : '',
      author: item.author || '',
      size: item.size || '',
      releaseDate: item.releaseDate || ''
    });
    
    setShowAddItemForm(true);
    setEditingItemIndex(index);
  };
  
  const handleDeleteItem = (index) => {
    // 确保parsedData.items是数组
    const items = Array.isArray(parsedData.items) ? parsedData.items : [];
    const updatedItems = [...items];
    updatedItems.splice(index, 1);
    
    // 更新文件内容
    const updatedContent = {
      ...parsedData,
      items: updatedItems
    };
    
    // 保存回文件
    setJsonFiles(prevFiles => 
      prevFiles.map(file => 
        file.id === activeFileId ? {
          ...file,
          content: JSON.stringify(updatedContent, null, 2)
        } : file
      )
    );
  };
  
  // 从下载链接自动填写信息
  const autoFillFromUrl = (url) => {
    if (!url.trim()) return;
    
    try {
      // 提取文件名
      let fileName = '';
      
      // 尝试从URL路径获取文件名
      if (url.includes('/')) {
        const urlParts = url.split('/');
        fileName = urlParts[urlParts.length - 1];
        
        // 处理可能包含的查询参数
        if (fileName.includes('?')) {
          fileName = fileName.split('?')[0];
        }
      }
      
      // 如果无法从URL获取文件名，使用域名作为基础
      if (!fileName && url.includes('://')) {
        const domain = new URL(url).hostname;
        fileName = domain.split('.')[0] + '-app';
      }
      
      // 提取不带扩展名的文件名和扩展名
      let nameWithoutExt = fileName;
      let ext = '';
      if (fileName.includes('.')) {
        const parts = fileName.split('.');
        ext = parts[parts.length - 1].toLowerCase();
        nameWithoutExt = parts.slice(0, parts.length - 1).join('.');
      }
      
      // 清理文件名（移除破折号、下划线并将首字母大写）
      const cleanName = nameWithoutExt
        .replace(/[-_]/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      // 尝试提取版本号（常见格式如 name-1.0.0.exe 或 name_v1.2.3.zip）
      let version = '';
      const versionRegex = /[vV]?(\d+\.\d+(\.\d+)?)/;
      const versionMatch = nameWithoutExt.match(versionRegex);
      if (versionMatch) {
        version = versionMatch[1];
        // 移除版本号，使名称更干净
        nameWithoutExt = nameWithoutExt.replace(versionRegex, '').replace(/[-_]\s*$/, '');
      }
      
      // 根据文件扩展名猜测分类
      let category = 'software';
      if (['exe', 'msi', 'dmg', 'deb', 'rpm', 'appimage'].includes(ext)) {
        category = 'software';
      } else if (['apk', 'ipa'].includes(ext)) {
        category = 'mobile';
      } else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext) && nameWithoutExt.toLowerCase().includes('model')) {
        category = 'llm';
      } else if (['zip', 'rar', '7z'].includes(ext) && (
        nameWithoutExt.toLowerCase().includes('game') || 
        nameWithoutExt.toLowerCase().includes('play')
      )) {
        category = 'game';
      }
      
      // 从域名猜测开发者/作者
      let author = '';
      if (url.includes('://')) {
        const domain = new URL(url).hostname;
        const domainParts = domain.split('.');
        if (domainParts.length >= 2) {
          author = domainParts[domainParts.length - 2].charAt(0).toUpperCase() + 
                  domainParts[domainParts.length - 2].slice(1);
        }
      }
      
      // 更新表单数据
      setItemFormData(prev => {
        // 只更新空字段，已有数据不覆盖
        const newData = { ...prev };
        
        if (!newData.name) newData.name = cleanName || '新项目';
        if (!newData.version && version) newData.version = version;
        if (!newData.category && category) newData.category = category;
        if (!newData.author && author) newData.author = author;
        
        // 额外信息的推断
        if (!newData.tags) {
          const tags = [];
          if (ext) tags.push(ext.toUpperCase());
          if (category === 'software') tags.push('应用');
          else if (category === 'game') tags.push('游戏');
          else if (category === 'llm') tags.push('AI模型');
          newData.tags = tags.join(', ');
        }
        
        return newData;
      });
      
      setJsonError('');
    } catch (err) {
      console.log('自动填充失败:', err);
      // 不显示错误，静默失败
    }
  };
  
  // 导出当前文件
  const exportFile = () => {
    const currentFile = jsonFiles.find(file => file.id === activeFileId);
    if (!currentFile) return;
    
    const blob = new Blob([currentFile.content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFile.name;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  // 导入文件
  const importFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target.result;
        // 验证JSON
        JSON.parse(content);
        
        const newId = Math.max(0, ...jsonFiles.map(f => f.id)) + 1;
        const newFile = { 
          id: newId, 
          name: file.name,
          content: content
        };
        setJsonFiles([...jsonFiles, newFile]);
        setActiveFileId(newId);
      } catch (err) {
        setJsonError(`导入失败: ${err.message}`);
      }
    };
    reader.readAsText(file);
    // 清空input以允许再次导入相同文件
    e.target.value = '';
  };
  
  // 无代码源编辑器
  const renderNoCodeEditor = () => (
    <NoCodeContainer>
      <InfoBox theme={theme}>
        <strong>软件源文件说明：</strong><br />
        源文件用于定义软件、游戏或大语言模型信息。系统会自动读取这些文件并在首页相应分类中显示条目。<br />
        每个条目必须包含：名称、版本、描述、下载链接、图标链接和分类。<br />
        分类值必须为：software (软件)、game (游戏) 或 llm (大语言模型)。
        {syncStatus && <div style={{ marginTop: '10px', color: '#28a745' }}>{syncStatus}</div>}
      </InfoBox>
      
      {/* 文件创建/编辑表单 */}
      {(showAddForm || showEditForm) && (
        <FormContainer theme={theme}>
          <FormTitle theme={theme}>{showAddForm ? '新建源文件' : '编辑源文件属性'}</FormTitle>
          <form onSubmit={handleFormSubmit}>
            <FormGroup>
              <Label theme={theme}>文件名</Label>
              <Input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                placeholder="software.json"
                theme={theme}
              />
            </FormGroup>
            
            <FormGroup>
              <Label theme={theme}>源名称</Label>
              <Input
                type="text"
                name="name_meta"
                value={formData.name_meta || ''}
                onChange={handleFormChange}
                placeholder="软件源"
                theme={theme}
              />
            </FormGroup>
            
            <FormGroup>
              <Label theme={theme}>版本</Label>
              <Input
                type="text"
                name="version"
                value={formData.version || ''}
                onChange={handleFormChange}
                placeholder="1.0"
                theme={theme}
              />
            </FormGroup>
            
            <FormGroup>
              <Label theme={theme}>描述</Label>
              <Input
                type="text"
                name="description"
                value={formData.description || ''}
                onChange={handleFormChange}
                placeholder="OpenStore软件源"
                theme={theme}
              />
            </FormGroup>
            
            {jsonError && <ErrorMessage>{jsonError}</ErrorMessage>}
            
            <ButtonGroup>
              <Button 
                type="button" 
                onClick={handleCancelForm}
                theme={theme}
              >
                取消
              </Button>
              <Button 
                type="submit" 
                primary
              >
                确定
              </Button>
            </ButtonGroup>
          </form>
        </FormContainer>
      )}
      
      {/* 项目添加/编辑表单 */}
      {showAddItemForm && (
        <FormContainer theme={theme}>
          <FormTitle theme={theme}>{editingItemIndex !== null ? '编辑项目' : '添加新项目'}</FormTitle>
          <form onSubmit={handleItemFormSubmit}>
            <FormGroup>
              <Label theme={theme}>名称 *</Label>
              <Input
                type="text"
                name="name"
                value={itemFormData.name}
                onChange={handleItemFormChange}
                placeholder="项目名称"
                theme={theme}
                required
              />
            </FormGroup>
            
            <FormGroup>
              <Label theme={theme}>版本</Label>
              <Input
                type="text"
                name="version"
                value={itemFormData.version}
                onChange={handleItemFormChange}
                placeholder="1.0.0"
                theme={theme}
              />
            </FormGroup>
            
            <FormGroup>
              <Label theme={theme}>描述</Label>
              <Input
                type="text"
                name="description"
                value={itemFormData.description}
                onChange={handleItemFormChange}
                placeholder="项目描述"
                theme={theme}
              />
            </FormGroup>
            
            <FormGroup>
              <Label theme={theme}>下载链接 *</Label>
              <Input
                type="text"
                name="downloadUrl"
                value={itemFormData.downloadUrl}
                onChange={handleItemFormChange}
                onBlur={(e) => autoFillFromUrl(e.target.value)}
                placeholder="https://example.com/download/app.exe"
                theme={theme}
                required
              />
              <div style={{ 
                fontSize: '12px', 
                color: theme === 'dark' ? '#999' : '#888',
                marginTop: '4px' 
              }}>
                输入下载链接后移开焦点，将自动提取名称和版本
              </div>
            </FormGroup>
            
            <FormGroup>
              <Label theme={theme}>图标链接</Label>
              <Input
                type="text"
                name="iconUrl"
                value={itemFormData.iconUrl}
                onChange={handleItemFormChange}
                placeholder="https://example.com/icons/app.png"
                theme={theme}
              />
            </FormGroup>
            
            <FormGroup>
              <Label theme={theme}>分类</Label>
              <select
                name="category"
                value={itemFormData.category}
                onChange={handleItemFormChange}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`,
                  backgroundColor: theme === 'dark' ? '#3a3a3d' : 'white',
                  color: theme === 'dark' ? '#f5f5f7' : '#1d1d1f'
                }}
              >
                <option value="software">软件</option>
                <option value="game">游戏</option>
                <option value="llm">大语言模型</option>
              </select>
            </FormGroup>
            
            <FormGroup>
              <Label theme={theme}>标签 (用逗号分隔)</Label>
              <Input
                type="text"
                name="tags"
                value={itemFormData.tags}
                onChange={handleItemFormChange}
                placeholder="标签1, 标签2, 标签3"
                theme={theme}
              />
            </FormGroup>
            
            <FormGroup>
              <Label theme={theme}>作者/开发者</Label>
              <Input
                type="text"
                name="author"
                value={itemFormData.author}
                onChange={handleItemFormChange}
                placeholder="作者或开发者名称"
                theme={theme}
              />
            </FormGroup>
            
            <FormGroup>
              <Label theme={theme}>大小</Label>
              <Input
                type="text"
                name="size"
                value={itemFormData.size}
                onChange={handleItemFormChange}
                placeholder="10MB"
                theme={theme}
              />
            </FormGroup>
            
            <FormGroup>
              <Label theme={theme}>发布日期</Label>
              <Input
                type="text"
                name="releaseDate"
                value={itemFormData.releaseDate}
                onChange={handleItemFormChange}
                placeholder="YYYY-MM-DD"
                theme={theme}
              />
            </FormGroup>
            
            {jsonError && <ErrorMessage>{jsonError}</ErrorMessage>}
            
            <ButtonGroup>
              <Button 
                type="button" 
                onClick={handleCancelItemForm}
                theme={theme}
              >
                取消
              </Button>
              <Button 
                type="submit" 
                primary
              >
                保存
              </Button>
            </ButtonGroup>
          </form>
        </FormContainer>
      )}
      
      {/* 文件操作按钮 */}
      <FileControls>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button 
            theme={theme} 
            primary 
            onClick={addNewFile}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
            新建源文件
          </Button>
          
          <label>
            <input
              type="file"
              accept=".json"
              onChange={importFile}
              style={{ display: 'none' }}
            />
            <Button 
              as="span"
              theme={theme}
            >
              导入文件
            </Button>
          </label>
        </div>
        
        <Button 
          theme={theme}
          success
          onClick={exportFile}
        >
          导出当前文件
        </Button>
      </FileControls>
      
      {/* 文件选择器 */}
      <FileSelector>
        {jsonFiles.map(file => (
          <FileItem 
            key={file.id} 
            active={file.id === activeFileId}
            theme={theme}
            onClick={() => handleFileSelect(file.id)}
          >
            {file.name}
          </FileItem>
        ))}
      </FileSelector>
      
      {/* 编辑视图 */}
      <EditorWrapper>
        <EditorHeader theme={theme}>
          <EditorTitle theme={theme}>
            {activeFile?.name || '未命名.json'}
          </EditorTitle>
          <EditorControls>
            <Button 
              theme={theme} 
              onClick={handleEditFile}
              title="编辑源信息"
            >
              编辑源信息
            </Button>
            <Button 
              theme={theme} 
              danger
              onClick={deleteFile}
              title="删除文件"
            >
              删除
            </Button>
          </EditorControls>
        </EditorHeader>
        
        {/* 编辑标签页 */}
        <TabContainer theme={theme}>
          <EditTab 
            theme={theme} 
            active={activeEditTab === 'items'} 
            onClick={() => handleEditTabChange('items')}
          >
            项目列表
          </EditTab>
          <EditTab 
            theme={theme} 
            active={activeEditTab === 'info'} 
            onClick={() => handleEditTabChange('info')}
          >
            源信息
          </EditTab>
        </TabContainer>
        
        {/* 标签页内容 */}
        {activeEditTab === 'info' ? (
          // 源信息面板
          <MetaInfoPanel theme={theme}>
            <ItemDetails>
              <ItemDetail>
                <DetailLabel theme={theme}>名称</DetailLabel>
                <DetailValue theme={theme}>{parsedData.name || '未命名'}</DetailValue>
              </ItemDetail>
              <ItemDetail>
                <DetailLabel theme={theme}>版本</DetailLabel>
                <DetailValue theme={theme}>{parsedData.version || '1.0'}</DetailValue>
              </ItemDetail>
              <ItemDetail>
                <DetailLabel theme={theme}>描述</DetailLabel>
                <DetailValue theme={theme}>{parsedData.description || '无描述'}</DetailValue>
              </ItemDetail>
              <ItemDetail>
                <DetailLabel theme={theme}>项目数量</DetailLabel>
                <DetailValue theme={theme}>{parsedData.items?.length || 0} 个</DetailValue>
              </ItemDetail>
            </ItemDetails>
            <Button 
              theme={theme} 
              onClick={handleEditFile}
            >
              编辑源信息
            </Button>
          </MetaInfoPanel>
        ) : (
          // 项目列表
          <>
            <div style={{ marginBottom: '16px' }}>
              <Button 
                theme={theme} 
                primary 
                onClick={handleAddItem}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
                添加新项目
              </Button>
            </div>
            
            <ItemsContainer>
              {Array.isArray(parsedData.items) && parsedData.items.length > 0 ? (
                parsedData.items.map((item, index) => (
                  <ItemCard key={index} theme={theme}>
                    <ItemHeader>
                      <ItemTitle theme={theme}>{item.name || '未命名项目'}</ItemTitle>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Button 
                          theme={theme} 
                          onClick={() => handleEditItem(index)}
                        >
                          编辑
                        </Button>
                        <Button 
                          theme={theme} 
                          danger
                          onClick={() => handleDeleteItem(index)}
                        >
                          删除
                        </Button>
                      </div>
                    </ItemHeader>
                    
                    <ItemDetails>
                      <ItemDetail>
                        <DetailLabel theme={theme}>版本</DetailLabel>
                        <DetailValue theme={theme}>{item.version || '无版本号'}</DetailValue>
                      </ItemDetail>
                      <ItemDetail>
                        <DetailLabel theme={theme}>分类</DetailLabel>
                        <DetailValue theme={theme}>
                          {item.category === 'software' ? '软件' : 
                           item.category === 'game' ? '游戏' : 
                           item.category === 'llm' ? '大语言模型' : 
                           item.category}
                        </DetailValue>
                      </ItemDetail>
                      <ItemDetail>
                        <DetailLabel theme={theme}>作者</DetailLabel>
                        <DetailValue theme={theme}>{item.author || '未知'}</DetailValue>
                      </ItemDetail>
                      <ItemDetail>
                        <DetailLabel theme={theme}>大小</DetailLabel>
                        <DetailValue theme={theme}>{item.size || '未知'}</DetailValue>
                      </ItemDetail>
                    </ItemDetails>
                    
                    <ItemDetail style={{ marginBottom: '10px' }}>
                      <DetailLabel theme={theme}>描述</DetailLabel>
                      <DetailValue theme={theme}>{item.description || '无描述'}</DetailValue>
                    </ItemDetail>
                    
                    <ItemDetail style={{ marginBottom: '10px' }}>
                      <DetailLabel theme={theme}>下载链接</DetailLabel>
                      <DetailValue theme={theme} style={{ wordBreak: 'break-all' }}>
                        {item.downloadUrl || '无下载链接'}
                      </DetailValue>
                    </ItemDetail>
                    
                    {item.tags?.length > 0 && (
                      <div>
                        <DetailLabel theme={theme}>标签</DetailLabel>
                        <CardRow>
                          {item.tags.map((tag, i) => (
                            <CardTag key={i} theme={theme}>{tag}</CardTag>
                          ))}
                        </CardRow>
                      </div>
                    )}
                  </ItemCard>
                ))
              ) : (
                <EmptyState theme={theme}>
                  暂无项目。点击"添加新项目"按钮来添加。
                </EmptyState>
              )}
            </ItemsContainer>
          </>
        )}
        
        {jsonError && (
          <StatusBar theme={theme} error={true}>
            {jsonError}
          </StatusBar>
        )}
      </EditorWrapper>
    </NoCodeContainer>
  );
    
  return (
    <ExtensionsContainer theme={theme}>
      <ExtensionsTitle theme={theme}>扩展功能</ExtensionsTitle>
      
      <ExtensionsTabs theme={theme}>
        <Tab 
          theme={theme} 
          active={activeTab === 'welcome'} 
          onClick={() => handleTabChange('welcome')}
        >
          欢迎
        </Tab>
        <Tab 
          theme={theme} 
          active={activeTab === 'json-editor'} 
          onClick={() => handleTabChange('json-editor')}
        >
          软件源管理器
        </Tab>
      </ExtensionsTabs>
      
      <ExtensionContent theme={theme}>
        {activeTab === 'json-editor' ? renderNoCodeEditor() : (
          <EmptyState theme={theme}>
            欢迎使用OpenStore扩展功能！<br /><br />
            请选择"软件源管理器"标签页来管理软件源文件。
          </EmptyState>
        )}
      </ExtensionContent>
    </ExtensionsContainer>
  );
};

export default Extensions; 