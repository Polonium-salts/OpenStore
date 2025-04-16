import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

// Create a context for translation functionality
const TranslationContext = createContext();

export const useTranslationContext = () => useContext(TranslationContext);

export const TranslationProvider = ({ children }) => {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    return localStorage.getItem('language') || 'en-US';
  });

  // Initialize language from localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage) {
      i18n.changeLanguage(savedLanguage);
      setCurrentLanguage(savedLanguage);
    } else {
      // Use browser language or default to en-US
      const browserLang = navigator.language;
      const language = browserLang.startsWith('zh') ? 'zh-CN' : 'en-US';
      i18n.changeLanguage(language);
      setCurrentLanguage(language);
      localStorage.setItem('language', language);
    }
  }, [i18n]);

  // Function to change the language
  const changeLanguage = (language) => {
    i18n.changeLanguage(language);
    setCurrentLanguage(language);
    localStorage.setItem('language', language);
  };

  return (
    <TranslationContext.Provider value={{ currentLanguage, changeLanguage }}>
      {children}
    </TranslationContext.Provider>
  );
};

export default TranslationProvider; 