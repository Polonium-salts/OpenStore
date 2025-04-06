import React from 'react';
import styled from 'styled-components';

const Card = styled.div`
  border-radius: 12px;
  background-color: ${props => props.theme === 'dark' ? '#2a2a2d' : 'white'};
  overflow: hidden;
  box-shadow: 0 1px 3px ${props => props.theme === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.05)'};
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
  height: 100%;
  display: flex;
  flex-direction: column;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px ${props => props.theme === 'dark' ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.1)'};
  }
`;

const AppIcon = styled.div`
  width: 100%;
  padding-top: 100%;
  position: relative;
  background-color: ${props => props.theme === 'dark' ? '#1c1c1e' : '#f5f5f7'};
  
  img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const AppInfo = styled.div`
  padding: 12px;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
`;

const AppName = styled.h3`
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f'};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const AppDeveloper = styled.div`
  font-size: 12px;
  color: ${props => props.theme === 'dark' ? '#999' : '#86868b'};
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const AppRating = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  
  svg {
    width: 14px;
    height: 14px;
    fill: #FFC107;
    margin-right: 2px;
  }
  
  span {
    font-size: 12px;
    color: ${props => props.theme === 'dark' ? '#999' : '#86868b'};
    margin-left: 4px;
  }
`;

const AppPrice = styled.div`
  margin-top: auto;
  font-size: 13px;
  font-weight: 500;
  color: ${props => props.$free ? '#34C759' : (props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f')};
`;

const AppCard = ({ app, theme = 'light' }) => {
  // 防御性检查，确保app对象及其属性存在
  if (!app) {
    return <div>无法加载应用信息</div>;
  }
  
  // 计算星星评分
  const renderStars = (rating = 0) => {
    const stars = [];
    rating = parseFloat(rating) || 0;
    
    for (let i = 0; i < 5; i++) {
      const starPath = i < Math.floor(rating) 
        ? "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" 
        : (i === Math.floor(rating) && rating % 1 > 0
            ? "M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4V6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z"
            : "M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4l-3.76 2.27 1-4.28-3.32-2.88 4.38-.38L12 6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z"
          );
          
      stars.push(
        <svg key={i} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d={starPath} />
        </svg>
      );
    }
    return stars;
  };

  return (
    <Card theme={theme}>
      <AppIcon theme={theme}>
        <img src={app.icon || 'https://via.placeholder.com/150'} alt={app.name || '应用'} />
      </AppIcon>
      <AppInfo>
        <AppName theme={theme}>{app.name || '未命名应用'}</AppName>
        <AppDeveloper theme={theme}>{app.developer || '未知开发者'}</AppDeveloper>
        <AppRating>
          {renderStars(app.rating)}
          <span>({(app.ratingCount || 0).toLocaleString()})</span>
        </AppRating>
        <AppPrice $free={(app.price || '') === '免费'} theme={theme}>
          {app.price || '未知'}
        </AppPrice>
      </AppInfo>
    </Card>
  );
};

export default AppCard; 