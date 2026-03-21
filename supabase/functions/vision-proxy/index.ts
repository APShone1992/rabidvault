// supabase/functions/vision-proxy/index.ts
// Deploy: supabase functions deploy vision-proxy
// Secret: supabase secrets set GOOGLE_VISION_API_KEY=your_key

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const API_KEY = Deno.env.get('GOOGLE_VISION_API_KEY') ?? ''
    if (!API_KEY) throw new Error('GOOGLE_VISION_API_KEY secret not set')

    const { imageBase64 } = await req.json()
    if (!imageBase64) throw new Error('imageBase64 is required')

    const body = {
      requests: [{
        image: { content: imageBase64 },
        features: [
          { type: 'TEXT_DETECTION',  maxResults: 1 },
          { type: 'WEB_DETECTION',   maxResults: 5 },
          { type: 'LOGO_DETECTION',  maxResults: 3 },
          { type: 'LABEL_DETECTION', maxResults: 5 },
        ],
      }],
    }

    const res = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${API_KEY}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    )

    if (!res.ok) throw new Error(`Vision API returned ${res.status}`)
    const data = await res.json()

    return new Response(JSON.stringify(data), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
