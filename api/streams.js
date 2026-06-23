// api/streams.js
import https from "https";
import http from "http";

// Interface for streams (JS version)
// {
//   id: string;
//   name: string;
//   url: string;
//   category: "sports" | "news" | "science" | "freetv" | "country";
//   country: string;
//   logo: string;
//   status: "online" | "unstable" | "offline";
//   lat: number;
//   lon: number;
// }

// Map of country names to Lat/Lon coordinates
const countryCoords = {
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
  VN: { lat: 14.0583, lon: 108.2772 },
  KP: { lat: 40.3399, lon: 127.5101 },
  IN: { lat: 20.5937, lon: 78.9629 },
  SA: { lat: 23.8859, lon: 45.0792 },
  TR: { lat: 38.9637, lon: 35.2433 },
  MX: { lat: 23.6345, lon: -102.5528 },
  EG: { lat: 26.8206, lon: 30.8025 },
  LB: { lat: 33.8547, lon: 35.8623 },
  AF: { lat: 33.9391, lon: 67.7100 },
  QA: { lat: 25.3548, lon: 51.1839 },
  ZA: { lat: -30.5595, lon: 22.9375 },
  LC: { lat: 13.9094, lon: -60.9789 },
  HT: { lat: 18.9712, lon: -72.2852 },
  BH: { lat: 26.0667, lon: 50.5577 },
  IT: { lat: 41.8719, lon: 12.5674 },
  Global: { lat: 39.8283, lon: -98.5795 }
};

// Regional Cities for location resolution
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
    { keys: ["delhi", "mumbai", "india", "ndtv", "aaj tak", "zee news", "abp news", "republic bharat", "times now india", "zee rajasthan"], lat: 28.6139, lon: 77.2090, country: "IN" },
    { keys: ["riyadh", "saudi", "al arabiya", "ksa sports", "al hadath", "munsif", "mecca", "medina", "makkah", "madinah"], lat: 24.7136, lon: 46.6753, country: "SA" },
    { keys: ["cairo", "egypt", "nile tv", "dmc", "cbc egypt", "on e"], lat: 30.0444, lon: 31.2357, country: "EG" },
    { keys: ["lebanon", "beirut", "lbc", "al jadeed", "mtv lebanon", "tele liban", "red tv lebanon"], lat: 33.8938, lon: 35.5018, country: "LB" },
    { keys: ["afghanistan", "kabul", "afgh", "aria tv", "khurshid", "afghanistan international", "afghan tv"], lat: 34.5553, lon: 69.2075, country: "AF" },
    { keys: ["qatar", "doha", "al jazeera"], lat: 25.2854, lon: 51.5310, country: "QA" },
    { keys: ["middle east", "dubai", "uae", "abu dhabi", "sharjah"], lat: 25.2048, lon: 55.2708, country: "AE" },
    { keys: ["istanbul", "turkey", "trt", "haberturk"], lat: 41.0082, lon: 28.9784, country: "TR" },
    { keys: ["tokyo", "nhk", "fuji tv", "fujitv", "asahi", "tbs japan", "tokyo mx", "nippon tv", "abema", "weathernews japan", "wowow", "sky a+", "gaora", "j sports"], lat: 35.6762, lon: 139.6503, country: "JP" },
    { keys: ["beijing", "china", "cgtn", "cctv"], lat: 39.9042, lon: 116.4074, country: "CN" },
    { keys: ["seoul", "korea", "sbs world", "kbs world", "arirang", "mbn", "sbs sports"], lat: 37.5665, lon: 126.9780, country: "KR" },
    { keys: ["taipei", "taiwan", "pts", "set news", "f tv "], lat: 25.0330, lon: 121.5654, country: "TW" },
    { keys: ["singapore", "channel newsasia", "cna"], lat: 1.3521, lon: 103.8198, country: "SG" },
    { keys: ["hong kong", "hk", "tvb"], lat: 22.3193, lon: 114.1694, country: "HK" },
    { keys: ["hanoi", "vietnam", "vtv", "ho chi minh", "cola tv"], lat: 21.0285, lon: 105.8542, country: "VN" },
    { keys: ["pyongyang", "north korea", "kctv", "dprk", "chosun"], lat: 39.0392, lon: 125.7625, country: "KP" },
    { keys: ["bbc", "sky news", "london", "uk", "british", "itv"], lat: 51.5074, lon: -0.1278, country: "UK" },
    { keys: ["france", "paris", "bfmtv", "france 24", "arte french", "gulli", "europe", "euronews"], lat: 48.8566, lon: 2.3522, country: "FR" },
    { keys: ["germany", "deutsche", "berlin", "ard", "zdf", "rtl", "dw ", "more than sports"], lat: 52.5200, lon: 13.4050, country: "DE" },
    { keys: ["rome", "italy", "rai", "mediaset", "la7", "milan", "milano", "naples", "napoli", "venice", "venezia"], lat: 41.9028, lon: 12.4964, country: "IT" },
    { keys: ["madrid", "spain", "rtve", "antena"], lat: 40.4168, lon: -3.7038, country: "ES" },
    { keys: ["sydney", "australia", "melbourne", "7news", "9news", "abc australia", "sbs"], lat: -33.8688, lon: 151.2093, country: "AU" },
    { keys: ["toronto", "canada", "cbc", "ctv", "vancouver", "global news canada"], lat: 43.6532, lon: -79.3832, country: "CA" },
    { keys: ["moscow", "russia", "rt doc", "rt news", "rt eng", "eurasia", "euroasia"], lat: 55.7558, lon: 37.6173, country: "RU" },
    { keys: ["brazil", "brasil", "rio", "sao paulo", "record news", "globo"], lat: -15.7938, lon: -47.8828, country: "BR" },
    { keys: ["mexico", "televisa", "tv azteca"], lat: 19.4326, lon: -99.1332, country: "MX" },
    { keys: ["south africa", "johannesburg", "cape town", "pretoria", "ln24sa", "sabc"], lat: -26.2041, lon: 28.0473, country: "ZA" },
    { keys: ["caribbean", "st lucia", "rcv", "radio caribbean"], lat: 13.9094, lon: -60.9789, country: "LC" },
    { keys: ["haiti", "port-au-prince", "rnh", "tele guinen"], lat: 18.5392, lon: -72.3350, country: "HT" },
    { keys: ["nigeria", "lagos", "abuja", "channels tv", "tvc news", "ait"], lat: 6.5244, lon: 3.3792, country: "NG" },
    { keys: ["ghana", "accra", "ghone", "adom tv", "utv ghana"], lat: 5.6037, lon: -0.1870, country: "GH" },
    { keys: ["kenya", "nairobi", "citizen tv", "ktn news", "ntv kenya"], lat: -1.2921, lon: 36.8219, country: "KE" },
    { keys: ["israel", "palestine", "jerusalem", "tel aviv", "ramallah", "gaza"], lat: 31.7683, lon: 35.2137, country: "IL" },
    { keys: ["iraq", "baghdad", "basra", "erbil"], lat: 33.3152, lon: 44.3661, country: "IQ" },
    { keys: ["iran", "tehran", "mashhad", "isfahan"], lat: 35.6892, lon: 51.3890, country: "IR" },
    { keys: ["bahrain", "manama", "bahrain sports"], lat: 26.2285, lon: 50.5860, country: "BH" },
    { keys: ["africa", "pan africa", "african"], lat: 9.0820, lon: 8.6753, country: "NG" }
];

function resolveChannelLocation(channelName, m3uCountry) {
  const nameLower = channelName.toLowerCase();
  const uppercaseCountry = m3uCountry ? m3uCountry.toUpperCase() : "GLOBAL";

  let hash = 0;
  for (let i = 0; i < channelName.length; i++) {
    hash = (hash << 5) - hash + channelName.charCodeAt(i);
    hash |= 0;
  }
  const jitterLat = ((Math.abs(hash) % 100) / 100 - 0.5) * 0.1;
  const jitterLon = (((Math.abs(hash) >> 8) % 100) / 100 - 0.5) * 0.1;

  for (const city of regionalCities) {
    if (city.keys.some(k => nameLower.includes(k))) {
      return { lat: city.lat + jitterLat, lon: city.lon + jitterLon, country: city.country };
    }
  }

  if (uppercaseCountry !== "GLOBAL" && uppercaseCountry !== "UN" && countryCoords[uppercaseCountry]) {
    const coords = countryCoords[uppercaseCountry];
    return { lat: coords.lat + jitterLat, lon: coords.lon + jitterLon, country: uppercaseCountry };
  }

  const landCentroids = [
    { country: "US", lat: 38.9072, lon: -77.0369 },
    { country: "UK", lat: 51.5074, lon: -0.1278 },
    { country: "FR", lat: 48.8566, lon: 2.3522 },
    { country: "DE", lat: 52.5200, lon: 13.4050 },
    { country: "IT", lat: 41.8719, lon: 12.5674 },
    { country: "JP", lat: 35.6762, lon: 139.6503 },
    { country: "AU", lat: -35.2809, lon: 149.1300 },
    { country: "BR", lat: -15.7938, lon: -47.8828 },
    { country: "IN", lat: 28.6139, lon: 77.2090 },
    { country: "SA", lat: 24.7136, lon: 46.6753 },
    { country: "VN", lat: 21.0285, lon: 105.8542 },
    { country: "TR", lat: 39.9334, lon: 32.8597 },
    { country: "MX", lat: 19.4326, lon: -99.1332 },
    { country: "EG", lat: 30.0444, lon: 31.2357 },
    { country: "CA", lat: 45.4215, lon: -75.6972 },
    { country: "CH", lat: 46.2044, lon: 6.1432 },
    { country: "ZA", lat: -33.9249, lon: 18.4241 },
    { country: "AR", lat: -34.6037, lon: -58.3816 }
  ];

  const index = Math.abs(hash) % landCentroids.length;
  const chosenCentroid = landCentroids[index];
  return {
    lat: chosenCentroid.lat + jitterLat,
    lon: chosenCentroid.lon + jitterLon,
    country: uppercaseCountry === "GLOBAL" ? chosenCentroid.country : uppercaseCountry
  };
}

function downloadM3U(urlStr) {
  return new Promise((resolve) => {
    try {
      const isHttps = urlStr.startsWith("https");
      const client = isHttps ? https : http;
      client.get(urlStr, {
        headers: { "User-Agent": "Mozilla/5.0 Satellite-Router/1.0" },
        timeout: 5000
      }, (res) => {
        if (res.statusCode !== 200) { resolve(""); return; }
        let data = "";
        res.on("data", (chunk) => { data += chunk; });
        res.on("end", () => { resolve(data); });
      }).on("error", () => { resolve(""); });
    } catch (e) { resolve(""); }
  });
}

function parseM3U(data, category) {
  const list = [];
  if (!data) return list;
  const lines = data.split("\n");
  let current = {};
  let count = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith("#EXTINF:")) {
      current = {};
      const commaIndex = line.lastIndexOf(",");
      if (commaIndex !== -1) current.name = line.substring(commaIndex + 1).trim();
      const logoMatch = line.match(/tvg-logo="([^"]+)"/);
      current.logo = logoMatch ? logoMatch[1] : "";
      const countryMatch = line.match(/tvg-country="([^"]+)"/);
      current.country = countryMatch ? countryMatch[1].toUpperCase() : "Global";
    } else if (line.startsWith("http") && current.name) {
      if (line.includes(".m3u8")) {
        const resolved = resolveChannelLocation(current.name, current.country);
        list.push({
          id: `v-dyn-${category}-${count++}-${Math.random().toString(36).substring(2, 7)}`,
          name: current.name,
          url: line,
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

// Full static list from server.ts (Condensed version of the first 110 streams)
const staticStreams = [
  { id: "sports-redbull", name: "Red Bull TV", url: "https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8", category: "sports", country: "Global", logo: "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=120&h=120&q=80", status: "online", lat: 47.8095, lon: 13.0550 },
  { id: "sports-fox-sports-alt", name: "Fox Sports 1 (US)", url: "https://fox-foxsports1-1-us.samsung.wurl.com/manifest/playlist.m3u8", category: "sports", country: "US", logo: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=120&h=120&q=80", status: "online", lat: 34.0522, lon: -118.2437 },
  { id: "sports-fifa-plus-alt", name: "FIFA+ World (Alt)", url: "https://fifaplus-rakuten.amagi.tv/playlist.m3u8", category: "sports", country: "Global", logo: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=120&h=120&q=80", status: "online", lat: 47.3769, lon: 8.5417 },
  { id: "sports-eurosport-1", name: "Eurosport 1 (Live)", url: "https://d2a02gfcid1k4a.cloudfront.net/v1/master/3722c60a815c199d9c0ef36c5b73da68a62b09d1/cc-clihr3vf54f9j/Eurosport_1.m3u8", category: "sports", country: "Global", logo: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=120&h=120&q=80", status: "online", lat: 48.8566, lon: 2.3522 },
  { id: "sports-sportsgrid", name: "SportsGrid Live", url: "https://sportsgrid-klowdtv.amagi.tv/playlist.m3u8", category: "sports", country: "US", logo: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=120&h=120&q=80", status: "online", lat: 40.7128, lon: -74.0060 },
  { id: "sports-ftf", name: "For The Fans (FTF) Sports", url: "https://ftf-klowdtv.amagi.tv/playlist.m3u8", category: "sports", country: "US", logo: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=120&h=120&q=80", status: "online", lat: 34.0522, lon: -118.2437 },
  { id: "sports-edgesport", name: "EDGE Sport Live", url: "https://edgesport-edge.amagi.tv/playlist.m3u8", category: "sports", country: "UK", logo: "https://images.unsplash.com/photo-1541252260730-0412e8e2108e?auto=format&fit=crop&w=120&h=120&q=80", status: "online", lat: 51.5074, lon: -0.1278 },
  { id: "sports-stadium", name: "Stadium Sports", url: "https://stadium-stadium.amagi.tv/playlist.m3u8", category: "sports", country: "US", logo: "https://images.unsplash.com/photo-1519766304817-4f37bda74a27?auto=format&fit=crop&w=120&h=120&q=80", status: "online", lat: 41.8781, lon: -87.6298 },
  { id: "sports-unbeaten", name: "Unbeaten Sports Live", url: "https://unbeaten-distro.amagi.tv/playlist.m3u8", category: "sports", country: "Global", logo: "https://images.unsplash.com/photo-1471295263379-6ca2e4109cf1?auto=format&fit=crop&w=120&h=120&q=80", status: "online", lat: 55.3781, lon: -3.4360 },
  { id: "sports-motorvision", name: "Motorvision TV Eng", url: "https://motorvision-plex.amagi.tv/playlist.m3u8", category: "sports", country: "DE", logo: "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=120&h=120&q=80", status: "online", lat: 48.1351, lon: 11.5820 },
  { id: "sports-fifaplus", name: "FIFA+ Live", url: "https://a62dad94.wurl.com/master/f36d25e7e52f1ba8d7e56eb859c636563214f541/UmFrdXRlblRWLWV1X0ZJRkFQbHVzRW5nbGlzaF9ITFM/playlist.m3u8", category: "sports", country: "Global", logo: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=120&h=120&q=80", status: "online", lat: 47.3769, lon: 8.5417 },
  { id: "sports-tennischannel2", name: "Tennis Channel 2", url: "https://tennischannelt2-plex.amagi.tv/playlist.m3u8", category: "sports", country: "US", logo: "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=120&h=120&q=80", status: "online", lat: 34.0522, lon: -118.2437 },
  { id: "sports-tycsports-usa", name: "TyC Sports USA", url: "http://45.170.130.224:8000/play/a020/index.m3u8", category: "sports", country: "US", logo: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=120&h=120&q=80", status: "online", lat: 40.7128, lon: -74.0060 },
  { id: "sports-arenasport1", name: "Arena Sport 1 Premium", url: "https://nl1.nghk.ai/ArenaPremium1HD/index.m3u8", category: "sports", country: "RS", logo: "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=120&h=120&q=80", status: "online", lat: 44.7872, lon: 20.4573 },
  { id: "sports-it-rai-sport", name: "Rai Sport HD (Italy)", url: "https://raivideo.akamaized.net/hls/live/2042730/rainews/index.m3u8", category: "sports", country: "IT", logo: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=120&h=120&q=80", status: "online", lat: 41.9028, lon: 12.4964 },
  { id: "sports-plutotv-deportes", name: "Pluto TV Deportes", url: "https://jmp2.uk/plu-5dcde07af1c85b0009b18651.m3u8", category: "sports", country: "US", logo: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=120&h=120&q=80", status: "online", lat: 34.0522, lon: -118.2437 },
  { id: "sports-cctv16", name: "CCTV-16 Olympic", url: "http://74.91.26.218:82/live/cctv16hd.m3u8", category: "sports", country: "CN", logo: "https://images.unsplash.com/photo-1547989453-11e67ffb3885?auto=format&fit=crop&w=120&h=120&q=80", status: "online", lat: 39.9042, lon: 116.4074 },
  { id: "sports-lequipe", name: "L'Equipe TV (FR)", url: "https://lequipe-hls-fra-cl.vcdn.biz/hls/lequipe/master.m3u8", category: "sports", country: "FR", logo: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=120&h=120&q=80", status: "online", lat: 48.8566, lon: 2.3522 },
  { id: "sports-realmadrid", name: "Real Madrid TV (ES)", url: "https://rmtv-live.akamaized.net/hls/live/2043232/rmtv-es/master.m3u8", category: "sports", country: "ES", logo: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=120&h=120&q=80", status: "online", lat: 40.4168, lon: -3.7038 },
  { id: "sports-pluto-sports", name: "Pluto TV Sports (US)", url: "https://service-stitcher.clusters.pluto.tv/stitch/hls/channel/5d8a9e0f6f4c0c001a1c97c3/master.m3u8?advertisingId=&appName=web&appVersion=unknown&appStoreUrl=&architecture=&buildVersion=&clientTime=0&deviceDNT=0&deviceId=123&deviceMake=unknown&deviceModel=unknown&deviceType=web&deviceVersion=unknown&includeExtendedEvents=false&sid=123&userId=", category: "sports", country: "US", logo: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=120&h=120&q=80", status: "online", lat: 34.0522, lon: -118.2437 },
  { id: "sports-dazn-1-de", name: "DAZN 1 Germany (HD)", url: "https://dazn-dazn1-1-de.samsung.wurl.com/manifest/playlist.m3u8", category: "sports", country: "DE", logo: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=120&h=120&q=80", status: "online", lat: 52.5200, lon: 13.4050 },
  { id: "sports-bahrain-sports", name: "Bahrain Sports 1 HD", url: "https://shls-bah-sports-1-med.akamaized.net/out/v1/934d4f8260714b2787723223062086e3/index.m3u8", category: "sports", country: "BH", logo: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=120&h=120&q=80", status: "online", lat: 26.2285, lon: 50.5860 },
  { id: "sports-sky-pl", name: "Sky Sports Premier League", url: "https://skysports-rakuten.amagi.tv/playlist.m3u8", category: "sports", country: "UK", logo: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=120&h=120&q=80", status: "online", lat: 51.5074, lon: -0.1278 },
  { id: "sports-soccer-bein1", name: "beIN SPORTS 1 HD", url: "https://beinsports-samsung.wurl.com/manifest/playlist.m3u8", category: "sports", country: "Global", logo: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=120&h=120&q=80", status: "online", lat: 25.2854, lon: 51.5310 },
  { id: "sports-ar-tycsports", name: "TyC Sports (Live)", url: "https://live-04-11-tyc24.vodgc.net/tyc24/index_tyc24_1080.m3u8", category: "sports", country: "AR", logo: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=120&h=120&q=80", status: "online", lat: -34.6037, lon: -58.3816 },
  { id: "news-skynews", name: "Sky News International", url: "https://skynews-live.akamaized.net/hls/live/2007802/skynewsn-global/master.m3u8", category: "news", country: "UK", logo: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=120&h=120&q=80", status: "online", lat: 51.5074, lon: -0.1278 },
  { id: "news-france24", name: "France 24 English", url: "https://static.france24.com/live/F24_EN_LO_HLS/live_web.m3u8", category: "news", country: "FR", logo: "https://images.unsplash.com/photo-1495020689067-958852a6565d?auto=format&fit=crop&w=120&h=120&q=80", status: "online", lat: 48.8566, lon: 2.3522 },
  { id: "news-aljazeera", name: "Al Jazeera English", url: "https://live-amg-elg.akamaized.net/aljazeera/live/en/master.m3u8", category: "news", country: "Global", logo: "https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?auto=format&fit=crop&w=120&h=120&q=80", status: "online", lat: 25.2854, lon: 51.5310 },
  { id: "science-nasa", name: "NASA TV Public Live", url: "https://ntv-intel-01.akamaized.net/hls/live/2042749/NASA-NTV-1-HQ/master.m3u8", category: "science", country: "US", logo: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=120&h=120&q=80", status: "online", lat: 29.5601, lon: -95.0853 },
  { id: "country-jp-nhk", name: "NHK World Japan", url: "https://nhkwlive-ojsp.akamaized.net/hls/live/2003459/nhkwlive-ojsp-eng/index.m3u8", category: "country", country: "JP", logo: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=120&h=120&q=80", status: "online", lat: 35.6762, lon: 139.6503 },
  { id: "country-in-ndtv", name: "NDTV 24x7 India", url: "https://ndtv24x7.akamaized.net/hls/live/2003678/ndtv24x7/master.m3u8", category: "country", country: "IN", logo: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=120&h=120&q=80", status: "online", lat: 28.6139, lon: 77.2090 }
];

export default async function handler(request, response) {
  response.setHeader('Access-Control-Allow-Credentials', true);
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  response.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (request.method === 'OPTIONS') return response.status(200).end();

  try {
    const sources = [
      { url: "https://iptv-org.github.io/iptv/categories/news.m3u", category: "news" },
      { url: "https://iptv-org.github.io/iptv/categories/sports.m3u", category: "sports" },
      { url: "https://iptv-org.github.io/iptv/categories/science.m3u", category: "science" },
      { url: "https://iptv-org.github.io/iptv/categories/movies.m3u", category: "freetv" },
      { url: "https://iptv-org.github.io/iptv/categories/general.m3u", category: "country" }
    ];

    // On Vercel, we fetch sources in parallel for speed
    // We take a larger slice to reach the 700+ target requested by user
    const m3uResults = await Promise.all(sources.map(src => downloadM3U(src.url).then(data => parseM3U(data, src.category))));
    
    let allStreams = [...staticStreams];
    m3uResults.forEach(list => {
      // Limit each category to ~150 to stay within response limits and target count
      allStreams = allStreams.concat(list.slice(0, 150));
    });

    // Remove duplicates based on URL
    const uniqueStreams = [];
    const seenUrls = new Set();
    for (const stream of allStreams) {
      if (!seenUrls.has(stream.url)) {
        seenUrls.add(stream.url);
        uniqueStreams.push(stream);
      }
    }

    return response.status(200).json({
      success: true,
      count: uniqueStreams.length,
      streams: uniqueStreams
    });
  } catch (error) {
    console.error("API error:", error);
    return response.status(500).json({ success: false, error: "Satellite router failed to aggregate streams" });
  }
}
