// useExport.js — Export collection as CSV or PDF
// PDF uses browser's built-in print dialog (no library needed)
// CSV is pure JS

import { useCollection } from '../context/CollectionContext'
import { useAuth }       from '../context/AuthContext'

export function useExport() {
  const { collection, stats } = useCollection()
  const { profile }           = useAuth()

  // ── CSV export ────────────────────────────────────────────────
  function exportCSV() {
    const headers = [
      'Title', 'Issue', 'Publisher', 'Grade',
      'Price Paid (£)', 'Current Value (£)', 'ROI (%)', 'Notes', 'Date Added'
    ]

    const rows = collection.map(c => {
      const roi = c.paid_price > 0
        ? (((c.current_value - c.paid_price) / c.paid_price) * 100).toFixed(1)
        : ''
      return [
        `"${(c.comics?.title        || '').replace(/"/g, '""')}"`,
        `"${(c.comics?.issue_number || '').replace(/"/g, '""')}"`,
        `"${(c.comics?.publisher    || '').replace(/"/g, '""')}"`,
        `"${(c.grade                || '').replace(/"/g, '""')}"`,
        Number(c.paid_price    || 0).toFixed(2),
        Number(c.current_value || 0).toFixed(2),
        roi,
        `"${(c.notes || '').replace(/"/g, '""')}"`,
        new Date(c.added_at).toLocaleDateString('en-GB'),
      ].join(',')
    })

    const csv     = [headers.join(','), ...rows].join('\n')
    const blob    = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url     = URL.createObjectURL(blob)
    const link    = document.createElement('a')
    link.href     = url
    link.download = `rabidvault-${profile?.username || 'collection'}-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  // ── PDF export (uses browser print) ──────────────────────────
  function exportPDF() {
    const roi = stats.totalSpent > 0
      ? (((stats.totalValue - stats.totalSpent) / stats.totalSpent) * 100).toFixed(1)
      : '0'

    const rows = [...collection]
      .sort((a, b) => Number(b.current_value) - Number(a.current_value))
      .map((c, i) => {
        const comicRoi = c.paid_price > 0
          ? (((c.current_value - c.paid_price) / c.paid_price) * 100).toFixed(0)
          : '—'
        const roiColor = Number(comicRoi) >= 0 ? '#10b981' : '#ef4444'
        return `
          <tr style="border-bottom:1px solid #e5e7eb">
            <td style="padding:8px 6px;font-size:12px">${i + 1}</td>
            <td style="padding:8px 6px">
              <div style="font-weight:600;font-size:13px">${c.comics?.title || '—'}</div>
              <div style="color:#6b7280;font-size:11px">${c.comics?.publisher || ''} ${c.comics?.issue_number || ''}</div>
            </td>
            <td style="padding:8px 6px;font-size:12px">${c.grade || '—'}</td>
            <td style="padding:8px 6px;font-size:12px;text-align:right">£${Number(c.paid_price || 0).toLocaleString()}</td>
            <td style="padding:8px 6px;font-size:13px;font-weight:bold;text-align:right;color:#8b5cf6">£${Number(c.current_value || 0).toLocaleString()}</td>
            <td style="padding:8px 6px;font-size:12px;font-weight:bold;text-align:right;color:${roiColor}">${comicRoi !== '—' ? `${Number(comicRoi) >= 0 ? '+' : ''}${comicRoi}%` : '—'}</td>
          </tr>`
      }).join('')

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>The Rabid Vault — ${profile?.username || 'Collection'}</title>
        <style>
          body { font-family: -apple-system, sans-serif; color: #111; margin: 32px; }
          h1   { font-size: 28px; color: #8b5cf6; margin-bottom: 4px; }
          .meta { color: #6b7280; font-size: 13px; margin-bottom: 24px; }
          .stats { display: flex; gap: 32px; background: #f9fafb; border-radius: 10px; padding: 16px 20px; margin-bottom: 28px; }
          .stat-label { font-size: 10px; text-transform: uppercase; letter-spacing: .08em; color: #6b7280; margin-bottom: 2px; }
          .stat-value { font-size: 20px; font-weight: 700; }
          table { width: 100%; border-collapse: collapse; }
          thead tr { background: #f3f4f6; }
          th { padding: 10px 6px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .06em; color: #6b7280; }
          @media print { body { margin: 16px } }
        </style>
      </head>
      <body>
        <h1>🦝 The Rabid Vault</h1>
        <div class="meta">
          ${profile?.username || 'Collection'} · Exported ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
        <div class="stats">
          <div><div class="stat-label">Total Comics</div><div class="stat-value">${stats.total}</div></div>
          <div><div class="stat-label">Collection Value</div><div class="stat-value" style="color:#8b5cf6">£${stats.totalValue.toLocaleString()}</div></div>
          <div><div class="stat-label">Total Spent</div><div class="stat-value">£${stats.totalSpent.toLocaleString()}</div></div>
          <div><div class="stat-label">ROI</div><div class="stat-value" style="color:${Number(roi) >= 0 ? '#10b981' : '#ef4444'}">${Number(roi) >= 0 ? '+' : ''}${roi}%</div></div>
          <div><div class="stat-label">Publishers</div><div class="stat-value">${stats.publishers}</div></div>
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th><th>Comic</th><th>Grade</th>
              <th style="text-align:right">Paid</th>
              <th style="text-align:right">Value</th>
              <th style="text-align:right">ROI</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div style="margin-top:24px;font-size:11px;color:#9ca3af;text-align:center">
          Generated by The Rabid Vault · ${new Date().toISOString()}
        </div>
      </body>
      </html>`

    const win = window.open('', '_blank')
    win.document.write(html)
    win.document.close()
    win.focus()
    setTimeout(() => win.print(), 500)
  }

  return { exportCSV, exportPDF }
}
