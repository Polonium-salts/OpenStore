import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import messageService from '../services/messageService';

const MessagesContainer = styled.div`
  padding: 20px;
  height: 100%;
  overflow-y: auto;
`;

const MessagesHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid ${props => props.theme === 'dark' ? '#3a3a3d' : '#e8e8ed'};
`;

const MessagesTitle = styled.h1`
  font-size: 24px;
  font-weight: 600;
  margin: 0;
  color: ${props => props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f'};
`;

const MessagesActions = styled.div`
  display: flex;
  gap: 12px;
`;

const ActionButton = styled.button`
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid ${props => props.theme === 'dark' ? '#3a3a3d' : '#e8e8ed'};
  background-color: ${props => props.theme === 'dark' ? '#2a2a2d' : 'white'};
  color: ${props => props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f'};
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.theme === 'dark' ? '#3a3a3d' : '#f5f5f7'};
  }
  
  &.primary {
    background-color: #0066CC;
    color: white;
    border-color: #0066CC;
    
    &:hover {
      background-color: #0052a3;
    }
  }
`;

const MessagesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const MessageCard = styled.div`
  background-color: ${props => props.theme === 'dark' ? '#2a2a2d' : 'white'};
  border-radius: 12px;
  padding: 16px;
  border: 1px solid ${props => props.theme === 'dark' ? '#3a3a3d' : '#e8e8ed'};
  transition: all 0.2s ease;
  position: relative;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px ${props => props.theme === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)'};
  }
  
  &.unread {
    border-left: 4px solid #0066CC;
  }
`;

const MessageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
`;

const MessageInfo = styled.div`
  flex: 1;
`;

const MessageTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: ${props => props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f'};
`;

const MessageMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: ${props => props.theme === 'dark' ? '#999' : '#666'};
`;

const MessageType = styled.span`
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  background-color: ${props => {
    switch (props.type) {
      case 'system': return '#34c759';
      case 'app_popup': return '#5856d6';
      case 'download': return '#0066CC';
      case 'install': return '#30d158';
      case 'update': return '#ff9500';
      case 'error': return '#ff3b30';
      case 'notification': return '#007aff';
      default: return '#8e8e93';
    }
  }};
  color: white;
`;

const MessageTime = styled.span`
  font-size: 12px;
  color: ${props => props.theme === 'dark' ? '#999' : '#666'};
`;

const MessageContent = styled.div`
  font-size: 14px;
  line-height: 1.5;
  color: ${props => props.theme === 'dark' ? '#bbb' : '#333'};
  margin-bottom: 12px;
`;

const MessageActions = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
`;

const MessageButton = styled.button`
  padding: 6px 12px;
  border-radius: 6px;
  border: none;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &.primary {
    background-color: #0066CC;
    color: white;
    
    &:hover {
      background-color: #0052a3;
    }
  }
  
  &.secondary {
    background-color: ${props => props.theme === 'dark' ? '#3a3a3d' : '#f5f5f7'};
    color: ${props => props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f'};
    
    &:hover {
      background-color: ${props => props.theme === 'dark' ? '#4a4a4d' : '#e8e8ed'};
    }
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: ${props => props.theme === 'dark' ? '#999' : '#666'};
`;

const EmptyIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
`;

const EmptyText = styled.div`
  font-size: 16px;
  margin-bottom: 8px;
`;

const EmptySubtext = styled.div`
  font-size: 14px;
  opacity: 0.7;
`;

const FilterTabs = styled.div`
  display: flex;
  gap: 4px;
  margin-bottom: 20px;
  background-color: ${props => props.theme === 'dark' ? '#1d1d1f' : '#f5f5f7'};
  border-radius: 8px;
  padding: 4px;
`;

const FilterTab = styled.button.withConfig({
  shouldForwardProp: (prop) => !['active'].includes(prop)
})`
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: ${props => props.active ? 
    (props.theme === 'dark' ? '#2a2a2d' : 'white') : 'transparent'};
  color: ${props => props.active ? 
    (props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f') : 
    (props.theme === 'dark' ? '#999' : '#666')};
  
  &:hover {
    background-color: ${props => props.active ? 
      (props.theme === 'dark' ? '#2a2a2d' : 'white') : 
      (props.theme === 'dark' ? '#2a2a2d50' : '#ffffff50')};
  }
`;

const Messages = ({ theme }) => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // 加载消息数据
  const loadMessages = () => {
    try {
      const storedMessages = messageService.getMessages();
      // 确保时间字段是Date对象
      const processedMessages = storedMessages.map(msg => ({
        ...msg,
        time: new Date(msg.time)
      }));
      setMessages(processedMessages);
    } catch (error) {
      console.error('Failed to load messages:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 初始加载
    loadMessages();

    // 监听消息变化
    const unsubscribe = messageService.addListener((event, data) => {
      switch (event) {
        case 'messageAdded':
        case 'messageUpdated':
        case 'messageDeleted':
        case 'allMessagesRead':
        case 'allMessagesCleared':
          loadMessages();
          break;
        default:
          break;
      }
    });

    // 添加一些初始示例消息（仅在没有消息时）
    const existingMessages = messageService.getMessages();
    if (existingMessages.length === 0) {
      messageService.addMessage({
        title: '欢迎使用 OpenStore',
        content: '感谢您使用 OpenStore！这里是您的消息中心，您可以查看系统通知、下载状态和其他重要信息。',
        type: 'system',
        source: 'system',
        actions: [
          { label: '了解更多', type: 'primary', action: 'learn' }
        ]
      });
    }

    return unsubscribe;
  }, []);

  const filteredMessages = useMemo(() => {
    switch (filter) {
      case 'unread':
        return messages.filter(msg => !msg.read);
      case 'system':
        return messages.filter(msg => msg.type === 'system');
      case 'download':
        return messages.filter(msg => msg.type === 'download');
      case 'install':
        return messages.filter(msg => msg.type === 'install');
      case 'app_popup':
        return messages.filter(msg => msg.type === 'app_popup');
      case 'update':
        return messages.filter(msg => msg.type === 'update');
      case 'error':
        return messages.filter(msg => msg.type === 'error');
      case 'notification':
        return messages.filter(msg => msg.type === 'notification');
      default:
        return messages;
    }
  }, [messages, filter]);

  const unreadCount = useMemo(() => {
    return messages.filter(msg => !msg.read).length;
  }, [messages]);

  const formatTime = (time) => {
    const now = new Date();
    const diff = now - time;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `${minutes}分钟前`;
    } else if (hours < 24) {
      return `${hours}小时前`;
    } else {
      return `${days}天前`;
    }
  };

  const handleMessageAction = (messageId, action) => {
    console.log(`执行操作: ${action} for message ${messageId}`);
    
    // 根据不同的操作类型执行相应的逻辑
    switch (action) {
      case 'retry':
        // 重试操作，可以触发重新下载等
        window.showInfo('正在重试操作...', '重试');
        break;
      case 'dismiss':
        // 忽略消息，标记为已读
        markAsRead(messageId);
        break;
      case 'update':
        // 执行更新操作
        window.showInfo('正在检查更新...', '更新');
        break;
      case 'remind':
        // 稍后提醒
        window.showInfo('将在稍后提醒您', '提醒');
        markAsRead(messageId);
        break;
      case 'open':
        // 打开应用
        window.showInfo('正在打开应用...', '打开');
        markAsRead(messageId);
        break;
      case 'learn':
        // 了解更多
        window.showInfo('正在打开帮助页面...', '帮助');
        markAsRead(messageId);
        break;
      case 'viewDownload':
        // 查看下载
        window.showInfo('正在打开下载管理器...', '下载');
        markAsRead(messageId);
        break;
      // 新增的应用相关操作
      case 'launch':
        // 启动应用
        window.showInfo('正在启动应用...', '启动');
        markAsRead(messageId);
        break;
      case 'details':
        // 查看详情
        window.showInfo('正在打开应用详情...', '详情');
        markAsRead(messageId);
        break;
      case 'viewLog':
        // 查看日志
        window.showInfo('正在打开错误日志...', '日志');
        markAsRead(messageId);
        break;
      // 下载相关操作
      case 'pause':
        // 暂停下载
        window.showInfo('已暂停下载', '暂停');
        break;
      case 'resume':
        // 继续下载
        window.showInfo('正在继续下载...', '继续');
        break;
      case 'cancel':
        // 取消下载/安装
        window.showInfo('已取消操作', '取消');
        markAsRead(messageId);
        break;
      case 'install':
        // 安装应用
        window.showInfo('正在开始安装...', '安装');
        break;
      case 'openFolder':
        // 打开文件夹
        window.showInfo('正在打开文件夹...', '文件夹');
        markAsRead(messageId);
        break;
      case 'delete':
        // 删除文件
        window.showInfo('正在删除文件...', '删除');
        markAsRead(messageId);
        break;
      // 安装相关操作
      case 'createShortcut':
        // 创建快捷方式
        window.showInfo('正在创建快捷方式...', '快捷方式');
        markAsRead(messageId);
        break;
      case 'viewError':
        // 查看错误
        window.showInfo('正在打开错误详情...', '错误详情');
        markAsRead(messageId);
        break;
      default:
        console.log('未知操作:', action);
    }
  };

  const markAsRead = (messageId) => {
    messageService.markAsRead(messageId);
  };

  const markAllAsRead = () => {
    messageService.markAllAsRead();
  };

  const clearAllMessages = () => {
    messageService.clearAllMessages();
  };

  if (loading) {
    return (
      <MessagesContainer>
        <div style={{ textAlign: 'center', padding: '60px 20px', color: theme === 'dark' ? '#999' : '#666' }}>
          加载消息中...
        </div>
      </MessagesContainer>
    );
  }

  return (
    <MessagesContainer>
      <MessagesHeader theme={theme}>
        <MessagesTitle theme={theme}>
          消息中心 {unreadCount > 0 && `(${unreadCount})`}
        </MessagesTitle>
        <MessagesActions>
          {unreadCount > 0 && (
            <ActionButton theme={theme} onClick={markAllAsRead}>
              全部标记为已读
            </ActionButton>
          )}
          <ActionButton theme={theme} onClick={clearAllMessages}>
            清空消息
          </ActionButton>
        </MessagesActions>
      </MessagesHeader>

      <FilterTabs theme={theme}>
        <FilterTab 
          theme={theme} 
          active={filter === 'all'} 
          onClick={() => setFilter('all')}
        >
          全部 ({messages.length})
        </FilterTab>
        <FilterTab 
          theme={theme} 
          active={filter === 'unread'} 
          onClick={() => setFilter('unread')}
        >
          未读 ({unreadCount})
        </FilterTab>
        <FilterTab 
          theme={theme} 
          active={filter === 'system'} 
          onClick={() => setFilter('system')}
        >
          系统
        </FilterTab>
        <FilterTab 
          theme={theme} 
          active={filter === 'app_popup'} 
          onClick={() => setFilter('app_popup')}
        >
          应用
        </FilterTab>
        <FilterTab 
          theme={theme} 
          active={filter === 'download'} 
          onClick={() => setFilter('download')}
        >
          下载
        </FilterTab>
        <FilterTab 
          theme={theme} 
          active={filter === 'install'} 
          onClick={() => setFilter('install')}
        >
          安装
        </FilterTab>
        <FilterTab 
          theme={theme} 
          active={filter === 'update'} 
          onClick={() => setFilter('update')}
        >
          更新
        </FilterTab>
        <FilterTab 
          theme={theme} 
          active={filter === 'error'} 
          onClick={() => setFilter('error')}
        >
          错误
        </FilterTab>
      </FilterTabs>

      {filteredMessages.length === 0 ? (
        <EmptyState theme={theme}>
          <EmptyIcon>📭</EmptyIcon>
          <EmptyText>暂无消息</EmptyText>
          <EmptySubtext>
            {filter === 'all' ? '您的消息中心是空的' : `没有${filter === 'unread' ? '未读' : filter}消息`}
          </EmptySubtext>
        </EmptyState>
      ) : (
        <MessagesList>
          {filteredMessages.map(message => (
            <MessageCard 
              key={message.id} 
              theme={theme} 
              className={!message.read ? 'unread' : ''}
              onClick={() => !message.read && markAsRead(message.id)}
            >
              <MessageHeader>
                <MessageInfo>
                  <MessageTitle theme={theme}>{message.title}</MessageTitle>
                  <MessageMeta theme={theme}>
                    <MessageType type={message.type}>
                      {message.type === 'system' && '系统'}
                      {message.type === 'download' && '下载'}
                      {message.type === 'update' && '更新'}
                      {message.type === 'error' && '错误'}
                    </MessageType>
                    <MessageTime theme={theme}>{formatTime(message.time)}</MessageTime>
                  </MessageMeta>
                </MessageInfo>
              </MessageHeader>
              
              <MessageContent theme={theme}>
                {message.content}
              </MessageContent>
              
              {message.actions && message.actions.length > 0 && (
                <MessageActions>
                  {message.actions.map((action, index) => (
                    <MessageButton
                      key={index}
                      theme={theme}
                      className={action.type}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMessageAction(message.id, action.action);
                      }}
                    >
                      {action.label}
                    </MessageButton>
                  ))}
                </MessageActions>
              )}
            </MessageCard>
          ))}
        </MessagesList>
      )}
    </MessagesContainer>
  );
};

export default Messages;