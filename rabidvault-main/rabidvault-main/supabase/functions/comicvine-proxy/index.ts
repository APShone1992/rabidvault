// supabase/functions/comicvine-proxy/index.ts
// Deploy with: supabase functions deploy comicvine-proxy

const COMICVINE_BASE = 'https://comicvine.gamespot.com/api'
const API_KEY = Deno.env.get('COMICVINE_API_KEY') ?? ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const url = new URL(req.url)

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
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
