import React from 'react'

export default function StorySummary({ text }) {
  const [expanded, setExpanded] = React.useState(false)
  const LIMIT = 220
  const short  = text.length > LIMIT
  const shown  = expanded ? text : text.slice(0, LIMIT) + (short ? '…' : '')

  return (
    <div style={{ fontSize:'0.8rem', color:'var(--muted)', lineHeight:1.6 }}>
      {shown}
      {short && (
        <button
          onClick={() => setExpanded(e => !e)}
          style={{ background:'none', border:'none', color:'var(--purple-light)', cursor:'pointer', fontSize:'0.78rem', fontFamily:'var(--font-ui)', fontWeight:600, padding:'0 0 0 4px' }}
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}
    </div>
  )
}
