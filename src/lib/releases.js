// ================================================================
// UPCOMING RELEASES + VARIANT COVERS  — ComicVine API
// All requests proxied through Supabase Edge Function
// ================================================================

const PROXY = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/comicvine-proxy`
const ANON  = import.meta.env.VITE_SUPABASE_ANON_KEY

async function cv(endpoint, params = {}) {
  const url = new URL(PROXY)
  url.searchParams.set('endpoint', endpoint)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url, { headers: { Authorization: `Bearer ${ANON}` } })
  if (!res.ok) throw new Error(`CV ${res.status}`)
  return res.json()
}

function fmt(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`
}

function stripHtml(h = '') {
  return h.replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').trim().slice(0,500)
}

export function norm(raw) {
  return {
    comicvine_id: String(raw.id),
    title:        raw.volume?.name || raw.name || 'Unknown',
    issue_number: raw.issue_number ? `#${raw.issue_number}` : '',
    publisher:    raw.volume?.publisher?.name || '',
    cover_url:    raw.image?.medium_url   || raw.image?.original_url || '',
    thumb_url:    raw.image?.thumb_url    || raw.image?.medium_url   || '',
    releaseDate:  raw.cover_date || '',
    variantCount: (raw.associated_images || []).length,
    hasVariants:  (raw.associated_images || []).length > 0,
  }
}

// ── Upcoming releases grouped by release week ─────────────────
export async function fetchUpcomingReleases(monthsAhead = 4) {
  try {
  const today  = new Date()
  const future = new Date(today)
  future.setMonth(future.getMonth() + monthsAhead)

  const data = await cv('issues', {
    filter:     `cover_date:${fmt(today)}|${fmt(future)}`,
    field_list: 'id,name,issue_number,cover_date,image,volume,associated_images',
    sort:       'cover_date:asc',
    limit:      100,
  })

  return (data.results || []).map(norm)
  } catch (err) {
    console.warn("[releases]", err?.message)
    return []
  }
}

// ── Full issue detail + all variant covers ────────────────────
export async function fetchVariants(comicvineId) {
  const data = await cv(`issue/4000-${comicvineId}`, {
    field_list: 'id,name,issue_number,image,associated_images,volume,cover_date,description,character_credits,story_arc_credits',
  })

  const issue = data.results
  if (!issue) return null

  const mainCover = {
    id:     `main-${issue.id}`,
    label:  'Main Cover',
    url:    issue.image?.original_url || issue.image?.medium_url || '',
    thumb:  issue.image?.medium_url   || issue.image?.thumb_url  || '',
    isMain: true,
  }

  const variants = (issue.associated_images || []).map((img, i) => ({
    id:     `v-${issue.id}-${i}`,
    label:  `Variant ${String.fromCharCode(65 + i)}`,
    url:    img.original_url || img.medium_url || '',
    thumb:  img.medium_url   || img.original_url || '',
    isMain: false,
  }))

  return {
    ...norm(issue),
    covers:      [mainCover, ...variants],
    characters:  (issue.character_credits  || []).slice(0, 8).map(c => c.name),
    storyArcs:   (issue.story_arc_credits  || []).map(a => a.name),
    description: stripHtml(issue.description || ''),
  }
}

// ── Search upcoming ───────────────────────────────────────────
export async function searchUpcoming(query, monthsAhead = 6) {
  const today  = new Date()
  const future = new Date(today)
  future.setMonth(future.getMonth() + monthsAhead)

  const data = await cv('search', {
    query,
    resources:  'issue',
    field_list: 'id,name,issue_number,cover_date,image,volume,associated_images',
    limit:      20,
  })

  return (data.results || [])
    .filter(i => { const d = new Date(i.cover_date); return d >= today && d <= future })
    .map(norm)
}

// ── Group issues by Wednesday release date ────────────────────
export function groupByWeek(issues) {
  return issues.reduce((acc, issue) => {
    const d   = new Date(issue.releaseDate)
    if (isNaN(d)) return acc
    const wed = new Date(d)
    const day = wed.getDay()
    wed.setDate(wed.getDate() + ((day <= 3) ? (3 - day) : (10 - day)))
    const key = wed.toISOString().split('T')[0]
    if (!acc[key]) acc[key] = []
    acc[key].push(issue)
    return acc
  }, {})
}

export function formatWeekLabel(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })
}
