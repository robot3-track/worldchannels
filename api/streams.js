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
  TR: { lat: 38.9615, lon: 35.2517},
  RO: { lat: 45.9432, lon: 24.9668 },
  AE: { lat: 23.4241, lon: 53.8478 },
  NZ: { lat: -40.9006, lon: 174.8860 },
  FI: { lat: 64.0000, lon: 26.0000 },
  NO: { lat: 62.0000, lon: 10.0000},
  SE: { lat: 60.1282, lon: 18.6435 },
  DK: { lat: 56.2639, lon: 9.5018 },
  NL: { lat: 52.1326, lon: 5.2913 },
  BE: { lat: 50.5039, lon: 4.4699 },
  CH: { lat: 46.8182, lon: 8.2275 },
  Global: { lat: 39.8283, lon: -98.5795 }
};

// Regional Cities for location resolution
const regionalCities = [
    { keys: ["sacramento"], lat: 38.5816, lon: -121.4944, country: "US" },
    { keys: ["american", "america", "us news", "usa ", "fox news", "cnn news", "msnbc", "fox sports", "fox sports 2", "fox sports 1", "nhra tv"], lat: 37.0902, lon: -95.7129, country: "US" },
    { keys: ["los angeles", "la tv", "kcbs", "ktla", "kcal", "kabc", "knbc"], lat: 34.0522, lon: -118.2437, country: "US" },
    { keys: ["san francisco", "kpix", "kqed", "kgo", "bay area"], lat: 37.7749, lon: -122.4194, country: "US" },
    { keys: ["new york", "nyc", "wabc", "wnyw", "wcbs", "wnbc", "pix11", "overtime", "big civic"], lat: 40.7128, lon: -74.0060, country: "US" },
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
    { keys: ["las vegas", "klas", "ktnv", "brian tv"], lat: 36.1716, lon: -115.1398, country: "US" },
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
    { keys: ["texas", "tx ", "horse tv"], lat: 31.9686, lon: -99.9018, country: "US" },
    { keys: ["florida", "fl "], lat: 27.6648, lon: -81.5158, country: "US" },
    { keys: ["delhi", "mumbai", "india", "ndtv", "aaj tak", "zee news", "abp news", "republic bharat", "times now india", "zee rajasthan", "anada barta", "anshun comprehensive news channel"], lat: 28.6139, lon: 77.2090, country: "IN" },
    { keys: ["riyadh", "saudi", "al arabiya", "ksa sports", "al hadath", "munsif", "mecca", "medina", "makkah", "madinah"], lat: 24.7136, lon: 46.6753, country: "SA" },
    { keys: ["cairo", "egypt", "nile tv", "dmc", "cbc egypt", "on e"], lat: 30.0444, lon: 31.2357, country: "EG" },
    { keys: ["lebanon", "beirut", "lbc", "al jadeed", "mtv lebanon", "tele liban", "red tv lebanon"], lat: 33.8938, lon: 35.5018, country: "LB" },
    { keys: ["afghanistan", "kabul", "afgh", "aria tv", "khurshid", "afghanistan international", "afghan tv"], lat: 34.5553, lon: 69.2075, country: "AF" },
    { keys: ["qatar", "doha", "al jazeera"], lat: 25.2854, lon: 51.5310, country: "QA" },
    { keys: ["middle east", "dubai", "uae", "abu dhabi", "sharjah", "al yaum tv", "al ghad tv"], lat: 25.2048, lon: 55.2708, country: "AE" },
    { keys: ["istanbul", "turkey", "trt", "haberturk"], lat: 41.0082, lon: 28.9784, country: "TR" },
    { keys: ["tokyo", "nhk", "fuji tv", "fujitv", "asahi", "tbs japan", "tokyo mx", "nippon tv", "weathernews japan", "wowow", "sky a+", "j sports", "cgntv japan"], lat: 35.6762, lon: 139.6503, country: "JP" },
    { keys: ["beijing", "china", "cgtn", "cctv", "西安丝路", "山东卫视"], lat: 39.9042, lon: 116.4074, country: "CN" },
    { keys: ["seoul", "korea", "sbs world", "kbs world", "arirang", "mbn", "sbs sports", "chosun"], lat: 37.5665, lon: 126.9780, country: "KR" },
    { keys: ["taipei", "taiwan", "pts", "set news", "f tv "], lat: 25.0330, lon: 121.5654, country: "TW" },
    { keys: ["singapore", "channel newsasia", "cna"], lat: 1.3521, lon: 103.8198, country: "SG" },
    { keys: ["hong kong", "hk", "tvb"], lat: 22.3193, lon: 114.1694, country: "HK" },
    { keys: ["hanoi", "vietnam", "vtv", "ho chi minh", "cola tv"], lat: 21.0285, lon: 105.8542, country: "VN" },
    { keys: ["pyongyang", "north korea", "kctv", "dprk"], lat: 39.0392, lon: 125.7625, country: "KP" },
    { keys: ["bbc", "sky news", "london", "uk", "british", "itv"], lat: 51.5074, lon: -0.1278, country: "UK" },
    { keys: ["france", "paris", "bfmtv", "france 24", "arte french", "gulli", "europe", "euronews", "bfm2", "bfm", "bfm lyon"], lat: 48.8566, lon: 2.3522, country: "FR" },
    { keys: ["germany", "deutsche", "berlin", "ard", "zdf", "rtl", "dw ", "more than sports"], lat: 52.5200, lon: 13.4050, country: "DE" },
    { keys: ["rome", "italy", "rai", "mediaset", "la7", "milan", "milano", "naples", "napoli", "venice", "venezia"], lat: 41.9028, lon: 12.4964, country: "IT" },
    { keys: ["madrid", "spain", "rtve", "antena", "arena sport 1 premium bh (1080p)"], lat: 40.4168, lon: -3.7038, country: "ES" },
    { keys: ["sydney", "australia", "melbourne", "7news", "9news", "abc australia", "sbs", "sky racing", "sky racing 2"], lat: -33.8688, lon: 151.2093, country: "AU" },
    { keys: ["toronto", "canada", "cbc", "ctv", "vancouver", "global news canada"], lat: 43.6532, lon: -79.3832, country: "CA" },
    { keys: ["moscow", "russia", "rt doc", "rt news", "rt eng", "eurasia", "euroasia", "1+1 marafon"], lat: 55.7558, lon: 37.6173, country: "RU" },
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
    { keys: ["bahrain", "manama", "bahrain sports", "bahrain sports 1 (720p) [Not 24/7]", "bahrain sports 2 (720p) [Not 24/7]", "bahrain international", "bahrain tv"], lat: 26.2285, lon: 50.5860, country: "BH" },
    { keys: ["africa", "pan africa", "african"], lat: 9.0820, lon: 8.6753, country: "NG" },
    { keys: ["uruguay","dsports uruguay", "dsports" ], lat: -33.0000, lon: -56.0000, country: "UY"},
    { keys: ["serbia", "arena sport 1 premium", "arena sport 2 premium", "arena sport 3 premium", "arena sport 4 premium"], lat: 44.8176, lon: 20.4569, country: "RS" }
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
      current = { headers: {} }; // Initialize headers object for the channel
      
      const commaIndex = line.lastIndexOf(",");
      if (commaIndex !== -1) current.name = line.substring(commaIndex + 1).trim();
      
      const logoMatch = line.match(/tvg-logo="([^"]+)"/);
      current.logo = logoMatch ? logoMatch[1] : "";
      
      const countryMatch = line.match(/tvg-country="([^"]+)"/);
      current.country = countryMatch ? countryMatch[1].toUpperCase() : "Global";

    } else if (line.startsWith("#EXTVLCOPT:")) {
      // 1. Identifies header options inside the playlist
      // Captures options formatted like: #EXTVLCOPT:http-user-agent=Mozilla/5.0
      // Captures options formatted like: #EXTVLCOPT:http-referrer=https://example.com
      if (current.headers) {
        const optMatch = line.match(/#EXTVLCOPT:http-(user-agent|referrer)=(.*)/i);
        if (optMatch) {
          const key = optMatch[1].toLowerCase();
          const value = optMatch[2].trim();
          
          if (key === "user-agent") {
            current.headers["User-Agent"] = value;
          } else if (key === "referrer") {
            current.headers["Referer"] = value; // Canonical HTTP format spelling
          }
        }
      }

    } else if (line.startsWith("http") && current.name) {
      if (line.includes(".m3u8")) {
        const resolved = resolveChannelLocation(current.name, current.country);
        
        const channelObj = {
          id: `v-dyn-${category}-${count++}-${Buffer.from(line).toString('base64').substring(0, 8)}`,
          name: current.name,
          url: line,
          category: category,
          country: resolved.country,
          logo: current.logo || "https://images.unsplash.com/photo-1585829365294-fa8c63327f31?auto=format&fit=crop&w=120&h=120&q=80",
          status: "online",
          lat: resolved.lat,
          lon: resolved.lon
        };

        // 2. Only map and append headers if any were successfully identified
        if (Object.keys(current.headers).length > 0) {
          channelObj.headers = current.headers;
        }

        list.push(channelObj);
      }
      current = {}; // Reset container state
    }
  }
  return list;
}


// Full static list from server.ts (High-priority stable streams)
const staticStreams = [
  // --- SPORTS (Category: sports, Country: Global/Specific) ---
  {
    id: "sports-redbull",
    name: "Red Bull TV",
    url: "https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8",
    category: "sports",
    country: "Global",
    logo: "https://static.wikia.nocookie.net/logopedia/images/3/3c/Red_Bull_TV.svg/revision/latest?cb=20180423100712",
    status: "online",
    lat: 47.8095, // Salzburg, Austria
    lon: 13.0550,
  },
  {
    id: "sports-arenasport1",
    name: "Arena Sport 1 Premium",
    url: "https://nl2.nghk.ai/ArenaPremium1HD/index.m3u8", // High quality, updated Arena Sport 1 Premium stream feed
    category: "sports",
    country: "RS",
    category: "world cup",
    logo: "https://static.wikia.nocookie.net/logopedia/images/e/e0/Arena_Sport_1_Premium_%282021%2C_short%29.svg/revision/latest?cb=20221111214150",
    status: "online",
    lat: 44.7872, // Belgrade, Serbia (Arena Sport HQ)
    lon: 20.4573,
  },
  {
    id: "sports-arenasport1-backup",
    name: "Arena Sport 1 Premium (Backup)",
    url: "https://nl1.nghk.ai/ArenaPremium1HD/index.m3u8", // High quality, updated Arena Sport 1 Premium stream feed
    category: "sports",
    category: "world cup",
    country: "RS",
    logo: "https://static.wikia.nocookie.net/logopedia/images/e/e0/Arena_Sport_1_Premium_%282021%2C_short%29.svg/revision/latest?cb=20221111214150",
    status: "online",
    lat: 44.7872, // Belgrade, Serbia (Arena Sport HQ)
    lon: 20.4573,
  },
  { 
    id: "sports-foxsports-1", 
    name: "FS1 (Fox Sports)", 
    url: "https://cdn.stmify.com/embed-free/v1/fox-spores-mx-jw;allowfullscreen=true;autoplay=true;controls=false;mute=false;loop=false;playsinline=true", 
    isEmbed: true, // Custom flag to help your frontend player switch modes
    category: "world cup", 
    country: "US", 
    logo: "https://static.wikia.nocookie.net/logopedia/images/a/ad/FS1_New_Logo.svg/revision/latest?cb=20230817005648", 
    status: "online", 
    lat: 34.0522, 
    lon: -118.2437 
  },
  {
    id:"sports-fubotv-sports",
    name: "Fubo Sports Network",
    url: "http://main.light-ott.net:80/play/live.php?mac=00:1A:79:3A:93:FD&stream=858538&extension=m3u8", // High quality, stable Fubo Sports Network stream
    category: "sports",
    country: "US",
    logo: "https://static.wikia.nocookie.net/logopedia/images/1/1e/2023-fubotv-new-logo-design-2-520x321.png/revision/latest?cb=20230519120710",
    status: "online",
    lat: 40.7128, // New York City, US (FuboTV HQ)
    lon: -74.0060,
  },
  {
    id: "sports-fifaplus",
    name: "FIFA+ Live",
    url: "https://a62dad94.wurl.com/master/f36d25e7e52f1ba8d7e56eb859c636563214f541/UmFrdXRlblRWLWV1X0ZJRkFQbHVzRW5nbGlzaF9ITFM/playlist.m3u8", // High quality official stable FIFA+ live channel stream
    category: "sports",
    country: "Global",
    logo: "https://static.wikia.nocookie.net/logopedia/images/1/1c/FIFA.svg/revision/latest/scale-to-width-down/200?cb=20220919201858",
    status: "online",
    lat: 47.3769, // Zurich, Switzerland (FIFA HQ)
    lon: 8.5417,
  },
  {
    id: "sports-es-dazn",
    name: "Red Bull TV Sports (ES)",
    url: "https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8", // Red Bull TV sports stream
    category: "sports",
    country: "ES",
    logo: "https://static.wikia.nocookie.net/logopedia/images/3/3c/Red_Bull_TV.svg/revision/latest?cb=20180423100712",
    status: "online",
    lat: 40.4168, // Madrid, Spain
    lon: -3.7038,
  },
  {
    id: "sports-trtv-sports",
    name: "TR Sport TV",
    url: "https://livetr.teleromagna.it/mia/live/playlist.m3u8", // TRTV working server
    category: "sports",
    country: "IT",
    logo: "https://static.wikia.nocookie.net/logopedia/images/7/7a/TR_TV.png/revision/latest?cb=20250116224024",
    status: "online",
    lat: 44.4949, // Bologna, Italy
    lon: 11.3426,
  },
  {
    id: "sports-fifa-plus-alt",
    name: "FIFA+ World (Alt)",
    url: "https://fifaplus-rakuten.amagi.tv/playlist.m3u8", // Alternative stable FIFA+ stream link via Rakuten Amagi CDN
    category: "sports",
    country: "Global",
    logo: "https://static.wikia.nocookie.net/logopedia/images/1/1c/FIFA.svg/revision/latest/scale-to-width-down/200?cb=20220919201858",
    status: "online",
    lat: 47.3769,
    lon: 8.5417,
  },
  {
    id: "sports-sportsgrid",
    name: "SportsGrid Live",
    url: "https://sportsgrid-klowdtv.amagi.tv/playlist.m3u8",
    category: "sports",
    country: "US",
    logo: "https://static.wikia.nocookie.net/logopedia/images/1/16/SportsGrid_Live.png/revision/latest?cb=20250821170615",
    status: "online",
    lat: 40.7128, // New York, US
    lon: -74.0060,
  },
  {
    id: "sports-es-dazn",
    name: "Red Bull TV Sports (ES)",
    url: "https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8", // Red Bull TV sports stream
    category: "sports",
    country: "ES",
    logo: "https://static.wikia.nocookie.net/logopedia/images/3/3c/Red_Bull_TV.svg/revision/latest?cb=20180423100712",
    status: "online",
    lat: 40.4168, // Madrid, Spain
    lon: -3.7038,
  },
  {
    id: "news-fox-weather",
    name: "Fox Weather US",
    url: "https://jmp2.uk/plu-640a68880e884c0009979cc2.m3u8",
    category: "news",
    country: "US",
    logo: "https://images.pluto.tv/channels/640a68880e884c0009979cc2/colorLogoPNG_1779087602438.png",
    status: "online",
    lat: 40.7589, // New York City, US
    lon: 73.9822,
  },
  {
    id: "sports-fr-beinsportsxtra",
    name: "beIN SPORTS Xtra (US)",
    url: "https://bein-beinxtrasports-firetv.amagi.tv/playlist.m3u8", // High-quality, CORS-friendly beIN sports stream
    category: "sports",
    country: "US",
    logo: "https://static.wikia.nocookie.net/logopedia/images/b/b6/Xtra.png/revision/latest?cb=20201108180634",
    status: "online",
    lat: 25.826725, // Florida, US
    lon: -80.314954,
  },
  {
    id:"sports-bbc-topgear",
    name: "BBC Top Gear (UK)",
    url: "https://amg00793-amg00793c5-firetv-us-4068.playouts.now.amagi.tv/playlist.m3u8", // High-quality, stable BBC Top Gear stream
    category: "sports",
    country: "UK",
    logo: "https://static.wikia.nocookie.net/logopedia/images/b/b3/Top_Gear_%282021%29.png/revision/latest?cb=20220211183139",
    status: "online",
    lat: 51.5074, // London, UK
    lon: -0.1278,
  },
  {
    id: "sports-motorvision",
    name: "Motorvision TV Eng",
    url: "https://mvg-mv-xumo.otteravision.com/mvg/mv/mv.m3u8",
    category: "sports",
    country: "DE",
    logo: "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 48.1351, // Munich, Germany
    lon: 11.5820,
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
    url: "http://playcom.trapemn.tv:1935/transcoderip/tycsports.stream/playlist.m3u8", // High quality TyC Sports USA stream feed
    category: "sports",
    country: "US",
    logo: "https://static.wikia.nocookie.net/logopedia/images/b/b5/Tycsports2026.svg/revision/latest?cb=20260602013902",
    status: "online",
    lat: 40.7128, // New York, NY
    lon: -74.0060,
  },
  {
    id: "sports-plutotv-deportes",
    name: "Pluto TV Deportes",
    url: "https://jmp2.uk/plu-5dcde07af1c85b0009b18651.m3u8", // High quality Pluto TV Deportes live stream
    category: "sports",
    country: "US",
    logo: "https://static.wikia.nocookie.net/logopedia/images/2/26/Pluto_TV_2024.svg/revision/latest?cb=20240126205307",
    status: "online",
    lat: 34.0522, // Los Angeles, California
    lon: -118.2437,
  },
  {
     id: "sports-cctv1-plus",
    name: "CCTV-1+",
    // Main official high-definition distribution hub
    url: "https://cd-live-stream.news.cctvplus.com/live/smil:CHANNEL1.smil/playlist.m3u8", 
    category: "sports",
    country: "CN",
    logo: "https://static.wikia.nocookie.net/logopedia/images/f/f6/CCTV-1_Logo.svg/revision/latest/scale-to-width-down/1000?cb=20240211154812",
    status: "online",
    lat: 39.9042, // Beijing, China
    lon: 116.4074,
  },
  // --- ADDED PREMIUM REGIONAL SPORTS CHANNELS ---
  {
    id: "sports-lequipe",
    name: "L'Equipe TV (FR)",
    url: "https://viamotionhsi.netplus.ch/live/eds/lequipe21/browser-HLS8/lequipe21.m3u8", // Direct stable L'Equipe TV feed
    category: "sports",
    country: "FR",
    logo: "https://i.ibb.co/KXhYwm0/lequipe.png",
    status: "online",
    lat: 48.8566,
    lon: 2.3522,
  },
  {
    id: "sports-pluto-sports",
    name: "Pluto TV Sports (US)",
    url: "https://service-stitcher.clusters.pluto.tv/stitch/hls/channel/5d8a9e0f6f4c0c001a1c97c3/master.m3u8?advertisingId=&appName=web&appVersion=unknown&appStoreUrl=&architecture=&buildVersion=&clientTime=0&deviceDNT=0&deviceId=123&deviceMake=unknown&deviceModel=unknown&deviceType=web&deviceVersion=unknown&includeExtendedEvents=false&sid=123&userId=", // Official Pluto TV Sports ID
    category: "sports",
    country: "US",
    logo: "https://static.wikia.nocookie.net/logopedia/images/2/26/Pluto_TV_2024.svg/revision/latest?cb=20240126205307",
    status: "online",
    lat: 34.0522,
    lon: -118.2437,
  },
  {
    id: "cam-us-telemundo",
    name: "Live Telemundo Security Cam",
    url: "https://content.uplynk.com/channel/b6a96ed39d694ae1b738faa98cf7dd3f.m3u8", // Red Bull Sports feed used as stable backup
    category: "sports",
    country: "US",
    logo: "https://upload.wikimedia.org/wikipedia/commons/6/68/Telemundo_logo_2018.svg",
    status: "online",
    lat: 25.7617, // Miami, Florida (Telemundo HQ)
    lon: -80.1918,
  },
  {
    id: "sports-us-telemundo",
    name: "Telemundo Sports",
    url: "http://ikitv.exid.me/play/live.php?mac=00:1A:79:18:15:1D&stream=934970&extension=m3u8",
    category: "sports",
    country: "US",
    logo: "https://upload.wikimedia.org/wikipedia/commons/6/68/Telemundo_logo_2018.svg",
    status: "online",
    lat: 25.7617,
    lon: -80.1918
  },
  // --- NEWS (Category: news, Country: Global/Specific) ---
  {
    id: "news-skyarabia",
    name: "Sky News Arabia",
    url: "https://stream.skynewsarabia.com/ott/ott.m3u8",
    category: "news",
    country: "AE",
    logo: "https://static.wikia.nocookie.net/logopedia/images/f/f0/Sky_News_Arabia_2024.svg/revision/latest?cb=20240721145837",
    status: "online",
    lat: 24.4539, // Abu Dhabi, UAE
    lon: 54.3773,
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
  {
    id: "news-france24",
    name: "France 24 English",
    url: "https://www.youtube.com/embed/HvZt-nh9sGg?si=65pWG4eDUOL3JQ3h&amp;controls=0",
    category: "news",
    country: "FR",
    logo: "https://upload.wikimedia.org/wikipedia/commons/c/c1/France_24_logo_%282013%29.svg",
    status: "online",
    lat: 48.8566, // Paris, France
    lon: 2.3522,
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
    url: "https://www.youtube.com/embed/iipR5yUp36o?si=ib0ookVfqOWBgLJX;controls=0",
    category: "news",
    country: "US",
    logo: "https://s.abcnews.com/images/Live/abc_news_live-abc-ml-250210_1739199021469_hpMain_16x9_608.jpg",
    status: "online",
    lat: 37.0902,
    lon: -95.7129,
  },

  // --- SCIENCE (Category: science, Country: Global/Specific) ---
  {
    id: "science-nasa",
    name: "NASA Live Space Station",
    url: "https://www.youtube.com/embed/uwXgcTc8oY8?si=QwhCYkYFKRqIhAp-&amp;controls=0",
    category: "science",
    country: "US",
    logo: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=120&h=120&q=80",
    status: "online",
    lat: 29.5601, // Houston (NASA JSC), US
    lon: -95.0853,
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

  // --- FREE TV GLOBAL (Category: freetv, Country: Global) ---
  {
    id: "country-tw-pts",
    name: "Aqua Taiwan News",
    url: "https://www.youtube.com/embed/Vrs-AeKZIEg?si=kYuNuSQtb6jLupP4;controls=0", // Working sport/general backup
    category: "country",
    country: "TW",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/New_Taipei_City_Library_logo.svg/250px-New_Taipei_City_Library_logo.svg.png",
    status: "online",
    lat: 25.0330, // Taipei, Taiwan
    lon: 121.5654,
  },
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
    name: "CCTV Français News Global",
    url: "https://news.cgtn.com/resource/live/french/cgtn-f.m3u8",
    category: "country",
    country: "CN",
    logo: "https://upload.wikimedia.org/wikipedia/commons/7/78/CGTN_-_fran%C3%A7ais.png",
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
    logo: "https://static.wikia.nocookie.net/logopedia/images/3/3c/Red_Bull_TV.svg/revision/latest?cb=20180423100712",
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
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/PBS_Kids_logo_%282022%29.svg/960px-PBS_Kids_logo_%282022%29.svg.png",
    status: "online",
    lat: 38.9072, // Washington D.C., US
    lon: -77.0369,
  },
  {
    id: "country-uk-skynews",
    name: "Sky News Live Stream",
    url: "https://news.sky.com/watch-live",
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
    id: "country-jp-nhk",
    name: "NHK World Japan English",
    url: "https://masterpl.hls.nhkworld.jp/hls/w/live/smarttv.m3u8",
    category: "country",
    country: "JP",
    logo: "https://static.wikia.nocookie.net/logopedia/images/5/57/Gf_nhk_logo_gray.svg/revision/latest/scale-to-width-down/1000?cb=20200402134529",
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
    logo: "https://static.wikia.nocookie.net/logopedia/images/f/f5/TRT_Haber_2020.svg/revision/latest/scale-to-width-down/1000?cb=20201112125806",
    status: "online",
    lat: 39.9334, // Ankara, Turkey
    lon: 32.8597,
  },
  {
    id: "country-id-tvrf",
    name: "TVRInternational Romania",
    url: "https://tvr-international.lg.mncdn.com/tvrinternational/smil:tvrinternational.smil/chunklist_b5160000.m3u8", // Working backup
    category: "country",
    country: "RO",
    logo: "https://static.wikia.nocookie.net/logopedia/images/a/ae/TVRi_2019.svg/revision/latest/scale-to-width-down/1000?cb=20260220213825",
    status: "online",
    lat: 44.46331, // Bucharest, Romania
    lon: 26.0921,
  },
  {
    id: "country-cn-cgtn",
    name: "CGTN News China",
    url: "https://dash4.antik.sk/live/test_cgtn/playlist.m3u8",
    category: "country",
    country: "CN",
    logo: "https://static.wikia.nocookie.net/logopedia/images/4/4d/CGTN_%28China_Global_Television_Network%29.svg/revision/latest?cb=20210816144604",
    status: "online",
    lat: 39.9042,
    lon: 116.4074,
  },
  {
    id: "country-kr-arirang",
    name: "Arirang World Korea",
    url: "https://cdn-01.bonus-tv.ru/arirang_edge/playlist.m3u8",
    category: "country",
    country: "KR",
    logo: "https://static.wikia.nocookie.net/logopedia/images/9/94/Arirang_TV_Logo.svg/revision/latest?cb=20210828042411",
    status: "online",
    lat: 37.5665, // Seoul, South Korea
    lon: 126.9780,
  },
  {
    id: "country-es-rtve",
    name: "RTVE Canal 24h Spain",
    url: "https://ztnr.rtve.es/ztnr/1694255.m3u8",
    category: "country",
    country: "ES",
    logo: "https://upload.wikimedia.org/wikipedia/commons/2/2b/Logo_Canal_24_horas.svg",
    status: "online",
    lat: 40.4168, // Madrid, Spain
    lon: -3.7038,
  },
  {
    id: "country-ru-rthaber",
    name: "RT News Russia (English)",
    url: "https://rt-doc.rttv.com/dvr/rtdru/playlist.m3u8",
    category: "country",
    country: "RU",
    logo: "https://upload.wikimedia.org/wikipedia/commons/a/a0/Russia-today-logo.svg",
    status: "online",
    lat: 55.7558,
    lon: 37.6173,
  },
  // --- VIETNAM ---
  {
    id: "country-vn-colatv",
    name: "Cola TV Vietnam (Web)",
    url: "https://colatv.live", // Main site URL
    category: "sports",
    category: "world cup",
    country: "VN",
    logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQRHAMUZmC4Pd8038CRvNN4rYlfCBNUW5HYpw&s",
    status: "online",
    lat: 10.8231, // Ho Chi Minh City
    lon: 106.6297,
  },
  {
    id: "country-vn-colatv-alt",
    name: "Cola TV Vietnam (Backup)",
    url: "https://live05.apusport.com/live/78905744.m3u8", // M3U8 Link
    category: "sports",
    category: "world cup",
    country: "VN",
    logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQRHAMUZmC4Pd8038CRvNN4rYlfCBNUW5HYpw&s",
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
    logo: "https://static.wikia.nocookie.net/logopedia/images/a/ad/Korean_Central_Television_2005.svg/revision/latest/scale-to-width-down/250?cb=20240831112220",
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
    logo: "https://static.wikia.nocookie.net/logopedia/images/f/f7/Rai_1_2016.svg/revision/latest?cb=20190913200441",
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
    logo: "https://static.wikia.nocookie.net/logopedia/images/f/f7/Rai_1_2016.svg/revision/latest?cb=20190913200441",
    status: "online",
    lat: 45.4642, // Milan
    lon: 9.1900,
  },
  // --- JAPAN ---
  {
    id: "country-jp-nhk-world-eng",
    name: "NHK World Japan (English)",
    url: "https://masterpl.hls.nhkworld.jp/hls/w/live/smarttv.m3u8",
    category: "country",
    country: "JP",
    logo: "https://static.wikia.nocookie.net/logopedia/images/5/57/Gf_nhk_logo_gray.svg/revision/latest/scale-to-width-down/1000?cb=20200402134529",
    status: "online",
    lat: 35.6633, // Shibuya, Tokyo (NHK HQ)
    lon: 139.6974,
  },
  {
    id: "country-jp-weathernews",
    name: "WeatherNews Japan Live",
    url: "https://rch01e-alive-hls.akamaized.net/38fb45b25cdb05a1/out/v1/4e907bfabc684a1dae10df8431a84d21/index.m3u8",
    category: "country",
    country: "JP",
    logo: "https://static.wikia.nocookie.net/logopedia/images/8/87/Weathernews.svg/revision/latest?cb=20190214232403",
    status: "online",
    lat: 35.6146,
    lon: 139.7745,
  },

  // --- SAUDI ARABIA ---
  {
    id: "country-sa-al-arabiya",
    name: "Al Arabiya News",
    url: "https://live.alarabiya.net/alarabiapublish/english/playlist_dvr.m3u8",
    category: "country",
    country: "SA",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Al-Arabiya_new_logo.svg/1280px-Al-Arabiya_new_logo.svg.png?_=20241011192745",
    status: "online",
    lat: 24.7136, // Riyadh
    lon: 46.6753,
  },
  {
    id: "country-sa-al-hadath",
    name: "Al Hadath",
    url: "https://av.alarabiya.net/alarabiapublish/alhadath.smil/playlist.m3u8",
    category: "country",
    country: "SA",
    logo: "https://static.wikia.nocookie.net/logopedia/images/e/ed/6F9E60A2-4A2C-4902-A03B-A52B2A112A6D.png/revision/latest/scale-to-width-down/1000?cb=20231126172043",
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
      { url: "https://iptv-org.github.io/iptv/categories/general.m3u", category: "country" },
      { url: "https://iptv-org.github.io/iptv/categories/music.m3u", category: "music"},
      { url: "https://iptv-org.github.io/iptv/countries/jp.m3u", category: "country", country: "JP" },
      { url: "https://iptv-org.github.io/iptv/countries/kr.m3u", category: "country", country: "KR" },
      { url: "https://iptv-org.github.io/iptv/countries/vn.m3u", category: "country", country: "VN" },
      { url: "https://iptv-org.github.io/iptv/countries/sa.m3u", category: "country", country: "SA" },
      { url: "https://iptv-org.github.io/iptv/countries/in.m3u", category: "country", country: "IN" },
      { url: "https://iptv-org.github.io/iptv/countries/br.m3u", category: "country", country: "BR" },
      { url: "https://iptv-org.github.io/iptv/countries/ru.m3u", category: "country", country: "RU" },
      { url: "https://iptv-org.github.io/iptv/countries/it.m3u", category: "country", country: "IT" },
      { url: "https://iptv-org.github.io/iptv/countries/fr.m3u", category: "country", country: "FR" },
      { url: "https://iptv-org.github.io/iptv/regions/amer.m3u", category: "region", region: "AMER" },
      { url: "https://iptv-org.github.io/iptv/countries/uk.m3u", category: "country", country: "UK" },
      { url: "https://iptv-org.github.io/iptv/countries/au.m3u", category: "country", country: "AU" },
      { url: "https://iptv-org.github.io/iptv/countries/ca.m3u", category: "country", country: "CA" },
      { url: "https://iptv-org.github.io/iptv/countries/tw.m3u", category: "country", country: "TW" },
      { url: "https://iptv-org.github.io/iptv/countries/tr.m3u", category: "country", country: "TR" },
      { url: "https://iptv-org.github.io/iptv/countries/es.m3u", category: "country", country: "ES" },
      { url: "https://iptv-org.github.io/iptv/countries/de.m3u", category: "country", country: "DE" },
      { url: "https://iptv-org.github.io/iptv/countries/cn.m3u", category: "country", country: "CN" },
      { url: "https://iptv-org.github.io/iptv/countries/ro.m3u", category: "country", country: "RO" },
      { url: "https://iptv-org.github.io/iptv/countries/ae.m3u", category: "country", country: "AE" },
      { url: "https://iptv-org.github.io/iptv/countries/nz.m3u", category: "country", country: "NZ" },
      { url: "https://iptv-org.github.io/iptv/countries/kp.m3u", category: "country", country: "KP" },
      { url: "https://iptv-org.github.io/iptv/countries/fi.m3u", category: "country", country: "FI" },
      { url: "https://iptv-org.github.io/iptv/countries/no.m3u", category: "country", country: "NO" },
      { url: "https://iptv-org.github.io/iptv/countries/se.m3u", category: "country", country: "SE" },
      { url: "https://iptv-org.github.io/iptv/countries/dk.m3u", category: "country", country: "DK" },
      { url: "https://iptv-org.github.io/iptv/countries/nl.m3u", category: "country", country: "NL" },
      { url: "https://iptv-org.github.io/iptv/countries/be.m3u", category: "country", country: "BE" },
      { url: "https://iptv-org.github.io/iptv/countries/ch.m3u", category: "country", country: "CH" },
      { url: "https://iptv-org.github.io/iptv/countries/kp.m3u", category: "country", country: "KP" },
      { url: "https://iptv-org.github.io/iptv/index.m3u", category: "general"}
    ];

    const m3uResults = await Promise.all(sources.map(src => downloadM3U(src.url).then(data => parseM3U(data, src.category))));
    
    let allStreams = [...staticStreams];
    m3uResults.forEach(list => {
      // Buffer slightly more per category to hit the 2000 target after deduplication
      allStreams = allStreams.concat(list.slice(0, 400));
    });

    // Deduplication and Status Estimation
    const uniqueStreams = [];
    const seenUrls = new Set();
    
    for (const stream of allStreams) {
      if (!seenUrls.has(stream.url)) {
        seenUrls.add(stream.url);
        
        // Smarter Status Estimation:
        // Use deterministic statuses for dynamic streams so they aren't all "online"
        let estimatedStatus = stream.status;
        if (stream.id.startsWith("v-dyn")) {
          const urlStr = stream.url.toLowerCase();
          // Heuristic: Some domains are known to be unstable in certain regions
          if (urlStr.includes("akamai") || urlStr.includes("cloudfront")) {
            estimatedStatus = "online";
          } else {
            // Mix in some "unstable" indicators for dynamic feeds
            estimatedStatus = (stream.url.length % 5 === 0) ? "unstable" : "online";
          }
        }
        
        uniqueStreams.push({ ...stream, status: estimatedStatus });
      }
    }

    // Strict 10000 cap for Vercel deployment stability
    const cappedStreams = uniqueStreams.slice(0, 10000);

    return response.status(200).json({
      success: true,
      count: cappedStreams.length,
      streams: cappedStreams
    });
  } catch (error) {
    console.error("API error:", error);
    return response.status(500).json({ success: false, error: "Satellite router failed to aggregate streams" });
  }
}
