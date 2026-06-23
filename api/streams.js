// api/streams.js

export default async function handler(request, response) {
  // Add CORS headers so your frontend can communicate with it smoothly
  response.setHeader('Access-Control-Allow-Credentials', true);
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  response.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight OPTIONS request
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  try {
    // We return the structure that App.tsx expects: { success: true, streams: [...] }
    // These are highly stable mock streams to ensure the app boots correctly on Vercel
    const mockStreams = [
      {
        id: "v-stream-1",
        name: "World Channel Alpha (Red Bull TV)",
        status: "online",
        url: "https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8",
        category: "sports",
        country: "Global",
        logo: "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=120&h=120&q=80",
        lat: 47.8095,
        lon: 13.0550
      },
      {
        id: "v-stream-2",
        name: "World Channel Beta (Sky News)",
        status: "online",
        url: "https://skynews-live.akamaized.net/hls/live/2007802/skynewsn-global/master.m3u8",
        category: "news",
        country: "UK",
        logo: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=120&h=120&q=80",
        lat: 51.5074,
        lon: -0.1278
      },
      {
        id: "v-stream-3",
        name: "France 24 English",
        status: "online",
        url: "https://static.france24.com/live/F24_EN_LO_HLS/live_web.m3u8",
        category: "news",
        country: "FR",
        logo: "https://images.unsplash.com/photo-1495020689067-958852a6565d?auto=format&fit=crop&w=120&h=120&q=80",
        lat: 48.8566,
        lon: 2.3522
      },
      {
        id: "v-stream-4",
        name: "NASA TV Public",
        status: "online",
        url: "https://ntv-intel-01.akamaized.net/hls/live/2042749/NASA-NTV-1-HQ/master.m3u8",
        category: "science",
        country: "US",
        logo: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=120&h=120&q=80",
        lat: 28.5729,
        lon: -80.6490
      }
    ];

    // Return the response explicitly as application/json in the format App.tsx expects
    return response.status(200).json({
      success: true,
      streams: mockStreams
    });

  } catch (error) {
    console.error("API error:", error);
    return response.status(500).json({ 
      success: false, 
      error: "Failed to load stream infrastructure data" 
    });
  }
}
