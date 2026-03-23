import { useState, useEffect, useRef, useCallback } from 'react'
import { useCollection } from '../context/CollectionContext'
import { useWishlist }   from '../hooks/useWishlist'
import './CommandPalette.css'
import {
  IconDashboard, IconCollection, IconAdd, IconAnalytics, IconSeries,
  IconReleases, IconMarket, IconWishlist, IconFriends, IconAchievements,
  IconSettings, IconSearch, IconClose,
} from '../lib/icons'

const PAGES = [
  { id: 'dashboard',    label: 'Dashboard',     Icon: IconDashboard,    type: 'page' },
  { id: 'collection',   label: 'Collection',    Icon: IconCollection,   type: 'page' },
  { id: 'add',          label: 'Add Comic',     Icon: IconAdd,          type: 'page' },
  { id: 'analytics',    label: 'Analytics',     Icon: IconAnalytics,    type: 'page' },
  { id: 'releases',     label: 'New Releases',  Icon: IconReleases,     type: 'page' },
  { id: 'market',       label: 'Market Prices', Icon: IconMarket,       type: 'page' },
  { id: 'wishlist',     label: 'Wishlist',      Icon: IconWishlist,     type: 'page' },
  { id: 'friends',      label: 'Social',        Icon: IconFriends,      type: 'page' },
  { id: 'achievements', label: 'Achievements',  Icon: IconAchievements, type: 'page' },
  { id: 'settings',     label: 'Settings',      Icon: IconSettings,     type: 'page' },
]

export default function CommandPalette({ open, onClose, setPage }) {
  const { collection } = useCollection()
  const { wishlist }   = useWishlist()
  const [query, setQuery]   = useState('')
  const [cursor, setCursor] = useState(0)
  const inputRef = useRef()
  const listRef  = useRef()

  useEffect(() => {
    if (open) { setQuery(''); setCursor(0); setTimeout(() => inputRef.current?.focus(), 50) }
  }, [open])

  const results = useCallback(() => {
    const q = query.toLowerCase().trim()
    if (!q) return PAGES.slice(0, 6)

    const items = []

    // Page matches
    PAGES.forEach(p => {
      if (p.label.toLowerCase().includes(q)) items.push({ ...p, icon: null })
    })

    // Comic matches from collection
    collection
      .filter(c => {
        const title = (c.comics?.title || '').toLowerCase()
        const issue = (c.comics?.issue_number || '').toLowerCase()
        const pub   = (c.comics?.publisher || '').toLowerCase()
        return title.includes(q) || issue.includes(q) || pub.includes(q)
      })
      .slice(0, 5)
      .forEach(c => items.push({
        id:    `comic-${c.id}`,
        label: `${c.comics?.title} ${c.comics?.issue_number}`,
        sub:   `${c.comics?.publisher} · ${c.grade} · £${Number(c.current_value).toLocaleString()}`,
        icon:  c.comics?.cover_url || '📖',
        type:  'comic',
        cover: c.comics?.cover_url,
        pageTarget: 'collection',
      }))

    // Wishlist matches
    wishlist
      .filter(w => (w.title || '').toLowerCase().includes(q))
      .slice(0, 3)
      .forEach(w => items.push({
        id:    `wish-${w.id}`,
        label: `${w.title} ${w.issue_number || ''}`,
        sub:   `Wishlist · ${w.priority} priority`,
        icon:  '⭐',
        type:  'wishlist',
        pageTarget: 'wishlist',
      }))

    return items.slice(0, 8)
  }, [query, collection, wishlist])

  const items = results()

  const select = useCallback((item) => {
    if (item.pageTarget) setPage(item.pageTarget)
    else if (item.type === 'page') setPage(item.id)
    onClose()
  }, [setPage, onClose])

  useEffect(() => {
    const handler = (e) => {
      if (!open) return
      if (e.key === 'Escape') { onClose(); return }
      if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(c => Math.min(c + 1, items.length - 1)) }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)) }
      if (e.key === 'Enter' && items[cursor]) { e.preventDefault(); select(items[cursor]) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, cursor, items, select, onClose])

  if (!open) return null

  return (
    <div className="cp-overlay" onClick={onClose}>
      <div className="cp-modal" onClick={e => e.stopPropagation()}>
        <div className="cp-search">
          <IconSearch size={15} style={{ opacity: 0.5, flexShrink: 0 }} />
          <input
            ref={inputRef}
            className="cp-input"
            placeholder="Search comics, pages, wishlist..."
            value={query}
            onChange={e => { setQuery(e.target.value); setCursor(0) }}
          />
          <kbd className="cp-kbd">ESC</kbd>
        </div>

        {items.length > 0 && (
          <div className="cp-list" ref={listRef}>
            {!query && <div className="cp-section-label">Quick navigation</div>}
            {query && <div className="cp-section-label">{items.length} result{items.length !== 1 ? 's' : ''}</div>}
            {(items || []).map((item, i) => (
              <button
                key={item.id}
                className={`cp-item ${i === cursor ? 'active' : ''}`}
                onClick={() => select(item)}
                onMouseEnter={() => setCursor(i)}
              >
                <div className="cp-item-icon">
                  {item.cover
                    ? <img src={item.cover} alt="" style={{ width: 28, height: 40, objectFit: 'cover', borderRadius: 3 }} loading="lazy" />
                    : item.Icon
                      ? <item.Icon size={16} />
                      : <span style={{ fontSize: '1rem' }}>{item.icon}</span>
                  }
                </div>
                <div className="cp-item-body">
                  <div className="cp-item-label">{item.label}</div>
                  {item.sub && <div className="cp-item-sub">{item.sub}</div>}
                </div>
                <div className="cp-item-type">{item.type}</div>
              </button>
            ))}
          </div>
        )}

        <div className="cp-footer">
          <span><kbd>↑↓</kbd> navigate</span>
          <span><kbd>↵</kbd> select</span>
          <span><kbd>Esc</kbd> close</span>
        </div>
      </div>
    </div>
  )
}
