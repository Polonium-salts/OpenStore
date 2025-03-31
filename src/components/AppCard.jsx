import React from 'react';
import styled from 'styled-components';

const Card = styled.div`
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  background-color: white;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.07);
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
  height: 100%;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
  }
`;

const AppImage = styled.div`
  height: 0;
  padding-bottom: 56.25%; /* 16:9 aspect ratio */
  position: relative;
  overflow: hidden;
  
  img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const AppIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 10px;
  background-color: ${props => props.bgColor || '#f5f5f7'};
  position: absolute;
  bottom: -18px;
  left: 10px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const AppInfo = styled.div`
  padding: 24px 10px 10px;
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const AppName = styled.h3`
  font-size: 13px;
  font-weight: 600;
  margin: 0 0 2px 0;
  color: #1d1d1f;
`;

const AppDeveloper = styled.p`
  font-size: 11px;
  color: #86868b;
  margin: 0 0 4px 0;
`;

const AppDescription = styled.p`
  font-size: 11px;
  color: #1d1d1f;
  margin: 0 0 8px 0;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
`;

const GetButton = styled.button`
  background-color: #f5f5f7;
  border: none;
  border-radius: 14px;
  padding: 5px 10px;
  font-size: 11px;
  font-weight: 600;
  color: #0066CC;
  cursor: pointer;
  align-self: flex-start;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #e8e8ed;
  }
`;

const AppCard = ({ app }) => {
  return (
    <Card>
      <AppImage>
        <img src={app.screenshot} alt={`${app.name} screenshot`} />
        <AppIcon bgColor={app.iconBgColor}>
          <img src={app.icon} alt={`${app.name} icon`} />
        </AppIcon>
      </AppImage>
      <AppInfo>
        <AppName>{app.name}</AppName>
        <AppDeveloper>{app.developer}</AppDeveloper>
        <AppDescription>{app.description}</AppDescription>
        <GetButton>{app.price === 0 ? '获取' : `¥${app.price.toFixed(2)}`}</GetButton>
      </AppInfo>
    </Card>
  );
};

export default AppCard; 