import { useState, useEffect, useCallback } from 'react'
import { fetchUpcomingReleases, fetchVariants, groupByWeek } from '../lib/releases'
import { buildEbayActiveUrl } from '../lib/comicvine'
import { useWishlist } from '../hooks/useWishlist'
import './NewReleases.css'

const PUBLISHERS = ['All', 'Marvel', 'DC Comics', 'Image Comics', 'Dark Horse', 'IDW', 'BOOM! Studios']
const FALLBACK = { Marvel: '🕷️', 'DC Comics': '🦇', 'Image Comics': '🚀', Default: '📖' }

const DEMO = {
  '2026-03-26': [
    { comicvine_id:'d1', title:'Ultimate Spider-Man', issue_number:'#14', publisher:'Marvel', cover_url:'', releaseDate:'2026-03-26', hasVariants:true, variantCount:4 },
    { comicvine_id:'d2', title:'Batman', issue_number:'#155', publisher:'DC Comics', cover_url:'', releaseDate:'2026-03-26', hasVariants:true, variantCount:3 },
    { comicvine_id:'d3', title:'Invincible', issue_number:'#151', publisher:'Image Comics', cover_url:'', releaseDate:'2026-03-26', hasVariants:false, variantCount:0 },
    { comicvine_id:'d4', title:'X-Men', issue_number:'#25', publisher:'Marvel', cover_url:'', releaseDate:'2026-03-26', hasVariants:true, variantCount:5 },
    { comicvine_id:'d5', title:'Saga', issue_number:'#70', publisher:'Image Comics', cover_url:'', releaseDate:'2026-03-26', hasVariants:false, variantCount:0 },
    { comicvine_id:'d6', title:'Thor', issue_number:'#34', publisher:'Marvel', cover_url:'', releaseDate:'2026-03-26', hasVariants:true, variantCount:3 },
  ],
  '2026-04-02': [
    { comicvine_id:'d7', title:'Daredevil', issue_number:'#8', publisher:'Marvel', cover_url:'', releaseDate:'2026-04-02', hasVariants:true, variantCount:2 },
    { comicvine_id:'d8', title:'Detective Comics', issue_number:'#1085', publisher:'DC Comics', cover_url:'', releaseDate:'2026-04-02', hasVariants:true, variantCount:3 },
    { comicvine_id:'d9', title:'The Walking Dead Deluxe', issue_number:'#88', publisher:'Image Comics', cover_url:'', releaseDate:'2026-04-02', hasVariants:false, variantCount:0 },
    { comicvine_id:'d10', title:'Wolverine', issue_number:'#12', publisher:'Marvel', cover_url:'', releaseDate:'2026-04-02', hasVariants:true, variantCount:6 },
  ],
  '2026-04-09': [
    { comicvine_id:'d11', title:'Spawn', issue_number:'#360', publisher:'Image Comics', cover_url:'', releaseDate:'2026-04-09', hasVariants:false, variantCount:0 },
    { comicvine_id:'d12', title:'Wonder Woman', issue_number:'#18', publisher:'DC Comics', cover_url:'', releaseDate:'2026-04-09', hasVariants:true, variantCount:2 },
    { comicvine_id:'d13', title:'Avengers', issue_number:'#22', publisher:'Marvel', cover_url:'', releaseDate:'2026-04-09', hasVariants:true, variantCount:4 },
    { comicvine_id:'d14', title:'Hellboy', issue_number:'#5', publisher:'Dark Horse', cover_url:'', releaseDate:'2026-04-09', hasVariants:false, variantCount:0 },
  ],
  '2026-04-16': [
    { comicvine_id:'d15', title:'Amazing Spider-Man', issue_number:'#58', publisher:'Marvel', cover_url:'', releaseDate:'2026-04-16', hasVariants:true, variantCount:5 },
    { comicvine_id:'d16', title:'Superman', issue_number:'#24', publisher:'DC Comics', cover_url:'', releaseDate:'2026-04-16', hasVariants:true, variantCount:2 },
    { comicvine_id:'d17', title:'Black Panther', issue_number:'#9', publisher:'Marvel', cover_url:'', releaseDate:'2026-04-16', hasVariants:false, variantCount:0 },
  ],
}

export default function NewReleases() {
  const { addItem } = useWishlist()
  const [grouped, setGrouped]         = useState({})
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState('')
  const [filterPub, setFilterPub]     = useState('All')
  const [search, setSearch]           = useState('')
  const [monthsAhead, setMonthsAhead] = useState(3)
  const [selected, setSelected]       = useState(null)
  const [variantData, setVariantData] = useState(null)
  const [variantLoading, setVLoad]    = useState(false)
  const [added, setAdded]             = useState({})
  const [activeCover, setActiveCover] = useState(null)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const data = await fetchUpcomingReleases(monthsAhead)
      setGrouped(groupByWeek(data))
    } catch (err) {
      setError('Could not reach ComicVine. Showing demo data — add your API key to .env.local')
      setGrouped(DEMO)
    }
    setLoading(false)
  }, [monthsAhead])

  useEffect(() => { load() }, [load])

  const openIssue = async (issue) => {
    setSelected(issue); setVariantData(null); setActiveCover(null); setVLoad(true)
    try {
      const d = await fetchVariants(issue.comicvine_id)
      setVariantData(d)
      setActiveCover(d?.covers?.[0] || null)
    } catch {
      const fallback = { ...issue, covers:[{ id:'main', label:'Main Cover', url:issue.cover_url, thumb:issue.cover_url, isMain:true }], characters:[], storyArcs:[], description:'' }
      setVariantData(fallback)
      setActiveCover(fallback.covers[0])
    }
    setVLoad(false)
  }

  const handleAdd = async (issue, cover) => {
    const label = cover?.label || 'Main Cover'
    const key   = `${issue.comicvine_id}-${label}`
    await addItem({
      title:        `${issue.title} ${issue.issue_number}${label !== 'Main Cover' ? ` [${label}]` : ''}`,
      issue_number: issue.issue_number,
      publisher:    issue.publisher,
      notes:        `Upcoming ${new Date(issue.releaseDate).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})} · ${label}`,
      priority:     'Medium',
      target_price: 0,
    })
    setAdded(prev => ({ ...prev, [key]: true }))
  }

  const filtered = Object.entries(grouped).reduce((acc,[week,issues]) => {
    const f = issues.filter(i =>
      (filterPub === 'All' || i.publisher === filterPub) &&
      (!search || i.title.toLowerCase().includes(search.toLowerCase()))
    )
    if (f.length) acc[week] = f
    return acc
  }, {})

  const total = Object.values(filtered).reduce((s,a) => s+a.length, 0)

  return (
    <div className="page-enter nr-page">
      <div className="section-header" style={{ marginBottom:'0.5rem' }}>
        <h1 className="section-title">Upcoming Releases</h1>
        <div style={{ display:'flex', gap:'0.5rem', alignItems:'center' }}>
          <select className="form-select" style={{ width:'auto', fontSize:'0.8rem', padding:'0.4rem 0.75rem' }}
            value={monthsAhead} onChange={e => setMonthsAhead(Number(e.target.value))}>
            <option value={1}>Next 1 month</option>
            <option value={2}>Next 2 months</option>
            <option value={3}>Next 3 months</option>
            <option value={6}>Next 6 months</option>
          </select>
          <button className="btn btn-outline" style={{ fontSize:'0.8rem' }} onClick={load}>↻ Refresh</button>
        </div>
      </div>

      <p style={{ color:'var(--muted)', fontSize:'0.85rem', marginBottom:'1.25rem' }}>
        {loading ? 'Loading from ComicVine…' : `${total} upcoming issues · Click any cover to view variants`}
      </p>

      {error && (
        <div style={{ background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.25)', borderRadius:10, padding:'0.85rem 1rem', marginBottom:'1.5rem', color:'#fcd34d', fontSize:'0.82rem' }}>
          ⚠️ {error}
        </div>
      )}

      <div style={{ display:'flex', gap:'0.75rem', marginBottom:'1.5rem', flexWrap:'wrap', alignItems:'center' }}>
        <input className="form-input" style={{ flex:1, minWidth:180, fontSize:'0.85rem' }}
          placeholder="Search series..." value={search} onChange={e => setSearch(e.target.value)} />
        <div className="tabs" style={{ marginBottom:0, flexWrap:'wrap' }}>
          {PUBLISHERS.map(p => (
            <button key={p} className={`tab ${filterPub===p?'active':''}`}
              onClick={() => setFilterPub(p)} style={{ fontSize:'0.72rem', padding:'0.3rem 0.65rem' }}>{p}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:'1rem' }}>
          {Array.from({length:16}).map((_,i) => (
            <div key={i} className="nr-skeleton" style={{ animationDelay:`${i*0.05}s` }}>
              <div className="nr-skel-cover" />
              <div className="nr-skel-line" style={{ width:'80%', marginBottom:4 }} />
              <div className="nr-skel-line" style={{ width:'55%' }} />
            </div>
          ))}
        </div>
      ) : Object.keys(filtered).length === 0 ? (
        <div className="card" style={{ textAlign:'center', padding:'3rem', color:'var(--muted)' }}>
          <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>🔍</div>
          <div style={{ fontWeight:700 }}>No upcoming issues match your filters</div>
        </div>
      ) : (
        Object.entries(filtered).map(([weekDate, issues]) => (
          <div key={weekDate} className="nr-week">
            <div className="nr-week-header">
              <div className="nr-week-badge">
                <span className="nr-week-day">{new Date(weekDate).toLocaleDateString('en-GB',{weekday:'short'})}</span>
                <span className="nr-week-date">{new Date(weekDate).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</span>
              </div>
              <div className="nr-week-line" />
              <span className="nr-week-count">{issues.length} issue{issues.length!==1?'s':''}</span>
            </div>

            <div className="nr-grid">
              {issues.map(issue => (
                <div key={issue.comicvine_id} className="nr-card" onClick={() => openIssue(issue)}>
                  <div className="nr-cover-wrap">
                    {issue.cover_url ? (
                      <img src={issue.cover_url} alt={`${issue.title} ${issue.issue_number}`}
                        className="nr-cover-img" loading="lazy"
                        onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex' }} />
                    ) : null}
                    <div className="nr-cover-fallback" style={{ display:issue.cover_url?'none':'flex' }}>
                      {FALLBACK[issue.publisher] || FALLBACK.Default}
                    </div>
                    {issue.hasVariants && (
                      <div className="nr-variant-badge">+{issue.variantCount} variant{issue.variantCount!==1?'s':''}</div>
                    )}
                    <div className="nr-hover-overlay"><div className="nr-hover-text">View Covers & Add</div></div>
                  </div>
                  <div className="nr-info">
                    <div className="nr-pub">{issue.publisher}</div>
                    <div className="nr-title">{issue.title}</div>
                    <div className="nr-issue">{issue.issue_number}</div>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'0.4rem' }}>
                      <div className="nr-date">{new Date(issue.releaseDate).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}</div>
                      <button
                        className={`btn btn-sm ${added[`${issue.comicvine_id}-Main Cover`]?'nr-added':'btn-outline'}`}
                        style={{ fontSize:'0.62rem', padding:'0.18rem 0.5rem' }}
                        onClick={e => { e.stopPropagation(); handleAdd(issue, {label:'Main Cover'}) }}
                      >{added[`${issue.comicvine_id}-Main Cover`]?'✓':'+ Wishlist'}</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* VARIANT MODAL */}
      {selected && (
        <div className="nr-modal-backdrop" onClick={() => { setSelected(null); setVariantData(null) }}>
          <div className="nr-modal" onClick={e => e.stopPropagation()}>
            <button className="nr-modal-close" onClick={() => { setSelected(null); setVariantData(null) }}>✕</button>
            <div className="nr-modal-body">
              {/* LEFT — cover viewer */}
              <div className="nr-modal-left">
                <div className="nr-modal-cover-main">
                  {variantLoading ? (
                    <div className="nr-modal-loading"><div className="nr-spin" /><div style={{ fontSize:'0.82rem', color:'var(--muted)', marginTop:'0.75rem' }}>Loading covers…</div></div>
                  ) : activeCover?.url ? (
                    <img loading="lazy" src={activeCover.url} alt={activeCover.label} style={{ width:'100%', height:'100%', objectFit:'contain', borderRadius:8 }} />
                  ) : (
                    <div style={{ fontSize:'5rem', display:'flex', alignItems:'center', justifyContent:'center', height:'100%' }}>
                      {FALLBACK[selected.publisher] || FALLBACK.Default}
                    </div>
                  )}
                </div>

                {variantData?.covers?.length > 1 && (
                  <div className="nr-variant-strip">
                    {variantData.covers.map(cover => (
                      <div key={cover.id} className={`nr-variant-thumb ${activeCover?.id===cover.id?'active':''}`}
                        onClick={() => setActiveCover(cover)}>
                        {cover.thumb
                          ? <img loading="lazy" src={cover.thumb} alt={cover.label} style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:6, border: activeCover?.id===cover.id?'2px solid var(--purple)':'2px solid transparent' }} />
                          : <div style={{ width:56, height:80, background:'var(--bg3)', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.4rem', border: activeCover?.id===cover.id?'2px solid var(--purple)':'2px solid transparent' }}>📖</div>
                        }
                        <div className="nr-variant-label">{cover.label}</div>
                      </div>
                    ))}
                  </div>
                )}

                {activeCover && (
                  <div style={{ fontSize:'0.78rem', fontWeight:700, color:'var(--purple-light)', textAlign:'center' }}>
                    {activeCover.label}
                  </div>
                )}
              </div>

              {/* RIGHT — details + wishlist */}
              <div className="nr-modal-right">
                <div className="nr-modal-pub">{selected.publisher}</div>
                <h2 className="nr-modal-title">{selected.title}</h2>
                <div className="nr-modal-issue">{selected.issue_number}</div>

                <div style={{ display:'flex', gap:'0.6rem', marginBottom:'1.25rem', flexWrap:'wrap' }}>
                  <div className="nr-modal-chip">
                    📅 {new Date(selected.releaseDate).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}
                  </div>
                  {variantData?.covers?.length > 1 && (
                    <div className="nr-modal-chip" style={{ background:'rgba(139,92,246,0.15)', color:'var(--purple-light)', borderColor:'rgba(139,92,246,0.3)' }}>
                      🎨 {variantData.covers.length - 1} variant{variantData.covers.length-1!==1?'s':''}
                    </div>
                  )}
                </div>

                {variantData?.description ? (
                  <p style={{ fontSize:'0.83rem', color:'var(--muted)', lineHeight:1.65, marginBottom:'1.25rem' }}>
                    {variantData.description}
                  </p>
                ) : null}

                {variantData?.characters?.length > 0 && (
                  <div style={{ marginBottom:'1rem' }}>
                    <div style={{ fontSize:'0.68rem', fontWeight:800, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--muted)', marginBottom:'0.4rem' }}>Characters</div>
                    <div style={{ display:'flex', gap:'0.4rem', flexWrap:'wrap' }}>
                      {variantData.characters.map(c => (
                        <span key={c} style={{ padding:'0.2rem 0.6rem', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:20, fontSize:'0.73rem', fontWeight:600 }}>{c}</span>
                      ))}
                    </div>
                  </div>
                )}

                {variantData?.storyArcs?.length > 0 && (
                  <div style={{ marginBottom:'1.25rem' }}>
                    <div style={{ fontSize:'0.68rem', fontWeight:800, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--muted)', marginBottom:'0.4rem' }}>Story Arc</div>
                    <div style={{ fontSize:'0.85rem', color:'var(--purple-light)', fontWeight:700 }}>{variantData.storyArcs.join(', ')}</div>
                  </div>
                )}

                <a
                  href={buildEbayActiveUrl(selected.title, selected.issue_number, null)}
                  target="_blank" rel="noopener noreferrer"
                  className="btn btn-outline btn-sm"
                  style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'0.4rem', textDecoration:'none', marginBottom:'1rem', fontSize:'0.8rem' }}
                >
                  🛒 Check eBay Listings
                </a>

                <div style={{ fontSize:'0.68rem', fontWeight:800, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--muted)', marginBottom:'0.75rem' }}>
                  Add to Wishlist
                </div>

                <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem', maxHeight:260, overflowY:'auto' }}>
                  {(variantData?.covers || [{ id:'main', label:'Main Cover', url:selected.cover_url, thumb:selected.cover_url, isMain:true }]).map(cover => {
                    const key = `${selected.comicvine_id}-${cover.label}`
                    return (
                      <div key={cover.id} style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.65rem 0.8rem', background:'var(--bg3)', borderRadius:8, border:'1px solid var(--border)' }}>
                        {cover.thumb
                          ? <img loading="lazy" src={cover.thumb} alt="" style={{ width:30, height:42, objectFit:'cover', borderRadius:4, flexShrink:0 }} />
                          : <div style={{ width:30, height:42, background:'var(--card)', borderRadius:4, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.9rem', flexShrink:0 }}>📖</div>
                        }
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontWeight:700, fontSize:'0.82rem' }}>{cover.label}</div>
                          <div style={{ fontSize:'0.7rem', color:'var(--muted)' }}>{selected.title} {selected.issue_number}</div>
                        </div>
                        <button
                          className="btn btn-sm"
                          style={added[key]
                            ? { background:'rgba(16,185,129,0.15)', color:'var(--green)', border:'1px solid var(--green)', fontSize:'0.72rem', padding:'0.25rem 0.6rem' }
                            : { background:'var(--purple)', color:'#fff', border:'none', fontSize:'0.72rem', padding:'0.25rem 0.6rem' }
                          }
                          onClick={() => !added[key] && handleAdd(selected, cover)}
                        >
                          {added[key] ? '✓ Added' : '+ Add'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
