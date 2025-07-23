"use client";

import { createContext, useState, useContext, ReactNode } from "react";

// The Language type and translations object have been moved into this file
// to create a self-contained module and prevent deployment errors
// related to module resolution.

/**
 * Language Type Definition
 * Defines the supported languages for the application.
 */
export type Language = "en" | "tc";

/**
 * Translations Object
 * Contains all the translation strings for the supported languages.
 */
export const translations: Record<Language, Record<string, string>> = {
  en: {
    dashboard: "Dashboard",
    players: "Players",
    matches: "Matches",
    availability: "Availability",
    profile: "Profile",
    logout: "Logout",
    language: "Language",
    english: "English",
    traditionalChinese: "Traditional Chinese",
    
    // Translations for booking page
    booking: "Booking",
    bookingInformation: "Booking Information",
    filters: "Filters",
    venueName: "Venue Name",
    searchVenuePlaceholder: "Search by venue name...",
    district: "District",
    selectDistrict: "Select a district",
    allDistricts: "All Districts",
    date: "Date",
    showAvailableOnly: "Show available only",
    loading: "Loading data...",
    address: "Address",
    sessionTime: "Session Time",
    available: "Available",
    notAvailable: "Not Available",
    noResultsFound: "No results found.",
  },
  tc: {
    dashboard: "儀表板",
    players: "球員",
    matches: "比賽",
    availability: "可出席時間",
    profile: "個人資料",
    logout: "登出",
    language: "語言",
    english: "英文",
    traditionalChinese: "繁體中文",

    // Translations for booking page
    booking: "場地預訂",
    bookingInformation: "場地預訂資訊",
    filters: "篩選",
    venueName: "場地名稱",
    searchVenuePlaceholder: "按場地名稱搜索...",
    district: "地區",
    selectDistrict: "選擇地區",
    allDistricts: "所有地區",
    date: "日期",
    showAvailableOnly: "僅顯示可預訂",
    loading: "載入中...",
    address: "地址",
    sessionTime: "時段",
    availability: "可預訂狀態",
    available: "可預訂",
    notAvailable: "無法預訂",
    noResultsFound: "找不到結果。",
  },
};

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
