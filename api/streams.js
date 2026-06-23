import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
  // 1. Handle CORS Preflight Requests (Crucial for Vercel)
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
    // 2. Initialize the Gemini SDK
    // It automatically reads the GEMINI_API_KEY from your Vercel Environment Variables
    const ai = new GoogleGenAI({});

    // 3. Define the prompt instructions for the AI
    const systemPrompt = `
      You are a backend streaming data generator. 
      Generate a valid JSON array containing a list of 5 fictional or curated video live streams. 
      Each stream object MUST have these exact keys:
      - id: unique string
      - title: string
      - category: string
      - viewers: number
      - streamer: string
      
      Respond ONLY with the raw JSON array. Do not include markdown formatting like \`\`\`json.
    `;

    // 4. Request content from the Gemini model
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: systemPrompt,
    });

    // 5. Clean up code block backticks if the model accidentally includes them
    let cleanText = response.text.trim();
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```json\s*/, '').replace(/```$/, '').trim();
    }

    // 6. Parse the AI response text into an actual JSON object
    const streamsData = JSON.parse(cleanText);

    // 7. Send the valid JSON object back to your frontend
    return res.status(200).json(streamsData);

  } catch (error) {
    console.error('Streams API Error:', error);
    
    // Fallback static data so your frontend doesn't crash if the API limit is hit
    return res.status(200).json([
      { id: "1", title: "Gaming Marathon", category: "Gaming", viewers: 1250, streamer: "PixelPro" },
      { id: "2", title: "Lo-Fi Beats to Code To", category: "Music", viewers: 3400, streamer: "ChillVibes" }
    ]);
  }
}
