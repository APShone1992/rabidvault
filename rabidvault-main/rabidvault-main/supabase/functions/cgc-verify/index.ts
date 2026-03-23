// supabase/functions/cgc-verify/index.ts
// Verifies CGC and CBCS cert numbers by scraping the grading company registries
// Deploy: supabase functions deploy cgc-verify


const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const { certNumber, registry } = await req.json()
    if (!certNumber) throw new Error('certNumber is required')

    const clean = String(certNumber).replace(/\D/g, '')
    let result  = null

    if (registry === 'CGC' || !registry) {
      result = await verifyCGC(clean)
    }
    if (!result && (registry === 'CBCS' || !registry)) {
      result = await verifyCBCS(clean)
    }

    return new Response(JSON.stringify(result || { found: false }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status:  500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})

async function verifyCGC(certNumber: string) {
  try {
    const url = `https://www.cgccomics.com/certlookup/${certNumber}/`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'The Rabid Vault/1.0 (comic tracker)' }
    })
    if (!res.ok) return null
    const html = await res.text()

    // Parse key fields from CGC's cert lookup HTML
    const title   = extractBetween(html, 'class="Title">', '</span>')
    const issue   = extractBetween(html, 'class="Issue">', '</span>')
    const grade   = extractBetween(html, 'class="Grade">', '</span>')
    const year    = extractBetween(html, 'class="Year">', '</span>')
    const variant = extractBetween(html, 'class="Variant">', '</span>')
    const label   = extractBetween(html, 'class="Label">', '</span>')

    if (!title && !grade) return null

    return {
      found:      true,
      registry:   'CGC',
      certNumber,
      title:      clean(title),
      issue:      clean(issue),
      grade:      clean(grade),
      year:       clean(year),
      variant:    clean(variant),
      label:      clean(label),
      verifiedAt: new Date().toISOString(),
    }
  } catch { return null }
}

async function verifyCBCS(certNumber: string) {
  try {
    const url = `https://cbcscomics.com/certification/lookup?certificationNumber=${certNumber}`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'The Rabid Vault/1.0 (comic tracker)' }
    })
    if (!res.ok) return null
    const html = await res.text()

    const title = extractBetween(html, '"title":', ',')?.replace(/"/g, '')
    const grade = extractBetween(html, '"grade":', ',')?.replace(/"/g, '')

    if (!title && !grade) return null

    return {
      found:      true,
      registry:   'CBCS',
      certNumber,
      title:      clean(title),
      grade:      clean(grade),
      verifiedAt: new Date().toISOString(),
    }
  } catch { return null }
}

function extractBetween(html: string, start: string, end: string): string {
  const s = html.indexOf(start)
  if (s === -1) return ''
  const e = html.indexOf(end, s + start.length)
  if (e === -1) return ''
  return html.slice(s + start.length, e).trim()
}

function clean(str: string): string {
  return (str || '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').trim()
}
