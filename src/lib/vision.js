// vision.js — Google Vision via secure Supabase Edge Function
// The API key never touches the browser

const PROXY = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vision-proxy`
const ANON  = import.meta.env.VITE_SUPABASE_ANON_KEY

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function callVision(imageBase64) {
  const res = await fetch(PROXY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ANON}` },
    body: JSON.stringify({ imageBase64 }),
  })
  if (!res.ok) throw new Error(`Vision proxy error: ${res.status}`)
  const data = await res.json()
  if (data.error) throw new Error(data.error)
  return data
}

export async function scanCoverImage(imageBase64) {
  const data     = await callVision(imageBase64)
  const response = data.responses?.[0]
  if (!response) throw new Error('No response from Vision API')
  return parseVisionResponse(response)
}

export async function scanAndEnrich(imageBase64) {
  const detected = await scanCoverImage(imageBase64)
  const query    = [detected.title, detected.issueNumber].filter(Boolean).join(' ').trim()
  if (!query) return { ...detected, cover_url: '', comicvine_id: '' }
  try {
    const { searchComics } = await import('./comicvine')
    const results = await searchComics(query)
    if (results?.length > 0) {
      const best = results[0]
      return {
        title:               best.title               || detected.title,
        issueNumber:         best.issue_number        || detected.issueNumber,
        publisher:           best.publisher           || detected.publisher,
        cover_url:           best.cover_url           || '',
        comicvine_id:        best.comicvine_id        || '',
        description:         best.description         || '',
        deck:                best.deck                || '',
        volume_id:           best.volume_id           || '',
        volume_issue_count:  best.volume_issue_count  || null,
        rawText:             detected.rawText,
      }
    }
  } catch (err) { console.warn("[vision]", err?.message) }
  return { ...detected, cover_url: '', comicvine_id: '' }
}

function parseVisionResponse(response) {
  const fullText    = response.textAnnotations?.[0]?.description || ''
  const webEntities = response.webDetection?.webEntities || []
  const logos       = response.logoAnnotations || []
  const PUBLISHERS  = ['Marvel', 'DC Comics', 'DC', 'Image', 'Dark Horse', 'IDW', 'BOOM']
  const logo        = logos.find(l => PUBLISHERS.some(p => l.description?.toLowerCase().includes(p.toLowerCase())))
  const publisher   = logo?.description || extractPublisherFromText(fullText)
  const issueMatch  = fullText.match(/#?\s*(\d+)/m)
  const issueNumber = issueMatch ? `#${issueMatch[1]}` : ''
  const titleEntity = webEntities.filter(e => e.score > 0.5 && e.description?.length > 3).sort((a,b) => b.score - a.score)[0]
  const title       = titleEntity?.description || extractTitleFromText(fullText)
  return { title, issueNumber, publisher, rawText: fullText }
}

function extractPublisherFromText(text) {
  for (const p of ['Marvel','DC Comics','DC','Image','Dark Horse','IDW','BOOM']) {
    if (text.toLowerCase().includes(p.toLowerCase())) return p
  }
  return ''
}

function extractTitleFromText(text) {
  return text.split('\n').map(l => l.trim()).filter(l => l.length > 2)[0] || ''
}
