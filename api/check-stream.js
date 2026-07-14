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
      
      const urlLowerCase = streamUrl.split('?')[0].toLowerCase();
      const hasMediaExtension = urlLowerCase.includes(".m3u8") || 
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
        // 1. Basic HTTP status code check (must be 200-399)
        const validStatus = res.statusCode && res.statusCode >= 200 && res.statusCode < 400;
        if (!validStatus) {
          req.destroy();
          return resolve(false);
        }

        const contentType = (res.headers['content-type'] || '').toLowerCase();
        const contentLength = parseInt(res.headers['content-length'] || '-1', 10);

        // 2. Reject empty bodies (Common for dead or placeholder links)
        if (contentLength === 0) {
          req.destroy();
          return resolve(false);
        }

        // 3. Reject JSON API Errors (Common for expired IPTV accounts)
        if (contentType.includes('application/json')) {
          req.destroy();
          return resolve(false);
        }

        // 4. Handle HTML pages (Embeds vs. Error Pages)
        if (contentType.includes('text/html')) {
          if (hasMediaExtension) {
            // It asked for a media file but got a webpage. This is a dead link/error page.
            req.destroy();
            return resolve(false);
          } else {
            // It asked for an extensionless URL and got a webpage. Trust it as a valid Iframe embed.
            req.destroy();
            return resolve(true);
          }
        }

        // 5. Handle Binary Video Streams (.ts, .mp4)
        // These won't have #EXTM3U text inside them, so if the server returns this type, it's online.
        if (contentType.includes('video/') || contentType.includes('application/octet-stream')) {
          req.destroy();
          return resolve(true);
        }

        // 6. Handle M3U/M3U8 Playlists (application/x-mpegurl, audio/mpegurl, text/plain)
        // Read data streams systematically to ensure valid structure
        let rawData = '';
        let resolved = false;

        res.on('data', (chunk) => {
          if (resolved) return;
          rawData += chunk.toString('utf8');
          
          // Verify if we have a valid M3U8 structure block
          const hasM3UTag = rawData.includes('#EXTM3U') || rawData.includes('#EXTINF');
          
          if (hasM3UTag) {
            resolved = true;
            req.destroy();
            resolve(true);
          } else if (rawData.length >= 1024) {
            // If we've read 1KB of data and still don't have M3U tags, it's a false playlist
            resolved = true;
            req.destroy();
            resolve(false);
          }
        });

        res.on('end', () => {
          if (resolved) return;
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