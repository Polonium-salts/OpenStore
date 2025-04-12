import React from 'react';
import styled from 'styled-components';
import AppCard from './AppCard';

const GridContainer = styled.div`
  padding: 0 0 16px 0;
  width: 100%;
`;

const SectionTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 12px 0;
  color: #1d1d1f;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
  width: 100%;

  @media (min-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }

  @media (min-width: 1200px) {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  }

  @media (min-width: 1440px) {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  }
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
`;

const AppGrid = ({ title, apps, viewMode = 'grid' }) => {
  return (
    <GridContainer>
      <SectionTitle>{title}</SectionTitle>
      {viewMode === 'grid' ? (
        <Grid>
          {apps.map((app, index) => (
            <AppCard key={index} app={app} viewMode={viewMode} />
          ))}
        </Grid>
      ) : (
        <List>
          {apps.map((app, index) => (
            <AppCard key={index} app={app} viewMode={viewMode} />
          ))}
        </List>
      )}
    </GridContainer>
  );
};

export default AppGrid; 