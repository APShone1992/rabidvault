import { useAchievements } from '../context/AchievementsContext'
import {
  IconDashboard, IconCollection, IconAdd, IconAnalytics, IconSeries,
  IconReleases, IconMarket, IconWishlist, IconFriends, IconAchievements,
  IconSettings, IconSearch, IconSignOut, IconCommand,
  IconBook,
} from '../lib/icons'
import NotificationBell from './NotificationBell'
import './Sidebar.css'

const NAV_SECTIONS = [
  {
    label: 'Collection',
    items: [
      { id: 'dashboard',    Icon: IconDashboard,    label: 'Dashboard'    },
      { id: 'collection',   Icon: IconCollection,   label: 'Collection'   },
      { id: 'add',          Icon: IconAdd,          label: 'Add Comic'    },
      { id: 'analytics',    Icon: IconAnalytics,    label: 'Analytics'    },
      { id: 'series',       Icon: IconSeries,       label: 'Series & Sets'},
      { id: 'reading',      Icon: IconBook,         label: 'Reading Order' },
    ],
  },
  {
    label: 'Discover',
    items: [
      { id: 'releases',     Icon: IconReleases,     label: 'New Releases' },
      { id: 'market',       Icon: IconMarket,       label: 'Market'       },
      { id: 'wishlist',     Icon: IconWishlist,     label: 'Wishlist'     },
    ],
  },
  {
    label: 'Community',
    items: [
      { id: 'friends',      Icon: IconFriends,      label: 'Social'       },
      { id: 'achievements', Icon: IconAchievements, label: 'Achievements' },
    ],
  },
  {
    label: 'Account',
    items: [
      { id: 'settings',     Icon: IconSettings,     label: 'Settings'     },
    ],
  },
]

export default function Sidebar({ profile, page, setPage, onLogout, open }) {
  const { xp, level, xpProgress } = useAchievements()

  return (
    <aside className={`sidebar${open ? ' open' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <img loading="lazy"
          src={`${import.meta.env.BASE_URL}logo.png`}
          alt="The Rabid Vault"
          className="sidebar-logo-img"
          onError={e => { e.target.style.display = 'none' }}
        />
        <span className="sidebar-brand">THE RABID VAULT</span>
      </div>

      {/* Search shortcut */}
      <div style={{ padding: '0.6rem 0.65rem 0.25rem' }}>
        <button
          onClick={() => {
            const e = new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true })
            window.dispatchEvent(e)
          }}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.6rem',
            width: '100%', padding: '0.55rem 0.85rem',
            background: 'var(--bg3)', border: '1px solid var(--border)',
            borderRadius: 8, cursor: 'pointer', color: 'var(--muted)',
            fontFamily: 'var(--font-ui)', fontSize: '0.78rem', fontWeight: 500,
            transition: 'border-color 0.15s, color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--purple)'; e.currentTarget.style.color = 'var(--text)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted)' }}
        >
          <IconSearch size={13} />
          <span style={{ flex: 1 }}>Search...</span>
          <kbd style={{ fontFamily: 'var(--font-ui)', fontSize: '0.58rem', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 5px', display:'inline-flex', alignItems:'center', gap:2 }}><IconCommand size={9} />K</kbd>
        </button>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {NAV_SECTIONS.map(section => (
          <div key={section.label}>
            <div className="nav-section-label">{section.label}</div>
            {section.items.map(item => (
              <button
                key={item.id}
                className={`nav-item ${page === item.id ? 'active' : ''}`}
                onClick={() => setPage(item.id)}
              >
                <item.Icon size={16} style={{ flexShrink: 0 }} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="user-avatar">
            {profile?.avatar_url
              ? <img loading="lazy" src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              : profile?.username?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="user-info">
            <div className="user-name">{profile?.username || 'Collector'}</div>
            <div className="user-role">Lvl {level} Collector</div>
          </div>
          <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
            <NotificationBell />
          </div>
        </div>

        {/* XP bar */}
        <div className="xp-bar-track">
          <div className="xp-bar-fill" style={{ width: `${xpProgress}%` }} />
        </div>
        <div className="xp-label">
          <span>{xp.toLocaleString()} XP</span>
          <span>Lvl {level + 1} →</span>
        </div>

        {/* Logout */}
        <div className="sidebar-footer-actions">
          <button
            className="btn btn-ghost btn-sm btn-full"
            style={{ justifyContent: 'center', fontSize: '0.75rem' }}
            onClick={onLogout}
          >
            <IconSignOut size={13} style={{ flexShrink:0 }} /> Sign Out
          </button>
        </div>

        <div className="sidebar-footer-label">Comic Book Vault</div>
      </div>
    </aside>
  )
}
