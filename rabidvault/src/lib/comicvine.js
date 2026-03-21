// ComicVine API — https://comicvine.gamespot.com/api
// Free tier: 200 requests/hour
// All requests are proxied through a Supabase Edge Function to hide your API key

const PROXY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/comicvine-proxy`

async function cvFetch(endpoint, params = {}) {
  const url = new URL(PROXY_URL)
  url.searchParams.set('endpoint', endpoint)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
  })
  if (!res.ok) throw new Error(`ComicVine proxy error: ${res.status}`)
  return res.json()
}

// Search comics by title
export async function searchComics(query) {
  try {
  const data = await cvFetch('search', {
    query,
    resources: 'issue',
    field_list: 'id,name,issue_number,volume,image,cover_date,description,deck',
    limit: 10,
  })
  return (data.results || []).map(normaliseIssue)
  } catch (err) {
    console.warn("[comicvine]", err?.message)
    return []
  }
}

// Get a single issue by ComicVine ID
export async function getIssue(comicvineId) {
  try {
  const data = await cvFetch(`issue/4000-${comicvineId}`, {
    field_list: 'id,name,issue_number,volume,image,cover_date,description,deck,character_credits',
  })
  return data.results ? normaliseIssue(data.results) : null
  } catch (err) {
    console.warn("[comicvine]", err?.message)
    return null
  }
}

// Get issues in a volume (series)
export async function getVolume(volumeId) {
  try {
  const data = await cvFetch(`volume/4050-${volumeId}`, {
    field_list: 'id,name,publisher,issues,image,description',
  })
  return data.results || null
  } catch (err) {
    console.warn("[comicvine]", err?.message)
    return null
  }
}

// Fetch price history from our own Supabase price_history table
export async function getPriceHistory(comicId) {
  try {
  const { supabase } = await import('./supabase')
  const { data } = await supabase
    .from('price_history')
    .select('price, grade, recorded_at, source')
    .eq('comic_id', comicId)
    .order('recorded_at', { ascending: true })
    .limit(24)
  return data || []
  } catch (err) {
    console.warn("[comicvine]", err?.message)
    return []
  }
}

// Record a new price snapshot (called when user updates value)
export async function recordPriceSnapshot(comicId, grade, price) {
  try {
  const { supabase } = await import('./supabase')
  await supabase
    .from('price_history')
    .insert({ comic_id: comicId, grade, price, source: 'user' })
  } catch (err) {
    console.warn("[comicvine]", err?.message)
    return null
  }
}

function stripHtml(html = '') {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, 600)
}

function normaliseIssue(raw) {
  return {
    comicvine_id:        String(raw.id),
    title:               raw.volume?.name || raw.name,
    issue_number:        raw.issue_number ? `#${raw.issue_number}` : '',
    publisher:           raw.volume?.publisher?.name || '',
    cover_url:           raw.image?.medium_url || raw.image?.original_url || '',
    description:         stripHtml(raw.description || ''),
    deck:                raw.deck || '',
    publish_date:        raw.cover_date || '',
    volume_id:           raw.volume?.id ? String(raw.volume.id) : '',
    volume_issue_count:  raw.volume?.count_of_issues || null,
    volume_name:         raw.volume?.name || '',
  }
}


// ── eBay search URL builder ────────────────────────────────────
// Opens an eBay search for the exact comic with grade filter
export function buildEbayUrl(title, issueNumber, grade) {
  // Build a focused search query
  const gradeKeyword = gradeToEbayKeyword(grade)
  const query = [title, issueNumber, gradeKeyword, 'comic']
    .filter(Boolean)
    .join(' ')
    .trim()
  const encoded = encodeURIComponent(query)
  // Use eBay's completed listings for real sold prices, or active for current
  return `https://www.ebay.co.uk/sch/i.html?_nkw=${encoded}&_sacat=259104&LH_Sold=1&LH_Complete=1`
  // Category 259104 = Comics & Graphic Novels on eBay UK
}

// Also export an active listings URL (what's for sale right now)
export function buildEbayActiveUrl(title, issueNumber, grade) {
  const gradeKeyword = gradeToEbayKeyword(grade)
  const query = [title, issueNumber, gradeKeyword, 'comic'].filter(Boolean).join(' ').trim()
  return `https://www.ebay.co.uk/sch/i.html?_nkw=${encodeURIComponent(query)}&_sacat=259104`
}

function gradeToEbayKeyword(grade) {
  if (!grade) return ''
  const g = grade.toLowerCase()
  if (g.includes('mint') && !g.includes('near')) return 'CGC 9.8 OR NM/MT'
  if (g.includes('near mint'))   return 'NM OR 9.4 OR 9.6'
  if (g.includes('very fine'))   return 'VF OR 8.0'
  if (g.includes('fine'))        return 'FN OR 6.0'
  if (g.includes('good'))        return 'GD OR 2.0'
  return ''
}
