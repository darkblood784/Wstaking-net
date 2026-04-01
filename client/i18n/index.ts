import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector'; // 自動檢測瀏覽器語言
import HttpApi from 'i18next-http-backend'; // 支持從服務器加載語言文件
import zhFlag from '@/assets/images/language/zh.svg';
import idFlag from '@/assets/images/language/id.svg';
import enFlag from '@/assets/images/language/en.svg';
import hiFlag from '@/assets/images/language/hi.svg';

// 使用 ISO 639-1 標準代碼,包含 RainbowKit 本地化对象https://www.rainbowkit.com/zh-TW/docs/localization
export const LANGUAGES = [
  { code: 'en', label: 'English', img: enFlag, rainbowKitLocale: 'en-US' },
  { code: 'id', label: 'Bahasa Indonesia', img: idFlag, rainbowKitLocale: 'id-ID' },
  { code: 'hi', label: 'हिन्दी', img: hiFlag, rainbowKitLocale: 'hi-IN' },
  { code: 'zh-TW', label: '繁體中文', img: zhFlag, rainbowKitLocale: 'zh-TW' },
];
  
  if (typeof window !== 'undefined') {
    const storedLang = window.localStorage.getItem('i18nextLng');
    if (!storedLang) {
      window.localStorage.setItem('i18nextLng', 'en');
    }
  }

  i18n
  .use(LanguageDetector)
  .use(HttpApi)
  .use(initReactI18next)
  .init({
    fallbackLng: {
      zh: ['zh-TW'],
      default: ['en'],
    }, // 默認語言
    debug: false,
    supportedLngs: [...LANGUAGES.map((lang) => lang.code), 'zh'],
    detection: {
      order: ['localStorage', 'cookie', 'querystring'],
      caches: ['localStorage'],
    },
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json', // 多命名空間支持
    },
    ns: ['global'], // 命名空間列表, 可以添加多個翻譯文件名稱
    defaultNS: 'global', // 默認供用翻譯檔案
    interpolation: {
      escapeValue: false,
    },
  });
  
  export default i18n;
