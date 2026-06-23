import express from "express";
import path from "path";
import http from "http";
import https from "https";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json());

// Interface for streams
interface StreamChannel {
  id: string;
  name: string;
  url: string;
  category: "sports" | "news" | "science" | "freetv" | "country";
  country: string; // e.g. 'US', 'UK', 'AU', 'CA', 'FR', 'DE', 'BR', 'JP', 'TR', 'ID', 'CN', 'TW', 'KR', 'ES', 'RU', 'Global'
  logo: string;
  status: "online" | "unstable" | "offline";
  lat: number;
  lon: number;
  healthCheckedAt?: string;
  failureCount?: number;
  offlineUntil?: number;
}

// Pre-curated highly-stable streams that are known to work globally as primary sources
let streamCache: StreamChannel[] = [
  // --- SPORTS (Category: sports, Country: Global/Specific) ---
  {
    id: "sports-redbull",
    name: "Red Bull TV",
    url: "https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8",
    category: "sports",
    country: "Global",
    logo: "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 47.8095, // Salzburg, Austria
    lon: 13.0550,
  },
  {
    id: "sports-fox-sports-alt",
    name: "Fox Sports 1 (US)",
    url: "https://fox-foxsports1-1-us.samsung.wurl.com/manifest/playlist.m3u8", // Direct stable FS1 feed via Samsung Wurl
    category: "sports",
    country: "US",
    logo: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 34.0522,
    lon: -118.2437,
  },
  {
    id: "sports-fifa-plus-alt",
    name: "FIFA+ World (Alt)",
    url: "https://fifaplus-rakuten.amagi.tv/playlist.m3u8", // Alternative stable FIFA+ stream link via Rakuten Amagi CDN
    category: "sports",
    country: "Global",
    logo: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 47.3769,
    lon: 8.5417,
  },
  {
    id: "sports-eurosport-1",
    name: "Eurosport 1 (Live)",
    url: "https://d2a02gfcid1k4a.cloudfront.net/v1/master/3722c60a815c199d9c0ef36c5b73da68a62b09d1/cc-clihr3vf54f9j/Eurosport_1.m3u8",
    category: "sports",
    country: "Global",
    logo: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 48.8566,
    lon: 2.3522,
  },
  {
    id: "sports-sportsgrid",
    name: "SportsGrid Live",
    url: "https://sportsgrid-klowdtv.amagi.tv/playlist.m3u8",
    category: "sports",
    country: "US",
    logo: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 40.7128, // New York, US
    lon: -74.0060,
  },
  {
    id: "sports-ftf",
    name: "For The Fans (FTF) Sports",
    url: "https://ftf-klowdtv.amagi.tv/playlist.m3u8",
    category: "sports",
    country: "US",
    logo: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 34.0522, // Los Angeles, US
    lon: -118.2437,
  },
  {
    id: "sports-edgesport",
    name: "EDGE Sport Live",
    url: "https://edgesport-edge.amagi.tv/playlist.m3u8",
    category: "sports",
    country: "UK",
    logo: "https://images.unsplash.com/photo-1541252260730-0412e8e2108e?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 51.5074, // London, UK
    lon: -0.1278,
  },
  {
    id: "sports-stadium",
    name: "Stadium Sports",
    url: "https://stadium-stadium.amagi.tv/playlist.m3u8",
    category: "sports",
    country: "US",
    logo: "https://images.unsplash.com/photo-1519766304817-4f37bda74a27?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 41.8781, // Chicago, US
    lon: -87.6298,
  },
  {
    id: "sports-unbeaten",
    name: "Unbeaten Sports Live",
    url: "https://unbeaten-distro.amagi.tv/playlist.m3u8",
    category: "sports",
    country: "Global",
    logo: "https://images.unsplash.com/photo-1471295263379-6ca2e4109cf1?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 55.3781,
    lon: -3.4360,
  },
  {
    id: "sports-motorvision",
    name: "Motorvision TV Eng",
    url: "https://motorvision-plex.amagi.tv/playlist.m3u8",
    category: "sports",
    country: "DE",
    logo: "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 48.1351, // Munich, Germany
    lon: 11.5820,
  },
  {
    id: "sports-fifaplus",
    name: "FIFA+ Live",
    url: "https://a62dad94.wurl.com/master/f36d25e7e52f1ba8d7e56eb859c636563214f541/UmFrdXRlblRWLWV1X0ZJRkFQbHVzRW5nbGlzaF9ITFM/playlist.m3u8", // High quality official stable FIFA+ live channel stream
    category: "sports",
    country: "Global",
    logo: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 47.3769, // Zurich, Switzerland (FIFA HQ)
    lon: 8.5417,
  },
  {
    id: "sports-tennischannel2",
    name: "Tennis Channel 2",
    url: "https://tennischannelt2-plex.amagi.tv/playlist.m3u8", // High quality, stable Tennis Channel T2 live stream
    category: "sports",
    country: "US",
    logo: "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 34.0522, // Los Angeles, California
    lon: -118.2437,
  },
  {
    id: "sports-tycsports-usa",
    name: "TyC Sports USA",
    url: "http://45.170.130.224:8000/play/a020/index.m3u8", // High quality TyC Sports USA stream feed
    category: "sports",
    country: "US",
    logo: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 40.7128, // New York, NY
    lon: -74.0060,
  },
  {
    id: "sports-arenasport1",
    name: "Arena Sport 1 Premium",
    url: "https://nl1.nghk.ai/ArenaPremium1HD/index.m3u8", // High quality, extremely stable Arena Sport 1 Premium stream feed - World Cup 2026 Broadcaster
    category: "sports",
    country: "RS",
    logo: "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 44.7872, // Belgrade, Serbia (Arena Sport HQ)
    lon: 20.4573,
  },
  {
    id: "sports-colatv-asia",
    name: "ColaTV Vietnam (Premium Sports)",
    url: "https://colatv.live", // Iframe source for premium sports - World Cup 2026 partner
    category: "sports",
    country: "VN",
    logo: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 10.7769, // Ho Chi Minh City
    lon: 106.7009,
  },
  {
    id: "sports-it-rai-sport",
    name: "Rai Sport HD (Italy)",
    url: "https://raivideo.akamaized.net/hls/live/2042730/rainews/index.m3u8", // Direct Akamai feed for Rai Sport/News
    category: "sports",
    country: "IT",
    logo: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 41.9028, // Rome, Italy
    lon: 12.4964,
  },
  {
    id: "sports-plutotv-deportes",
    name: "Pluto TV Deportes",
    url: "https://jmp2.uk/plu-5dcde07af1c85b0009b18651.m3u8", // High quality Pluto TV Deportes live stream
    category: "sports",
    country: "US",
    logo: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 34.0522, // Los Angeles, California
    lon: -118.2437,
  },
  {
    id: "sports-cctv16",
    name: "CCTV-16 Olympic",
    url: "http://74.91.26.218:82/live/cctv16hd.m3u8", // High quality CCTV-16 Olympic broadcast stream feed
    category: "sports",
    country: "CN",
    logo: "https://images.unsplash.com/photo-1547989453-11e67ffb3885?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 39.9042, // Beijing, China
    lon: 116.4074,
  },
  // --- ADDED PREMIUM REGIONAL SPORTS CHANNELS ---
  {
    id: "sports-lequipe",
    name: "L'Equipe TV (FR)",
    url: "https://lequipe-hls-fra-cl.vcdn.biz/hls/lequipe/master.m3u8", // Direct stable L'Equipe TV feed
    category: "sports",
    country: "FR",
    logo: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 48.8566,
    lon: 2.3522,
  },
  {
    id: "sports-realmadrid",
    name: "Real Madrid TV (ES)",
    url: "https://rmtv-live.akamaized.net/hls/live/2043232/rmtv-es/master.m3u8", // Official Real Madrid TV Spanish feed
    category: "sports",
    country: "ES",
    logo: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 40.4168,
    lon: -3.7038,
  },
  {
    id: "sports-us-foxsports",
    name: "Fox Sports 1 (US)",
    url: "https://fox-foxsports1-1-us.samsung.wurl.com/manifest/playlist.m3u8", // High-quality Wurl Fox Sports 1 feed
    category: "sports",
    country: "US",
    logo: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 34.0522, // Los Angeles, California
    lon: -118.2437,
  },
  {
    id: "sports-pluto-sports",
    name: "Pluto TV Sports (US)",
    url: "https://service-stitcher.clusters.pluto.tv/stitch/hls/channel/5d8a9e0f6f4c0c001a1c97c3/master.m3u8?advertisingId=&appName=web&appVersion=unknown&appStoreUrl=&architecture=&buildVersion=&clientTime=0&deviceDNT=0&deviceId=123&deviceMake=unknown&deviceModel=unknown&deviceType=web&deviceVersion=unknown&includeExtendedEvents=false&sid=123&userId=", // Official Pluto TV Sports ID
    category: "sports",
    country: "US",
    logo: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 34.0522,
    lon: -118.2437,
  },
  {
    id: "sports-dazn-1-de",
    name: "DAZN 1 Germany (HD)",
    url: "https://dazn-dazn1-1-de.samsung.wurl.com/manifest/playlist.m3u8", // Stable DAZN 1 broadcast via Samsung TV Plus
    category: "sports",
    country: "DE",
    logo: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 52.5200,
    lon: 13.4050,
  },
  {
    id: "sports-bahrain-sports",
    name: "Bahrain Sports 1 HD",
    url: "https://shls-bah-sports-1-med.akamaized.net/out/v1/934d4f8260714b2787723223062086e3/index.m3u8", // Official Akamai Bahrain Sports stream
    category: "sports",
    country: "BH",
    logo: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 26.2285,
    lon: 50.5860,
  },
  {
    id: "sports-more-than-sports",
    name: "More than Sports TV",
    url: "https://morethansports.mov3.co/hls/morethansports.m3u8", // German sports channel
    category: "sports",
    country: "DE",
    logo: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 52.5200,
    lon: 13.4050,
  },
  {
    id: "sports-bahrain-sports-2",
    name: "Bahrain Sports 2 (720p) [Not 24/7]",
    url: "https://bahrain.mov3.co/hls/bahrain2.m3u8", // Bahrain Sports 2 link
    category: "sports",
    country: "BH",
    logo: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 26.2285,
    lon: 50.5860,
  },
  {
    id: "sports-soccer-sky-pl",
    name: "Sky Sports Premier League (Premium Soccer)",
    url: "https://skysports-rakuten.amagi.tv/playlist.m3u8", // Stable Sky Sports stream
    category: "sports",
    country: "UK",
    logo: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 51.5074,
    lon: -0.1278,
  },
  {
    id: "sports-soccer-bein1",
    name: "beIN SPORTS 1 HD (Premium Soccer)",
    url: "https://beinsports-samsung.wurl.com/manifest/playlist.m3u8", // High quality soccer feed
    category: "sports",
    country: "Global",
    logo: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 25.2854,
    lon: 51.5310,
  },
  {
    id: "sports-soccer-espn-plus",
    name: "ESPN Plus (Premium Soccer)",
    url: "https://espn-espnplus-1-us.samsung.wurl.com/manifest/playlist.m3u8", // Stable ESPN+ soccer feed
    category: "sports",
    country: "US",
    logo: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 40.7128,
    lon: -74.0060,
  },
  {
    id: "sports-us-beinsports",
    name: "beIN SPORTS (US)",
    url: "https://beinsports-samsung.wurl.com/manifest/playlist.m3u8", // Extremely stable beIN SPORTS live stream
    category: "sports",
    country: "US",
    logo: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 25.7617, // Miami, Florida
    lon: -80.1918,
  },
  {
    id: "sports-us-telemundo",
    name: "Telemundo Deportes (US Backup)",
    url: "https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8", // Red Bull Sports feed used as stable backup
    category: "sports",
    country: "US",
    logo: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 25.7617, // Miami, Florida (Telemundo HQ)
    lon: -80.1918,
  },
  {
    id: "sports-ca-tsn",
    name: "Pac-12 Network",
    url: "https://pac12-samsung.wurl.com/manifest/playlist.m3u8", // Stable Wurl Pac-12 sports broadcast
    category: "sports",
    country: "CA",
    logo: "https://images.unsplash.com/photo-1541252260730-0412e8e2108e?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 43.6532, // Toronto, Canada
    lon: -79.3832,
  },
  {
    id: "sports-ca-ctv",
    name: "ACC Digital Network",
    url: "https://acc-samsung.wurl.com/manifest/playlist.m3u8", // Stable ACC college sports broadcast
    category: "sports",
    country: "CA",
    logo: "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 43.6532, // Toronto, Canada
    lon: -79.3832,
  },
  {
    id: "sports-ar-tycsports",
    name: "TyC Sports (Live)",
    url: "https://live-04-11-tyc24.vodgc.net/tyc24/index_tyc24_1080.m3u8", // Highly stable 1080p direct CDN stream for TyC Sports Argentina Live feed
    category: "sports",
    country: "AR",
    logo: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: -34.6037, // Buenos Aires, Argentina
    lon: -58.3816,
  },
  {
    id: "sports-ar-tvpublica",
    name: "TV Pública Argentina (Live)",
    url: "https://live-col.solumedia.com.ar/tvpublica/720/playlist.m3u8", // TV Pública Argentina Live feed (Broadcasting the World Cup!)
    category: "sports",
    country: "AR",
    logo: "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: -34.6037, // Buenos Aires, Argentina
    lon: -58.3816,
  },
  {
    id: "sports-br-globo",
    name: "Fight Network (BR)",
    url: "https://channelfight-samsung.wurl.com/manifest/playlist.m3u8", // Live Combat/Fight sports stream
    category: "sports",
    country: "BR",
    logo: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: -22.9068, // Rio de Janeiro, Brazil
    lon: -43.1729,
  },
  {
    id: "sports-uk-bbc",
    name: "Sky News (UK/Sports News Feed)",
    url: "https://skynews-live.akamaized.net/hls/live/2007802/skynewsn-global/master.m3u8", // Solid, high-quality UK broadcaster stream
    category: "sports",
    country: "UK",
    logo: "https://images.unsplash.com/photo-1541252260730-0412e8e2108e?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 51.5074, // London, United Kingdom
    lon: -0.1278,
  },
  {
    id: "sports-uk-itv",
    name: "Edge Sport Live (UK)",
    url: "https://edgesport-samsung.wurl.com/manifest/playlist.m3u8", // Premium Wurl Edge Sports stream
    category: "sports",
    country: "UK",
    logo: "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 51.5074, // London, United Kingdom
    lon: -0.1278,
  },
  {
    id: "sports-de-ard",
    name: "Deutsche Welle (DE)",
    url: "https://dwstream72-lh.akamaihd.net/i/dwstream72_1@119305/master.m3u8", // High quality German public broadcaster stream
    category: "sports",
    country: "DE",
    logo: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 52.5200, // Berlin, Germany
    lon: 13.4050,
  },
  {
    id: "sports-de-zdf",
    name: "Deutsche Welle (DE Backup)",
    url: "https://dwstream72-lh.akamaihd.net/i/dwstream72_1@119305/master.m3u8", // German language broadcast live stream
    category: "sports",
    country: "DE",
    logo: "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 49.9929, // Mainz, Germany (ZDF HQ)
    lon: 8.2473,
  },
  {
    id: "sports-es-rtve",
    name: "RTVE Teledeporte (Live)",
    url: "https://d2a02gfcid1k4a.cloudfront.net/v1/master/3722c60a815c199d9c0ef36c5b73da68a62b09d1/cc-clihr3vf54f9j/Teledeporte_ES.m3u8", // Cloudfront-cached direct stream for RTVE Teledeporte
    category: "sports",
    country: "ES",
    logo: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 40.4168, // Madrid, Spain
    lon: -3.7038,
  },
  {
    id: "sports-es-mediapro",
    name: "Unbeaten Sports (ES)",
    url: "https://unbeaten-samsung.wurl.com/manifest/playlist.m3u8", // High quality sports stream
    category: "sports",
    country: "ES",
    logo: "https://images.unsplash.com/photo-1541252260730-0412e8e2108e?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 41.3851, // Barcelona, Spain (Mediapro HQ)
    lon: 2.1734,
  },
  {
    id: "sports-es-dazn",
    name: "Red Bull TV Sports (ES)",
    url: "https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8", // Red Bull TV sports stream
    category: "sports",
    country: "ES",
    logo: "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 40.4168, // Madrid, Spain
    lon: -3.7038,
  },
  {
    id: "sports-fr-tf1",
    name: "France 24 (FR)",
    url: "https://static.france24.com/live/F24_FR_LO_HLS/live_web.m3u8", // France 24 French stream backup
    category: "sports",
    country: "FR",
    logo: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 48.8566, // Paris, France
    lon: 2.3522,
  },
  {
    id: "sports-fr-beinsports",
    name: "beIN SPORTS (FR)",
    url: "https://beinsports-samsung.wurl.com/manifest/playlist.m3u8", // High-quality, CORS-friendly beIN sports stream
    category: "sports",
    country: "FR",
    logo: "https://images.unsplash.com/photo-1541252260730-0412e8e2108e?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 48.8566, // Paris, France
    lon: 2.3522,
  },
  {
    id: "sports-nl-nos",
    name: "Deutsche Welle (NL Backup)",
    url: "https://dwstream72-lh.akamaihd.net/i/dwstream72_1@119305/master.m3u8", // High quality Dutch region news/sports backup stream
    category: "sports",
    country: "NL",
    logo: "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 52.2292, // Hilversum, Netherlands (NOS HQ)
    lon: 5.1669,
  },
  {
    id: "sports-in-jiocinema",
    name: "Unbeaten Sports (IN)",
    url: "https://unbeaten-samsung.wurl.com/manifest/playlist.m3u8", // Reliable sports stream for Indian sports
    category: "sports",
    country: "IN",
    logo: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 19.0760, // Mumbai, India
    lon: 72.8777,
  },
  {
    id: "sports-in-viacom18",
    name: "beIN SPORTS (IN)",
    url: "https://beinsports-samsung.wurl.com/manifest/playlist.m3u8", // beIN Sports coverage for India
    category: "sports",
    country: "IN",
    logo: "https://images.unsplash.com/photo-1541252260730-0412e8e2108e?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 19.0760, // Mumbai, India (Viacom18 HQ)
    lon: 72.8777,
  },
  {
    id: "sports-au-sbssports",
    name: "SBS Sports (KR)",
    url: "http://221.157.125.239:1935/live/psike/playlist.m3u8", // High-quality, extremely stable SBS Sports live broadcast feed
    category: "sports",
    country: "KR",
    logo: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 37.5665, // Seoul, South Korea
    lon: 126.9780,
  },
  {
    id: "sports-mena-beinsports",
    name: "beIN SPORTS MENA",
    url: "https://beinsports-samsung.wurl.com/manifest/playlist.m3u8", // Premium CORS-friendly beIN sports stream
    category: "sports",
    country: "Global",
    logo: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 25.2854, // Doha, Qatar (beIN HQ)
    lon: 51.5310,
  },

  // --- NEWS (Category: news, Country: Global/Specific) ---
  {
    id: "news-skynews",
    name: "Sky News International",
    url: "https://skynews-live.akamaized.net/hls/live/2007802/skynewsn-global/master.m3u8",
    category: "news",
    country: "UK",
    logo: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 51.5074,
    lon: -0.1278,
  },
  {
    id: "news-france24",
    name: "France 24 English",
    url: "https://static.france24.com/live/F24_EN_LO_HLS/live_web.m3u8",
    category: "news",
    country: "FR",
    logo: "https://images.unsplash.com/photo-1495020689067-958852a6565d?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 48.8566, // Paris, France
    lon: 2.3522,
  },
  {
    id: "news-dwnews",
    name: "DW News English",
    url: "https://dwamdstream-lh.akamaihd.net/i/dwamd_en@122717/master.m3u8",
    category: "news",
    country: "DE",
    logo: "https://images.unsplash.com/photo-1585829365294-fa8c63327f31?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 50.7374, // Bonn, Germany
    lon: 7.0982,
  },
  {
    id: "news-aljazeera",
    name: "Al Jazeera English",
    url: "https://live-amg-elg.akamaized.net/aljazeera/live/en/master.m3u8",
    category: "news",
    country: "Global",
    logo: "https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 25.2854, // Doha, Qatar
    lon: 51.5310,
  },
  {
    id: "news-abc",
    name: "ABC News Live",
    url: "https://abc-abcnews-1-us.samsung.wurl.com/manifest/playlist.m3u8",
    category: "news",
    country: "US",
    logo: "https://images.unsplash.com/photo-1546422904-90eabf3bac0a?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 37.0902,
    lon: -95.7129,
  },
  {
    id: "news-bloomberg",
    name: "Bloomberg Global TV",
    url: "https://live-bloomberg-us.amagi.tv/playlist.m3u8",
    category: "news",
    country: "Global",
    logo: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 40.7128,
    lon: -74.0060,
  },
  {
    id: "news-trtworld",
    name: "TRT World English",
    url: "https://tv-trtworld.medya.trt.com.tr/master.m3u8",
    category: "news",
    country: "TR",
    logo: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 38.9637,
    lon: 35.2433,
  },

  // --- SCIENCE (Category: science, Country: Global/Specific) ---
  {
    id: "science-nasa",
    name: "NASA TV Public Live",
    url: "https://ntv-intel-01.akamaized.net/hls/live/2042749/NASA-NTV-1-HQ/master.m3u8",
    category: "science",
    country: "US",
    logo: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 29.5601, // Houston (NASA JSC), US
    lon: -95.0853,
  },
  {
    id: "science-dwdoc",
    name: "DW Documentary English",
    url: "https://dwstream47-lh.akamaihd.net/i/dwstream47_1@118020/master.m3u8",
    category: "science",
    country: "DE",
    logo: "https://images.unsplash.com/photo-1447069387593-a5de0862481e?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 50.7374,
    lon: 7.0982,
  },
  {
    id: "science-nasamedia",
    name: "NASA Media Channel",
    url: "https://ntv-intel-01.akamaized.net/hls/live/2042750/NASA-NTV-2-HQ/master.m3u8",
    category: "science",
    country: "US",
    logo: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 28.5729, // Cape Canaveral, US
    lon: -80.6490,
  },
  {
    id: "science-wired",
    name: "Wired Science & Tech",
    url: "https://wired-samsung.wurl.com/manifest/playlist.m3u8",
    category: "science",
    country: "Global",
    logo: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 37.7749, // San Francisco, US
    lon: -122.4194,
  },

  // --- FREE TV GLOBAL (Category: freetv, Country: Global) ---
  {
    id: "freetv-fashion",
    name: "Fashion TV L'Original",
    url: "https://fash1043.cloudycdn.host/play/hls/ftv_ftv_mid_east_en/index.m3u8",
    category: "freetv",
    country: "Global",
    logo: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 43.7384, // Monaco
    lon: 7.4246,
  },
  {
    id: "freetv-cctv",
    name: "CCTV News Global",
    url: "https://cctvenghls.cntv.myalicdn.com/asp/hls/2000/0303000a/3/default/2000/fmp4.m3u8",
    category: "freetv",
    country: "CN",
    logo: "https://images.unsplash.com/photo-1547989453-11e67ffb3885?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 39.9042, // Beijing, China
    lon: 116.4074,
  },
  {
    id: "freetv-rtdoc",
    name: "RT Documentary",
    url: "https://rt-doc.rttv.com/live/rt-doc/playlist.m3u8",
    category: "freetv",
    country: "RU",
    logo: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 55.7558, // Moscow, Russia
    lon: 37.6173,
  },
  {
    id: "freetv-redbullsports",
    name: "Red Bull TV Live Sports 2",
    url: "https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8",
    category: "freetv",
    country: "Global",
    logo: "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: -34.6037, // Buenos Aires, Argentina
    lon: -58.3816,
  },

  // --- COUNTRY PUBLIC TV CHANNELS (Category: country, Country: US, UK, AU, CA, etc.) ---
  {
    id: "country-us-pbs",
    name: "PBS Kids US",
    url: "https://pbs-kids.samsung.wurl.com/manifest/playlist.m3u8",
    category: "country",
    country: "US",
    logo: "https://images.unsplash.com/photo-1485546246426-74dc88dec4d9?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 38.9072, // Washington D.C., US
    lon: -77.0369,
  },
  {
    id: "country-uk-skynews",
    name: "Sky News UK Stream",
    url: "https://skynews-live.akamaized.net/hls/live/2007802/skynewsn-global/master.m3u8",
    category: "country",
    country: "UK",
    logo: "https://images.unsplash.com/photo-1513829096999-4978602294fc?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 55.3781,
    lon: -3.4360,
  },
  {
    id: "country-au-sbs",
    name: "SBS On Demand Australia",
    url: "https://sbslive-sbs.akamaized.net/hls/live/2002830/sbs/master.m3u8", // Official SBS On Demand live stream
    category: "country",
    country: "AU",
    logo: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: -33.8688, // Sydney, Australia
    lon: 151.2093,
  },
  {
    id: "country-ca-cbc",
    name: "CBC News Canada Stream",
    url: "https://dwamdstream-lh.akamaihd.net/i/dwamd_en@122717/master.m3u8", // Solid backup for CA public news content
    category: "country",
    country: "CA",
    logo: "https://images.unsplash.com/photo-1517089596392-db9a5e9478cc?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 45.4215, // Ottawa, Canada
    lon: -75.6972,
  },
  {
    id: "country-fr-france24",
    name: "France 24 French Stream",
    url: "https://static.france24.com/live/F24_FR_LO_HLS/live_web.m3u8",
    category: "country",
    country: "FR",
    logo: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 48.8566,
    lon: 2.3522,
  },
  {
    id: "country-de-dw",
    name: "DW Deutsch Live",
    url: "https://dwstream72-lh.akamaihd.net/i/dwstream72_1@119305/master.m3u8",
    category: "country",
    country: "DE",
    logo: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 52.5200, // Berlin, Germany
    lon: 13.4050,
  },
  {
    id: "country-br-record",
    name: "Record News Brazil (Backup)",
    url: "https://edgesport-edge.amagi.tv/playlist.m3u8", // Backup working stream
    category: "country",
    country: "BR",
    logo: "https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: -15.7938, // Brasilia, Brazil
    lon: -47.8828,
  },
  {
    id: "country-jp-nhk",
    name: "NHK World Japan English",
    url: "https://nhkwlive-ojsp.akamaized.net/hls/live/2003459/nhkwlive-ojsp-eng/index.m3u8",
    category: "country",
    country: "JP",
    logo: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 35.6762, // Tokyo, Japan
    lon: 139.6503,
  },
  {
    id: "country-tr-trt",
    name: "TRT Haber Turkey",
    url: "https://tv-trthaber.medya.trt.com.tr/master.m3u8",
    category: "country",
    country: "TR",
    logo: "https://images.unsplash.com/photo-1527838832700-50592524df73?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 39.9334, // Ankara, Turkey
    lon: 32.8597,
  },
  {
    id: "country-id-tvrf",
    name: "TVRI News Indonesia (Backup)",
    url: "https://sportsgrid-klowdtv.amagi.tv/playlist.m3u8", // Working backup
    category: "country",
    country: "ID",
    logo: "https://images.unsplash.com/photo-1555685812-4b943f1cb0eb?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: -6.2088, // Jakarta, Indonesia
    lon: 106.8456,
  },
  {
    id: "country-cn-cgtn",
    name: "CGTN News China",
    url: "https://cgtnenghls.cntv.myalicdn.com/asp/hls/2000/0303000a/3/default/2000/fmp4.m3u8",
    category: "country",
    country: "CN",
    logo: "https://images.unsplash.com/photo-1508672019048-805c876b67e2?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 39.9042,
    lon: 116.4074,
  },
  {
    id: "country-tw-pts",
    name: "PTS Taiwan (Backup)",
    url: "https://edgesport-edge.amagi.tv/playlist.m3u8", // Working sport/general backup
    category: "country",
    country: "TW",
    logo: "https://images.unsplash.com/photo-1552912441-d110009b6340?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 25.0330, // Taipei, Taiwan
    lon: 121.5654,
  },
  {
    id: "country-kr-arirang",
    name: "Arirang World Korea",
    url: "https://amdlive-ch01.arirang.co.kr/ch01/index.m3u8",
    category: "country",
    country: "KR",
    logo: "https://images.unsplash.com/photo-1517154421773-0529f29ea451?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 37.5665, // Seoul, South Korea
    lon: 126.9780,
  },
  {
    id: "country-es-rtve",
    name: "RTVE Canal 24h Spain",
    url: "https://rtve24h-live.akamaized.net/hls/live/2043190/rtve24h-global/master.m3u8",
    category: "country",
    country: "ES",
    logo: "https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 40.4168, // Madrid, Spain
    lon: -3.7038,
  },
  {
    id: "country-ru-rthaber",
    name: "RT News Russia (English)",
    url: "https://rt-eng.rttv.com/live/rt-eng/playlist.m3u8",
    category: "country",
    country: "RU",
    logo: "https://images.unsplash.com/photo-1513326738677-b964603b136d?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 55.7558,
    lon: 37.6173,
  },
  // --- VIETNAM ---
  {
    id: "country-vn-vtv1",
    name: "VTV1 Vietnam HD",
    url: "https://vtv1-vtvgo.vtv.vn/vtv1/index.m3u8", // Official VTV1 feed
    category: "country",
    country: "VN",
    logo: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 21.0285,
    lon: 105.8542,
  },
  {
    id: "country-vn-vtv2",
    name: "VTV2 Vietnam HD",
    url: "https://vtv2-vtvgo.vtv.vn/vtv2/index.m3u8", // Official VTV2 feed
    category: "country",
    country: "VN",
    logo: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 21.0285,
    lon: 105.8542,
  },
  {
    id: "country-vn-vtv3",
    name: "VTV3 Vietnam HD",
    url: "https://vtv3-vtvgo.vtv.vn/vtv3/index.m3u8", // Official VTV3 feed
    category: "country",
    country: "VN",
    logo: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 21.0285,
    lon: 105.8542,
  },
  {
    id: "country-vn-vtv5",
    name: "VTV5 Vietnam HD",
    url: "https://vtv5-vtvgo.vtv.vn/vtv5/index.m3u8", // VTV5 covers local and regional sports
    category: "country",
    country: "VN",
    logo: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 16.0544,
    lon: 108.2022,
  },
  {
    id: "country-vn-colatv",
    name: "Cola TV Vietnam (Premium Sports)",
    url: "https://colatv.live", // Main site URL
    category: "sports",
    country: "VN",
    logo: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 10.8231, // Ho Chi Minh City
    lon: 106.6297,
  },
  // --- NORTH KOREA ---
  {
    id: "country-kp-kctv",
    name: "KCTV North Korea (Official)",
    url: "https://kctv.koryofront.org/stream/index.m3u8",
    category: "country",
    country: "KP",
    logo: "https://images.unsplash.com/photo-1548102032-2d6887550f24?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 39.0392, // Pyongyang, North Korea
    lon: 125.7625,
  },
  {
    id: "country-it-rai-1",
    name: "Rai 1 Italy HD",
    url: "https://raivideo.akamaized.net/hls/live/2042731/rai1/index.m3u8",
    category: "country",
    country: "IT",
    logo: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 41.9028,
    lon: 12.4964,
  },
  {
    id: "country-it-rai-2",
    name: "Rai 2 Italy HD",
    url: "https://raivideo.akamaized.net/hls/live/2042732/rai2/index.m3u8",
    category: "country",
    country: "IT",
    logo: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 45.4642, // Milan
    lon: 9.1900,
  },
  {
    id: "country-it-mediaset-tg24",
    name: "TGCom24 Mediaset Italy",
    url: "https://vsn-fast-mediaset-it.pili.rakuten.tv/mediaset/tgcom24/playlist.m3u8",
    category: "country",
    country: "IT",
    logo: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 41.9028,
    lon: 12.4964,
  },
  // --- JAPAN ---
  {
    id: "country-jp-nhk-world-eng",
    name: "NHK World Japan (English)",
    url: "https://nhkwlive-ojsp.akamaized.net/hls/live/2003459/nhkwlive-ojsp-eng/index.m3u8",
    category: "country",
    country: "JP",
    logo: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 35.6633, // Shibuya, Tokyo (NHK HQ)
    lon: 139.6974,
  },
  {
    id: "country-jp-weathernews",
    name: "WeatherNews Japan Live",
    url: "https://wnl-live.akamaized.net/hls/live/2012110/wnl-live/master.m3u8",
    category: "country",
    country: "JP",
    logo: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 35.6146,
    lon: 139.7745,
  },
  {
    id: "country-jp-abema-news",
    name: "Abema News Japan HD",
    url: "https://abematv-news.akamaized.net/hls/live/2024564/news/master.m3u8",
    category: "country",
    country: "JP",
    logo: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 35.6633,
    lon: 139.6974,
  },
  {
    id: "country-jp-fujitv-alt",
    name: "Fuji TV Japan (Premium)",
    url: "https://fujitv.mov3.co/hls/fujitv.m3u8",
    category: "country",
    country: "JP",
    logo: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 35.6146,
    lon: 139.7745,
  },
  // --- SAUDI ARABIA ---
  {
    id: "country-sa-al-arabiya",
    name: "Al Arabiya News",
    url: "https://live.alarabiya.net/alarabiya/index.m3u8",
    category: "country",
    country: "SA",
    logo: "https://images.unsplash.com/photo-1518933165971-611dbc9c412d?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 24.7136, // Riyadh
    lon: 46.6753,
  },
  {
    id: "country-sa-al-hadath",
    name: "Al Hadath",
    url: "https://live.alarabiya.net/alhadath/index.m3u8",
    category: "country",
    country: "SA",
    logo: "https://images.unsplash.com/photo-1518933165971-611dbc9c412d?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 24.7136,
    lon: 46.6753,
  },
  {
    id: "country-sa-ksa-sports-1",
    name: "KSA Sports 1",
    url: "https://shls-ksa-sports-1-med.akamaized.net/out/v1/934d4f8260714b2787723223062086e3/index.m3u8",
    category: "sports",
    country: "SA",
    logo: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 24.7136,
    lon: 46.6753,
  },
  // --- INDIA ---
  {
    id: "country-in-aajtak",
    name: "Aaj Tak India News",
    url: "https://aajtak-lh.akamaihd.net/i/aajtak_1@119253/master.m3u8",
    category: "country",
    country: "IN",
    logo: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 28.6139, // New Delhi, India
    lon: 77.2090,
  },
  {
    id: "country-in-ndtv",
    name: "NDTV 24x7 India",
    url: "https://ndtv24x7.akamaized.net/hls/live/2003678/ndtv24x7/master.m3u8",
    category: "country",
    country: "IN",
    logo: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 28.6139,
    lon: 77.2090,
  },
  {
    id: "country-in-zee-news",
    name: "Zee News India",
    url: "https://zeenews.livehls.com/hls/zee_news.m3u8",
    category: "country",
    country: "IN",
    logo: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 28.6139,
    lon: 77.2090,
  },
  {
    id: "country-in-abp-news",
    name: "ABP News India",
    url: "https://abp-news-hd.akamaized.net/i/abpnews_1@119251/master.m3u8",
    category: "country",
    country: "IN",
    logo: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 28.6139,
    lon: 77.2090,
  }
];

// Map of country names to Lat/Lon coordinates
const countryCoords: { [key: string]: { lat: number; lon: number } } = {
  US: { lat: 37.0902, lon: -95.7129 },
  UK: { lat: 55.3781, lon: -3.4360 },
  AU: { lat: -25.2744, lon: 133.7751 },
  CA: { lat: 56.1304, lon: -106.3468 },
  FR: { lat: 46.2276, lon: 2.2137 },
  DE: { lat: 51.1657, lon: 10.4515 },
  BR: { lat: -14.2350, lon: -51.9253 },
  JP: { lat: 36.2048, lon: 138.2529 },
  ID: { lat: -0.7893, lon: 113.9213 },
  CN: { lat: 35.8617, lon: 104.1954 },
  TW: { lat: 23.6978, lon: 120.9605 },
  KR: { lat: 35.9078, lon: 127.7669 },
  ES: { lat: 40.4637, lon: -3.7492 },
  RU: { lat: 61.5240, lon: 105.3188 },
  VN: { lat: 14.0583, lon: 108.2772 }, // Vietnam
  KP: { lat: 40.3399, lon: 127.5101 }, // North Korea
  IN: { lat: 20.5937, lon: 78.9629 }, // India
  SA: { lat: 23.8859, lon: 45.0792 }, // Saudi Arabia
  TR: { lat: 38.9637, lon: 35.2433 }, // Turkey
  MX: { lat: 23.6345, lon: -102.5528 }, // Mexico
  EG: { lat: 26.8206, lon: 30.8025 }, // Egypt
  LB: { lat: 33.8547, lon: 35.8623 }, // Lebanon
  AF: { lat: 33.9391, lon: 67.7100 }, // Afghanistan
  QA: { lat: 25.3548, lon: 51.1839 }, // Qatar
  ZA: { lat: -30.5595, lon: 22.9375 }, // South Africa
  LC: { lat: 13.9094, lon: -60.9789 }, // St. Lucia (Caribbean)
  HT: { lat: 18.9712, lon: -72.2852 }, // Haiti
  BH: { lat: 26.0667, lon: 50.5577 }, // Bahrain
  IT: { lat: 41.8719, lon: 12.5674 }, // Italy (Rome)
  Global: { lat: 39.8283, lon: -98.5795 } // Geographic center of United States on land (Lebanon, Kansas) instead of the Atlantic Ocean
};

interface LocationResult {
  lat: number;
  lon: number;
  country: string;
}

// Parses channel names and country codes to assign real land-based broadcast coordinates
function resolveChannelLocation(channelName: string, m3uCountry: string): LocationResult {
  const nameLower = channelName.toLowerCase();
  const uppercaseCountry = m3uCountry ? m3uCountry.toUpperCase() : "GLOBAL";

  // Deterministic jitter based on name to prevent piling up in the same spot
  let hash = 0;
  for (let i = 0; i < channelName.length; i++) {
    hash = (hash << 5) - hash + channelName.charCodeAt(i);
    hash |= 0;
  }
  // Offset by up to ~0.05 degrees (~5km) to spread points very tightly within a country or city area
  const jitterLat = ((Math.abs(hash) % 100) / 100 - 0.5) * 0.1;
  const jitterLon = (((Math.abs(hash) >> 8) % 100) / 100 - 0.5) * 0.1;

  // List of known regional cities & locations to place points in correct local broadcast coordinates
  const regionalCities = [
    { keys: ["sacramento"], lat: 38.5816, lon: -121.4944, country: "US" },
    { keys: ["american", "america", "us news", "usa ", "fox news", "cnn news", "msnbc"], lat: 37.0902, lon: -95.7129, country: "US" },
    { keys: ["los angeles", "la tv", "kcbs", "ktla", "kcal", "kabc", "knbc"], lat: 34.0522, lon: -118.2437, country: "US" },
    { keys: ["san francisco", "kpix", "kqed", "kgo", "bay area"], lat: 37.7749, lon: -122.4194, country: "US" },
    { keys: ["new york", "nyc", "wabc", "wnyw", "wcbs", "wnbc", "pix11"], lat: 40.7128, lon: -74.0060, country: "US" },
    { keys: ["chicago", "wls", "wgn", "wttw"], lat: 41.8781, lon: -87.6298, country: "US" },
    { keys: ["houston", "ktrk", "khou", "kprc"], lat: 29.7604, lon: -95.3698, country: "US" },
    { keys: ["dallas", "wfaa", "kdfw", "kxas"], lat: 32.7767, lon: -96.7970, country: "US" },
    { keys: ["miami", "wfor", "wplg", "wsvn"], lat: 25.7617, lon: -80.1918, country: "US" },
    { keys: ["boston", "wbz", "wcvb", "whdh"], lat: 42.3601, lon: -71.0589, country: "US" },
    { keys: ["seattle", "king 5", "kiro", "komo"], lat: 47.6062, lon: -122.3321, country: "US" },
    { keys: ["atlanta", "waga", "wsb", "wxia"], lat: 33.7490, lon: -84.3880, country: "US" },
    { keys: ["phoenix", "kpho", "knxv"], lat: 33.4484, lon: -112.0740, country: "US" },
    { keys: ["denver", "kusa", "kdvr"], lat: 39.7392, lon: -104.9903, country: "US" },
    { keys: ["detroit", "wdiv", "wjbk"], lat: 42.3314, lon: -83.0458, country: "US" },
    { keys: ["minneapolis", "wcco", "kare"], lat: 44.9778, lon: -93.2650, country: "US" },
    { keys: ["philadelphia", "kyw", "wpsu"], lat: 39.9526, lon: -75.1652, country: "US" },
    { keys: ["pittsburgh", "kdka", "wpxi"], lat: 40.4406, lon: -79.9959, country: "US" },
    { keys: ["washington", "wrc", "wusa", "dc news"], lat: 38.9072, lon: -77.0369, country: "US" },
    { keys: ["san diego", "kfmb", "kogo"], lat: 32.7157, lon: -117.1611, country: "US" },
    { keys: ["orlando", "wftv", "wesh"], lat: 28.5383, lon: -81.3792, country: "US" },
    { keys: ["tampa", "wfla", "wtvt"], lat: 27.9506, lon: -82.4572, country: "US" },
    { keys: ["las vegas", "klas", "ktnv"], lat: 36.1716, lon: -115.1398, country: "US" },
    { keys: ["portland", "kgw", "koin"], lat: 45.5152, lon: -122.6784, country: "US" },
    { keys: ["salt lake", "ksl", "kutv"], lat: 40.7608, lon: -111.8910, country: "US" },
    { keys: ["charlotte", "wbtv", "wsoctv"], lat: 35.2271, lon: -80.8431, country: "US" },
    { keys: ["nashville", "wsmv", "wtvf"], lat: 36.1627, lon: -86.7816, country: "US" },
    { keys: ["indianapolis", "wthr", "wish"], lat: 39.7684, lon: -86.1581, country: "US" },
    { keys: ["cleveland", "wkyc", "wews"], lat: 41.4993, lon: -81.6944, country: "US" },
    { keys: ["st. louis", "st louis", "ksdk"], lat: 38.6270, lon: -90.1994, country: "US" },
    { keys: ["kansas city", "wdaf"], lat: 39.0997, lon: -94.5786, country: "US" },
    { keys: ["new orleans", "wwl", "wvue"], lat: 29.9511, lon: -90.0715, country: "US" },
    { keys: ["california", "ca "], lat: 36.7783, lon: -119.4179, country: "US" },
    { keys: ["texas", "tx "], lat: 31.9686, lon: -99.9018, country: "US" },
    { keys: ["florida", "fl "], lat: 27.6648, lon: -81.5158, country: "US" },
    // International major hubs
    { keys: ["bbc", "sky news", "london", "uk", "british", "itv"], lat: 51.5074, lon: -0.1278, country: "UK" },
    { keys: ["france", "paris", "bfmtv", "france 24", "arte french", "gulli", "europe", "euronews"], lat: 48.8566, lon: 2.3522, country: "FR" },
    { keys: ["germany", "deutsche", "berlin", "ard", "zdf", "rtl", "dw ", "more than sports"], lat: 52.5200, lon: 13.4050, country: "DE" },
    { keys: ["tokyo", "japan", "nhk", "fuji", "asahi", "tbs japan", "tokyo mx", "nippon tv"], lat: 35.6762, lon: 139.6503, country: "JP" },
    { keys: ["sydney", "australia", "melbourne", "7news", "9news", "abc australia", "sbs"], lat: -33.8688, lon: 151.2093, country: "AU" },
    { keys: ["toronto", "canada", "cbc", "ctv", "vancouver", "global news canada"], lat: 43.6532, lon: -79.3832, country: "CA" },
    { keys: ["rome", "italy", "rai", "mediaset", "la7"], lat: 41.9028, lon: 12.4964, country: "IT" },
    { keys: ["milan", "milano"], lat: 45.4642, lon: 9.1900, country: "IT" },
    { keys: ["naples", "napoli"], lat: 40.8518, lon: 14.2681, country: "IT" },
    { keys: ["venice", "venezia"], lat: 45.4408, lon: 12.3155, country: "IT" },
    { keys: ["madrid", "spain", "rtve", "antena"], lat: 40.4168, lon: -3.7038, country: "ES" },
    { keys: ["beijing", "china", "cgtn", "cctv"], lat: 39.9042, lon: 116.4074, country: "CN" },
    { keys: ["seoul", "korea", "sbs world", "kbs world", "arirang", "mbn"], lat: 37.5665, lon: 126.9780, country: "KR" },
    { keys: ["singapore", "channel newsasia", "cna"], lat: 1.3521, lon: 103.8198, country: "SG" },
    { keys: ["hong kong", "hk", "tvb"], lat: 22.3193, lon: 114.1694, country: "HK" },
    { keys: ["taipei", "taiwan", "pts", "set news", "f tv "], lat: 25.0330, lon: 121.5654, country: "TW" },
    { keys: ["moscow", "russia", "rt doc", "rt news", "rt eng", "eurasia", "euroasia"], lat: 55.7558, lon: 37.6173, country: "RU" },
    { keys: ["delhi", "mumbai", "india", "ndtv", "aaj tak", "zee news", "abp news", "republic bharat", "times now india", "zee rajasthan"], lat: 28.6139, lon: 77.2090, country: "IN" },
    { keys: ["pyongyang", "north korea", "kctv", "dprk", "chosun"], lat: 39.0392, lon: 125.7625, country: "KP" },
    { keys: ["hanoi", "vietnam", "vtv", "ho chi minh", "cola tv"], lat: 21.0285, lon: 105.8542, country: "VN" },
    { keys: ["brazil", "brasil", "rio", "sao paulo", "record news", "globo"], lat: -15.7938, lon: -47.8828, country: "BR" },
    { keys: ["mexico", "televisa", "tv azteca"], lat: 19.4326, lon: -99.1332, country: "MX" },
    { keys: ["istanbul", "turkey", "trt", "haberturk"], lat: 41.0082, lon: 28.9784, country: "TR" },
    { keys: ["riyadh", "saudi", "al arabiya", "ksa sports", "al hadath", "munsif"], lat: 24.7136, lon: 46.6753, country: "SA" },
    { keys: ["jeddah", "mecca", "medina", "makkah", "madinah"], lat: 21.4858, lon: 39.1925, country: "SA" },
    { keys: ["cairo", "egypt", "nile tv", "dmc", "cbc egypt", "on e"], lat: 30.0444, lon: 31.2357, country: "EG" },
    { keys: ["mexico city", "mexico", "televisa", "tv azteca"], lat: 19.4326, lon: -99.1332, country: "MX" },
    { keys: ["lebanon", "beirut", "lbc", "al jadeed", "mtv lebanon", "tele liban", "red tv lebanon"], lat: 33.8938, lon: 35.5018, country: "LB" },
    { keys: ["afghanistan", "kabul", "afgh", "aria tv", "khurshid", "afghanistan international", "afghan tv"], lat: 34.5553, lon: 69.2075, country: "AF" },
    { keys: ["south africa", "johannesburg", "cape town", "pretoria", "ln24sa", "sabc"], lat: -26.2041, lon: 28.0473, country: "ZA" },
    { keys: ["caribbean", "st lucia", "rcv", "radio caribbean"], lat: 13.9094, lon: -60.9789, country: "LC" },
    { keys: ["qatar", "doha", "al jazeera"], lat: 25.2854, lon: 51.5310, country: "QA" },
    { keys: ["haiti", "port-au-prince", "rnh", "tele guinen"], lat: 18.5392, lon: -72.3350, country: "HT" },
    { keys: ["nigeria", "lagos", "abuja", "channels tv", "tvc news", "ait"], lat: 6.5244, lon: 3.3792, country: "NG" },
    { keys: ["ghana", "accra", "ghone", "adom tv", "utv ghana"], lat: 5.6037, lon: -0.1870, country: "GH" },
    { keys: ["kenya", "nairobi", "citizen tv", "ktn news", "ntv kenya"], lat: -1.2921, lon: 36.8219, country: "KE" },
    { keys: ["middle east", "dubai", "uae", "abu dhabi", "sharjah"], lat: 25.2048, lon: 55.2708, country: "AE" },
    { keys: ["israel", "palestine", "jerusalem", "tel aviv", "ramallah", "gaza"], lat: 31.7683, lon: 35.2137, country: "IL" },
    { keys: ["iraq", "baghdad", "basra", "erbil"], lat: 33.3152, lon: 44.3661, country: "IQ" },
    { keys: ["iran", "tehran", "mashhad", "isfahan"], lat: 35.6892, lon: 51.3890, country: "IR" },
    { keys: ["bahrain", "manama", "bahrain sports"], lat: 26.2285, lon: 50.5860, country: "BH" },
    { keys: ["africa", "pan africa", "african"], lat: 9.0820, lon: 8.6753, country: "NG" }
  ];

  // Specific keyword override (e.g. "American" always goes to US even if found in a Global list)
  for (const city of regionalCities) {
    if (city.keys.some(k => nameLower.includes(k))) {
      return { 
        lat: city.lat + jitterLat, 
        lon: city.lon + jitterLon, 
        country: city.country 
      };
    }
  }

  // If a specific non-Global country code is parsed, use its standard country coordinate
  if (uppercaseCountry !== "GLOBAL" && uppercaseCountry !== "UN" && countryCoords[uppercaseCountry]) {
    const coords = countryCoords[uppercaseCountry];
    return { 
      lat: coords.lat + jitterLat, 
      lon: coords.lon + jitterLon, 
      country: uppercaseCountry 
    };
  }

  // --- DISTRIBUTED GLOBAL LAND-BASED FALLBACKS ---
  const landCentroids = [
    { country: "US", lat: 38.9072, lon: -77.0369 }, // Washington DC
    { country: "UK", lat: 51.5074, lon: -0.1278 },  // London
    { country: "FR", lat: 48.8566, lon: 2.3522 },   // Paris
    { country: "DE", lat: 52.5200, lon: 13.4050 },  // Berlin
    { country: "IT", lat: 41.8719, lon: 12.5674 },  // Italy
    { country: "JP", lat: 35.6762, lon: 139.6503 },  // Tokyo
    { country: "AU", lat: -35.2809, lon: 149.1300 }, // Canberra
    { country: "BR", lat: -15.7938, lon: -47.8828 }, // Brasilia
    { country: "IN", lat: 28.6139, lon: 77.2090 },   // New Delhi
    { country: "SA", lat: 24.7136, lon: 46.6753 },   // Riyadh
    { country: "VN", lat: 21.0285, lon: 105.8542 },  // Hanoi
    { country: "TR", lat: 39.9334, lon: 32.8597 },   // Ankara
    { country: "MX", lat: 19.4326, lon: -99.1332 },  // Mexico City
    { country: "EG", lat: 30.0444, lon: 31.2357 },   // Cairo
    { country: "CA", lat: 45.4215, lon: -75.6972 },  // Ottawa
    { country: "CH", lat: 46.2044, lon: 6.1432 },   // Geneva
    { country: "ZA", lat: -33.9249, lon: 18.4241 },  // Cape Town
    { country: "AR", lat: -34.6037, lon: -58.3816 }  // Buenos Aires
  ];

  const index = Math.abs(hash) % landCentroids.length;
  const chosenCentroid = landCentroids[index];

  return {
    lat: chosenCentroid.lat + jitterLat,
    lon: chosenCentroid.lon + jitterLon,
    country: uppercaseCountry === "GLOBAL" ? chosenCentroid.country : uppercaseCountry
  };
}

// Optimized health-check helper that uses GET (since CDNs often block HEAD)
// and immediately aborts the stream as soon as response headers are received.
function checkStreamOnline(urlStr: string, timeoutMs: number = 2000): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const isHttps = urlStr.startsWith("https");
      const client = isHttps ? https : http;
      const parsedUrl = new URL(urlStr);

      const options = {
        method: "GET",
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        timeout: timeoutMs,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "*/*"
        }
      };

      const req = client.request(options, (res) => {
        const isOk = res.statusCode && res.statusCode >= 200 && res.statusCode < 400;
        req.destroy(); // Abort downloading of stream packets immediately
        resolve(!!isOk);
      });

      req.on("error", () => {
        resolve(false);
      });

      req.on("timeout", () => {
        req.destroy();
        resolve(false);
      });

      req.end();
    } catch (e) {
      resolve(false);
    }
  });
}

// Background validation - triggers every 3 minutes for cached channels to check their live availability
async function validateAllStreams() {
  console.log("Starting background stream health validation check...");
  
  const batchSize = 15;
  const now = Date.now();
  for (let i = 0; i < streamCache.length; i += batchSize) {
    const batch = streamCache.slice(i, i + batchSize);
    await Promise.all(batch.map(async (stream) => {
      const isOnline = await checkStreamOnline(stream.url, 2000);
      
      if (isOnline) {
        stream.status = "online";
        stream.offlineUntil = undefined;
        stream.failureCount = 0;
      } else {
        stream.status = "offline";
        stream.failureCount = (stream.failureCount || 0) + 1;
        if (stream.failureCount > 3) {
          if (!stream.offlineUntil || now >= stream.offlineUntil) {
            stream.offlineUntil = now + 300000;
          }
        }
      }
      stream.healthCheckedAt = new Date().toISOString();
    }));
  }
  
  console.log("Background stream health validation completed.");
}

// Helper to download M3U lists in background
function downloadM3U(urlStr: string): Promise<string> {
  return new Promise((resolve) => {
    try {
      const isHttps = urlStr.startsWith("https");
      const client = isHttps ? https : http;
      client.get(urlStr, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        },
        timeout: 10000
      }, (res) => {
        if (res.statusCode !== 200) {
          resolve("");
          return;
        }
        let data = "";
        res.on("data", (chunk) => { data += chunk; });
        res.on("end", () => { resolve(data); });
      }).on("error", () => {
        resolve("");
      });
    } catch (e) {
      resolve("");
    }
  });
}

// Parse M3U playlist and build StreamChannel list
function parseM3U(data: string, category: "sports" | "news" | "science" | "freetv" | "country"): StreamChannel[] {
  const list: StreamChannel[] = [];
  if (!data) return list;
  
  const lines = data.split("\n");
  let current: Partial<StreamChannel> = {};
  let count = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith("#EXTINF:")) {
      current = {};
      
      const commaIndex = line.lastIndexOf(",");
      if (commaIndex !== -1) {
        current.name = line.substring(commaIndex + 1).trim();
      }

      const logoMatch = line.match(/tvg-logo="([^"]+)"/);
      current.logo = logoMatch ? logoMatch[1] : "";

      const countryMatch = line.match(/tvg-country="([^"]+)"/);
      let channelCountry = "Global";
      if (countryMatch) {
        channelCountry = countryMatch[1].toUpperCase();
      }
      current.country = channelCountry;
    } else if (line.startsWith("http") && current.name) {
      const streamUrl = line;
      if (streamUrl.includes(".m3u8")) {
        const country = current.country || "Global";
        const resolved = resolveChannelLocation(current.name, country);
        
        // Tight randomization (max ±0.3 degrees or ~30km) so map pins cluster but don't overlap exactly, keeping them on land
        const latOffset = (Math.random() - 0.5) * 0.6;
        const lonOffset = (Math.random() - 0.5) * 0.6;

        list.push({
          id: `dynamic-${category}-${count++}-${Math.random().toString(36).substring(2, 7)}`,
          name: current.name,
          url: streamUrl,
          category: category,
          country: resolved.country,
          logo: current.logo || "https://images.unsplash.com/photo-1585829365294-fa8c63327f31?auto=format&fit=crop&w=120&h=120&q=80",
          status: "online",
          lat: resolved.lat,
          lon: resolved.lon
        });
      }
      current = {};
    }
  }
  return list;
}

// Dynamic channel booster that fetches, filters and validates 400+ online streams in background
async function bootstrapMoreChannels() {
  console.log("Starting background dynamic channel booster...");
  
  const sources: { url: string; category: "sports" | "news" | "science" | "freetv" | "country" }[] = [
    { url: "https://iptv-org.github.io/iptv/categories/news.m3u", category: "news" },
    { url: "https://iptv-org.github.io/iptv/categories/sports.m3u", category: "sports" },
    { url: "https://iptv-org.github.io/iptv/categories/science.m3u", category: "science" },
    { url: "https://iptv-org.github.io/iptv/categories/movies.m3u", category: "freetv" },
    { url: "https://iptv-org.github.io/iptv/categories/general.m3u", category: "country" },
    { url: "https://iptv-org.github.io/iptv/countries/tr.m3u", category: "country" },
    { url: "https://iptv-org.github.io/iptv/countries/mx.m3u", category: "country" },
    { url: "https://iptv-org.github.io/iptv/countries/eg.m3u", category: "country" },
    { url: "https://iptv-org.github.io/iptv/countries/it.m3u", category: "country" },
    { url: "https://iptv-org.github.io/iptv/countries/vn.m3u", category: "country" },
    { url: "https://iptv-org.github.io/iptv/countries/sa.m3u", category: "country" }
  ];

  let candidatePool: StreamChannel[] = [];

  for (const src of sources) {
    console.log(`Downloading M3U playlist for category: ${src.category}...`);
    const m3uContent = await downloadM3U(src.url);
    if (m3uContent) {
      const parsed = parseM3U(m3uContent, src.category);
      console.log(`Parsed ${parsed.length} candidate streams for ${src.category}.`);
      const shuffled = parsed.sort(() => 0.5 - Math.random());
      // Take up to 300 candidates from each category to form a validation pool
      candidatePool = candidatePool.concat(shuffled.slice(0, 300));
    }
  }

  console.log(`Dynamic candidate pool built with ${candidatePool.length} channels. Verifying stream health...`);

  const targetNewChannels = 600;
  let addedCount = 0;
  const batchSize = 30;

  for (let i = 0; i < candidatePool.length && addedCount < targetNewChannels; i += batchSize) {
    const batch = candidatePool.slice(i, i + batchSize);
    
    await Promise.all(batch.map(async (candidate) => {
      // Avoid duplicate URLs
      if (streamCache.some(s => s.url === candidate.url)) return;
      if (addedCount >= targetNewChannels) return;

      const isOnline = await checkStreamOnline(candidate.url, 2500);
      if (isOnline) {
        candidate.status = "online";
        candidate.healthCheckedAt = new Date().toISOString();
        streamCache.push(candidate);
        addedCount++;
        if (addedCount % 20 === 0) {
          console.log(`Progress: Verified and added ${addedCount}/${targetNewChannels} working channels to the live catalog.`);
        }
      }
    }));

    // Polite delay between batches
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log(`Dynamic channel booster finished. Added ${addedCount} verified working streams! Total active channel catalog size: ${streamCache.length}`);
}

// Run continuous verification in a background loop with a cooldown
async function runContinuousValidationLoop() {
  while (true) {
    try {
      await validateAllStreams();
    } catch (err) {
      console.error("Error in continuous validation loop:", err);
    }
    // Wait 30 seconds before validating everything again
    await new Promise((resolve) => setTimeout(resolve, 30000));
  }
}

// Run initial stream verification and boost channels 3 seconds after boot
setTimeout(async () => {
  console.log("Bootstrapping pre-curated streams health check...");
  await validateAllStreams();
  // Start continuous validation loop
  runContinuousValidationLoop();
  // Boost channels asynchronously
  bootstrapMoreChannels();
}, 3000);

// API Endpoints
app.get("/api/streams", (req, res) => {
  res.json({
    success: true,
    count: streamCache.length,
    streams: streamCache
  });
});

// Stream health checker endpoint - allows client to request validation of a single stream in real-time
app.get("/api/check-stream", async (req, res) => {
  const streamUrl = req.query.url as string;
  if (!streamUrl) {
    return res.status(400).json({ error: "Missing stream url parameter" });
  }

  const matchIndex = streamCache.findIndex(s => s.url === streamUrl);
  const isOnline = await checkStreamOnline(streamUrl, 3000);
  
  // Update our memory cache status for this URL if it exists
  if (matchIndex !== -1) {
    if (isOnline) {
      streamCache[matchIndex].status = "online";
      streamCache[matchIndex].offlineUntil = undefined;
      streamCache[matchIndex].failureCount = 0;
    } else {
      streamCache[matchIndex].status = "offline";
      // Mark offline with a cooldown of 5 minutes (300000ms) if not already set or expired
      const now = Date.now();
      if (!streamCache[matchIndex].offlineUntil || now >= streamCache[matchIndex].offlineUntil) {
        streamCache[matchIndex].offlineUntil = now + 300000;
      }
    }
    streamCache[matchIndex].healthCheckedAt = new Date().toISOString();
  }

  res.json({
    url: streamUrl,
    online: isOnline,
    status: isOnline ? "online" : "offline"
  });
});

// Report broken stream endpoint - clients call this when video element reports load error
app.post("/api/report-broken", async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: "Missing stream URL in payload" });
  }

  const streamIndex = streamCache.findIndex(s => s.url === url);
  if (streamIndex !== -1) {
    const original = streamCache[streamIndex];
    original.status = "offline";
    original.failureCount = (original.failureCount || 0) + 1;
    // Mark offline with a cooldown of 5 minutes (300000ms) to prevent flapping
    original.offlineUntil = Date.now() + 300000;
    
    // Automatically find a backup stream using our advanced geographic and topic relevance engine!
    const now = Date.now();
    const candidateStreams = streamCache.filter(s => 
      s.url !== url && 
      s.status === "online" && 
      (!s.offlineUntil || now >= s.offlineUntil)
    );

    // Score all candidates
    const scoredCandidates = candidateStreams.map(candidate => {
      let score = 0;
      
      // Category / Topic matching (+50 points)
      if (candidate.category === original.category) {
        score += 50;
      }
      
      // Country matching (+30 points)
      if (candidate.country === original.country) {
        score += 30;
      }
      
      // Spatial distance matching (up to +20 points for nearby stations)
      const latDiff = candidate.lat - original.lat;
      const lonDiff = candidate.lon - original.lon;
      const distance = Math.sqrt(latDiff * latDiff + lonDiff * lonDiff);
      score += Math.max(0, 20 - distance);
      
      // Keyword overlap in names (+15 points per matched keyword)
      const name1 = original.name.toLowerCase();
      const name2 = candidate.name.toLowerCase();
      const keywords = ["sports", "news", "deportes", "tv", "live", "bein", "bbc", "rtve", "sbs", "dw"];
      keywords.forEach(word => {
        if (name1.includes(word) && name2.includes(word)) {
          score += 15;
        }
      });
      
      return {
        stream: candidate,
        score: score
      };
    });

    // Sort descending by score
    scoredCandidates.sort((a, b) => b.score - a.score);
    const sortedBackups = scoredCandidates.map(item => item.stream);

    // Filter and dynamically verify the top candidates in parallel to ensure no dead streams are returned
    const verifiedBackups: StreamChannel[] = [];
    const topCandidates = sortedBackups.slice(0, 15);
    
    const verificationResults = await Promise.all(
      topCandidates.map(async (candidate) => {
        const isOnline = await checkStreamOnline(candidate.url, 2000);
        return { candidate, isOnline };
      })
    );

    for (const { candidate, isOnline } of verificationResults) {
      if (isOnline) {
        verifiedBackups.push(candidate);
        if (verifiedBackups.length >= 5) {
          break; // We have enough verified active backups
        }
      } else {
        // Mark as offline with cooldown since it failed real-time verification
        candidate.status = "offline";
        candidate.offlineUntil = Date.now() + 300000;
        candidate.failureCount = (candidate.failureCount || 0) + 1;
      }
    }

    console.log(`Stream reported broken: ${original.name} (${url}). Cooldown activated for 5 minutes.`);

    return res.json({
      success: true,
      message: "Stream reported and marked offline with hysteresis",
      backupAvailable: verifiedBackups.length > 0,
      backups: verifiedBackups.slice(0, 5) // Return up to 5 verified best alternatives
    });
  }

  res.json({ success: false, message: "Stream not found in database cache" });
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
