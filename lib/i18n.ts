export const translations = {
  en: {
    // Navigation
    dashboard: "Dashboard",
    matches: "Matches",
    players: "Players",
    availability: "Availability",
    profile: "Profile",
    logout: "Logout",

    // Authentication
    login: "Login",
    username: "Username",
    password: "Password",
    signIn: "Sign In",
    createUser: "Create New User",
    fullName: "Full Name",
    jerseyNumber: "Jersey Number",
    position: "Position",
    phone: "Phone",
    create: "Create",

    // Matches
    createMatch: "Create Match",
    opponentTeam: "Opponent Team",
    matchDate: "Match Date",
    location: "Location",
    homeJerseyColor: "Home Jersey Color",
    awayJerseyColor: "Away Jersey Color",
    isHomeGame: "Home Game",
    keyPlayers: "Key Players",
    matchDetails: "Match Details",
    accept: "Accept",
    decline: "Decline",
    pending: "Pending",
    accepted: "Accepted",
    declined: "Declined",

    // Match Events
    addEvent: "Add Event",
    goal: "Goal",
    assist: "Assist",
    waterBreak: "Water Break",
    halftime: "Halftime",
    gameStart: "Game Start",
    gameEnd: "Game End",
    eventTime: "Event Time (minutes)",

    // Ratings
    ratePlayer: "Rate Player",
    rating: "Rating",
    comments: "Comments",
    submitRating: "Submit Rating",

    // Common
    save: "Save",
    cancel: "Cancel",
    edit: "Edit",
    delete: "Delete",
    loading: "Loading...",
    error: "Error",
    success: "Success",
  },
  zh: {
    // Navigation
    dashboard: "儀表板",
    matches: "比賽",
    players: "球員",
    availability: "可用性",
    profile: "個人資料",
    logout: "登出",

    // Authentication
    login: "登入",
    username: "用戶名",
    password: "密碼",
    signIn: "登入",
    createUser: "創建新用戶",
    fullName: "全名",
    jerseyNumber: "球衣號碼",
    position: "位置",
    phone: "電話",
    create: "創建",

    // Matches
    createMatch: "創建比賽",
    opponentTeam: "對手球隊",
    matchDate: "比賽日期",
    location: "地點",
    homeJerseyColor: "主場球衣顏色",
    awayJerseyColor: "客場球衣顏色",
    isHomeGame: "主場比賽",
    keyPlayers: "關鍵球員",
    matchDetails: "比賽詳情",
    accept: "接受",
    decline: "拒絕",
    pending: "待定",
    accepted: "已接受",
    declined: "已拒絕",

    // Match Events
    addEvent: "添加事件",
    goal: "進球",
    assist: "助攻",
    waterBreak: "飲水休息",
    halftime: "中場休息",
    gameStart: "比賽開始",
    gameEnd: "比賽結束",
    eventTime: "事件時間（分鐘）",

    // Ratings
    ratePlayer: "評分球員",
    rating: "評分",
    comments: "評論",
    submitRating: "提交評分",

    // Common
    save: "保存",
    cancel: "取消",
    edit: "編輯",
    delete: "刪除",
    loading: "載入中...",
    error: "錯誤",
    success: "成功",
  },
}

export type Language = keyof typeof translations
export type TranslationKey = keyof typeof translations.en

export function useTranslation(lang: Language = "en") {
  return {
    t: (key: TranslationKey) => translations[lang][key] || translations.en[key],
    lang,
  }
}
