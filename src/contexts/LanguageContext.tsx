import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type LanguageCode = 'en' | 'ta';

const STORAGE_KEY = 'singa-language';

const dictionary = {
  en: {
    home: 'Home',
    about: 'About',
    singaPenClub: 'Singa Pen Club',
    schemes: 'Govt Schemes',
    skills: 'Skills',
    safety: 'Safety',
    gallery: 'Gallery',
    signIn: 'Sign In',
    register: 'Register',
    dashboard: 'Dashboard',
    signOut: 'Sign Out',
    languageEnglish: 'English',
    languageTamil: 'Tamil',
    backToWebsite: 'Website',
    settings: 'Settings',
    notifications: 'Notifications',
  },
  ta: {
    home: 'முகப்பு',
    about: 'அறிமுகம்',
    singaPenClub: 'சிங்கப் பெண் குழு',
    schemes: 'அரசுத் திட்டங்கள்',
    skills: 'திறன்கள்',
    safety: 'பாதுகாப்பு',
    gallery: 'படத்தொகுப்பு',
    signIn: 'உள்நுழை',
    register: 'பதிவு',
    dashboard: 'டாஷ்போர்டு',
    signOut: 'வெளியேறு',
    languageEnglish: 'English',
    languageTamil: 'தமிழ்',
    backToWebsite: 'வலைத்தளம்',
    settings: 'அமைப்புகள்',
    notifications: 'அறிவிப்புகள்',
  },
} as const;

type TranslationKey = keyof typeof dictionary.en;

interface LanguageContextValue {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  toggleLanguage: () => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    if (typeof window === 'undefined') return 'en';
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === 'ta' ? 'ta' : 'en';
  });

  const setLanguage = (nextLanguage: LanguageCode) => {
    setLanguageState(nextLanguage);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language === 'ta' ? 'ta' : 'en';
  }, [language]);

  const value = useMemo<LanguageContextValue>(() => ({
    language,
    setLanguage,
    toggleLanguage: () => setLanguage(language === 'en' ? 'ta' : 'en'),
    t: (key) => dictionary[language][key] || dictionary.en[key],
  }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
