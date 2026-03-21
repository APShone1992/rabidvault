import React, { useState, useCallback } from 'react'
import { useCollection } from '../context/CollectionContext'
import { useToast } from '../context/ToastContext'
import { getVolume } from '../lib/comicvine'
import { supabase } from '../lib/supabase'

function CompletionRing({ owned, total, size = 48 }) {
  const pct    = total ? Math.min(owned / total, 1) : 0
  const r      = (size - 6) / 2
  const circ   = 2 * Math.PI * r
  const offset = circ * (1 - pct)
  const done   = total && owned >= total
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--bg3)" strokeWidth={5} />
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke={done ? 'var(--green)' : 'var(--purple)'}
        strokeWidth={5} strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
    </svg>
  )
}

export default function Series() {
  const { series, collection, loading } = useCollection()
  const toast = useToast()
  const [filter, setFilter]         = useState('all')
  const [expanded, setExpanded]     = useState(null)   // volume_id showing missing issues
  const [loadingMissing, setLoadingMissing] = useState(null)
  const [missingData, setMissingData]       = useState({}) // volumeId → { issues, loading }
  const [markingRead, setMarkingRead]       = useState(null)

  if (loading) return (
    <div className="page-enter">
      <h1 className="section-title" style={{ marginBottom:'1.5rem' }}>Series & Sets</h1>
      <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
        {[...Array(5)].map((_,i) => <div key={i} className="skeleton" style={{ height:80, borderRadius:12 }} />)}
      </div>
    </div>
  )

  const standalones     = collection.filter(c => !c.comics?.volume_id)
  const completeCount   = (series || []).filter(s => s.total && s.owned >= s.total).length
  const incompleteCount = (series || []).filter(s => s.total && s.owned < s.total).length
  const unknownCount    = (series || []).filter(s => !s.total).length

  // ── Fetch all issues in a volume from ComicVine ──────────────
  async function loadMissing(s) {
    const vid = s.volume_id
    if (expanded === vid) { setExpanded(null); return }

    setExpanded(vid)

    // Return cached result
    if (missingData[vid]) return

    setLoadingMissing(vid)
    try {
      const volumeData = await getVolume(vid)
      const allIssues  = volumeData?.issues || []

      // What we own — build a Set of issue numbers (normalised)
      const ownedNums = new Set(
        s.issues.map(c => {
          const raw = (c.comics?.issue_number || '').replace(/[^0-9.]/g, '')
          return raw ? parseFloat(raw) : null
        }).filter(n => n !== null)
      )

      // Map ComicVine issues to missing / owned
      const mapped = allIssues
        .map(issue => {
          const num = issue.issue_number != null ? parseFloat(issue.issue_number) : null
          const isOwned = num !== null && ownedNums.has(num)
          return {
            id:           issue.id,
            issue_number: issue.issue_number != null ? `#${issue.issue_number}` : '?',
            num:          num ?? 9999,
            name:         issue.name || '',
            cover_url:    issue.image?.small_url || issue.image?.thumb_url || '',
            cover_date:   issue.cover_date || '',
            api_detail:   issue.api_detail_url || '',
            owned:        isOwned,
          }
        })
        .sort((a, b) => a.num - b.num)

      setMissingData(prev => ({ ...prev, [vid]: mapped }))
    } catch (err) {
      toast.error('Could not load full issue list from ComicVine')
      setExpanded(null)
    } finally {
      setLoadingMissing(null)
    }
  }

  async function toggleRead(collectionId, isRead) {
    setMarkingRead(collectionId)
    try {
      await supabase.from('collection').update({
        read_at: isRead ? null : new Date().toISOString()
      }).eq('id', collectionId)
      window.dispatchEvent(new Event('rv-collection-refresh'))
    } catch (_) { /* intentional */ }
    setMarkingRead(null)
  }

  const filtered = (series || []).filter(s => {
    if (filter === 'complete')   return s.total && s.owned >= s.total
    if (filter === 'incomplete') return s.total && s.owned < s.total
    if (filter === 'unknown')    return !s.total
    return true
  })

  return (
    <div className="page-enter">
      <div className="section-header" style={{ marginBottom:'0.75rem' }}>
        <h1 className="section-title">Series & Sets</h1>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontFamily:'var(--font-ui)', fontWeight:700, color:'var(--green)', fontSize:'0.9rem' }}>
            {completeCount} complete
          </div>
          <div style={{ fontFamily:'var(--font-ui)', fontSize:'0.75rem', color:'var(--muted)' }}>
            {incompleteCount} in progress · {unknownCount} unknown length
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="tabs" style={{ marginBottom:'1.5rem' }}>
        {[
          ['all',        `All (${(series || []).length})`],
          ['complete',   `✓ Complete (${completeCount})`],
          ['incomplete', `⏳ In Progress (${incompleteCount})`],
          ['unknown',    `? Unknown (${unknownCount})`],
        ].map(([val, label]) => (
          <button key={val} className={`tab ${filter === val ? 'active' : ''}`}
            onClick={() => setFilter(val)}>{label}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-icon">📚</div>
          <div className="empty-title">No series here yet</div>
          <div className="empty-body">Add comics via ComicVine search to track series completion automatically</div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'0.85rem' }}>
          {filtered.map(s => {
            const done    = s.total && s.owned >= s.total
            const pct     = s.total ? Math.round((s.owned / s.total) * 100) : null
            const missing = s.total ? s.total - s.owned : null
            const value   = s.issues.reduce((sum, c) => sum + Number(c.current_value || 0), 0)
            const isExpanded   = expanded === s.volume_id
            const isLoadingThis = loadingMissing === s.volume_id
            const issueList    = missingData[s.volume_id] || []
            const missingList  = issueList.filter(i => !i.owned)
            const ownedList    = issueList.filter(i => i.owned)

            return (
              <div key={s.volume_id} className={`card ${done ? 'card-glow' : ''}`}
                style={{ borderColor: done ? 'rgba(16,185,129,0.4)' : undefined }}>

                {/* ── Header row ── */}
                <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
                  <div style={{ position:'relative', flexShrink:0 }}>
                    <CompletionRing owned={s.owned} total={s.total} size={52} />
                    <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center',
                      justifyContent:'center', fontFamily:'var(--font-ui)', fontWeight:800,
                      fontSize: pct !== null ? '0.68rem' : '0.75rem',
                      color: done ? 'var(--green)' : 'var(--text)' }}>
                      {done ? '✓' : pct !== null ? `${pct}%` : `${s.owned}`}
                    </div>
                  </div>

                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.2rem', flexWrap:'wrap' }}>
                      <div style={{ fontFamily:'var(--font-ui)', fontWeight:700, fontSize:'0.95rem',
                        whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                        {s.name}
                      </div>
                      {done && <span className="badge badge-green">✓ Complete Set</span>}
                      {!done && missing !== null && (
                        <span className="badge badge-gray">{missing} missing</span>
                      )}
                      {!s.total && <span className="badge badge-gray">? issues in run</span>}
                    </div>
                    <div style={{ fontSize:'0.78rem', color:'var(--muted)', fontFamily:'var(--font-ui)', marginBottom:'0.6rem' }}>
                      {s.publisher} · {s.owned} of {s.total ?? '?'} issues owned
                    </div>
                    {s.total && (
                      <div style={{ height:5, background:'var(--bg3)', borderRadius:3, overflow:'hidden' }}>
                        <div style={{ height:'100%', borderRadius:3,
                          background: done ? 'var(--green)' : 'linear-gradient(90deg,var(--purple),var(--purple-light))',
                          width:`${(s.owned/s.total)*100}%`, transition:'width 0.6s ease' }} />
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontFamily:'var(--font-ui)', fontWeight:800, color:'var(--gold)', fontSize:'1rem' }}>
                      £{Number(value || 0).toLocaleString()}
                    </div>
                    <div style={{ fontSize:'0.72rem', color:'var(--muted)', fontFamily:'var(--font-ui)', marginBottom:'0.4rem' }}>
                      set value
                    </div>
                    {/* Only show "What's missing?" for incomplete series with a known total */}
                    {!done && s.total ? (
                      <button onClick={() => loadMissing(s)} disabled={isLoadingThis}
                        style={{ background: isExpanded ? 'rgba(239,68,68,0.12)' : 'rgba(139,92,246,0.12)',
                          border:`1px solid ${isExpanded ? 'rgba(239,68,68,0.3)' : 'rgba(139,92,246,0.25)'}`,
                          borderRadius:6, padding:'0.28rem 0.6rem', cursor:'pointer',
                          fontFamily:'var(--font-ui)', fontSize:'0.68rem', fontWeight:700,
                          color: isExpanded ? '#fca5a5' : 'var(--purple-light)',
                          whiteSpace:'nowrap', transition:'all 0.15s',
                          opacity: isLoadingThis ? 0.6 : 1 }}>
                        {isLoadingThis ? 'Loading…' : isExpanded ? '▲ Hide' : `🔍 What's Missing?`}
                      </button>
                    ) : (
                      <button onClick={() => loadMissing(s)} disabled={isLoadingThis}
                        style={{ background:'var(--bg3)', border:'1px solid var(--border)',
                          borderRadius:6, padding:'0.28rem 0.6rem', cursor:'pointer',
                          fontFamily:'var(--font-ui)', fontSize:'0.68rem', fontWeight:700,
                          color:'var(--muted)', whiteSpace:'nowrap',
                          opacity: isLoadingThis ? 0.6 : 1 }}>
                        {isLoadingThis ? 'Loading…' : isExpanded ? '▲ Hide' : '📖 All Issues'}
                      </button>
                    )}
                  </div>
                </div>

                {/* ── Owned thumbnails strip ── */}
                {s.issues.length > 0 && !isExpanded && (
                  <div style={{ display:'flex', gap:'0.4rem', marginTop:'0.85rem', overflowX:'auto', paddingBottom:'0.25rem' }}>
                    {[...s.issues]
                      .sort((a,b) => {
                        const na = parseInt((a.comics?.issue_number||''). replace(/\D/g,''))||0
                        const nb = parseInt((b.comics?.issue_number||''). replace(/\D/g,''))||0
                        return na - nb
                      })
                      .slice(0, 12)
                      .map(c => (
                        <div key={c.id} style={{ flexShrink:0, position:'relative' }}
                          title={`${c.comics?.title} ${c.comics?.issue_number}`}>
                          {c.comics?.cover_url
                            ? <img loading="lazy" src={c.comics.cover_url} alt=""
                                style={{ width:36, height:50, objectFit:'cover', borderRadius:4, border:'1px solid var(--border)' }} />
                            : <div style={{ width:36, height:50, background:'var(--bg3)', borderRadius:4,
                                display:'flex', alignItems:'center', justifyContent:'center',
                                fontSize:'0.7rem', border:'1px solid var(--border)' }}>📖</div>
                          }
                          <div style={{ position:'absolute', bottom:0, left:0, right:0,
                            background:'rgba(0,0,0,0.75)', borderRadius:'0 0 4px 4px',
                            textAlign:'center', fontFamily:'var(--font-ui)', fontSize:'0.5rem',
                            fontWeight:700, color:'#fff', padding:'1px 0' }}>
                            {(c.comics?.issue_number||''). replace('#','')}
                          </div>
                        </div>
                      ))}
                    {s.issues.length > 12 && (
                      <div style={{ width:36, height:50, background:'var(--bg3)', borderRadius:4,
                        border:'1px solid var(--border)', display:'flex', alignItems:'center',
                        justifyContent:'center', flexShrink:0, fontFamily:'var(--font-ui)',
                        fontWeight:800, fontSize:'0.7rem', color:'var(--muted)' }}>
                        +{s.issues.length - 12}
                      </div>
                    )}
                  </div>
                )}

                {/* ── MISSING ISSUES PANEL ── */}
                {isExpanded && (
                  <div style={{ marginTop:'1rem', borderTop:'1px solid var(--border)', paddingTop:'1rem' }}>

                    {isLoadingThis ? (
                      <div style={{ display:'flex', gap:'0.4rem', overflowX:'auto' }}>
                        {[...Array(6)].map((_,i) => (
                          <div key={i} className="skeleton"
                            style={{ width:52, height:74, borderRadius:6, flexShrink:0,
                              animationDelay:`${i*0.07}s` }} />
                        ))}
                      </div>
                    ) : issueList.length === 0 ? (
                      <div style={{ color:'var(--muted)', fontSize:'0.82rem', textAlign:'center', padding:'0.75rem 0' }}>
                        Could not load issue list — ComicVine may be unavailable
                      </div>
                    ) : (
                      <>
                        {/* Missing issues */}
                        {missingList.length > 0 && (
                          <div style={{ marginBottom:'1rem' }}>
                            <div style={{ fontFamily:'var(--font-ui)', fontSize:'0.72rem', fontWeight:700,
                              letterSpacing:'0.08em', textTransform:'uppercase',
                              color:'#fca5a5', marginBottom:'0.6rem' }}>
                              ❌ Missing ({missingList.length})
                            </div>
                            <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
                              {missingList.map(issue => (
                                <div key={issue.id}
                                  style={{ position:'relative', cursor:'default' }}
                                  title={issue.name ? `${issue.issue_number} — ${issue.name}` : issue.issue_number}>
                                  {issue.cover_url
                                    ? <img loading="lazy" src={issue.cover_url} alt=""
                                        style={{ width:52, height:74, objectFit:'cover', borderRadius:6,
                                          border:'2px solid rgba(239,68,68,0.5)',
                                          filter:'grayscale(40%) brightness(0.75)' }} />
                                    : <div style={{ width:52, height:74, background:'rgba(239,68,68,0.08)',
                                        borderRadius:6, border:'2px dashed rgba(239,68,68,0.35)',
                                        display:'flex', flexDirection:'column', alignItems:'center',
                                        justifyContent:'center', gap:2 }}>
                                        <span style={{ fontSize:'1rem' }}>?</span>
                                      </div>
                                  }
                                  {/* Issue number badge */}
                                  <div style={{ position:'absolute', bottom:0, left:0, right:0,
                                    background:'rgba(239,68,68,0.85)', borderRadius:'0 0 5px 5px',
                                    textAlign:'center', fontFamily:'var(--font-ui)', fontSize:'0.55rem',
                                    fontWeight:800, color:'#fff', padding:'2px 0' }}>
                                    {issue.issue_number.replace('#','')}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Owned issues in this view */}
                        {ownedList.length > 0 && (
                          <div>
                            <div style={{ fontFamily:'var(--font-ui)', fontSize:'0.72rem', fontWeight:700,
                              letterSpacing:'0.08em', textTransform:'uppercase',
                              color:'var(--green)', marginBottom:'0.6rem' }}>
                              ✓ Owned ({ownedList.length})
                            </div>
                            <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
                              {ownedList.map(issue => {
                                // Find the actual collection item for this issue
                                const collItem = s.issues.find(c => {
                                  const n = parseFloat((c.comics?.issue_number||''). replace(/[^0-9.]/g,''))
                                  return n === issue.num
                                })
                                const isRead = !!collItem?.read_at
                                return (
                                  <div key={issue.id} style={{ position:'relative' }}
                                    title={issue.name ? `${issue.issue_number} — ${issue.name}${isRead?' (Read)':''}`
                                                      : issue.issue_number}>
                                    {collItem?.comics?.cover_url
                                      ? <img loading="lazy" src={collItem.comics.cover_url} alt=""
                                          style={{ width:52, height:74, objectFit:'cover', borderRadius:6,
                                            border:`2px solid ${isRead ? 'rgba(16,185,129,0.6)' : 'rgba(139,92,246,0.5)'}`,
                                            opacity: isRead ? 0.8 : 1 }} />
                                      : <div style={{ width:52, height:74, background:'rgba(16,185,129,0.08)',
                                          borderRadius:6, border:'2px solid rgba(16,185,129,0.35)',
                                          display:'flex', alignItems:'center', justifyContent:'center' }}>
                                          <span style={{ fontSize:'0.8rem' }}>✓</span>
                                        </div>
                                    }
                                    {/* Read indicator */}
                                    {isRead && (
                                      <div style={{ position:'absolute', top:2, right:2,
                                        background:'rgba(16,185,129,0.9)', borderRadius:'50%',
                                        width:14, height:14, display:'flex', alignItems:'center',
                                        justifyContent:'center', fontSize:'0.55rem', fontWeight:800, color:'#fff' }}>
                                        ✓
                                      </div>
                                    )}
                                    <div style={{ position:'absolute', bottom:0, left:0, right:0,
                                      background: isRead ? 'rgba(16,185,129,0.85)' : 'rgba(0,0,0,0.75)',
                                      borderRadius:'0 0 5px 5px', textAlign:'center',
                                      fontFamily:'var(--font-ui)', fontSize:'0.55rem',
                                      fontWeight:800, color:'#fff', padding:'2px 0' }}>
                                      {issue.issue_number.replace('#','')}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {/* Summary line */}
                        <div style={{ marginTop:'0.85rem', padding:'0.6rem 0.85rem',
                          background:'var(--bg3)', borderRadius:8,
                          fontFamily:'var(--font-ui)', fontSize:'0.78rem', color:'var(--muted)',
                          display:'flex', gap:'1.5rem', flexWrap:'wrap' }}>
                          <span>Total in series: <strong style={{ color:'var(--text)' }}>{issueList.length}</strong></span>
                          <span>You own: <strong style={{ color:'var(--green)' }}>{ownedList.length}</strong></span>
                          {missingList.length > 0 && (
                            <span>Still needed: <strong style={{ color:'#fca5a5' }}>{missingList.length}</strong></span>
                          )}
                          {missingList.length === 0 && (
                            <span style={{ color:'var(--green)', fontWeight:700 }}>🎉 Complete set!</span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Standalone comics */}
      {standalones.length > 0 && (
        <div style={{ marginTop:'2rem' }}>
          <h2 className="section-title" style={{ fontSize:'1.4rem', marginBottom:'1rem' }}>Standalone Issues</h2>
          <div className="card">
            <div style={{ color:'var(--muted)', fontSize:'0.85rem', marginBottom:'0.75rem' }}>
              {standalones.length} comic{standalones.length !== 1 ? 's' : ''} not linked to a series — add them via ComicVine search to track their series automatically
            </div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'0.4rem' }}>
              {standalones.slice(0, 20).map(c => (
                <span key={c.id} style={{ fontFamily:'var(--font-ui)', fontSize:'0.72rem',
                  background:'var(--bg3)', border:'1px solid var(--border)',
                  borderRadius:6, padding:'3px 8px' }}>
                  {c.comics?.title} {c.comics?.issue_number}
                </span>
              ))}
              {standalones.length > 20 && (
                <span style={{ fontFamily:'var(--font-ui)', fontSize:'0.72rem', color:'var(--muted)' }}>
                  +{standalones.length - 20} more
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
