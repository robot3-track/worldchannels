export default async function handler(req, res) {
  const { id } = req.query;

  if (id === 'sports-foxsports-1') {
    const targetUrl = "http://45.139.122.199:2095/live/ftU3Se0G/nSgzwb7/2432261.m3u8";
    const baseUrl = "http://45.139.122.199:2095/live/ftU3Se0G/nSgzwb7/2432261.m3u8";

    try {
      // 1. Fetch the raw HTTP stream on Vercel's secure backend
      const response = await fetch(targetUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Referer": targetUrl,
          "Origin": baseUrl
        }
      });

      let playlistText = await response.text();

      // 2. Rewrite internal relative .ts chunks to absolute HTTP links 
      // so the browser can read them through our secure channel
      playlistText = playlistText.replace(/^(?!http)(.*\.ts)$/gm, `${baseUrl}$1`);

      // 3. Send it to the frontend player with proper headers
      res.setHeader('Content-Type', 'application/x-mpegURL');
      res.setHeader('Access-Control-Allow-Origin', '*'); 
      return res.status(200).send(playlistText);

    } catch (error) {
      return res.status(500).send('Proxy streaming error: ' + error.message);
    }
  }

  return res.status(404).send('Stream not found');
}
