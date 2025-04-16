import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation resources
import enUS from './locales/en-US.json';
import zhCN from './locales/zh-CN.json';

// Initialize i18next
i18n
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    resources: {
      'en-US': { translation: enUS },
      'zh-CN': { translation: zhCN }
    },
    fallbackLng: 'en-US',
    debug: false,

    // Common namespace used around the full app
    ns: ['translation'],
    defaultNS: 'translation',

    keySeparator: '.',

    interpolation: {
      escapeValue: false // React already safes from XSS
    },

    // Language detection options
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'language',
      caches: ['localStorage']
    }
  });

export default i18n; 