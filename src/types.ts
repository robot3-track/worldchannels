export interface StreamChannel {
  id: string;
  name: string;
  url: string;
  category: "sports" | "news" | "science" | "freetv" | "country";
  country: string; // e.g. 'US', 'UK', 'AU', 'CA', 'FR', 'DE', 'BR', 'JP', 'TR', 'ID', 'CN', 'TW', 'KR', 'ES', 'RU', 'Global'
  logo: string;
  status: "online" | "unstable" | "offline";
  lat: number;
  lon: number;
  cityName?: string;
  healthCheckedAt?: string;
  failureCount?: number;
  offlineUntil?: number; // timestamp in ms during which stream must remain offline
}

export interface TutorialStep {
  targetClass: string;
  title: string;
  description: string;
  preferredPlacement?: "top" | "bottom" | "left" | "right";
  overlap?: boolean;
}

export type CategoryFilter = 
  | "all" 
  | "favorites" // new feature for my latest commit lol!
  | "world cup" 
  | "general" 
  | "sports" 
  | "news" 
  | "science" 
  | "freetv" 
  | "country";

export type CountryFilter = 
  | "all" 
  | "US" 
  | "UK" 
  | "AU" 
  | "CA" 
  | "FR" 
  | "DE" 
  | "BR" 
  | "JP" 
  | "TR" 
  | "ID" 
  | "CN" 
  | "TW" 
  | "KR" 
  | "ES" 
  | "RU" 
  | "LB" 
  | "AF" 
  | "VN" 
  | "KP" 
  | "IN" 
  | "SA" 
  | "MX" 
  | "EG" 
  | "IT" 
  | "SG" 
  | "HK" 
  | "RS" 
  | "IR" 
  | "BH" 
  | "NG" 
  | "UY" 
  | "LC";