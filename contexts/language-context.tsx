"use client";

import { createContext, useState, useContext, ReactNode } from "react";
import { Language } from "@/types/language";
import { translations } from "@/lib/i18n";

/**
 * LanguageContext
 * This context provides the current language and a function to set it.
 */
interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
}

export const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {
    console.warn("setLanguage called outside of LanguageProvider");
  },
});

/**
 * LanguageProvider
 * A component that provides the LanguageContext to its children.
 */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

/**
 * useTranslation Hook
 * A custom hook to access the translations for the currently selected language.
 * It uses the LanguageContext to determine the active language.
 */
export const useTranslation = () => {
  const { language } = useContext(LanguageContext);
  // Fallback to English if language is not available for any reason
  return translations[language] || translations.en;
};
