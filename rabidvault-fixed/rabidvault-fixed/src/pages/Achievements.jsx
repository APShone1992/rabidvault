import { useMemo } from 'react'
import { useCollection } from '../context/CollectionContext'
import { useWishlist }   from '../hooks/useWishlist'
import { useFriends }    from '../hooks/useFriends'
import { useAchievements } from '../context/AchievementsContext'

// Tier styling driven entirely from DB data
const TIER_COLORS = {
  bronze:   '#cd7f32',
  silver:   '#9ca3af',
  gold:     '#f59e0b',
  platinum: '#a78bfa',
}
const TIER_LABELS = {
  bronze:   'Bronze',
  silver:   'Silver',
  gold:     'Gold',
  platinum: 'Platinum',
}
const LEVEL_TITLES = [
  'Back-Issue Bargain Hunter', 'Spinner Rack Regular',  'Long-Box Explorer',
  'Silver Age Seeker',         'Golden Age Devotee',    'Key Issue Collector',
  'Bronze Archivist',          'First Print Hunter',    'Vault Keeper',
  'Master Collector',          'Legendary Archivist',   'The Vault Overlord',
  'Comic Oracle',              'Grand Curator',         'The Rabid One',
]

// Client-side unlock conditions keyed by achievement ID
// These mirror the DB rows exactly — one place to add a new achievement:
// 1. Add the row to schema_v3.sql
// 2. Add the condition function here
const CONDITIONS = {
  first_comic:    (s)          => s.total >= 1,
  ten_comics:     (s)          => s.total >= 10,
  twenty_five:    (s)          => s.total >= 25,
  fifty_comics:   (s)          => s.total >= 50,
  hundred_comics: (s)          => s.total >= 100,
  value_1k:       (s)          => s.totalValue >= 1000,
  value_10k:      (s)          => s.totalValue >= 10000,
  value_50k:      (s)          => s.totalValue >= 50000,
  roi_100:        (s)          => s.totalSpent > 0 && ((s.totalValue - s.totalSpent) / s.totalSpent) >= 1,
  roi_500:        (s)          => s.totalSpent > 0 && ((s.totalValue - s.totalSpent) / s.totalSpent) >= 5,
  first_friend:   (s, w, f)   => f >= 1,
  five_friends:   (s, w, f)   => f >= 5,
  first_wishlist: (s, w)      => w >= 1,
  first_scan:     (s)          => (s.totalScans || 0) >= 1,
  fifty_scans:    (s)          => (s.totalScans || 0) >= 50,
  publishers_5:   (s)          => s.publishers >= 5,
  complete_run:   (s)          => s.completeSeries >= 1,
  variant_hunter: (s)          => s.variants >= 3,
}

function AchievementCard({ ach, earned }) {
  const tc = TIER_COLORS[ach.tier] || TIER_COLORS.bronze

  if (!earned) {
    return (
      <div className="card" style={{ textAlign:'center', opacity:0.38, filter:'grayscale(0.5)' }}>
        <div style={{ fontSize:'2.2rem', marginBottom:'0.5rem' }}>{ach.icon}</div>
        <div style={{ fontFamily:'var(--font-ui)', fontWeight:700, fontSize:'0.88rem', marginBottom:'0.3rem' }}>{ach.name}</div>
        <div style={{ fontSize:'0.75rem', color:'var(--muted)', marginBottom:'0.6rem', lineHeight:1.4 }}>{ach.description}</div>
        <span style={{ fontFamily:'var(--font-ui)', fontSize:'0.65rem', fontWeight:700, color:'var(--muted)', background:'var(--bg3)', padding:'2px 9px', borderRadius:20, border:'1px solid var(--border)' }}>
          +{ach.xp_reward} XP
        </span>
      </div>
    )
  }

  return (
    <div
      className="card"
      style={{ textAlign:'center', borderColor:`${tc}44`, background:`${tc}0d`, transition:'transform 0.2s, box-shadow 0.2s', cursor:'default' }}
      onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow=`0 8px 24px ${tc}33` }}
      onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='' }}
    >
      <div style={{ fontSize:'2.2rem', marginBottom:'0.5rem' }}>{ach.icon}</div>
      <div style={{ fontFamily:'var(--font-ui)', fontWeight:700, fontSize:'0.88rem', color:tc, marginBottom:'0.3rem', letterSpacing:'0.04em' }}>{ach.name}</div>
      <div style={{ fontSize:'0.75rem', color:'var(--muted)', marginBottom:'0.6rem', lineHeight:1.4 }}>{ach.description}</div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'0.4rem' }}>
        <span style={{ fontFamily:'var(--font-ui)', fontSize:'0.65rem', fontWeight:700, color:tc, background:`${tc}22`, padding:'2px 9px', borderRadius:20, border:`1px solid ${tc}44` }}>
          +{ach.xp_reward} XP
        </span>
        <span style={{ fontFamily:'var(--font-ui)', fontSize:'0.58rem', color:tc, opacity:0.8, textTransform:'uppercase', letterSpacing:'0.06em' }}>
          {TIER_LABELS[ach.tier] || ach.tier}
        </span>
      </div>
    </div>
  )
}

export default function Achievements() {
  const { stats, series: seriesData }   = useCollection()
  const { wishlist }                    = useWishlist()
  const { friends }                     = useFriends()
  const { achievements, unlockedIds, xp, level, xpProgress, xpInLevel, loading } = useAchievements()

  // Enrich stats with things conditions need
  const enrichedStats = useMemo(() => ({
    ...stats,
    completeSeries: seriesData.filter(s => s.total && s.owned >= s.total).length,
    variants:       0, // would need a separate query — left as 0 until implemented
    totalScans:     0, // tracked via profile.total_scans if available
  }), [stats, seriesData])

  // Split achievements from DB into earned / locked using condition functions
  const { earned, locked } = useMemo(() => {
    const earned = [], locked = []
    achievements.forEach(ach => {
      const condition = CONDITIONS[ach.id]
      const isUnlocked = unlockedIds.has(ach.id) ||
        (condition ? condition(enrichedStats, wishlist.length, friends.length) : false)
      if (isUnlocked) earned.push(ach)
      else locked.push(ach)
    })
    return { earned, locked }
  }, [achievements, unlockedIds, enrichedStats, wishlist.length, friends.length])

  const levelTitle = LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)]

  if (loading) return (
    <div className="page-enter">
      <h1 className="section-title" style={{ marginBottom:'1.5rem' }}>Achievements</h1>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(190px,1fr))', gap:'1rem' }}>
        {[...Array(6)].map((_,i) => <div key={i} className="skeleton" style={{ height:160, borderRadius:12 }} />)}
      </div>
    </div>
  )

  return (
    <div className="page-enter">
      <div className="section-header" style={{ marginBottom:'0.5rem' }}>
        <h1 className="section-title">Achievements</h1>
        <span className="badge badge-purple">{earned.length} / {achievements.length} unlocked</span>
      </div>

      {/* Level card */}
      <div className="card card-glow" style={{ marginBottom:'1.75rem', background:'linear-gradient(135deg,#16003a,#1a1a2e)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1rem' }}>
          <div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:'1.6rem', letterSpacing:'0.1em', lineHeight:1 }}>Level {level}</div>
            <div style={{ color:'var(--purple-light)', fontFamily:'var(--font-ui)', fontSize:'0.85rem', marginTop:'0.25rem', letterSpacing:'0.04em' }}>{levelTitle}</div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontFamily:'var(--font-ui)', fontWeight:700, color:'var(--purple-light)', fontSize:'1rem' }}>{Number(xp || 0).toLocaleString()} XP</div>
            <div style={{ fontFamily:'var(--font-ui)', fontSize:'0.72rem', color:'var(--muted)', marginTop:'0.2rem' }}>{(1000 - xpInLevel).toLocaleString()} to Level {level + 1}</div>
          </div>
        </div>
        <div style={{ height:10, background:'rgba(255,255,255,0.08)', borderRadius:5, overflow:'hidden' }}>
          <div style={{ height:'100%', borderRadius:5, background:'linear-gradient(90deg,var(--purple),var(--purple-light))', width:`${xpProgress}%`, transition:'width 0.6s ease' }} />
        </div>
      </div>

      {/* Earned */}
      <div style={{ fontFamily:'var(--font-display)', fontSize:'1.4rem', letterSpacing:'0.08em', marginBottom:'1rem' }}>
        Unlocked
      </div>
      {earned.length === 0 ? (
        <div className="card empty-state" style={{ marginBottom:'1.5rem' }}>
          <div className="empty-icon">🔒</div>
          <div className="empty-title">None Yet</div>
          <div className="empty-body">Add comics to your vault to start earning achievements and XP</div>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(190px,1fr))', gap:'1rem', marginBottom:'2rem' }}>
          {earned.map(a => <AchievementCard key={a.id} ach={a} earned />)}
        </div>
      )}

      {/* Locked */}
      {locked.length > 0 && (
        <>
          <div style={{ fontFamily:'var(--font-display)', fontSize:'1.4rem', letterSpacing:'0.08em', marginBottom:'1rem' }}>
            Locked
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(190px,1fr))', gap:'1rem' }}>
            {locked.map(a => <AchievementCard key={a.id} ach={a} earned={false} />)}
          </div>
        </>
      )}
    </div>
  )
}
