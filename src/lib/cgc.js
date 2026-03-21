// useCGC.js - CGC/CBCS cert verification

const VERIFY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cgc-verify`
const ANON       = import.meta.env.VITE_SUPABASE_ANON_KEY

export async function verifyCert(certNumber, registry = null) {
  if (!certNumber?.trim()) throw new Error('Please enter a cert number')

  const res = await fetch(VERIFY_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ANON}` },
    body:    JSON.stringify({ certNumber: certNumber.trim(), registry }),
  })

  if (!res.ok) throw new Error(`Verification service error: ${res.status}`)
  return res.json()
}

// CGCVerifier UI component — drop into AddComic or Collection
import { useState } from 'react'

export function CGCVerifier({ onVerified }) {
  const [certNum,   setCertNum]   = useState('')
  const [registry,  setRegistry]  = useState('CGC')
  const [loading,   setLoading]   = useState(false)
  const [result,    setResult]    = useState(null)
  const [error,     setError]     = useState('')

  const handleVerify = async () => {
    if (!certNum.trim()) { setError('Enter a cert number'); return }
    setLoading(true); setError(''); setResult(null)
    try {
      const data = await verifyCert(certNum, registry)
      if (data.found) {
        setResult(data)
        onVerified?.(data)
      } else {
        setError(`No ${registry} record found for cert #${certNum}. Check the number and try again.`)
      }
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div>
      <div style={{ fontWeight: 800, marginBottom: '0.75rem', fontSize: '0.9rem' }}>
        🔏 CGC / CBCS Grade Verification
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
        <select
          className="form-select"
          style={{ width: 'auto' }}
          value={registry}
          onChange={e => setRegistry(e.target.value)}
        >
          <option value="CGC">CGC</option>
          <option value="CBCS">CBCS</option>
        </select>
        <input
          className="form-input"
          style={{ flex: 1, minWidth: 160 }}
          placeholder="Enter cert number e.g. 1234567890"
          value={certNum}
          onChange={e => setCertNum(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleVerify()}
        />
        <button className="btn btn-primary" onClick={handleVerify} disabled={loading}>
          {loading ? 'Checking...' : 'Verify'}
        </button>
      </div>

      {error && (
        <div style={{ color: 'var(--red)', fontSize: '0.82rem', marginBottom: '0.5rem' }}>⚠️ {error}</div>
      )}

      {result && (
        <div style={{
          background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)',
          borderRadius: 10, padding: '1rem', fontSize: '0.85rem',
        }}>
          <div style={{ color: 'var(--green)', fontWeight: 800, marginBottom: '0.6rem' }}>
            ✓ Verified {result.registry} Certificate #{result.certNumber}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            {result.title && <div><div style={{ fontSize: '0.7rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Title</div><div style={{ fontWeight: 700 }}>{result.title}</div></div>}
            {result.issue && <div><div style={{ fontSize: '0.7rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Issue</div><div style={{ fontWeight: 700 }}>{result.issue}</div></div>}
            {result.grade && <div><div style={{ fontSize: '0.7rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Grade</div><div style={{ fontWeight: 800, color: 'var(--purple-light)', fontSize: '1.1rem' }}>{result.grade}</div></div>}
            {result.year  && <div><div style={{ fontSize: '0.7rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Year</div><div style={{ fontWeight: 700 }}>{result.year}</div></div>}
            {result.label && <div><div style={{ fontSize: '0.7rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Label</div><div style={{ fontWeight: 700 }}>{result.label}</div></div>}
            {result.variant && <div><div style={{ fontSize: '0.7rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Variant</div><div style={{ fontWeight: 700 }}>{result.variant}</div></div>}
          </div>
        </div>
      )}
    </div>
  )
}
