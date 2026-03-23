import { useState, useRef, useEffect } from 'react'
import { useCollection } from '../context/CollectionContext'
import { searchComics } from '../lib/comicvine'
import { scanAndEnrich, fileToBase64 } from '../lib/vision'
import { startCameraScanner, stopScanner, scanFromFile } from '../lib/barcode'
import { CGCVerifier } from '../lib/cgc'
import { IconScan, IconBarcode, IconSearch, IconCamera, IconUpload, IconAdd } from '../lib/icons'
import { useToast } from '../context/ToastContext'

const GRADES = ['Mint', 'Near Mint', 'Very Fine', 'Fine', 'Good', 'Fair', 'Poor']

// Check if a comic is already in the collection
// Matches on comicvine_id first (exact), then falls back to title + issue fuzzy match
function findDuplicate(collection, { comicvine_id, title, issue_number }) {
  if (!collection?.length) return null

  // Exact match by ComicVine ID — most reliable
  if (comicvine_id) {
    const found = collection.find(c => c.comics?.comicvine_id === comicvine_id)
    if (found) return found
  }

  // Fuzzy match by title + issue — catches manual/scan entries
  if (title) {
    const normTitle = title.toLowerCase().trim()
    const normIssue = (issue_number || '').toLowerCase().replace(/[^0-9]/g, '')
    const found = collection.find(c => {
      const cTitle = (c.comics?.title || '').toLowerCase().trim()
      const cIssue = (c.comics?.issue_number || '').toLowerCase().replace(/[^0-9]/g, '')
      return cTitle === normTitle && (!normIssue || cIssue === normIssue)
    })
    if (found) return found
  }

  return null
}

export default function AddComic() {
  const { addComic, collection } = useCollection()
  const toast = useToast()
  const [tab, setTab]         = useState('manual')
  const [form, setForm]       = useState({ title: '', issue_number: '', publisher: '', grade: 'Near Mint', paid_price: '', current_value: '', notes: '', cover_url: '', comicvine_id: '', condition_photo: '', description: '', deck: '', volume_id: '', volume_issue_count: null })
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [scanning, setScanning]   = useState(false)
  const [barcodeActive, setBarcodeActive] = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [duplicate, setDuplicate]   = useState(null)
  const [conditionPhoto, setConditionPhoto] = useState('')
  const condPhotoRef = useRef()

  const coverFileRef   = useRef()
  const barcodeFileRef = useRef()
  const videoRef       = useRef()

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  // ── ComicVine search ──────────────────────────────────────────
  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setSearching(true)
    setSearchResults([])
    try {
      const results = await searchComics(searchQuery)
      setSearchResults(results)
    } catch (err) {
      toast.error('Search failed: ' + err.message)
    }
    setSearching(false)
  }

  const selectResult = (comic) => {
    setForm(f => ({
      ...f,
      title:               comic.title,
      issue_number:        comic.issue_number,
      publisher:           comic.publisher,
      cover_url:           comic.cover_url,
      comicvine_id:        comic.comicvine_id,
      description:         comic.description   || '',
      deck:                comic.deck          || '',
      volume_id:           comic.volume_id     || '',
      volume_issue_count:  comic.volume_issue_count || null,
    }))
    setDuplicate(findDuplicate(collection, comic))
    setSearchResults([])
    setTab('manual')
  }

  // ── Cover scan (Google Vision) ────────────────────────────────
  const handleCoverScan = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setScanning(true)
    try {
      const base64 = await fileToBase64(file)
      // scanAndEnrich: Vision detects text, then auto-searches ComicVine for cover
      const result = await scanAndEnrich(base64)
      const newForm = {
        title:               result?.title              || '',
        issue_number:        result.issueNumber        || '',
        publisher:           result?.publisher          || '',
        cover_url:           result?.cover_url          || '',
        comicvine_id:        result?.comicvine_id       || '',
        description:         result.description        || '',
        deck:                result.deck               || '',
        volume_id:           result.volume_id          || '',
        volume_issue_count:  result.volume_issue_count || null,
      }
      setForm(f => ({ ...f, ...newForm }))
      // Check if already in collection immediately after scan
      setDuplicate(findDuplicate(collection, newForm))
      setTab('manual')
    } catch (err) {
      toast.error('Scan failed: ' + err.message)
    }
    setScanning(false)
  }

  // ── Condition photo ──────────────────────────────────────
  const handleConditionPhoto = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Photo must be under 5MB'); return }
    const reader = new FileReader()
    reader.onload = (ev) => {
      setConditionPhoto(ev.target.result)
      setForm(f => ({ ...f, condition_photo: ev.target.result }))
    }
    reader.readAsDataURL(file)
  }

  // ── Barcode scan ──────────────────────────────────────────────
  const handleBarcodeFile = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    try {
      const barcode = await scanFromFile(file)
      await processBarcodeResult(barcode)
    } catch (err) {
      toast.error('Could not read barcode: ' + err.message)
    }
  }

  const startLiveBarcode = async () => {
    setBarcodeActive(true)
    await startCameraScanner(
      videoRef.current,
      async (barcode) => {
        stopScanner(videoRef.current)
        setBarcodeActive(false)
        await processBarcodeResult(barcode)
      },
      (err) => toast.error('Camera blocked — use file upload instead')
    )
  }

  const processBarcodeResult = async (barcode) => {
    const { lookupBarcode } = await import('../lib/barcode')
    const comic = await lookupBarcode(barcode)
    if (comic) {
      // If barcode gave us a title but no cover, search ComicVine for the cover
      let cover_url    = comic.cover_url    || ''
      let comicvine_id = comic.comicvine_id || ''
      if (!cover_url && comic.title) {
        try {
          const { searchComics } = await import('../lib/comicvine')
          const results = await searchComics(comic.title)
          if (results && results.length > 0) {
            cover_url    = results[0].cover_url    || ''
            comicvine_id = results[0].comicvine_id || ''
          }
        } catch (_) { /* intentional */ }
      }
      const barcodeForm = {
        title:        comic.title     || '',
        publisher:    comic.publisher || '',
        cover_url:    cover_url       || '',
        comicvine_id: comicvine_id    || '',
      }
      setForm(f => ({ ...f, ...barcodeForm }))
      setDuplicate(findDuplicate(collection, barcodeForm))
      setTab('manual')
    } else {
      toast.info('Barcode not found — please fill in the details manually')
      setTab('manual')
    }
  }

  useEffect(() => {
    return () => stopScanner(videoRef.current)
  }, [])

  // ── Save ──────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title) { toast.error('Please enter a title'); return }

    // Final duplicate check at save time
    const existingComic = findDuplicate(collection, form)
    if (existingComic && !duplicate) {
      // First time we're seeing this duplicate - warn and let them decide
      setDuplicate(existingComic)
      return
    }

    setSaving(true)
    const { error: saveErr } = await addComic({
      ...form,
      paid_price:    parseFloat(form.paid_price) || 0,
      current_value: parseFloat(form.current_value) || 0,
    })
    if (saveErr) { toast.error(saveErr); setSaving(false); return }
    toast.success('Comic added to The Rabid Vault!')
    setForm({ title: '', issue_number: '', publisher: '', grade: 'Near Mint', paid_price: '', current_value: '', notes: '', cover_url: '', comicvine_id: '', condition_photo: '', description: '', deck: '', volume_id: '', volume_issue_count: null })
    setConditionPhoto('')
    setDuplicate(null)
    setSaving(false)
  }

  return (
    <div className="page-enter" style={{ maxWidth: 640 }}>
      <h1 className="section-title" style={{ marginBottom: '1.5rem' }}>Add Comic</h1>

      <div className="tabs" style={{ marginBottom: '1.5rem' }}>
        {[['manual','✏️ Manual'],['scan','📷 Scan Cover'],['barcode','📊 Barcode'],['lookup','🔍 Lookup']].map(([id, label]) => (
          <button key={id} className={`tab ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      {/* ── SCAN COVER ── */}
      {tab === 'scan' && (
        <div className="card" style={{ textAlign: 'center', padding: '2.5rem', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{scanning ? 'Scanning...' : 'Position cover in frame'}</div>
          <p style={{ fontWeight: 700, marginBottom: '0.4rem' }}>{scanning ? 'Analysing cover...' : 'Upload a photo of your comic cover'}</p>
          <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '1.25rem' }}>Google Vision AI will detect title, issue & publisher</p>
          <input ref={coverFileRef} type="file" accept="image/*" capture="environment" onChange={handleCoverScan} style={{ display: 'none' }} />
          <button className="btn btn-primary" onClick={() => coverFileRef.current.click()} disabled={scanning}>
            {scanning ? 'Scanning...' : '📷 Take / Upload Photo'}
          </button>
        </div>
      )}

      {/* ── BARCODE ── */}
      {tab === 'barcode' && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontWeight: 700, marginBottom: '1rem' }}>Scan Comic Barcode</div>
          {barcodeActive ? (
            <div>
              <video ref={videoRef} style={{ width: '100%', borderRadius: 8, marginBottom: '0.75rem' }} autoPlay muted playsInline />
              <button className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }} onClick={() => { stopScanner(videoRef.current); setBarcodeActive(false) }}>Stop Camera</button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={startLiveBarcode}><IconCamera size={13} /> Live Camera Scan</button>
              <input ref={barcodeFileRef} type="file" accept="image/*" onChange={handleBarcodeFile} style={{ display: 'none' }} />
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => barcodeFileRef.current.click()}><IconUpload size={13} /> Upload Barcode Image</button>
            </div>
          )}
          <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.75rem' }}>Works with EAN-13 barcodes on the back of comics</p>
        </div>
      )}

      {/* ── LOOKUP ── */}
      {tab === 'lookup' && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontWeight: 700, marginBottom: '1rem' }}>Search ComicVine Database</div>
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
            <input className="form-input" style={{ flex: 1 }} placeholder="e.g. Amazing Spider-Man"
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()} />
            <button className="btn btn-primary" onClick={handleSearch} disabled={searching}>{searching ? '...' : 'Search'}</button>
          </div>
          {searchResults.length === 0 && searchQuery.trim() && !searching && (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--muted)', fontSize: '0.88rem' }}>
                No results found for "{searchQuery}" — try a different title or publisher
              </div>
            )}
      {searchResults.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 320, overflowY: 'auto' }}>
              {searchResults.map(r => {
                const alreadyOwned = findDuplicate(collection, r)
                return (
                  <div key={r.comicvine_id} onClick={() => selectResult(r)}
                    style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', padding: '0.75rem', background: alreadyOwned ? 'rgba(245,158,11,0.06)' : 'var(--bg3)', borderRadius: 8, cursor: 'pointer', border: `1px solid ${alreadyOwned ? 'rgba(245,158,11,0.4)' : 'var(--border)'}` }}>
                    {r.cover_url && <img loading="lazy" src={r.cover_url} alt="" style={{ width: 40, height: 55, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{r.title} {r.issue_number}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{r.publisher} · {r.publish_date}</div>
                      {alreadyOwned && (
                        <div style={{ fontSize: '0.72rem', color: '#fcd34d', fontWeight: 700, marginTop: '0.2rem' }}>
                          ✓ In your collection — {alreadyOwned.grade} · £{Number(alreadyOwned.current_value || 0).toLocaleString()}
                        </div>
                      )}
                    </div>
                    <div style={{ marginLeft: 'auto', color: 'var(--purple-light)', fontSize: '0.8rem', fontWeight: 700, flexShrink: 0 }}>Select →</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── DUPLICATE WARNING ── */}
      {duplicate && (
        <div style={{
          background: 'rgba(245,158,11,0.1)',
          border: '1.5px solid rgba(245,158,11,0.5)',
          borderRadius: 12,
          padding: '1rem 1.25rem',
          marginBottom: '1rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            {duplicate.comics?.cover_url && (
              <img loading="lazy"
                src={duplicate.comics.cover_url}
                alt=""
                style={{ width: 44, height: 62, objectFit: 'cover', borderRadius: 5, flexShrink: 0 }}
                onError={e => { e.target.style.display = 'none' }}
              />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, color: '#fcd34d', marginBottom: '0.25rem', fontSize: '0.95rem' }}>
                ⚠️ You already have this comic!
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text)', marginBottom: '0.15rem' }}>
                <strong>{duplicate.comics?.title} {duplicate.comics?.issue_number}</strong>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.6rem' }}>
                {duplicate.comics?.publisher} · Grade: <strong style={{ color: 'var(--text)' }}>{duplicate.grade}</strong> · Value: <strong style={{ color: 'var(--gold)' }}>£{Number(duplicate.current_value || 0).toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  className="btn btn-sm"
                  style={{ background: 'rgba(245,158,11,0.2)', color: '#fcd34d', border: '1px solid rgba(245,158,11,0.5)', fontSize: '0.78rem' }}
                  onClick={() => setDuplicate(null)}
                >
                  + Add Anyway (different grade/copy)
                </button>
                <button
                  className="btn btn-outline btn-sm"
                  style={{ fontSize: '0.78rem' }}
                  onClick={() => {
                    setForm({ title: '', issue_number: '', publisher: '', grade: 'Near Mint', paid_price: '', current_value: '', notes: '', cover_url: '', comicvine_id: '', condition_photo: '', description: '', deck: '', volume_id: '', volume_issue_count: null })
                    setDuplicate(null)
                  }}
                >
                  ✕ Clear Form
                </button>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* ── MANUAL FORM (always visible) ── */}
      <div className="card">
        <div style={{ fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          Comic Details
          {form.comicvine_id && <span style={{ fontSize: '0.7rem', background: 'rgba(139,92,246,0.2)', color: 'var(--purple-light)', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>ComicVine matched ✓</span>}
        </div>

        {/* Cover preview — shown whenever a cover_url is set */}
        <div style={{ display: 'flex', gap: '1.25rem', marginBottom: '1.5rem', alignItems: 'flex-start' }}>
          <div style={{
            width: 100, height: 140, borderRadius: 8, overflow: 'hidden', flexShrink: 0,
            background: 'var(--bg3)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {scanning ? (
              <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.7rem', padding: '0.5rem' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>⏳</div>
                Scanning...
              </div>
            ) : form.cover_url ? (
              <img loading="lazy"
                src={form.cover_url}
                alt={form.title || 'Cover'}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
              />
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.7rem', padding: '0.5rem' }}>
                <div style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>📖</div>
                No cover yet
              </div>
            )}
            {/* Hidden fallback shown if image 404s */}
            <div style={{ display: 'none', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', color: 'var(--muted)', fontSize: '0.7rem', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontSize: '1.75rem' }}>📖</div>No cover
            </div>
          </div>
          <div style={{ flex: 1, fontSize: '0.82rem', color: 'var(--muted)', lineHeight: 1.7 }}>
            {form.cover_url
              ? <span style={{ color: 'var(--green)', fontWeight: 700 }}>✓ Cover found</span>
              : <span>Cover will appear here once you scan, search, or paste a URL below</span>
            }
            <br />
            {form.comicvine_id
              ? <span style={{ color: 'var(--purple-light)' }}>ComicVine ID: {form.comicvine_id}</span>
              : <span>Use the Scan Cover or Lookup tab to auto-fill</span>
            }
          </div>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="form-input" placeholder="e.g. Amazing Spider-Man" value={form.title} onChange={set('title')} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Issue #</label>
              <input className="form-input" placeholder="#1" value={form.issue_number} onChange={set('issue_number')} />
            </div>
            <div className="form-group">
              <label className="form-label">Publisher</label>
              <input className="form-input" placeholder="Marvel, DC..." value={form.publisher} onChange={set('publisher')} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Grade</label>
              <select className="form-select" value={form.grade} onChange={set('grade')}>
                {GRADES.map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Price Paid (£)</label>
              <input className="form-input" type="number" step="0.01" placeholder="0.00" value={form.paid_price} onChange={set('paid_price')} />
            </div>
            <div className="form-group">
              <label className="form-label">Current Value (£)</label>
              <input className="form-input" type="number" step="0.01" placeholder="0.00" value={form.current_value} onChange={set('current_value')} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <input className="form-input" placeholder="Any notes about condition, where purchased, etc." value={form.notes} onChange={set('notes')} />
          </div>
          {/* Story summary preview - shown when ComicVine matched */}
          {(form.deck || form.description) && (
            <div style={{ marginBottom: '1.25rem', padding: '1rem', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10 }}>
              <div className="stat-label" style={{ marginBottom: '0.5rem' }}>Story Summary</div>
              {form.deck && (
                <div style={{ fontStyle: 'italic', color: 'var(--purple-light)', fontSize: '0.88rem', marginBottom: '0.5rem', lineHeight: 1.5 }}>
                  {form.deck}
                </div>
              )}
              {form.description && (
                <div style={{ fontSize: '0.82rem', color: 'var(--muted)', lineHeight: 1.6, maxHeight: 100, overflow: 'hidden', position: 'relative' }}>
                  {form.description.slice(0, 280)}{form.description.length > 280 ? '...' : ''}
                </div>
              )}
              {form.volume_issue_count && (
                <div style={{ marginTop: '0.6rem', fontSize: '0.75rem', color: 'var(--muted)', fontFamily: 'var(--font-ui)' }}>
                  Series: {form.volume_issue_count} issue{form.volume_issue_count !== 1 ? 's' : ''} total
                </div>
              )}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Cover Image URL (optional)</label>
            <input className="form-input" placeholder="https://..." value={form.cover_url} onChange={set('cover_url')} />
          </div>

          {/* Condition photo */}
          <div className="form-group">
            <label className="form-label">Condition Photo (optional)</label>
            <input ref={condPhotoRef} type="file" accept="image/*" onChange={handleConditionPhoto} style={{ display: 'none' }} />
            {conditionPhoto ? (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <img loading="lazy" src={conditionPhoto} alt="Condition" style={{ width: 80, height: 110, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border)' }} />
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.4rem' }}>Your copy's condition photo</div>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setConditionPhoto(''); setForm(f => ({ ...f, condition_photo: '' })) }}>
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" className="btn btn-outline btn-sm" onClick={() => condPhotoRef.current.click()}>
                📷 Upload Condition Photo
              </button>
            )}
            <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '0.4rem' }}>
              Photograph your actual copy to document its condition
            </div>
          </div>

          {/* CGC / CBCS Grade Verification */}
          <div style={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:10, padding:'1rem', marginBottom:'1rem' }}>
            <CGCVerifier onVerified={(data) => {
              if (data.grade) setForm(f => ({ ...f, grade: data.grade.includes('.') ? 'Near Mint' : f.grade }))
              if (data.title && !form.title) setForm(f => ({ ...f, title: data.title }))
            }} />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.85rem' }} disabled={saving}>
            {saving ? '⏳ Saving...' : '➕ Add to Collection'}
          </button>
        </form>
      </div>
    </div>
  )
}
