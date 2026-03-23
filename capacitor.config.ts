import { useState } from 'react'
import { buildEbayUrl } from '../lib/comicvine'
import { IconGrid, IconList, IconEbay, IconRead } from '../lib/icons'

const GRADE_CLASS = { Mint:'grade-mint', 'Near Mint':'grade-nm', 'Very Fine':'grade-vf', Fine:'grade-fn', Good:'grade-gd', Fair:'grade-fair', Poor:'grade-poor' }

function ComicGrid({ filtered, selected, setSelected, bulkMode, selected2, setSelected2,
                     view, setView, sortBy, setSortBy, readFilter, setReadFilter,
                     markRead, markUnread, removeComic, toast,
                     title, defaultSort }) {

  const [localSort, setLocalSort] = useState(defaultSort || sortBy)

  const sorted = [...filtered].sort((a, b) => {
    const s = localSort
    if (s === 'value')  return Number(b.current_value) - Number(a.current_value)
    if (s === 'title')  return (a.comics?.title || '').localeCompare(b.comics?.title || '')
    if (s === 'issue') {
      const na = parseInt((a.comics?.issue_number || '').replace(/\D/g,'')) || 0
      const nb = parseInt((b.comics?.issue_number || '').replace(/\D/g,'')) || 0
      return na - nb
    }
    if (s === 'paid')  return Number(b.paid_price) - Number(a.paid_price)
    if (s === 'roi') {
      const ra = a.paid_price ? (a.current_value - a.paid_price) / a.paid_price : 0
      const rb = b.paid_price ? (b.current_value - b.paid_price) / b.paid_price : 0
      return rb - ra
    }
    return new Date(b.added_at) - new Date(a.added_at)
  })

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display:'flex', gap:'0.5rem', marginBottom:'1.25rem', flexWrap:'wrap', alignItems:'center' }}>
        {title && <span style={{ fontFamily:'var(--font-ui)', fontWeight:700, fontSize:'0.9rem', color:'var(--text)' }}>{title} · {filtered.length} issue{filtered.length !== 1 ? 's' : ''}</span>}
        <div style={{ flex:1 }} />
        <select className="form-select" style={{ width:'auto', fontSize:'0.8rem' }} value={localSort} onChange={e => setLocalSort(e.target.value)}>
          <option value="recent">Recent</option>
          <option value="issue">Issue #</option>
          <option value="value">Value</option>
          <option value="roi">ROI</option>
          <option value="title">Title</option>
          <option value="paid">Paid</option>
        </select>
        <button className={`btn ${view === 'grid' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setView('grid')} title='Grid view'><IconGrid size={14} /></button>
        <button className={`btn ${view === 'list' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setView('list')} title='List view'><IconList size={14} /></button>
        <div style={{ width:'1px', background:'var(--border)', height:24, margin:'0 2px' }} />
        {[['all','All'],['unread','📖'],['read','✓']].map(([val, label]) => (
          <button key={val} className={`btn btn-sm ${readFilter === val ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setReadFilter(val)} style={{ fontSize:'0.72rem', padding:'0.25rem 0.55rem' }} title={val}>{label}</button>
        ))}
      </div>

      {sorted.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-icon">🔍</div>
          <div className="empty-title">No comics found</div>
        </div>
      ) : view === 'grid' ? (
        <div className="comics-grid">
          {sorted.map(c => (
            <div key={c.id}
              className={`comic-card ${!bulkMode && selected?.id === c.id ? 'selected' : ''} ${bulkMode && selected2.has(c.id) ? 'selected' : ''}`}
              onClick={() => {
                if (bulkMode) {
                  setSelected2(prev => { const n = new Set(prev); n.has(c.id) ? n.delete(c.id) : n.add(c.id); return n })
                } else {
                  setSelected(s => s?.id === c.id ? null : c)
                }
              }}
              style={(!bulkMode && selected?.id === c.id) || (bulkMode && selected2.has(c.id)) ? { borderColor:'var(--purple)', boxShadow:'0 0 0 2px rgba(139,92,246,0.3)' } : {}}>
              {bulkMode && (
                <div style={{ position:'absolute', top:6, left:6, zIndex:2, width:18, height:18, borderRadius:4,
                  background: selected2.has(c.id) ? 'var(--purple)' : 'rgba(0,0,0,0.6)',
                  border:`2px solid ${selected2.has(c.id) ? 'var(--purple)' : 'var(--muted)'}`,
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.65rem', color:'#fff' }}>
                  {selected2.has(c.id) ? '✓' : ''}
                </div>
              )}
              <div style={{ position:'relative' }}>
                {c.comics?.cover_url
                  ? <img loading="lazy" src={c.comics.cover_url} alt={c.comics.title} className="comic-cover" />
                  : <div className="comic-cover-placeholder">🦸</div>}
                {c.read_at && (
                  <div style={{ position:'absolute', top:5, right:5, background:'rgba(16,185,129,0.9)', color:'#fff', borderRadius:'50%', width:20, height:20, fontSize:'0.7rem', fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center' }}>✓</div>
                )}
              </div>
              <div className="comic-info">
                <span className={`grade-badge ${GRADE_CLASS[c.grade] || 'grade-gd'}`}>{c.grade}</span>
                <div className="comic-title">{c.comics?.title}</div>
                <div className="comic-meta">{c.comics?.publisher} · {c.comics?.issue_number}</div>
                <div style={{ display:'flex', justifyContent:'space-between', marginTop:'0.3rem' }}>
                  <div style={{ fontSize:'0.72rem', color:'var(--muted)' }}>£{Number(c.paid_price).toLocaleString()}</div>
                  <div className="comic-value">£{Number(c.current_value).toLocaleString()}</div>
                </div>
                {c.paid_price > 0 && (
                  <div style={{ fontSize:'0.72rem', color: c.current_value >= c.paid_price ? 'var(--green)' : 'var(--red)', fontWeight:700 }}>
                    {c.current_value >= c.paid_price ? '▲' : '▼'} {(((c.current_value - c.paid_price) / c.paid_price) * 100).toFixed(0)}%
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ borderBottom:'1px solid var(--border)', background:'var(--bg3)' }}>
                {['','Title','Publisher','Grade','Paid','Value','ROI',''].map((h,i) => (
                  <th key={i} style={{ padding:'0.65rem 0.85rem', textAlign:'left', fontSize:'0.65rem', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--muted)', fontFamily:'var(--font-ui)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((c, i) => {
                const roi = c.paid_price ? (((c.current_value - c.paid_price) / c.paid_price) * 100).toFixed(0) : null
                return (
                  <tr key={c.id} onClick={() => setSelected(s => s?.id === c.id ? null : c)}
                    style={{ borderBottom: i < sorted.length - 1 ? '1px solid var(--border)' : 'none', cursor:'pointer', background: selected?.id === c.id ? 'rgba(139,92,246,0.06)' : '' }}>
                    <td style={{ padding:'0.65rem 0.65rem 0.65rem 1rem', width:46 }}>
                      {c.comics?.cover_url
                        ? <img loading="lazy" src={c.comics.cover_url} alt="" style={{ width:28, height:40, objectFit:'cover', borderRadius:3 }} />
                        : <div style={{ width:28, height:40, background:'var(--bg3)', borderRadius:3, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.8rem' }}>🦸</div>}
                    </td>
                    <td style={{ padding:'0.65rem 0.85rem', fontWeight:700, fontSize:'0.88rem' }}>
                      {c.comics?.title} {c.comics?.issue_number}
                      {c.read_at && <span style={{ marginLeft:6, fontSize:'0.6rem', background:'rgba(16,185,129,0.15)', color:'var(--green)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:20, padding:'1px 7px', fontFamily:'var(--font-ui)', fontWeight:700 }}>✓</span>}
                    </td>
                    <td style={{ padding:'0.65rem 0.85rem', color:'var(--muted)', fontSize:'0.82rem' }}>{c.comics?.publisher}</td>
                    <td style={{ padding:'0.65rem 0.85rem' }}><span className={`grade-badge ${GRADE_CLASS[c.grade]||'grade-gd'}`}>{c.grade}</span></td>
                    <td style={{ padding:'0.65rem 0.85rem', fontFamily:'var(--font-ui)', fontSize:'0.88rem' }}>£{Number(c.paid_price).toLocaleString()}</td>
                    <td style={{ padding:'0.65rem 0.85rem', fontFamily:'var(--font-ui)', fontWeight:700, color:'var(--gold)', fontSize:'0.88rem' }}>£{Number(c.current_value).toLocaleString()}</td>
                    <td style={{ padding:'0.65rem 0.85rem', fontFamily:'var(--font-ui)', fontWeight:700, fontSize:'0.82rem', color: roi !== null ? (Number(roi) >= 0 ? 'var(--green)' : 'var(--red)') : 'var(--muted)' }}>
                      {roi !== null ? `${Number(roi) >= 0 ? '+' : ''}${roi}%` : '–'}
                    </td>
                    <td style={{ padding:'0.65rem 0.85rem' }}>
                      <div style={{ display:'flex', gap:4, alignItems:'center' }}>
                        <button onClick={e => { e.stopPropagation(); c.read_at ? markUnread(c.id) : markRead(c.id) }}
                          style={{ background:'none', border:'none', cursor:'pointer', fontSize:'0.85rem', padding:'0 2px', color: c.read_at ? 'var(--green)' : 'var(--muted)' }}
                          title={c.read_at ? 'Mark unread' : 'Mark read'}>{c.read_at ? '✓' : '○'}</button>
                        <a href={buildEbayUrl(c.comics?.title, c.comics?.issue_number, c.grade)} target="_blank" rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          style={{ color:'var(--muted)', textDecoration:'none', display:'flex', alignItems:'center', padding:'0 2px' }} title="eBay sold prices"><IconEbay size={14} /></a>
                        <button onClick={e => { e.stopPropagation(); removeComic(c.id); toast.success('Removed from vault') }}
                          style={{ background:'none', border:'none', cursor:'pointer', color:'var(--red)', fontSize:'0.88rem' }}>✕</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default ComicGrid
