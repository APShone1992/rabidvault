import './Onboarding.css'
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const STEPS = [
  {
    icon: '📚',
    title: 'Add your first comic',
    body: 'Scan a cover with AI, scan a barcode, or search ComicVine. Your comics sync across all your devices automatically.',
    action: 'add',
    cta: '➕ Add Your First Comic',
  },
  {
    icon: '💰',
    title: 'Track what it's worth',
    body: 'Set the price you paid and the current market value. The vault tracks your ROI and records a weekly snapshot so you can see the trend over time.',
    action: 'analytics',
    cta: '📊 See Analytics',
  },
  {
    icon: '📖',
    title: 'Reading order',
    body: 'Once you've added a series, the Reading Order tab shows every issue in sequence. Tick them off as you go — perfect for long runs.',
    action: 'reading',
    cta: '📖 Reading Order',
  },
  {
    icon: '⭐',
    title: 'Hunt list with price alerts',
    body: 'Add comics you're hunting to your Wishlist. Set a target price and get an in-app alert the moment a comic drops to your budget.',
    action: 'wishlist',
    cta: '⭐ Open Wishlist',
  },
  {
    icon: '🤝',
    title: 'Connect with collectors',
    body: 'Find other collectors, compare vaults side by side, and see what your friends are reading and chasing.',
    action: 'friends',
    cta: '🤝 Find Collectors',
  },
]

export default function Onboarding({ setPage, onDismiss }) {
  const { user } = useAuth()
  const [loadingDemo, setLoadingDemo] = useState(false)
  async function loadDemoCollection() {
    if (!user) return
    setLoadingDemo(true)
    try {
      // Check if a demo comic already exists with this title
      const { data: existing } = await supabase
        .from('collection')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)
      if (existing?.length > 0) { onDismiss(); setPage('dashboard'); return }

      // Insert iconic comics into the comics table (upsert to avoid duplicates)
      const DEMO_COMICS = [
        { title: 'Amazing Fantasy', issue_number: '#15', publisher: 'Marvel Comics', cover_url: 'https://comicvine.gamespot.com/a/uploads/scale_large/6/67663/3031520-amazing-fantasy-15.jpg' },
        { title: 'The Amazing Spider-Man', issue_number: '#300', publisher: 'Marvel Comics', cover_url: 'https://comicvine.gamespot.com/a/uploads/scale_large/6/67663/3031651-3031520-amazing-fantasy-15.jpg' },
        { title: 'Batman', issue_number: '#1', publisher: 'DC Comics', cover_url: '' },
        { title: 'X-Men', issue_number: '#1', publisher: 'Marvel Comics', cover_url: '' },
        { title: 'The Incredible Hulk', issue_number: '#181', publisher: 'Marvel Comics', cover_url: '' },
      ]

      // Insert comics and collection entries
      for (const [i, comic] of DEMO_COMICS.entries()) {
        // Upsert into comics
        const { data: comicRow } = await supabase
          .from('comics')
          .upsert({ ...comic, comicvine_id: null }, { onConflict: 'title,issue_number', ignoreDuplicates: false })
          .select('id')
          .maybeSingle()

        // Find the comic id
        const { data: found } = await supabase
          .from('comics')
          .select('id')
          .eq('title', comic.title)
          .eq('issue_number', comic.issue_number)
          .maybeSingle()

        const comicId = comicRow?.id || found?.id
        if (!comicId) continue

        const paid    = [150, 85, 200, 60, 95][i]
        const current = [280, 120, 350, 90, 180][i]

        await supabase.from('collection').insert({
          user_id: user.id, comic_id: comicId,
          grade: ['Very Fine', 'Near Mint', 'Fine', 'Very Fine', 'Good'][i],
          paid_price: paid, current_value: current, notes: 'Demo item',
        })
      }

      window.dispatchEvent(new Event('rv-collection-refresh'))
      onDismiss()
      setPage('dashboard')
    } catch (err) {
      console.warn('[demo]', err?.message)
    } finally {
      setLoadingDemo(false)
    }
  }

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-modal">
        <button className="onboarding-close" onClick={onDismiss}>✕</button>

        <div className="onboarding-header">
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🦝</div>
          <h2 className="onboarding-title">Welcome to The Rabid Vault</h2>
          <p className="onboarding-sub">Your vault is empty. Here's how to get started.</p>
        </div>

        <div className="onboarding-steps">
          {STEPS.map((step, i) => (
            <div key={i} className="onboarding-step">
              <div className="onboarding-step-num">{i + 1}</div>
              <div className="onboarding-step-icon">{step.icon}</div>
              <div className="onboarding-step-body">
                <div className="onboarding-step-title">{step.title}</div>
                <div className="onboarding-step-text">{step.body}</div>
                {step.action && (
                  <button
                    className="btn btn-outline btn-sm"
                    style={{ marginTop: '0.6rem', fontSize: '0.78rem' }}
                    onClick={() => { setPage(step.action); onDismiss() }}
                  >
                    {step.cta}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="onboarding-actions">
          <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => { setPage('add'); onDismiss() }}>
            ➕ Add My First Comic
          </button>
          <button className="btn btn-ghost btn-sm" style={{ marginTop: '0.75rem', width: '100%', justifyContent: 'center' }}
            onClick={loadDemoCollection} disabled={loadingDemo}>
            {loadingDemo ? '⏳ Loading demo...' : '🦸 Load 5 demo comics to explore'}
          </button>
          <button className="btn btn-ghost btn-sm" style={{ marginTop: '0.5rem', width: '100%', justifyContent: 'center', opacity: 0.6 }}
            onClick={onDismiss}>
            Explore empty vault
          </button>
        </div>
      </div>
    </div>
  )
}
