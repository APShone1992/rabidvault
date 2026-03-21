import { useState } from 'react'
import { useNotifications } from '../hooks/useNotifications'

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

function notificationIcon(type) {
  switch (type) {
    case 'price_alert':  return <BellRing size={16} />
    case 'add_comic':    return '📚'
    case 'achievement':  return '🏆'
    case 'friend_add':   return '👥'
    default:             return '📣'
  }
}

function notificationText(n) {
  const p = n.payload || {}
  switch (n.type) {
    case 'price_alert':
      return {
        title: `Price alert: ${p.title} ${p.issue_number || ''}`,
        body:  `Current price £${Number(p.current_price).toLocaleString()} has hit your target of £${Number(p.target_price).toLocaleString()}`,
        cover: p.cover_url || null,
      }
    case 'add_comic':
      return { title: `Added ${p.title}`, body: p.publisher || '', cover: p.cover_url || null }
    case 'achievement':
      return { title: `Achievement unlocked!`, body: p.name || '', cover: null }
    default:
      return { title: n.type, body: '', cover: null }
  }
}

import { Bell, BellRing } from 'lucide-react'
export default function NotificationBell() {
  const { notifications, unreadCount, markAllRead, markRead, deleteNotification } = useNotifications()
  const [open, setOpen] = useState(false)

  const handleOpen = () => {
    setOpen(o => !o)
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        style={{
          background:  'none',
          border:      'none',
          cursor:      'pointer',
          padding:     '4px 6px',
          borderRadius: 8,
          position:    'relative',
          fontSize:    '1.1rem',
          display:     'flex',
          alignItems:  'center',
          transition:  'background 0.15s',
        }}
        title="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position:        'absolute',
            top:             0,
            right:           0,
            background:      'var(--red)',
            color:           '#fff',
            borderRadius:    '50%',
            width:           16,
            height:          16,
            fontSize:        '0.6rem',
            fontWeight:      800,
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'center',
            lineHeight:      1,
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 200 }}
          />

          <div style={{
            position:     'absolute',
            bottom:       '110%',
            left:         0,
            width:        300,
            background:   'var(--bg2)',
            border:       '1px solid var(--border)',
            borderRadius: 14,
            boxShadow:    '0 8px 32px rgba(0,0,0,0.5)',
            zIndex:       201,
            overflow:     'hidden',
            maxHeight:    400,
            display:      'flex',
            flexDirection:'column',
          }}>
            {/* Header */}
            <div style={{
              display:        'flex',
              justifyContent: 'space-between',
              alignItems:     'center',
              padding:        '12px 14px',
              borderBottom:   '1px solid var(--border)',
              flexShrink:     0,
            }}>
              <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>
                Notifications {unreadCount > 0 && <span style={{ color: 'var(--purple-light)', fontWeight: 700 }}>({unreadCount} new)</span>}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  style={{ background: 'none', border: 'none', color: 'var(--purple-light)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, fontFamily: 'var(--font-body)' }}
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {notifications.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)', fontSize: '0.85rem' }}>
                  <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>🔔</div>
                  No notifications yet
                </div>
              ) : (
                (notifications || []).map(n => {
                  const { title, body, cover } = notificationText(n)
                  const isUnread = !n.read_at
                  return (
                    <div
                      key={n.id}
                      onClick={() => { markRead(n.id); setOpen(false) }}
                      style={{
                        display:       'flex',
                        alignItems:    'flex-start',
                        gap:           '0.65rem',
                        padding:       '10px 14px',
                        borderBottom:  '1px solid var(--border)',
                        cursor:        'pointer',
                        background:    isUnread ? 'rgba(139,92,246,0.06)' : 'transparent',
                        transition:    'background 0.15s',
                      }}
                    >
                      {/* Cover or icon */}
                      <div style={{ flexShrink: 0, marginTop: 2 }}>
                        {cover ? (
                          <img loading="lazy"
                            src={cover}
                            alt=""
                            style={{ width: 32, height: 44, objectFit: 'cover', borderRadius: 4 }}
                            onError={e => { e.target.style.display = 'none' }}
                          />
                        ) : (
                          <div style={{ fontSize: '1.2rem', width: 32, textAlign: 'center' }}>
                            {notificationIcon(n.type)}
                          </div>
                        )}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                          {isUnread && (
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--purple)', flexShrink: 0, marginTop: 5 }} />
                          )}
                          <div style={{ fontWeight: isUnread ? 800 : 600, fontSize: '0.82rem', lineHeight: 1.4 }}>{title}</div>
                        </div>
                        {body && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.2rem', lineHeight: 1.4 }}>{body}</div>
                        )}
                        <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: '0.3rem' }}>{timeAgo(n.created_at)}</div>
                      </div>

                      {/* Delete */}
                      <button
                        onClick={e => { e.stopPropagation(); deleteNotification(n.id) }}
                        style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.8rem', flexShrink: 0, padding: '0 2px' }}
                      >✕</button>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
