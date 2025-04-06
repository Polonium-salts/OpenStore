import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const FeaturedContainer = styled.div`
  margin-bottom: 30px;
  position: relative;
`;

const FeaturedTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: ${props => props.theme === 'dark' ? '#f5f5f7' : '#1d1d1f'};
`;

const Carousel = styled.div`
  overflow: hidden;
  border-radius: 12px;
  position: relative;
  height: 280px;
  
  @media (max-width: 768px) {
    height: 240px;
  }
  
  @media (max-width: 480px) {
    height: 200px;
  }
`;

const CarouselInner = styled.div`
  display: flex;
  transition: transform 0.5s ease;
  height: 100%;
  transform: translateX(-${props => props.active * 100}%);
`;

const Slide = styled.div`
  min-width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
`;

const SlideImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const SlideContent = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20px;
  background: linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0));
  color: white;
`;

const SlideTitle = styled.h3`
  margin: 0 0 4px 0;
  font-size: 24px;
  font-weight: 600;
  
  @media (max-width: 768px) {
    font-size: 20px;
  }
  
  @media (max-width: 480px) {
    font-size: 18px;
  }
`;

const SlideDescription = styled.p`
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
  
  @media (max-width: 480px) {
    font-size: 12px;
  }
`;

const NavButton = styled.button`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;
  z-index: 10;
  backdrop-filter: blur(4px);
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.5);
  }
  
  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
  
  svg {
    width: 24px;
    height: 24px;
    fill: white;
  }
  
  &.prev {
    left: 16px;
  }
  
  &.next {
    right: 16px;
  }
  
  @media (max-width: 768px) {
    width: 32px;
    height: 32px;
    
    svg {
      width: 18px;
      height: 18px;
    }
  }
`;

const Indicators = styled.div`
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  z-index: 10;
`;

const Indicator = styled.button`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${props => props.active ? 'white' : 'rgba(255,255,255,0.5)'};
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
  padding: 0;
  
  &:hover {
    background-color: ${props => props.active ? 'white' : 'rgba(255,255,255,0.7)'};
  }
`;

const FeaturedApps = ({ featuredApps, theme = 'light' }) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [autoplay, setAutoplay] = useState(true);
  
  // 自动轮播
  useEffect(() => {
    let interval;
    
    if (autoplay) {
      interval = setInterval(() => {
        setActiveSlide(prev => (prev + 1) % featuredApps.length);
      }, 5000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [autoplay, featuredApps.length]);
  
  // 鼠标悬停时暂停自动轮播
  const handleMouseEnter = () => setAutoplay(false);
  const handleMouseLeave = () => setAutoplay(true);
  
  const goToPrev = () => {
    setActiveSlide(prev => (prev - 1 + featuredApps.length) % featuredApps.length);
  };
  
  const goToNext = () => {
    setActiveSlide(prev => (prev + 1) % featuredApps.length);
  };
  
  const goToSlide = (index) => {
    setActiveSlide(index);
  };
  
  return (
    <FeaturedContainer>
      <FeaturedTitle theme={theme}>精选应用</FeaturedTitle>
      <Carousel 
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <CarouselInner active={activeSlide}>
          {featuredApps.map(app => (
            <Slide key={app.id}>
              <SlideImage src={app.featuredImage || app.screenshots[0]} alt={app.name} />
              <SlideContent>
                <SlideTitle>{app.name}</SlideTitle>
                <SlideDescription>{app.description}</SlideDescription>
              </SlideContent>
            </Slide>
          ))}
        </CarouselInner>
        
        <NavButton 
          className="prev" 
          onClick={goToPrev}
          disabled={featuredApps.length <= 1}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
          </svg>
        </NavButton>
        
        <NavButton 
          className="next" 
          onClick={goToNext}
          disabled={featuredApps.length <= 1}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
          </svg>
        </NavButton>
        
        <Indicators>
          {featuredApps.map((_, index) => (
            <Indicator 
              key={index} 
              active={index === activeSlide} 
              onClick={() => goToSlide(index)}
            />
          ))}
        </Indicators>
      </Carousel>
    </FeaturedContainer>
  );
};

export default FeaturedApps; 