import React from 'react';
import styled from 'styled-components';

const FeaturedContainer = styled.div`
  width: 100%;
  overflow: hidden;
  padding: 20px 0 24px 0;
`;

const FeaturedTitle = styled.h2`
  font-size: 22px;
  font-weight: 700;
  margin: 0 0 14px 0;
  color: #1d1d1f;
  padding: 0;
`;

const Carousel = styled.div`
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  padding: 12px 0;
  
  &::-webkit-scrollbar {
    height: 6px;
    background-color: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.15);
    border-radius: 6px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background-color: rgba(0, 0, 0, 0.3);
  }
  
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.15) transparent;
`;

const FeaturedCard = styled.div`
  flex: 0 0 auto;
  width: calc(90% - 20px);
  max-width: 800px;
  margin-right: 20px;
  height: 320px;
  border-radius: 10px;
  overflow: hidden;
  position: relative;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
  scroll-snap-align: start;
  transition: transform 0.3s ease;
  cursor: pointer;
  
  &:hover {
    transform: scale(0.99);
  }
  
  @media (min-width: 1024px) {
    width: calc(75% - 20px);
    height: 360px;
  }

  @media (min-width: 1280px) {
    width: calc(60% - 20px);
    height: 380px;
  }
`;

const FeaturedImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const FeaturedOverlay = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 30px 24px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
  color: white;
`;

const FeaturedTag = styled.span`
  display: inline-block;
  background-color: #0066CC;
  color: white;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  margin-bottom: 10px;
`;

const FeaturedAppTitle = styled.h3`
  font-size: 26px;
  font-weight: 700;
  margin: 0 0 6px 0;
`;

const FeaturedAppSubtitle = styled.h4`
  font-size: 16px;
  font-weight: 400;
  margin: 0 0 12px 0;
  opacity: 0.9;
`;

const FeaturedApps = ({ featuredApps }) => {
  return (
    <FeaturedContainer>
      <FeaturedTitle>精选应用</FeaturedTitle>
      <Carousel>
        {featuredApps.map((app, index) => (
          <FeaturedCard key={index}>
            <FeaturedImage src={app.featuredImage} alt={app.name} />
            <FeaturedOverlay>
              <FeaturedTag>{app.tag}</FeaturedTag>
              <FeaturedAppTitle>{app.name}</FeaturedAppTitle>
              <FeaturedAppSubtitle>{app.tagline}</FeaturedAppSubtitle>
            </FeaturedOverlay>
          </FeaturedCard>
        ))}
      </Carousel>
    </FeaturedContainer>
  );
};

export default FeaturedApps; 