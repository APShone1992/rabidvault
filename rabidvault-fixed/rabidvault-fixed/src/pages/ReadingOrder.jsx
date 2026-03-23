import { useState, useMemo } from 'react'
import { useCollection } from '../context/CollectionContext'
import { IconBack, IconRead, IconReadDone } from '../lib/icons'

export default function ReadingOrder({ setPage }) {
  const { collection, series, loading, markRead, markUnread, setReadingOrder } = useCollection()
  const [activeSeries, setActiveSeries] = useState(null)
  const [filter, setFilter] = useState('all') // all | unread | read

  // Groups with reading order enabled (have volume_id)
  const readableSeries = useMemo(() =>
    (series || []).filter(s => s.issues?.length > 0)
  , [series])

  // Current series issues sorted by reading order then issue number
  const seriesIssues = useMemo(() => {
    if (!activeSeries) return []
    const issues = [...(activeSeries.issues || [])]

    // Sort: by reading_order if set, else by issue_number numerically
    return issues.sort((a, b) => {
      const ao = a.reading_order, bo = b.reading_order
      if (ao != null && bo != null) return ao - bo
      if (ao != null) return -1
      if (bo != null) return 1
      const an = parseFloat((a.comics?.issue_number || '').replace(/[^0-9.]/g,'')) || 0
      const bn = parseFloat((b.comics?.issue_number || '').replace(/[^0-9.]/g,'')) || 0
      return an - bn
    })
  }, [activeSeries])

  const filtered = useMemo(() => {
    if (filter === 'unread') return seriesIssues.filter(c => !c.read_at)
    if (filter === 'read')   return seriesIssues.filter(c => !!c.read_at)
    return seriesIssues
  }, [seriesIssues, filter])

  const readCount   = seriesIssues.filter(c => !!c.read_at).length
  const totalIssues = seriesIssues.length
  const progress    = totalIssues > 0 ? Math.round((readCount / totalIssues) * 100) : 0
  const nextUnread  = seriesIssues.find(c => !c.read_at)

  if (loading) return (
    <div className="page-enter">
      <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
        {[...Array(5)].map((_,i) => <div key={i} className="skeleton" style={{ height:72, borderRadius:12 }} />)}
      </div>
    </div>
  )

  // ── Series list view ───────────────────────────────────────
  if (!activeSeries) return (
    <div className="page-enter">
      <h1 className="section-title" style={{ marginBottom:'1.5rem' }}>Reading Order</h1>

      {readableSeries.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-icon">📖</div>
          <div className="empty-title">No series yet</div>
          <div className="empty-body">Add comics via ComicVine search to enable reading order tracking by series.</div>
          <button className="btn btn-primary" onClick={() => setPage('add')}>Add Comics</button>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
          {readableSeries.map(s => {
            const read  = s.issues.filter(c => !!c.read_at).length
            const total = s.issues.length
            const pct   = total > 0 ? Math.round((read/total)*100) : 0
            const next  = [...s.issues]
              .sort((a,b) => {
                const ao = a.reading_order, bo = b.reading_order
                if (ao!=null&&bo!=null) return ao-bo
                const an = parseFloat((a.comics?.issue_number||'').replace(/[^0-9.]/g,''))||0
                const bn = parseFloat((b.comics?.issue_number||'').replace(/[^0-9.]/g,''))||0
                return an-bn
              })
              .find(c => !c.read_at)

            return (
              <div key={s.volume_id} className="card"
                style={{ cursor:'pointer', transition:'border-color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor='var(--purple)'}
                onMouseLeave={e => e.currentTarget.style.borderColor=''}
                onClick={() => setActiveSeries(s)}>
                <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
                  {/* Cover thumbnail of first issue */}
                  {s.issues[0]?.comics?.cover_url ? (
                    <img loading="lazy" src={s.issues[0].comics.cover_url} alt=""
                      style={{ width:40, height:56, objectFit:'cover', borderRadius:4, flexShrink:0 }} />
                  ) : (
                    <div style={{ width:40, height:56, background:'var(--bg3)', borderRadius:4, flexShrink:0,
                      display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.2rem' }}>📚</div>
                  )}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontFamily:'var(--font-ui)', fontWeight:700, fontSize:'0.95rem',
                      whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                      {s.name}
                    </div>
                    <div style={{ fontSize:'0.78rem', color:'var(--muted)', marginTop:2 }}>
                      {s.publisher} · {read}/{total} read
                      {next && <span style={{ color:'var(--purple-light)', marginLeft:8 }}>
                        Next: {next.comics?.issue_number}
                      </span>}
                    </div>
                    {/* Progress bar */}
                    <div style={{ height:4, background:'var(--bg3)', borderRadius:2, marginTop:6, overflow:'hidden' }}>
                      <div style={{ height:'100%', borderRadius:2,
                        background: pct===100 ? 'var(--green)' : 'var(--purple)',
                        width:`${pct}%`, transition:'width 0.4s ease' }} />
                    </div>
                  </div>
                  <div style={{ fontFamily:'var(--font-ui)', fontWeight:700, fontSize:'0.88rem',
                    color: pct===100 ? 'var(--green)' : 'var(--muted)', flexShrink:0 }}>
                    {pct}%
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  // ── Issue list view ────────────────────────────────────────
  return (
    <div className="page-enter">
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'1.25rem' }}>
        <button onClick={() => setActiveSeries(null)}
          style={{ background:'none', border:'none', color:'var(--muted)', cursor:'pointer',
            display:'flex', alignItems:'center', gap:4, fontFamily:'var(--font-ui)', fontSize:'0.82rem' }}>
          <IconBack size={14} /> All Series
        </button>
      </div>

      <div style={{ marginBottom:'1.25rem' }}>
        <h2 style={{ fontFamily:'var(--font-display)', fontSize:'1.6rem', letterSpacing:'0.08em',
          marginBottom:'0.25rem' }}>{activeSeries.name}</h2>
        <div style={{ fontSize:'0.82rem', color:'var(--muted)' }}>
          {activeSeries.publisher} · {readCount}/{totalIssues} issues read
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:12,
        padding:'1rem', marginBottom:'1.25rem' }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.5rem' }}>
          <span style={{ fontFamily:'var(--font-ui)', fontSize:'0.75rem', color:'var(--muted)' }}>Reading progress</span>
          <span style={{ fontFamily:'var(--font-ui)', fontWeight:700, fontSize:'0.82rem',
            color: progress===100 ? 'var(--green)' : 'var(--purple-light)' }}>{progress}%</span>
        </div>
        <div style={{ height:8, background:'var(--bg3)', borderRadius:4, overflow:'hidden' }}>
          <div style={{ height:'100%', borderRadius:4,
            background: progress===100 ? 'var(--green)' : 'linear-gradient(90deg,var(--purple),var(--pl))',
            width:`${progress}%`, transition:'width 0.5s ease' }} />
        </div>
        {nextUnread && (
          <div style={{ marginTop:'0.75rem', display:'flex', alignItems:'center', gap:'0.5rem',
            padding:'0.6rem 0.85rem', background:'rgba(139,92,246,0.08)',
            borderRadius:8, border:'1px solid rgba(139,92,246,0.2)' }}>
            <IconRead size={13} style={{ color:'var(--purple-light)', flexShrink:0 }} />
            <span style={{ fontFamily:'var(--font-ui)', fontSize:'0.8rem', color:'var(--purple-light)', fontWeight:600 }}>
              Up next: {nextUnread.comics?.title} {nextUnread.comics?.issue_number}
            </span>
            <button className="btn btn-primary btn-sm" style={{ marginLeft:'auto' }}
              onClick={() => markRead(nextUnread.id)}>
              Mark Read
            </button>
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div className="tabs" style={{ marginBottom:'1rem' }}>
        {[['all','All'],['unread','Unread'],['read','Read']].map(([val, label]) => (
          <button key={val} className={`tab ${filter===val?'active':''}`}
            onClick={() => setFilter(val)}>{label}</button>
        ))}
      </div>

      {/* Issue list */}
      <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
        {filtered.map((c, idx) => {
          const isRead = !!c.read_at
          return (
            <div key={c.id} className="card"
              style={{ display:'flex', alignItems:'center', gap:'0.85rem', padding:'0.75rem 1rem',
                opacity: isRead ? 0.75 : 1, transition:'opacity 0.2s' }}>
              {/* Issue number badge */}
              <div style={{ width:36, height:36, borderRadius:8, flexShrink:0,
                background: isRead ? 'rgba(16,185,129,0.15)' : 'rgba(139,92,246,0.12)',
                border: `1px solid ${isRead ? 'rgba(16,185,129,0.3)' : 'rgba(139,92,246,0.2)'}`,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontFamily:'var(--font-ui)', fontWeight:700, fontSize:'0.72rem',
                color: isRead ? 'var(--green)' : 'var(--purple-light)' }}>
                {c.comics?.issue_number || `#${idx+1}`}
              </div>
              {/* Cover */}
              {c.comics?.cover_url ? (
                <img loading="lazy" src={c.comics.cover_url} alt=""
                  style={{ width:32, height:44, objectFit:'cover', borderRadius:3, flexShrink:0 }} />
              ) : null}
              {/* Info */}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontFamily:'var(--font-ui)', fontWeight:600, fontSize:'0.88rem',
                  whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
                  textDecoration: isRead ? 'line-through' : 'none', color: isRead ? 'var(--muted)' : 'var(--text)' }}>
                  {c.comics?.title} {c.comics?.issue_number}
                </div>
                {isRead && c.read_at && (
                  <div style={{ fontSize:'0.7rem', color:'var(--green)', marginTop:1 }}>
                    Read {new Date(c.read_at).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}
                  </div>
                )}
              </div>
              {/* Read toggle */}
              <button
                onClick={() => isRead ? markUnread(c.id) : markRead(c.id)}
                style={{ background: isRead ? 'rgba(16,185,129,0.15)' : 'transparent',
                  border: `1.5px solid ${isRead ? 'rgba(16,185,129,0.4)' : 'var(--border)'}`,
                  color: isRead ? 'var(--green)' : 'var(--muted)',
                  borderRadius:8, padding:'0.4rem 0.7rem', cursor:'pointer', flexShrink:0,
                  display:'flex', alignItems:'center', gap:4,
                  fontFamily:'var(--font-ui)', fontSize:'0.72rem', fontWeight:600,
                  transition:'all 0.15s' }}
                title={isRead ? 'Mark unread' : 'Mark as read'}>
                {isRead ? <IconReadDone size={13} /> : <IconRead size={13} />}
                {isRead ? 'Read' : 'Unread'}
              </button>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div style={{ textAlign:'center', padding:'2rem', color:'var(--muted)', fontSize:'0.88rem' }}>
            {filter === 'unread' ? '🎉 All caught up!' : 'No issues match this filter'}
          </div>
        )}
      </div>
    </div>
  )
}
