import { useEffect, useRef, useState } from 'react'
import { useCollection } from '../context/CollectionContext'
import { getPriceHistory, buildEbayUrl, buildEbayActiveUrl } from '../lib/comicvine'
import { IconEbay, IconSearch } from '../lib/icons'
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

const GRADE_CLASS = { Mint:'grade-mint','Near Mint':'grade-nm','Very Fine':'grade-vf',Fine:'grade-fn',Good:'grade-gd',Fair:'grade-fair',Poor:'grade-poor' }

export default function Market() {
  const { collection, loading } = useCollection()
  const [selected, setSelected] = useState(null)
  const [history,  setHistory]  = useState([])
  const [histLoading, setHistLoading] = useState(false)
  const chartRef  = useRef()
  const chartInst = useRef()

  // Load price history when comic selected
  useEffect(() => {
    if (!selected) return
    setHistLoading(true)
    getPriceHistory(selected.comic_id)
      .then(setHistory)
      .finally(() => setHistLoading(false))
  }, [selected])

  // Draw chart
  useEffect(() => {
    if (!chartRef.current || !history.length) return
    chartInst.current?.destroy()
    const labels = history.map(p => new Date(p.recorded_at).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }))
    const prices = history.map(p => Number(p.price))
    chartInst.current = new Chart(chartRef.current, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          data: prices,
          borderColor: '#8b5cf6',
          backgroundColor: 'rgba(139,92,246,0.08)',
          borderWidth: 2,
          pointBackgroundColor: '#8b5cf6',
          pointRadius: 3,
          tension: 0.4,
          fill: true,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: '#7c7a8e', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
          y: { ticks: { color: '#7c7a8e', font: { size: 10 }, callback: v => '£' + Number(v || 0).toLocaleString() }, grid: { color: 'rgba(255,255,255,0.04)' } },
        },
      },
    })
    return () => chartInst.current?.destroy()
  }, [history])

  const sorted = [...collection].sort((a, b) => Number(b.current_value) - Number(a.current_value))

  if (!loading && (!collection || collection.length === 0)) return (
    <div className="page-enter">
      <h1 className="section-title" style={{ marginBottom: '1.5rem' }}>Market Prices</h1>
      <div className="card empty-state">
        <div className="empty-icon">📈</div>
        <div className="empty-title">No comics to value</div>
        <div className="empty-body">Add comics to your collection to track their market value and eBay prices here.</div>
      </div>
    </div>
  )

  if (loading) return (
    <div className="page-enter">
      <div className="section-header" style={{ marginBottom: '1.5rem' }}>
        <h1 className="section-title">Market Prices</h1>
      </div>
      <div style={{ display: 'grid', gap: '0.5rem' }}>
        {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 60, borderRadius: 10 }} />)}
      </div>
    </div>
  )

  return (
    <div className="page-enter">
      <div className="section-header" style={{ marginBottom: '0.5rem' }}>
        <h1 className="section-title">Market Prices</h1>
      </div>
      <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1.5rem', fontStyle: 'italic' }}>
        Select any comic to view its price history chart and search live eBay prices.
      </p>

      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
        {/* Table */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr>
                  {['', 'Comic', 'Publisher', 'Grade', 'Value', 'ROI'].map((h, i) => (
                    <th key={i}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
                    Add comics to your collection to see them here
                  </td></tr>
                ) : sorted.map(c => {
                  const roi = c.paid_price ? ((c.current_value - c.paid_price) / c.paid_price * 100).toFixed(1) : null
                  return (
                    <tr key={c.id} onClick={() => setSelected(c)}
                      style={{ background: selected?.id === c.id ? 'rgba(139,92,246,0.08)' : '' }}>
                      <td style={{ padding: '0.75rem 0.75rem 0.75rem 1rem', width: 50 }}>
                        {c.comics?.cover_url
                          ? <img loading="lazy" src={c.comics.cover_url} alt="" style={{ width: 30, height: 42, objectFit: 'cover', borderRadius: 4 }} />
                          : <div style={{ width: 30, height: 42, background: 'var(--bg3)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>🦸</div>}
                      </td>
                      <td style={{ fontWeight: 700, fontSize: '0.88rem' }}>{c.comics?.title} {c.comics?.issue_number}</td>
                      <td style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>{c.comics?.publisher}</td>
                      <td><span className={`grade-badge ${GRADE_CLASS[c.grade] || 'grade-gd'}`}>{c.grade}</span></td>
                      <td style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, color: 'var(--gold)' }}>£{Number(c.current_value).toLocaleString()}</td>
                      <td style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: '0.85rem', color: roi !== null ? (roi >= 0 ? 'var(--green)' : 'var(--red)') : 'var(--muted)' }}>
                        {roi !== null ? `${roi >= 0 ? '+' : ''}${roi}%` : '–'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail panel */}
        {selected && (
          <div style={{ width: 290, flexShrink: 0 }}>
            <div className="card card-glow" style={{ position: 'sticky', top: '1rem' }}>
              {selected.comics?.cover_url && (
                <img loading="lazy" src={selected.comics.cover_url} alt=""
                  style={{ width: '100%', borderRadius: 10, marginBottom: '1rem', objectFit: 'cover', maxHeight: 200 }} />
              )}
              <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: '1rem', marginBottom: '0.2rem' }}>
                {selected.comics?.title} {selected.comics?.issue_number}
              </div>
              <div style={{ color: 'var(--muted)', fontSize: '0.82rem', marginBottom: '1.1rem' }}>
                {selected.comics?.publisher}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', marginBottom: '1rem' }}>
                <div className="stat-card" style={{ padding: '0.75rem' }}>
                  <div className="stat-label">Paid</div>
                  <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: '1.1rem' }}>£{Number(selected.paid_price).toLocaleString()}</div>
                </div>
                <div className="stat-card" style={{ padding: '0.75rem' }}>
                  <div className="stat-label">Value</div>
                  <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--gold)' }}>£{Number(selected.current_value).toLocaleString()}</div>
                </div>
              </div>

              {/* eBay buttons */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.1rem' }}>
                <a href={buildEbayUrl(selected.comics?.title, selected.comics?.issue_number, selected.grade)}
                  target="_blank" rel="noopener noreferrer"
                  className="btn btn-outline btn-sm btn-full"
                  style={{ textDecoration: 'none', fontSize: '0.75rem' }}>
                  🛒 Sold Prices
                </a>
                <a href={buildEbayActiveUrl(selected.comics?.title, selected.comics?.issue_number, selected.grade)}
                  target="_blank" rel="noopener noreferrer"
                  className="btn btn-outline btn-sm btn-full"
                  style={{ textDecoration: 'none', fontSize: '0.75rem' }}>
                  🔍 Live Listings
                </a>
              </div>

              {/* Price history chart */}
              <div className="stat-label" style={{ marginBottom: '0.6rem' }}>Price History</div>
              {histLoading ? (
                <div className="skeleton" style={{ height: 130, borderRadius: 8 }} />
              ) : history.length > 1 ? (
                <div style={{ position: 'relative', height: 140 }}>
                  <canvas ref={chartRef} />
                </div>
              ) : (
                <div style={{ padding: '1.25rem', background: 'var(--bg3)', borderRadius: 8, textAlign: 'center', color: 'var(--muted)', fontSize: '0.8rem' }}>
                  Update the value in Collection to start building price history
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
