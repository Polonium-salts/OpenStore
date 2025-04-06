import React from 'react';
import styled from 'styled-components';
import AppCard from './AppCard';

const GridContainer = styled.div`
  margin-bottom: 30px;
`;

const GridTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: ${props => props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f'};
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 12px;
  }
  
  @media (max-width: 480px) {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 8px;
  }
`;

const ViewAllLink = styled.a`
  display: inline-block;
  margin-top: 16px;
  color: #0066CC;
  font-size: 14px;
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
  }
`;

const AppGrid = ({ title, apps, theme = 'light', showViewAll = false }) => {
  return (
    <GridContainer>
      <GridTitle theme={theme}>{title}</GridTitle>
      <Grid>
        {apps.map(app => (
          <AppCard key={app.id} app={app} theme={theme} />
        ))}
      </Grid>
      {showViewAll && (
        <ViewAllLink href="#">查看更多</ViewAllLink>
      )}
    </GridContainer>
  );
};

export default AppGrid; 