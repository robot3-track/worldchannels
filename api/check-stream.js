// api/check-stream.js
import https from "https";
import http from "http";

export default async function handler(request, response) {
  response.setHeader('Access-Control-Allow-Credentials', true);
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (request.method === 'OPTIONS') return response.status(200).end();

  const streamUrl = request.query.url;
  if (!streamUrl) return response.status(400).json({ error: "Missing stream url" });

  try {
    const isOnline = await new Promise((resolve) => {
      const isHttps = streamUrl.startsWith("https");
      const client = isHttps ? https : http;
      
      // Determine if this is a direct video stream file or an iframe/embed page
      const urlLowerCase = streamUrl.split('?')[0].toLowerCase();
      const isDirectStream = urlLowerCase.includes(".m3u8") || 
                             urlLowerCase.includes(".m3u") || 
                             urlLowerCase.includes(".mp4") || 
                             urlLowerCase.includes(".ts");

      const req = client.get(streamUrl, { 
        timeout: 4000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': '*/*'
        }
      }, (res) => {
        // 1. Basic HTTP status code check (must be 2xx or 3xx)
        const validStatus = res.statusCode && res.statusCode >= 200 && res.statusCode < 400;
        if (!validStatus) {
          req.destroy();
          return resolve(false);
        }

        // 2. IFRAME / EMBED PATH: If it's not a direct media stream, assume it's an embed page.
        // As long as the HTTP status is valid, we mark it online and don't inspect the HTML.
        if (!isDirectStream) {
          req.destroy();
          return resolve(true);
        }

        // 3. DIRECT STREAM PATH: Strict validation for .m3u8 / .m3u files
        const contentType = (res.headers['content-type'] || '').toLowerCase();
        if (contentType.includes('text/html')) {
          // A real .m3u8 file shouldn't return text/html; this is likely an error webpage
          req.destroy();
          return resolve(false);
        }

        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk.toString('utf8');
          
          // Check the first ~512 bytes for valid HLS/M3U playlist tags
          if (rawData.length >= 512) {
            req.destroy();
            const isValidPlaylist = rawData.includes('#EXTM3U') || rawData.includes('#EXTINF');
            resolve(isValidPlaylist);
          }
        });

        res.on('end', () => {
          const isValidPlaylist = rawData.includes('#EXTM3U') || rawData.includes('#EXTINF');
          resolve(isValidPlaylist);
        });

      }).on("error", () => resolve(false));

      req.on("timeout", () => { 
        req.destroy(); 
        resolve(false); 
      });
    });

    return response.status(200).json({
      url: streamUrl,
      online: isOnline,
      status: isOnline ? "online" : "offline"
    });
  } catch (error) {
    return response.status(200).json({ url: streamUrl, online: false, status: "offline" });
  }
}