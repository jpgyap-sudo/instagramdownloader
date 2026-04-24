export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing url parameter' });

  const KEY = process.env.RAPIDAPI_KEY;
  const HOST = 'instagram-scraper-stable-api.p.rapidapi.com';

  if (!KEY) {
    return res.status(500).json({ error: 'RAPIDAPI_KEY is not configured.' });
  }

  // Extract shortcode from URL
  const match = url.match(/\/(reel|p|tv)\/([A-Za-z0-9_-]+)/);
  const shortcode = match ? match[2] : null;
  if (!shortcode) return res.status(400).json({ error: 'Invalid Instagram URL' });

  const endpoints = [
    `https://${HOST}/ig/post_info/?shortcode=${shortcode}`,
    `https://${HOST}/ig/post_info/?post_url=${encodeURIComponent(url)}`,
    `https://${HOST}/ig/media_info/?shortcode=${shortcode}`,
    `https://${HOST}/ig/media/?shortcode=${shortcode}`,
    `https://${HOST}/ig/reel/?shortcode=${shortcode}`,
  ];

  const headers = {
    'x-rapidapi-key': KEY,
    'x-rapidapi-host': HOST,
  };

  let lastError = null;

  for (const ep of endpoints) {
    try {
      const r = await fetch(ep, { headers });
      const text = await r.text();
      let data = null;

      try {
        data = JSON.parse(text);
      } catch {
        // Ignore parse errors, preserve text for debugging
      }

      if (!r.ok) {
        lastError = {
          endpoint: ep,
          status: r.status,
          statusText: r.statusText,
          body: data || text,
        };
        continue;
      }

      if (data && !data.error && !data.detail) {
        return res.status(200).json(data);
      }

      lastError = {
        endpoint: ep,
        status: r.status,
        statusText: r.statusText,
        body: data || text,
      };
    } catch (e) {
      lastError = { endpoint: ep, error: e.message };
      continue;
    }
  }

  const errorMessage = lastError?.status === 403
    ? 'RapidAPI key is not authorized for this API. Check your subscription and RAPIDAPI_KEY.'
    : 'Could not fetch video from any endpoint. See details for the last RapidAPI response.';

  return res.status(500).json({ error: errorMessage, details: lastError });
}
