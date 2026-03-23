import React, { useState, useEffect, useRef } from 'react'
import { useCollection } from '../context/CollectionContext'
import { checkPriceAlerts } from '../hooks/useWishlist'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useExport } from '../hooks/useExport'
import { useToast } from '../context/ToastContext'
import { getPriceHistory, recordPriceSnapshot, buildEbayUrl, buildEbayActiveUrl } from '../lib/comicvine'
import {
  Chart,
  LineController, LineElement, PointElement,
  CategoryScale, LinearScale,
  Tooltip, Filler,
} from 'chart.js'
import {
  IconSearch, IconGrid, IconList, IconCSV, IconPDF, IconBulk, IconDelete,
  IconEbay, IconRead, IconClose, IconPublisher, IconSeries,
} from '../lib/icons'
import ComicGrid   from '../components/ComicGrid'
import StorySummary from '../components/StorySummary'

Chart.register(
  LineController, LineElement, PointElement,
  CategoryScale, LinearScale,
  Tooltip, Filler
)

// ── Expandable story summary ──────────────────────────────────


// ── Browse modes ──────────────────────────────────────────────
// publisher → browse all of that publisher's comics you own
// series    → browse by series/volume name within a publisher
// all       → flat list of everything
const BROWSE_MODES = [
  { id: 'publisher', label: 'By Publisher', Icon: IconPublisher },
  { id: 'series',    label: 'By Series', Icon: IconSeries },
  { id: 'all',       label: 'All Comics', Icon: IconGrid },
]

export default function Collection() {
  const { collection, loading, stats, removeComic, updateComic, markRead, markUnread } = useCollection()
  const { user }                    = useAuth()
  const { exportCSV, exportPDF }    = useExport()
  const toast                       = useToast()

  // ── Browse / filter state ─────────────────────────────────
  const [browseMode,   setBrowseMode]   = useState('publisher') // publisher | series | all
  const [activePub,    setActivePub]    = useState(null)        // selected publisher
  const [activeSeries, setActiveSeries] = useState(null)        // selected series title
  const [search,       setSearch]       = useState('')
  const [sortBy,       setSortBy]       = useState('recent')
  const [view,         setView]         = useState('grid')
  const [readFilter,   setReadFilter]   = useState('all')

  // ── Selection / bulk state ────────────────────────────────
  const [selected,    setSelected]    = useState(null)
  const [selected2,   setSelected2]   = useState(new Set())
  const [bulkMode,    setBulkMode]    = useState(false)

  // ── Price history / chart ────────────────────────────────
  const [priceHistory,  setPriceHistory]  = useState([])
  const [editingValue,   setEditingValue]   = useState('')
  const [comicDetail,    setComicDetail]    = useState(null) // full description loaded on demand
  const chartRef  = useRef()
  const chartInst = useRef()

  // Derived data
  const publishers = [...new Set(collection.map(c => c.comics?.publisher).filter(Boolean))].sort()
  const allSeries  = [...new Set(collection.map(c => c.comics?.title).filter(Boolean))].sort()

  // Series within the active publisher
  const pubSeries = activePub
    ? [...new Set(
        collection
          .filter(c => c.comics?.publisher === activePub)
          .map(c => c.comics?.title)
          .filter(Boolean)
      )].sort()
    : allSeries

  // Load price history + full description when comic selected
  useEffect(() => {
    if (!selected) { setComicDetail(null); return }
    getPriceHistory(selected.comic_id).then(setPriceHistory).catch(() => {})
    const fetchDetail = async () => {
      try {
        const { data } = await supabase.from('comics')
          .select('description, deck')
          .eq('id', selected.comic_id)
          .single()
        setComicDetail(data)
      } catch (_) { /* description unavailable */ }
    }
    fetchDetail()
  }, [selected?.comic_id])

  // Draw chart
  useEffect(() => {
    if (!chartRef.current || priceHistory.length === 0) return
    chartInst.current?.destroy()
    const labels = priceHistory.map(p => new Date(p.recorded_at).toLocaleDateString('en-GB', { month:'short', day:'numeric' }))
    const prices = priceHistory.map(p => Number(p.price))
    chartInst.current = new Chart(chartRef.current, {
      type: 'line',
      data: {
        labels,
        datasets: [{ data: prices, borderColor:'#8b5cf6', backgroundColor:'rgba(139,92,246,0.08)', borderWidth:2, pointBackgroundColor:'#8b5cf6', pointRadius:3, tension:0.4, fill:true }]
      },
      options: {
        responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{ display:false } },
        scales:{
          x:{ ticks:{ color:'#9ca3af', font:{ size:10 } }, grid:{ color:'rgba(255,255,255,0.05)' } },
          y:{ ticks:{ color:'#9ca3af', font:{ size:10 }, callback: v => `£${Number(v || 0).toLocaleString()}` }, grid:{ color:'rgba(255,255,255,0.05)' } }
        }
      }
    })
    return () => chartInst.current?.destroy()
  }, [priceHistory])

  // ── Update value handler ─────────────────────────────────
  const handleUpdateValue = async () => {
    const val = parseFloat(editingValue)
    if (!val || !selected) return
    await updateComic(selected.id, { current_value: val })
    await recordPriceSnapshot(selected.comic_id, selected.grade, val)
    await checkPriceAlerts(supabase, user.id, selected.comics?.title, selected.comics?.issue_number, val, selected.comics?.cover_url)
    toast.success('Value updated')
    setEditingValue('')
    setSelected(prev => ({ ...prev, current_value: val }))
    getPriceHistory(selected.comic_id).then(setPriceHistory)
  }

  // ── Filtered & sorted comic list ─────────────────────────
  const filtered = collection
    .filter(c => {
      // Browse mode filters
      if (browseMode === 'publisher' && activePub)    return c.comics?.publisher === activePub
      if (browseMode === 'series'   && activePub && activeSeries) return c.comics?.publisher === activePub && c.comics?.title === activeSeries
      if (browseMode === 'series'   && activePub)     return c.comics?.publisher === activePub
      if (browseMode === 'series'   && activeSeries)  return c.comics?.title === activeSeries
      return true
    })
    .filter(c => readFilter === 'all' ? true : readFilter === 'read' ? !!c.read_at : !c.read_at)
    .filter(c => {
      const s = search.toLowerCase()
      return !s ||
        (c.comics?.title     || '').toLowerCase().includes(s) ||
        (c.comics?.publisher || '').toLowerCase().includes(s) ||
        (c.comics?.issue_number || '').toLowerCase().includes(s)
    })
    .sort((a, b) => {
      if (sortBy === 'value')  return Number(b.current_value) - Number(a.current_value)
      if (sortBy === 'title')  return (a.comics?.title || '').localeCompare(b.comics?.title || '')
      if (sortBy === 'issue') {
        const na = parseInt((a.comics?.issue_number || '').replace(/\D/g,'')) || 0
        const nb = parseInt((b.comics?.issue_number || '').replace(/\D/g,'')) || 0
        return na - nb
      }
      if (sortBy === 'paid')   return Number(b.paid_price) - Number(a.paid_price)
      if (sortBy === 'roi') {
        const ra = a.paid_price ? (a.current_value - a.paid_price) / a.paid_price : 0
        const rb = b.paid_price ? (b.current_value - b.paid_price) / b.paid_price : 0
        return rb - ra
      }
      return new Date(b.added_at) - new Date(a.added_at)
    })

  // ── Publisher stats ──────────────────────────────────────
  const pubStats = publishers.map(pub => {
    const comics = collection.filter(c => c.comics?.publisher === pub)
    return {
      pub,
      count: comics.length,
      value: comics.reduce((s, c) => s + Number(c.current_value || 0), 0),
      cover: comics.find(c => c.comics?.cover_url)?.comics?.cover_url || null,
    }
  }).sort((a, b) => b.count - a.count)

  // ── Series stats within active publisher ─────────────────
  const seriesStats = pubSeries.map(title => {
    const comics = collection.filter(c =>
      c.comics?.title === title &&
      (!activePub || c.comics?.publisher === activePub)
    )
    const total = comics[0]?.comics?.volume_issue_count || null
    return {
      title,
      count:     comics.length,
      value:     comics.reduce((s, c) => s + Number(c.current_value || 0), 0),
      cover:     comics.find(c => c.comics?.cover_url)?.comics?.cover_url || null,
      total,
      complete:  total && comics.length >= total,
    }
  }).sort((a, b) => b.count - a.count)

  // ── Breadcrumb reset helpers ─────────────────────────────
  const resetToPublisher = () => { setActivePub(null); setActiveSeries(null) }
  const resetToSeries    = () => { setActiveSeries(null) }

  if (loading) return (
    <div className="page-enter">
      <h1 className="section-title" style={{ marginBottom:'1.5rem' }}>My Collection</h1>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:'1rem' }}>
        {[...Array(8)].map((_,i) => (
          <div key={i} className="skeleton-card">
            <div className="skeleton" style={{ width:'100%', aspectRatio:'2/3' }} />
            <div style={{ padding:'0.85rem' }}>
              <div className="skeleton" style={{ height:10, borderRadius:4, marginBottom:6 }} />
              <div className="skeleton" style={{ height:9, borderRadius:4, width:'60%' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="page-enter">

      {/* ── HEADER ── */}
      <div className="section-header" style={{ marginBottom:'1.25rem', flexWrap:'wrap', gap:'0.5rem' }}>
        <div>
          <h1 className="section-title">My Collection</h1>
          {/* Breadcrumb */}
          {(activePub || activeSeries) && (
            <div style={{ display:'flex', alignItems:'center', gap:'0.4rem', marginTop:'0.3rem', fontFamily:'var(--font-ui)', fontSize:'0.78rem', color:'var(--muted)' }}>
              <button onClick={resetToPublisher} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--purple-light)', fontFamily:'var(--font-ui)', fontSize:'0.78rem', padding:0 }}>
                All Publishers
              </button>
              {activePub && (
                <>
                  <span>›</span>
                  {activeSeries
                    ? <button onClick={resetToSeries} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--purple-light)', fontFamily:'var(--font-ui)', fontSize:'0.78rem', padding:0 }}>{activePub}</button>
                    : <span style={{ color:'var(--text)' }}>{activePub}</span>
                  }
                </>
              )}
              {activeSeries && (
                <>
                  <span>›</span>
                  <span style={{ color:'var(--text)' }}>{activeSeries}</span>
                </>
              )}
            </div>
          )}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'0.6rem', flexWrap:'wrap' }}>
          {stats.total > 0 && (
            <div style={{ display:'flex', alignItems:'center', gap:'0.4rem' }}>
              <div style={{ width:70, height:5, background:'var(--bg3)', borderRadius:3, overflow:'hidden' }}>
                <div style={{ height:'100%', borderRadius:3, background:'var(--green)', width:`${Math.round(((stats.read||0)/stats.total)*100)}%` }} />
              </div>
              <span style={{ fontSize:'0.72rem', color:'var(--muted)', fontFamily:'var(--font-ui)', whiteSpace:'nowrap' }}>{stats.read||0}/{stats.total} read</span>
            </div>
          )}
          <span style={{ color:'var(--muted)', fontSize:'0.85rem', fontFamily:'var(--font-ui)' }}>£{Number(stats.totalValue || 0).toLocaleString()}</span>
          <button className="btn btn-outline btn-sm" onClick={exportCSV} style={{display:"flex",alignItems:"center",gap:5}}><IconCSV size={13} /> CSV</button>
          <button className="btn btn-outline btn-sm" onClick={exportPDF} style={{display:"flex",alignItems:"center",gap:5}}><IconPDF size={13} /> PDF</button>
          <button className={`btn btn-sm ${bulkMode ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => { setBulkMode(b => !b); setSelected2(new Set()) }}><IconBulk size={13} /> Bulk</button>
        </div>
      </div>

      {/* ── BULK ACTION BAR ── */}
      {bulkMode && (
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.75rem 1rem', background:'rgba(139,92,246,0.1)', border:'1px solid rgba(139,92,246,0.3)', borderRadius:10, marginBottom:'1rem', flexWrap:'wrap' }}>
          <span style={{ fontFamily:'var(--font-ui)', fontWeight:700, fontSize:'0.85rem' }}>{selected2.size} selected</span>
          <button className="btn btn-sm btn-outline" onClick={() => {
            const allIds = new Set(filtered.map(c => c.id))
            setSelected2(selected2.size === filtered.length ? new Set() : allIds)
          }}>
            {selected2.size === filtered.length ? 'Deselect All' : 'Select All'}
          </button>
          <button className="btn btn-sm btn-danger" disabled={selected2.size === 0}
            onClick={async () => {
              if (!window.confirm(`Remove ${selected2.size} comic${selected2.size !== 1 ? 's' : ''} from your vault? This cannot be undone.`)) return
              for (const id of selected2) await removeComic(id)
              toast.success(`Removed ${selected2.size} comics`)
              setSelected2(new Set()); setBulkMode(false)
            }}>
            🗑 Delete Selected
          </button>
          <button className="btn btn-sm btn-outline" style={{ marginLeft:'auto' }} onClick={() => { setBulkMode(false); setSelected2(new Set()) }}>Cancel</button>
        </div>
      )}

      {/* ── BROWSE MODE TABS ── */}
      <div style={{ display:'flex', gap:'0.4rem', marginBottom:'1rem', flexWrap:'wrap' }}>
        {BROWSE_MODES.map(m => (
          <button key={m.id}
            className={`tab ${browseMode === m.id ? 'active' : ''}`}
            onClick={() => { setBrowseMode(m.id); setActivePub(null); setActiveSeries(null) }}
            style={{ display:'flex', alignItems:'center', gap:5 }}>
            <m.Icon size={13} />
            {m.label}
          </button>
        ))}
        <div style={{ flex:1 }} />
        {/* Quick search */}
        <input className="form-input" style={{ width:200, fontSize:'0.85rem', padding:'0.35rem 0.75rem' }}
          placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* ══════════════════════════════
          PUBLISHER BROWSE MODE
          ══════════════════════════════ */}
      {browseMode === 'publisher' && !activePub && (
        <div>
          {pubStats.length === 0 ? (
            <div className="card empty-state">
              <div className="empty-icon">🏢</div>
              <div className="empty-title">No publishers yet</div>
              <div className="empty-body">Add comics via ComicVine to browse by publisher</div>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:'1rem' }}>
              {pubStats.map(p => (
                <div key={p.pub} className="card" style={{ cursor:'pointer', transition:'all 0.15s' }}
                  onClick={() => setActivePub(p.pub)}
                  onMouseEnter={e => { e.currentTarget.style.borderColor='var(--purple)'; e.currentTarget.style.transform='translateY(-3px)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor=''; e.currentTarget.style.transform='' }}>
                  {p.cover && (
                    <img loading="lazy" src={p.cover} alt="" style={{ width:'100%', height:100, objectFit:'cover', borderRadius:8, marginBottom:'0.75rem' }}
                      onError={e => e.target.style.display='none'} />
                  )}
                  {!p.cover && (
                    <div style={{ width:'100%', height:70, background:'linear-gradient(135deg,var(--bg3),var(--bg2))', borderRadius:8, marginBottom:'0.75rem', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2rem' }}>🏢</div>
                  )}
                  <div style={{ fontFamily:'var(--font-ui)', fontWeight:700, fontSize:'0.95rem', marginBottom:'0.2rem', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.pub}</div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:'0.78rem', color:'var(--muted)', fontFamily:'var(--font-ui)' }}>{p.count} issue{p.count !== 1 ? 's' : ''}</span>
                    <span style={{ fontFamily:'var(--font-ui)', fontWeight:700, color:'var(--gold)', fontSize:'0.82rem' }}>£{Number(p.value || 0).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Publisher → comic grid (flat, no series drill-down in publisher mode) */}
      {browseMode === 'publisher' && activePub && (
        <ComicGrid
          filtered={filtered} selected={selected} setSelected={setSelected}
          bulkMode={bulkMode} selected2={selected2} setSelected2={setSelected2}
          view={view} setView={setView} sortBy={sortBy} setSortBy={setSortBy}
          readFilter={readFilter} setReadFilter={setReadFilter}
          markRead={markRead} markUnread={markUnread}
          removeComic={removeComic} toast={toast}
          title={activePub}
        />
      )}

      {/* ══════════════════════════════
          SERIES BROWSE MODE
          ══════════════════════════════ */}
      {browseMode === 'series' && !activeSeries && (
        <div>
          {/* Publisher filter row */}
          <div style={{ display:'flex', gap:'0.5rem', marginBottom:'1.25rem', flexWrap:'wrap', alignItems:'center' }}>
            <span style={{ fontFamily:'var(--font-ui)', fontSize:'0.75rem', color:'var(--muted)', letterSpacing:'0.08em', textTransform:'uppercase' }}>Publisher:</span>
            <button className={`tab ${!activePub ? 'active' : ''}`} onClick={() => setActivePub(null)}>All</button>
            {publishers.map(pub => (
              <button key={pub} className={`tab ${activePub === pub ? 'active' : ''}`} onClick={() => setActivePub(pub)}>{pub}</button>
            ))}
          </div>

          {seriesStats.length === 0 ? (
            <div className="card empty-state">
              <div className="empty-icon">📚</div>
              <div className="empty-title">No series found</div>
              <div className="empty-body">Add comics via ComicVine search to group them into series</div>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:'1rem' }}>
              {seriesStats.map(s => (
                <div key={s.title} className="card" style={{ cursor:'pointer', transition:'all 0.15s', borderColor: s.complete ? 'rgba(16,185,129,0.4)' : undefined }}
                  onClick={() => setActiveSeries(s.title)}
                  onMouseEnter={e => { e.currentTarget.style.borderColor='var(--purple)'; e.currentTarget.style.transform='translateY(-3px)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = s.complete ? 'rgba(16,185,129,0.4)' : ''; e.currentTarget.style.transform='' }}>
                  {s.cover
                    ? <img loading="lazy" src={s.cover} alt="" style={{ width:'100%', height:110, objectFit:'cover', borderRadius:8, marginBottom:'0.75rem' }} onError={e => e.target.style.display='none'} />
                    : <div style={{ width:'100%', height:80, background:'linear-gradient(135deg,var(--bg3),var(--bg2))', borderRadius:8, marginBottom:'0.75rem', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2rem' }}>📚</div>
                  }
                  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'0.4rem', marginBottom:'0.25rem' }}>
                    <div style={{ fontFamily:'var(--font-ui)', fontWeight:700, fontSize:'0.88rem', lineHeight:1.3, flex:1, minWidth:0 }}>{s.title}</div>
                    {s.complete && <span style={{ fontSize:'0.6rem', background:'rgba(16,185,129,0.2)', color:'var(--green)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:20, padding:'1px 6px', fontFamily:'var(--font-ui)', fontWeight:700, flexShrink:0 }}>✓</span>}
                  </div>
                  {/* Progress bar */}
                  {s.total && (
                    <div style={{ marginBottom:'0.4rem' }}>
                      <div style={{ height:3, background:'var(--bg3)', borderRadius:2, overflow:'hidden' }}>
                        <div style={{ height:'100%', borderRadius:2, background: s.complete ? 'var(--green)' : 'var(--purple)', width:`${Math.min((s.count/s.total)*100,100)}%` }} />
                      </div>
                      <div style={{ fontFamily:'var(--font-ui)', fontSize:'0.66rem', color:'var(--muted)', marginTop:'2px' }}>{s.count} of {s.total}</div>
                    </div>
                  )}
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:'0.75rem', color:'var(--muted)', fontFamily:'var(--font-ui)' }}>{s.count} issue{s.count !== 1 ? 's' : ''}</span>
                    <span style={{ fontFamily:'var(--font-ui)', fontWeight:700, color:'var(--gold)', fontSize:'0.78rem' }}>£{Number(s.value || 0).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Series → comic grid */}
      {browseMode === 'series' && activeSeries && (
        <ComicGrid
          filtered={filtered} selected={selected} setSelected={setSelected}
          bulkMode={bulkMode} selected2={selected2} setSelected2={setSelected2}
          view={view} setView={setView} sortBy={sortBy} setSortBy={setSortBy}
          readFilter={readFilter} setReadFilter={setReadFilter}
          markRead={markRead} markUnread={markUnread}
          removeComic={removeComic} toast={toast}
          title={activeSeries}
          defaultSort="issue"
        />
      )}

      {/* ══════════════════════════════
          ALL COMICS MODE
          ══════════════════════════════ */}
      {browseMode === 'all' && (
        <ComicGrid
          filtered={filtered} selected={selected} setSelected={setSelected}
          bulkMode={bulkMode} selected2={selected2} setSelected2={setSelected2}
          view={view} setView={setView} sortBy={sortBy} setSortBy={setSortBy}
          readFilter={readFilter} setReadFilter={setReadFilter}
          markRead={markRead} markUnread={markUnread}
          removeComic={removeComic} toast={toast}
        />
      )}

      {/* ── DETAIL PANEL ── */}
      {selected && (
        <div style={{ position:'fixed', top:0, right:0, bottom:0, width:300, background:'var(--bg2)', borderLeft:'1px solid var(--border)', overflowY:'auto', zIndex:300, padding:'1.5rem 1.25rem' }}>
          <button onClick={() => setSelected(null)}
            style={{ position:'absolute', top:'1rem', right:'1rem', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'50%', width:28, height:28, cursor:'pointer', color:'var(--muted)', display:'flex', alignItems:'center', justifyContent:'center' }}><IconClose size={13} /></button>

          {selected.comics?.cover_url && (
            <img loading="lazy" src={selected.comics.cover_url} alt="" style={{ width:'100%', borderRadius:10, marginBottom:'1rem', objectFit:'cover', maxHeight:220 }} />
          )}
          <div style={{ fontFamily:'var(--font-ui)', fontWeight:800, fontSize:'1rem', marginBottom:'0.2rem' }}>{selected.comics?.title} {selected.comics?.issue_number}</div>
          <div style={{ color:'var(--muted)', fontSize:'0.85rem', marginBottom:(selected.comics?.deck || selected.comics?.description) ? '0.65rem' : '1rem' }}>{selected.comics?.publisher}</div>

          {/* Story summary */}
          {(selected.comics?.deck || selected.comics?.description) && (
            <div style={{ marginBottom:'1rem', padding:'0.75rem', background:'var(--bg3)', borderRadius:8, border:'1px solid var(--border)' }}>
              {selected.comics?.deck && (
                <div style={{ fontStyle:'italic', color:'var(--purple-light)', fontSize:'0.8rem', lineHeight:1.5, marginBottom: selected.comics?.description ? '0.4rem' : 0 }}>
                  {selected.comics.deck}
                </div>
              )}
              {selected.comics?.description && <StorySummary text={selected.comics.description} />}
            </div>
          )}

          {/* Stats */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.65rem', marginBottom:'1.1rem' }}>
            <div className="stat-card" style={{ padding:'0.75rem' }}>
              <div className="stat-label">Paid</div>
              <div style={{ fontFamily:'var(--font-ui)', fontWeight:800, fontSize:'1rem' }}>£{Number(selected.paid_price).toLocaleString()}</div>
            </div>
            <div className="stat-card" style={{ padding:'0.75rem' }}>
              <div className="stat-label">Value</div>
              <div style={{ fontFamily:'var(--font-ui)', fontWeight:800, fontSize:'1rem', color:'var(--gold)' }}>£{Number(selected.current_value).toLocaleString()}</div>
            </div>
          </div>

          {/* eBay */}
          <div style={{ display:'flex', gap:'0.5rem', marginBottom:'1rem' }}>
            <a href={buildEbayUrl(selected.comics?.title, selected.comics?.issue_number, selected.grade)} target="_blank" rel="noopener noreferrer"
              className="btn btn-outline btn-sm" style={{ flex:1, justifyContent:'center', textDecoration:'none', fontSize:'0.75rem' }}><IconEbay size={12} /> eBay Sold</a>
            <a href={buildEbayActiveUrl(selected.comics?.title, selected.comics?.issue_number, selected.grade)} target="_blank" rel="noopener noreferrer"
              className="btn btn-outline btn-sm" style={{ flex:1, justifyContent:'center', textDecoration:'none', fontSize:'0.75rem' }}><IconSearch size={12} /> Listings</a>
          </div>

          {/* Read status */}
          <button onClick={() => selected.read_at ? markUnread(selected.id) : markRead(selected.id)}
            className="btn btn-sm" style={{ width:'100%', justifyContent:'center', marginBottom:'1rem',
              background: selected.read_at ? 'rgba(16,185,129,0.12)' : 'transparent',
              color:      selected.read_at ? 'var(--green)' : 'var(--muted)',
              border:     `1px solid ${selected.read_at ? 'rgba(16,185,129,0.35)' : 'var(--border)'}`,
              fontSize:'0.82rem' }}>
            {selected.read_at ? `Read ${new Date(selected.read_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}` : 'Mark as Read'}
          </button>

          {/* Update value */}
          <div style={{ marginBottom:'1rem' }}>
            <div className="form-label" style={{ marginBottom:'0.4rem' }}>Update Current Value</div>
            <div style={{ display:'flex', gap:'0.5rem' }}>
              <input className="form-input" type="number" placeholder="New value..."
                value={editingValue} onChange={e => setEditingValue(e.target.value)} style={{ flex:1 }} />
              <button className="btn btn-primary btn-sm" onClick={handleUpdateValue}>Save</button>
            </div>
          </div>

          {/* Price chart */}
          <div className="stat-label" style={{ marginBottom:'0.5rem' }}>Price History</div>
          {priceHistory.length > 1
            ? <div style={{ position:'relative', height:130 }}><canvas ref={chartRef} /></div>
            : <div style={{ padding:'0.85rem', background:'var(--bg3)', borderRadius:8, textAlign:'center', color:'var(--muted)', fontSize:'0.78rem' }}>Update value to build price history</div>
          }
        </div>
      )}
    </div>
  )
}

