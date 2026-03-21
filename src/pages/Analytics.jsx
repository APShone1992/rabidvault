import { useEffect, useRef, useState } from 'react'
import { useCollection } from '../context/CollectionContext'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useAchievements } from '../context/AchievementsContext'
import {
  Chart,
  LineController, LineElement, PointElement,
  BarController, BarElement,
  DoughnutController, ArcElement,
  PolarAreaController, RadialLinearScale,
  CategoryScale, LinearScale,
  Tooltip, Legend, Filler,
} from 'chart.js'

Chart.register(
  LineController, LineElement, PointElement,
  BarController, BarElement,
  DoughnutController, ArcElement,
  PolarAreaController, RadialLinearScale,
  CategoryScale, LinearScale,
  Tooltip, Legend, Filler
)

export default function Analytics() {
  const { collection, stats, loading } = useCollection()
  const { xp, level, xpProgress, xpInLevel } = useAchievements()

  const lineRef     = useRef(); const lineInst     = useRef()
  const pieRef      = useRef(); const pieInst      = useRef()
  const barRef      = useRef(); const barInst      = useRef()
  const pubRef      = useRef(); const pubInst      = useRef()
  const trendRef    = useRef(); const trendInst    = useRef()
  const [snapshots, setSnapshots] = useState([])
  const { user } = useAuth()

  // Fetch weekly value snapshots for the trend chart
  useEffect(() => {
    if (!user) return
    supabase
      .from('value_snapshots')
      .select('total_value, total_spent, recorded_at')
      .eq('user_id', user.id)
      .order('recorded_at', { ascending: true })
      .limit(52)
      .then(({ data }) => setSnapshots(data || []))
      .catch(() => {})
  }, [user])

  const roi = stats.totalSpent > 0
    ? (((stats.totalValue - stats.totalSpent) / stats.totalSpent) * 100).toFixed(1)
    : '0'

  const pubMap = {}
  collection.forEach(c => {
    const p = c.comics?.publisher || 'Unknown'
    pubMap[p] = (pubMap[p] || 0) + Number(c.current_value || 0)
  })
  const pubEntries = Object.entries(pubMap).sort((a, b) => b[1] - a[1]).slice(0, 6)

  const gradeMap = {}
  collection.forEach(c => { gradeMap[c.grade] = (gradeMap[c.grade] || 0) + 1 })

  const top5 = [...collection].sort((a, b) => Number(b.current_value) - Number(a.current_value)).slice(0, 5)

  useEffect(() => {
    if (loading) return

    const byMonth = {}
    let running = 0
    const sorted = [...collection].sort((a, b) => new Date(a.added_at) - new Date(b.added_at))
    sorted.forEach(c => {
      const m = new Date(c.added_at).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })
      running += Number(c.current_value || 0)
      byMonth[m] = running
    })
    const months = Object.keys(byMonth).slice(-8)
    const values = months.map(m => byMonth[m])

    lineInst.current?.destroy()
    // Weekly value trend from real snapshots
    if (trendRef.current && snapshots.length > 1) {
      if (trendInst.current) trendInst.current.destroy()
      const labels = snapshots.map(s => new Date(s.recorded_at).toLocaleDateString('en-GB', { day:'numeric', month:'short' }))
      const values = snapshots.map(s => Number(s.total_value || 0))
      const spent  = snapshots.map(s => Number(s.total_spent || 0))
      trendInst.current = new Chart(trendRef.current, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Collection Value',
              data: values,
              borderColor: 'rgba(139,92,246,0.9)',
              backgroundColor: 'rgba(139,92,246,0.1)',
              fill: true, tension: 0.4, pointRadius: 3,
            },
            {
              label: 'Total Spent',
              data: spent,
              borderColor: 'rgba(107,114,128,0.6)',
              backgroundColor: 'transparent',
              fill: false, tension: 0.4, pointRadius: 2,
              borderDash: [4, 4],
            },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: true, labels: { color: '#ede9ff', font: { size: 11 } } }, tooltip: { callbacks: { label: ctx => `£${Number(ctx.raw || 0).toLocaleString()}` } } },
          scales: {
            x: { ticks: { color: '#7c7a8e', font: { size: 10 }, maxTicksLimit: 8 }, grid: { color: 'rgba(255,255,255,0.05)' } },
            y: { ticks: { color: '#7c7a8e', font: { size: 10 }, callback: v => `£${Number(v||0).toLocaleString()}` }, grid: { color: 'rgba(255,255,255,0.05)' } },
          },
        },
      })
    }

    if (lineRef.current && months.length > 0) {
      lineInst.current = new Chart(lineRef.current, {
        type: 'line',
        data: { labels: months, datasets: [{ data: values, borderColor: '#8b5cf6', backgroundColor: 'rgba(139,92,246,0.08)', borderWidth: 2, pointBackgroundColor: '#8b5cf6', pointRadius: 4, tension: 0.4, fill: true }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#7c7a8e', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' } }, y: { ticks: { color: '#7c7a8e', font: { size: 10 }, callback: v => `£${Math.round(v / 1000)}k` }, grid: { color: 'rgba(255,255,255,0.04)' } } } },
      })
    }

    const GRADE_COLORS = { Mint: '#10b981', 'Near Mint': '#8b5cf6', 'Very Fine': '#3b82f6', Fine: '#f59e0b', Good: '#6b7280', Fair: '#b45309', Poor: '#b91c1c' }
    pieInst.current?.destroy()
    if (pieRef.current && Object.keys(gradeMap).length > 0) {
      pieInst.current = new Chart(pieRef.current, {
        type: 'doughnut',
        data: { labels: Object.keys(gradeMap), datasets: [{ data: Object.values(gradeMap), backgroundColor: Object.keys(gradeMap).map(g => GRADE_COLORS[g] || '#6b7280'), borderWidth: 0 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, cutout: '65%' },
      })
    }

    barInst.current?.destroy()
    if (barRef.current && top5.length > 0) {
      barInst.current = new Chart(barRef.current, {
        type: 'bar',
        data: {
          labels: top5.map(c => `${(c.comics?.title || '').substring(0, 14)} ${c.comics?.issue_number || ''}`),
          datasets: [
            { label: 'Paid', data: top5.map(c => Number(c.paid_price || 0)), backgroundColor: 'rgba(107,114,128,0.5)', borderRadius: 4 },
            { label: 'Value', data: top5.map(c => Number(c.current_value || 0)), backgroundColor: 'rgba(139,92,246,0.75)', borderRadius: 4 },
          ],
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#7c7a8e', font: { size: 9 }, maxRotation: 30 }, grid: { display: false } }, y: { ticks: { color: '#7c7a8e', font: { size: 9 }, callback: v => `£${Number(v || 0).toLocaleString()}` }, grid: { color: 'rgba(255,255,255,0.04)' } } } },
      })
    }

    pubInst.current?.destroy()
    if (pubRef.current && pubEntries.length > 0) {
      pubInst.current = new Chart(pubRef.current, {
        type: 'polarArea',
        data: {
          labels: pubEntries.map(([k]) => k),
          datasets: [{ data: pubEntries.map(([, v]) => v), backgroundColor: ['rgba(139,92,246,0.7)','rgba(59,130,246,0.7)','rgba(16,185,129,0.7)','rgba(245,158,11,0.7)','rgba(239,68,68,0.7)','rgba(107,114,128,0.7)'], borderWidth: 0 }],
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { r: { ticks: { display: false }, grid: { color: 'rgba(255,255,255,0.05)' } } } },
      })
    }

    return () => { lineInst.current?.destroy(); pieInst.current?.destroy(); barInst.current?.destroy(); pubInst.current?.destroy() }
  }, [collection, loading, snapshots])

  if (loading) return (
    <div className="page-enter">
      <h1 className="section-title" style={{ marginBottom: '1.5rem' }}>Analytics</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 12 }} />)}
      </div>
      <div className="skeleton" style={{ height: 240, borderRadius: 12 }} />
    </div>
  )

  if (!collection || collection.length === 0) return (
    <div className="page-enter">
      <h1 className="section-title" style={{ marginBottom: '1.5rem' }}>Analytics</h1>
      <div className="card empty-state">
        <div className="empty-icon">📊</div>
        <div className="empty-title">No data yet</div>
        <div className="empty-body">Add comics to your collection to see value charts and analytics here.</div>
      </div>
    </div>
  )

  return (
    <div className="page-enter">
      <h1 className="section-title" style={{ marginBottom: '1.5rem' }}>Analytics</h1>

      {/* XP bar */}
      <div className="card card-glow" style={{ marginBottom: '1.5rem', background: 'linear-gradient(120deg,#16003a,#1a1a2e)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', letterSpacing: '0.08em' }}>Level {level} Collector</div>
          <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, color: 'var(--purple-light)', fontSize: '0.9rem' }}>{Number(xp || 0).toLocaleString()} XP</div>
        </div>
        <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${xpProgress}%`, background: 'linear-gradient(90deg,var(--purple),var(--purple-light))', borderRadius: 4, transition: 'width 0.6s ease' }} />
        </div>
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.72rem', color: 'var(--muted)', marginTop: '0.4rem' }}>
          {(1000 - xpInLevel).toLocaleString()} XP to Level {level + 1}
        </div>
      </div>

      {/* Stats row */}
      <div className="stats-row" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-label">Total ROI</div>
          <div className="stat-value" style={{ color: Number(roi) >= 0 ? 'var(--green)' : 'var(--red)', fontSize: '1.6rem' }}>
            {Number(roi) >= 0 ? '+' : ''}{roi}%
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Gain / Loss</div>
          <div className="stat-value" style={{ color: stats.totalValue >= stats.totalSpent ? 'var(--green)' : 'var(--red)', fontSize: '1.5rem' }}>
            {stats.totalValue >= stats.totalSpent ? '+' : ''}£{Math.abs(stats.totalValue - stats.totalSpent).toLocaleString()}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg Value</div>
          <div className="stat-value" style={{ fontSize: '1.5rem' }}>
            £{stats.total ? Math.round(stats.totalValue / stats.total).toLocaleString() : 0}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Publishers</div>
          <div className="stat-value">{stats.publishers}</div>
        </div>
      </div>

      {/* Weekly value trend — only shows when snapshots exist */}
      {snapshots.length > 1 && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, letterSpacing: '0.04em', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Value trend — last {snapshots.length} weeks</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 400 }}>
              {snapshots.length < 4 ? 'Updates weekly — check back for your trend' : ''}
            </span>
          </div>
          <div style={{ position: 'relative', height: 180 }}><canvas ref={trendRef} /></div>
        </div>
      )}

      {/* Charts grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div className="card">
          <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, letterSpacing: '0.04em', marginBottom: '1rem' }}>Collection value over time</div>
          <div style={{ position: 'relative', height: 210 }}><canvas ref={lineRef} /></div>
        </div>
        <div className="card">
          <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, letterSpacing: '0.04em', marginBottom: '1rem' }}>Grade breakdown</div>
          <div style={{ position: 'relative', height: 140 }}><canvas ref={pieRef} /></div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '10px' }}>
            {Object.entries(gradeMap).map(([g, n]) => (
              <span key={g} style={{ fontFamily: 'var(--font-ui)', fontSize: '0.68rem', background: 'var(--bg3)', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>{g}: {n}</span>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card">
          <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, letterSpacing: '0.04em', marginBottom: '1rem' }}>Top 5 — paid vs value</div>
          <div style={{ position: 'relative', height: 190 }}><canvas ref={barRef} /></div>
          <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
            {[['Paid','rgba(107,114,128,0.5)'],['Value','rgba(139,92,246,0.75)']].map(([l,bg]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-ui)', fontSize: '0.72rem', color: 'var(--muted)' }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: bg, display: 'inline-block' }} />{l}
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, letterSpacing: '0.04em', marginBottom: '1rem' }}>By publisher</div>
          <div style={{ position: 'relative', height: 190 }}><canvas ref={pubRef} /></div>
        </div>
      </div>

      {/* Publisher bars */}
      {pubEntries.length > 0 && (
        <div className="card">
          <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, letterSpacing: '0.04em', marginBottom: '1rem' }}>Publisher breakdown</div>
          {pubEntries.map(([pub, val], i) => (
            <div key={pub} style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.85rem' }}>
              <div style={{ fontFamily: 'var(--font-ui)', width: 90, fontSize: '0.82rem', fontWeight: 600, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pub}</div>
              <div style={{ flex: 1, height: 8, background: 'var(--bg3)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 4, transition: 'width 0.6s ease', width: `${(val / pubEntries[0][1] * 100).toFixed(0)}%`, background: ['#8b5cf6','#3b82f6','#10b981','#f59e0b','#ef4444','#6b7280'][i] }} />
              </div>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.85rem', fontWeight: 700, color: 'var(--gold)', width: 80, textAlign: 'right', flexShrink: 0 }}>
                £{Number(val || 0).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
