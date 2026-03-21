import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function PublicProfile({ username, onBack }) {
  const [profile,    setProfile]    = useState(null)
  const [collection, setCollection] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [notFound,   setNotFound]   = useState(false)

  useEffect(() => {
    async function load() {
    try {
      setLoading(true)
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single()

      if (!prof) { setNotFound(true); setLoading(false); return }
      setProfile(prof)

      const { data: coll } = await supabase
        .from('collection')
        .select('*, comics(title, issue_number, publisher, cover_url, comicvine_id)')
        .eq('user_id', prof.id)
        .order('current_value', { ascending: false })

      setCollection(coll || [])
      setLoading(false)
        } catch (err) {
      setError("Failed to load profile. It may not exist.")
    }
  }
    if (username) load()
  }, [username])

  const totalValue = collection.reduce((s, c) => s + Number(c.current_value || 0), 0)
  const totalSpent = collection.reduce((s, c) => s + Number(c.paid_price || 0), 0)
  const publishers = [...new Set(collection.map(c => c.comics?.publisher).filter(Boolean))].length
  const roi = totalSpent > 0 ? (((totalValue - totalSpent) / totalSpent) * 100).toFixed(1) : null

  if (loading) return (
    <div className="page-enter" style={{ padding: '2rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
        {[...Array(8)].map((_, i) => (
          <div key={i} className="skeleton-card">
            <div className="skeleton" style={{ width: '100%', aspectRatio: '2/3' }} />
            <div style={{ padding: '0.75rem' }}>
              <div className="skeleton" style={{ height: 10, borderRadius: 4, marginBottom: 6 }} />
              <div className="skeleton" style={{ height: 8, borderRadius: 4, width: '60%' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  if (error) return (
    <div className="page-enter" style={{ padding: '2rem', textAlign: 'center' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
      <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem' }}>Profile Not Found</div>
      <div style={{ color: 'var(--muted)' }}>{error}</div>
    </div>
  )

  if (notFound) return (
    <div className="page-enter">
      <button className="btn btn-ghost btn-sm" onClick={onBack} style={{ marginBottom: '1rem' }}>← Back</button>
      <div className="card empty-state">
        <div className="empty-icon">🔍</div>
        <div className="empty-title">Collector not found</div>
        <div className="empty-body">No vault exists for @{username}</div>
      </div>
    </div>
  )

  return (
    <div className="page-enter">
      {onBack && (
        <button className="btn btn-ghost btn-sm" onClick={onBack} style={{ marginBottom: '1.25rem' }}>← Back</button>
      )}

      {/* Profile header */}
      <div className="card card-glow" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg,#16003a,#1a1a2e)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.25rem' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--purple-dark), var(--purple))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.6rem', fontWeight: 800, color: '#fff', flexShrink: 0,
            border: '2px solid var(--border-strong)', overflow: 'hidden',
          }}>
            {profile?.avatar_url
              ? <img loading="lazy" src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : profile?.username?.[0]?.toUpperCase()
            }
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', letterSpacing: '0.1em', lineHeight: 1 }}>
              {profile?.username}
            </div>
            {profile?.bio && (
              <div style={{ color: 'var(--muted)', fontSize: '0.9rem', marginTop: '0.3rem', fontStyle: 'italic' }}>
                {profile.bio}
              </div>
            )}
            <div style={{ fontSize: '0.72rem', color: 'var(--subtle)', fontFamily: 'var(--font-ui)', marginTop: '0.4rem', letterSpacing: '0.06em' }}>
              MEMBER SINCE {new Date(profile?.created_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }).toUpperCase()}
            </div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => navigator.clipboard?.writeText(window.location.href).then(() => {})}
            >
              🔗 Share
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          {[
            { label: 'Comics', value: collection.length },
            { label: 'Vault Value', value: `£${Number(totalValue || 0).toLocaleString()}`, color: 'var(--gold)' },
            { label: 'Publishers', value: publishers },
            { label: 'ROI', value: roi !== null ? `${Number(roi) >= 0 ? '+' : ''}${roi}%` : '–', color: roi !== null ? (Number(roi) >= 0 ? 'var(--green)' : 'var(--red)') : undefined },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div className="stat-label" style={{ textAlign: 'center' }}>{s.label}</div>
              <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 800, fontSize: '1.3rem', color: s.color || 'var(--text)' }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Collection grid */}
      <h2 className="section-title" style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>
        {profile?.username}'s Vault
      </h2>

      {collection.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-icon">📚</div>
          <div className="empty-title">Vault is empty</div>
          <div className="empty-body">This collector hasn't added any comics yet</div>
        </div>
      ) : (
        <div className="comics-grid">
          {collection.map(c => (
            <div key={c.id} className="comic-card">
              {c.comics?.cover_url
                ? <img loading="lazy" src={c.comics.cover_url} alt={c.comics?.title} className="comic-cover" />
                : <div className="comic-cover-placeholder">🦸</div>}
              <div className="comic-info">
                <div className="comic-title">{c.comics?.title}</div>
                <div className="comic-meta">{c.comics?.publisher} · {c.comics?.issue_number}</div>
                <div className="comic-value">£{Number(c.current_value).toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
