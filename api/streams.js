import { GoogleGenAI, Type } from '@google/genai';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const ai = new GoogleGenAI({});

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Generate a list of 5 fictional live streams.',
      config: {
        // Enforce pure JSON output
        responseMimeType: 'application/json',
        // Lock the model down to your exact frontend structure
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              category: { type: Type.STRING },
              viewers: { type: Type.INTEGER },
              streamer: { type: Type.STRING },
            },
            required: ['id', 'title', 'category', 'viewers', 'streamer'],
          },
        },
      },
    });

    // The SDK safely returns pre-parsed text when config schemas are applied
    const streamsData = JSON.parse(response.text);

    return res.status(200).json(streamsData);

  } catch (error) {
    console.error('Streams API Error:', error);
    
    // Hardcoded fallback data keeping your exact keys intact
    return res.status(200).json([
      { id: "1", title: "Coding Stream", category: "Technology", viewers: 1024, streamer: "DevUser" },
      { id: "2", title: "Just Chatting", category: "Community", viewers: 512, streamer: "ChatterBox" }
    ]);
  }
}
