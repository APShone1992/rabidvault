// supabase/functions/comicvine-proxy/index.ts
// Deploy with: supabase functions deploy comicvine-proxy
// Proxies both API calls AND cover images to avoid CORS/hotlink blocking

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const COMICVINE_BASE = 'https://comicvine.gamespot.com/api'
const API_KEY = Deno.env.get('COMICVINE_API_KEY') ?? ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const url = new URL(req.url)

  // ── Image proxy ───────────────────────────────────────────────
  const imageUrl = url.searchParams.get('image')
  if (imageUrl) {
    try {
      const res = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; TheRabidVault/1.0)',
          'Referer': 'https://comicvine.gamespot.com/',
        },
      })
      if (!res.ok) {
        return new Response('Image not found', { status: 404, headers: corsHeaders })
      }
      const contentType = res.headers.get('content-type') || 'image/jpeg'
      const imageData = await res.arrayBuffer()
      return new Response(imageData, {
        headers: {
          ...corsHeaders,
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400',
        },
      })
    } catch (err) {
      return new Response('Image fetch failed', { status: 500, headers: corsHeaders })
    }
  }

  // ── API proxy ─────────────────────────────────────────────────
  if (!API_KEY) {
    return new Response(
      JSON.stringify({ error: 'COMICVINE_API_KEY secret is not set.' }),
      { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const endpoint = url.searchParams.get('endpoint') ?? 'search'

    const params = new URLSearchParams()
    params.set('api_key', API_KEY)
    params.set('format', 'json')
    url.searchParams.forEach((value, key) => {
      if (key !== 'endpoint') params.set(key, value)
    })

    const cvUrl = `${COMICVINE_BASE}/${endpoint}/?${params}`
    const cvRes = await fetch(cvUrl, {
      headers: { 'User-Agent': 'The Rabid Vault/1.0' }
    })

    if (!cvRes.ok) throw new Error(`ComicVine returned ${cvRes.status}`)

    const data = await cvRes.json()

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
