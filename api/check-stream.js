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
      const req = client.get(streamUrl, { timeout: 3000 }, (res) => {
        const ok = res.statusCode && res.statusCode >= 200 && res.statusCode < 400;
        req.destroy();
        resolve(!!ok);
      }).on("error", () => resolve(false));
      req.on("timeout", () => { req.destroy(); resolve(false); });
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
