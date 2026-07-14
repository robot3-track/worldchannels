// api/report-broken.js
// Handles stream failure reports on Vercel with structured telemetry logging

// Optional: Warm-container cache to temporarily track reported URLs in memory
const temporaryFailureRegistry = new Set();

export default async function handler(request, response) {
  response.setHeader('Access-Control-Allow-Credentials', true);
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (request.method === 'OPTIONS') return response.status(200).end();
  if (request.method !== 'POST') return response.status(405).json({ error: 'Method not allowed' });

  try {
    // 1. Safe Body Parsing (Guards against unparsed string payloads in Vercel)
    let body = request.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        return response.status(400).json({ success: false, error: "Invalid JSON format" });
      }
    }

    const { url, name, category, country } = body || {};
    if (!url) {
      return response.status(400).json({ success: false, error: "Missing stream URL" });
    }

    // 2. Track failure inside the warm container lifecycle
    temporaryFailureRegistry.add(url);

    // 3. Structured Telemetry Logging
    // This outputs to your Vercel Function logs. You can easily parse these logs
    // or set up an integration to alert you when a stream goes down.
    console.warn(JSON.stringify({
      event: "STREAM_FAILURE_REPORTED",
      timestamp: new Date().toISOString(),
      stream: {
        url,
        name: name || "Unknown/Unnamed Node",
        category: category || "Uncategorized",
        country: country || "Global"
      },
      clientIp: request.headers['x-forwarded-for'] || request.socket.remoteAddress,
      userAgent: request.headers['user-agent']
    }, null, 2));

    // Optional: Integrate an external webhook here (e.g., Discord, Slack, or a database)
    // if (process.env.DISCORD_WEBHOOK_URL) {
    //   await fetch(process.env.DISCORD_WEBHOOK_URL, {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ content: `🚨 **Broken Stream:** ${name || 'Unknown'} (${url})` })
    //   }).catch(err => console.error("Webhook relay failed:", err));
    // }

    return response.status(200).json({
      success: true,
      message: "Stream failure registered by the monitoring network. Thank you for reporting.",
      reportedUrl: url,
      activeContainerFailuresCount: temporaryFailureRegistry.size
    });

  } catch (error) {
    console.error("Critical failure handling stream report:", error);
    return response.status(500).json({ success: false, error: "Report processing encountered an internal system error" });
  }
}