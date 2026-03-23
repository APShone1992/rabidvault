import { useState, useEffect, useRef } from 'react'
import { useCollection } from '../context/CollectionContext'
import { useAchievements }    from '../context/AchievementsContext'
import { useValueSnapshots }  from '../hooks/useValueSnapshots'
import { useAuth } from '../context/AuthContext'
import { buildEbayUrl } from '../lib/comicvine'
import { IconAdd, IconReleases, IconAnalytics, IconCollection, IconEbay, IconROIUp, IconROIDown } from '../lib/icons'
import Onboarding from '../components/Onboarding'

const GRADE_CLASS = { Mint:'grade-mint','Near Mint':'grade-nm','Very Fine':'grade-vf',Fine:'grade-fn',Good:'grade-gd',Fair:'grade-fair',Poor:'grade-poor' }

function SkeletonCard() {
  return (
    <div className="comic-card" style={{ pointerEvents: 'none' }}>
      <div className="skeleton" style={{ width: '100%', aspectRatio: '2/3' }} />
      <div style={{ padding: '0.85rem' }}>
        <div className="skeleton" style={{ height: 12, borderRadius: 6, marginBottom: 6 }} />
        <div className="skeleton" style={{ height: 10, borderRadius: 6, width: '60%' }} />
      </div>
    </div>
  )
}

export default function Dashboard({ setPage }) {
  const { profile } = useAuth()
  const { collection, stats, series, loading } = useCollection()
  const { level, xpProgress } = useAchievements()
  const [showOnboarding, setShowOnboarding] = useState(false)
  const snapshotTaken = useRef(false)
  const { snapshots, weeklyChange, takeSnapshot } = useValueSnapshots()

  useEffect(() => {
    if (!loading && stats.total === 0) {
      const seen = sessionStorage.getItem('rv-onboarding-seen')
      if (!seen) { setShowOnboarding(true); sessionStorage.setItem('rv-onboarding-seen', '1') }
    }
  }, [loading, stats.total])

  const recent = [...collection].slice(0, 6)
  const top5   = [...collection].sort((a, b) => Number(b.current_value) - Number(a.current_value)).slice(0, 5)
  const roi    = stats.totalSpent > 0 ? (((stats.totalValue - stats.totalSpent) / stats.totalSpent) * 100).toFixed(1) : '0'
  const gain   = stats.totalValue - stats.totalSpent

  // Auto-snapshot once when collection first loads with data
  useEffect(() => {
    if (!loading && stats.total > 0 && !snapshotTaken.current) {
      snapshotTaken.current = true
      takeSnapshot(stats.totalValue, stats.totalSpent, stats.total)
    }
  }, [loading]) // eslint-disable-line

  // Best ROI comic
  const bestRoi = collection.filter(c => c.paid_price > 0).sort((a, b) => {
    const ra = (a.current_value - a.paid_price) / a.paid_price
    const rb = (b.current_value - b.paid_price) / b.paid_price
    return rb - ra
  })[0]

  // Smart insights
  const mostUndervalued = collection
    .filter(c => c.current_value > 0 && c.paid_price > 0 && c.current_value < c.paid_price * 0.8)
    .sort((a, b) => (b.paid_price - b.current_value) - (a.paid_price - a.current_value))[0]

  const mostExpensive = collection
    .sort((a, b) => Number(b.current_value) - Number(a.current_value))[0]

  const totalRead = stats.read || 0

  return (
    <div className="page-enter">
      {showOnboarding && <Onboarding setPage={setPage} onDismiss={() => setShowOnboarding(false)} />}
      {/* Hero */}
      <div className="hero-banner">
        <h1 className="hero-title">
          {profile?.username ? `${profile.username.toUpperCase()}'S VAULT` : 'THE VAULT'}
        </h1>
        <p className="hero-sub">Track · Value · Discover · Connect</p>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
          <button className="btn btn-primary" onClick={() => setPage('add')}><IconAdd size={14} /> Add Comic</button>
          <button className="btn btn-outline" onClick={() => setPage('releases')}><IconReleases size={14} /> New Releases</button>
          <button className="btn btn-outline" onClick={() => setPage('analytics')}><IconAnalytics size={14} /> Analytics</button>
          <button className="btn btn-outline" onClick={() => setPage('collection')}><IconCollection size={14} /> Collection</button>
        </div>

        {/* Mini XP bar in hero */}
        {!loading && stats.total > 0 && (
          <div style={{ marginTop: '1.5rem', position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--muted)', fontFamily: 'var(--font-ui)', marginBottom: '0.3rem' }}>
              <span>Level {level} Collector</span>
              <span>{xpProgress.toFixed(0)}% to next level</span>
            </div>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden', maxWidth: 280 }}>
              <div style={{ height: '100%', width: `${xpProgress}%`, background: 'linear-gradient(90deg,var(--purple),var(--purple-light))', borderRadius: 2, transition: 'width 0.6s ease' }} />
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="stats-row">
        {[
          { label: 'Total Comics', value: loading ? '–' : stats.total },
          { label: 'Collection Value', value: loading ? '–' : `£${Number(stats.totalValue || 0).toLocaleString()}`, color: 'var(--gold)' },
          { label: 'Total Spent', value: loading ? '–' : `£${Number(stats.totalSpent || 0).toLocaleString()}` },
          { label: 'Publishers', value: loading ? '–' : stats.publishers },
          {
            label: 'This Week',
            value: weeklyChange === null ? '–' : weeklyChange >= 0
              ? `+£${Number(weeklyChange).toLocaleString()}`
              : `-£${Number(Math.abs(weeklyChange)).toLocaleString()}`,
            color: weeklyChange === null ? undefined : weeklyChange >= 0 ? 'var(--green)' : 'var(--red)',
          },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={s.color ? { color: s.color } : {}}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Portfolio performance */}
      {stats.totalSpent > 0 && !loading && (
        <div style={{ marginBottom: '2rem' }}>
          <div className="section-header" style={{ marginBottom: '0.85rem' }}>
            <h2 className="section-title">Portfolio</h2>
            <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: '1.1rem', color: gain >= 0 ? 'var(--green)' : 'var(--red)' }}>
              {Number(roi) >= 0 ? '↑' : '↓'} {roi}% ROI
            </span>
          </div>
          <div className="card card-glow">
            <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <div>
                <div className="stat-label">Invested</div>
                <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: '1.1rem' }}>£{Number(stats.totalSpent || 0).toLocaleString()}</div>
              </div>
              <div>
                <div className="stat-label">Current value</div>
                <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--gold)' }}>£{Number(stats.totalValue || 0).toLocaleString()}</div>
              </div>
              <div>
                <div className="stat-label">Gain / Loss</div>
                <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: '1.1rem', color: gain >= 0 ? 'var(--green)' : 'var(--red)' }}>
                  {gain >= 0 ? '+' : ''}£{Math.abs(gain).toLocaleString()}
                </div>
              </div>
              {bestRoi && (
                <div>
                  <div className="stat-label">Best performer</div>
                  <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: '0.85rem', color: 'var(--green)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {bestRoi.comics?.title} {bestRoi.comics?.issue_number}
                    <span style={{ marginLeft: '0.4rem', fontSize: '0.78rem' }}>
                      (+{(((bestRoi.current_value - bestRoi.paid_price) / bestRoi.paid_price) * 100).toFixed(0)}%)
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div style={{ height: 6, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 3, background: 'linear-gradient(90deg,var(--purple),var(--green))', width: `${Math.min(100, Math.abs(Number(roi)))}%`, transition: 'width 0.8s ease' }} />
            </div>
          </div>
        </div>
      )}

      {/* Smart Insights */}
      {!loading && stats.total > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {bestRoi && (
            <div className="card card-glow" style={{ background: 'linear-gradient(135deg,rgba(16,185,129,0.08),transparent)' }}>
              <div className="stat-label" style={{ marginBottom: '0.5rem' }}>🚀 Best Performer</div>
              <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {bestRoi.comics?.title} {bestRoi.comics?.issue_number}
              </div>
              <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 800, color: 'var(--green)', fontSize: '1.2rem', marginTop: '0.25rem' }}>
                +{(((bestRoi.current_value - bestRoi.paid_price) / bestRoi.paid_price) * 100).toFixed(0)}% ROI
              </div>
            </div>
          )}
          {mostExpensive && (
            <div className="card card-glow" style={{ background: 'linear-gradient(135deg,rgba(245,158,11,0.08),transparent)' }}>
              <div className="stat-label" style={{ marginBottom: '0.5rem' }}>💎 Crown Jewel</div>
              <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {mostExpensive.comics?.title} {mostExpensive.comics?.issue_number}
              </div>
              <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 800, color: 'var(--gold)', fontSize: '1.2rem', marginTop: '0.25rem' }}>
                £{Number(mostExpensive.current_value).toLocaleString()}
              </div>
            </div>
          )}
          {mostUndervalued && (
            <div className="card" style={{ borderColor: 'rgba(239,68,68,0.2)', background: 'linear-gradient(135deg,rgba(239,68,68,0.06),transparent)' }}>
              <div className="stat-label" style={{ marginBottom: '0.5rem' }}>⚠️ Under Market</div>
              <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {mostUndervalued.comics?.title} {mostUndervalued.comics?.issue_number}
              </div>
              <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 800, color: 'var(--red)', fontSize: '1.2rem', marginTop: '0.25rem' }}>
                -£{(mostUndervalued.paid_price - mostUndervalued.current_value).toLocaleString()}
              </div>
            </div>
          )}
          {stats.total > 0 && (
            <div className="card" style={{ background: 'linear-gradient(135deg,rgba(139,92,246,0.08),transparent)' }}>
              <div className="stat-label" style={{ marginBottom: '0.5rem' }}>📖 Reading Progress</div>
              <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 800, fontSize: '1.4rem', color: 'var(--purple-light)' }}>
                {totalRead} / {stats.total}
              </div>
              <div style={{ height: 4, background: 'var(--bg3)', borderRadius: 2, overflow: 'hidden', marginTop: '0.4rem' }}>
                <div style={{ height: '100%', borderRadius: 2, background: 'var(--purple)', width: `${stats.total ? (totalRead / stats.total) * 100 : 0}%`, transition: 'width 0.6s ease' }} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Top 5 by value */}
      {top5.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <div className="section-header" style={{ marginBottom: '0.85rem' }}>
            <h2 className="section-title">Top 5 by Value</h2>
          </div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {top5.map((c, i) => {
              const comicRoi = c.paid_price > 0 ? (Number(c.paid_price) > 0 ? (((Number(c.current_value) - Number(c.paid_price)) / Number(c.paid_price)) * 100) : 0).toFixed(0) : null
              return (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.9rem 1.25rem', borderBottom: i < 4 ? '1px solid var(--border)' : 'none', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(139,92,246,0.05)'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}>
                  <div style={{ fontFamily: 'var(--font-ui)', width: 24, fontWeight: 800, color: i === 0 ? 'var(--gold)' : 'var(--muted)', fontSize: '0.85rem', flexShrink: 0 }}>#{i + 1}</div>
                  {c.comics?.cover_url
                    ? <img loading="lazy" src={c.comics.cover_url} alt="" style={{ width: 34, height: 48, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} />
                    : <div style={{ width: 34, height: 48, background: 'var(--bg3)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>🦸</div>}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.comics?.title} {c.comics?.issue_number}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{c.comics?.publisher}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 800, color: 'var(--gold)', fontSize: '0.95rem' }}>£{Number(c.current_value).toLocaleString()}</div>
                    {comicRoi !== null && (
                      <div style={{ fontSize: '0.73rem', color: Number(comicRoi) >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 700, fontFamily: 'var(--font-ui)' }}>
                        {Number(comicRoi) >= 0 ? '↑' : '↓'} {comicRoi}%
                      </div>
                    )}
                    <a href={buildEbayUrl(c.comics?.title, c.comics?.issue_number, c.grade)}
                      target="_blank" rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      style={{ fontSize: '0.68rem', color: 'var(--muted)', textDecoration: 'none', fontFamily: 'var(--font-ui)' }}
                    ><IconEbay size={11} /> eBay</a>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Completed sets */}
      {!loading && series.filter(s => s.total && s.owned >= s.total).length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <div className="section-header" style={{ marginBottom: '0.85rem' }}>
            <h2 className="section-title">Complete Sets 🏆</h2>
            <button className="btn btn-outline btn-sm" onClick={() => setPage('series')}>View All Series</button>
          </div>
          <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
            {series.filter(s => s.total && s.owned >= s.total).slice(0, 4).map(s => (
              <div key={s.volume_id} className="card card-glow"
                style={{ flex: '1 1 180px', minWidth: 160, borderColor: 'rgba(16,185,129,0.4)', background: 'linear-gradient(135deg,rgba(16,185,129,0.06),transparent)' }}>
                <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: '1.5rem', flexShrink: 0 }}>✅</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                    <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.72rem', color: 'var(--green)', fontWeight: 700 }}>{s.owned} / {s.total} issues</div>
                    <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.72rem', color: 'var(--gold)', fontWeight: 700, marginTop: '0.2rem' }}>
                      £{s.issues.reduce((sum, c) => sum + Number(c.current_value || 0), 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent additions */}
      <div>
        <div className="section-header" style={{ marginBottom: '1rem' }}>
          <h2 className="section-title">Recent Additions</h2>
          {collection.length > 0 && (
            <button className="btn btn-outline btn-sm" onClick={() => setPage('collection')}>View All</button>
          )}
        </div>
        {loading ? (
          <div className="comics-grid">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : recent.length === 0 ? (
          <div className="card empty-state">
            <div className="empty-icon">📚</div>
            <div className="empty-title">The Vault is Empty</div>
            <div className="empty-body">Your collection awaits. Start adding comics to build your vault.</div>
            <button className="btn btn-primary btn-lg" onClick={() => setPage('add')}><IconAdd size={14} /> Add Your First Comic</button>
          </div>
        ) : (
          <div className="comics-grid">
            {recent.map(c => (
              <div key={c.id} className="comic-card" onClick={() => setPage('collection')}>
                {c.comics?.cover_url
                  ? <img loading="lazy" src={c.comics.cover_url} alt={c.comics?.title} className="comic-cover" />
                  : <div className="comic-cover-placeholder">🦸</div>}
                <div className="comic-info">
                  <span className={`grade-badge ${GRADE_CLASS[c.grade] || 'grade-gd'}`}>{c.grade}</span>
                  <div className="comic-title">{c.comics?.title}</div>
                  <div className="comic-meta">{c.comics?.publisher} · {c.comics?.issue_number}</div>
                  <div className="comic-value">£{Number(c.current_value).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
