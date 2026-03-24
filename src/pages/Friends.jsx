import { useState } from 'react'
import {
  IconFriends, IconSearch, IconLeaderboard, IconAddFriend, IconFriendDone,
  IconCompare, IconProfile, IconClose,
} from '../lib/icons'
import { useFriends } from '../hooks/useFriends'
import { useToast } from '../context/ToastContext'
import { useCollection } from '../context/CollectionContext'
import { useAuth } from '../context/AuthContext'

// ── Online status helper ─────────────────────────────────────
// "online" = seen within last 5 minutes
// "recent" = within last hour
// "offline" = older
function onlineStatus(lastSeen) {
  if (!lastSeen) return 'offline'
  const mins = (Date.now() - new Date(lastSeen).getTime()) / 60000
  if (mins < 5)  return 'online'
  if (mins < 60) return 'recent'
  return 'offline'
}

const STATUS_DOT = {
  online:  { color: '#10b981', label: 'Online now' },
  recent:  { color: '#f59e0b', label: 'Active recently' },
  offline: { color: '#6b7280', label: 'Offline' },
}

function Avatar({ username, avatarUrl, lastSeen, size = 44 }) {
  const status = onlineStatus(lastSeen)
  const dot    = STATUS_DOT[status]
  return (
    <div style={{ position: 'relative', flexShrink: 0, width: size, height: size }}>
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: avatarUrl ? 'transparent' : 'linear-gradient(135deg,#6d28d9,#8b5cf6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-ui)', fontWeight: 700,
        fontSize: size * 0.38 + 'px', color: '#fff',
        border: '2px solid rgba(139,92,246,0.35)', overflow: 'hidden',
      }}>
        {avatarUrl
          ? <img loading="lazy" src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : username?.[0]?.toUpperCase() || '?'
        }
      </div>
      {/* Online dot */}
      <div style={{
        position: 'absolute', bottom: 1, right: 1,
        width: size * 0.28, height: size * 0.28,
        borderRadius: '50%', background: dot.color,
        border: '2px solid var(--bg2)',
        boxShadow: status === 'online' ? `0 0 6px ${dot.color}` : 'none',
      }} title={dot.label} />
    </div>
  )
}

export default function Friends({ onViewProfile }) {
  const { user, profile } = useAuth()
  const { friends, pending, loading, searchUser, sendRequest, acceptRequest, removeFriend } = useFriends()
  const { stats: myStats, collection: myCollection } = useCollection()

  const [searchQuery,   setSearchQuery]   = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching,     setSearching]     = useState(false)
  const [compareWith,   setCompareWith]   = useState(null)
  const [compareData,   setCompareData]   = useState(null)
  const [compareLoading, setCompareLoading] = useState(false)
  const [requestSent,   setRequestSent]   = useState({})
  const [activeTab,     setActiveTab]     = useState('friends') // friends | search | leaderboard
  const toast = useToast()

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setSearching(true)
    const results = await searchUser(searchQuery)
    setSearchResults(results.filter(u => u.id !== user.id))
    if (results.length === 0) toast.info('No users found with that username')
    setSearching(false)
  }

  const handleSendRequest = async (addresseeId) => {
    const { error } = await sendRequest(addresseeId)
    if (error) toast.error('Could not send request: ' + error.message)
    else {
      setRequestSent(prev => ({ ...prev, [addresseeId]: true }))
      toast.success('Friend request sent!')
    }
  }

  const handleCompare = async (friend) => {
    setCompareWith(friend)
    setCompareLoading(true)
    try {
      const { supabase } = await import('../lib/supabase')
      const { data, error } = await supabase
        .from('collection')
        .select('*, comics(title, issue_number, publisher, cover_url)')
        .eq('user_id', friend?.id)
        .order('current_value', { ascending: false })
      if (error) throw error
      setCompareData(data || [])
    } catch (err) {
      toast.error('Could not load their collection. They may have made it private.')
      setCompareWith(null)
    } finally {
      setCompareLoading(false)
    }
  }

  const handleViewProfile = (friend) => {
    if (onViewProfile) onViewProfile(friend.username)
  }

  const sum    = (coll, key) => coll.reduce((s, c) => s + Number(c[key] || 0), 0)
  const fValue = (coll) => sum(coll, 'current_value')
  const fSpent = (coll) => sum(coll, 'paid_price')

  const onlineCount = friends.filter(f => onlineStatus(f.last_seen) === 'online').length

  // Leaderboard — friends sorted by collection value
  const leaderboard = [
    { username: profile?.username || 'You', avatarUrl: profile?.avatar_url, value: myStats.totalValue, isMe: true, last_seen: null },
    ...friends.map(f => ({
      username: f.username, avatarUrl: f.avatar_url,
      last_seen: f.last_seen,
      isMe: false,
      value: 0, // Will show as ? since we don't load all friend values eagerly
    }))
  ].sort((a, b) => b.value - a.value)

  return (
    <div className="page-enter">

      {/* ── HEADER ── */}
      <div className="section-header" style={{ marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h1 className="section-title">Friends</h1>
          {onlineCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '3px', fontFamily: 'var(--font-ui)', fontSize: '0.75rem', color: '#10b981' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 5px #10b981' }} />
              {onlineCount} friend{onlineCount !== 1 ? 's' : ''} online now
            </div>
          )}
        </div>
      </div>

      {/* ── PENDING REQUESTS ── */}
      {pending.length > 0 && (
        <div className="card" style={{ marginBottom: '1.25rem', borderColor: 'rgba(139,92,246,0.5)', background: 'rgba(139,92,246,0.05)' }}>
          <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, color: 'var(--purple-light)', marginBottom: '0.75rem', fontSize: '0.88rem' }}>
            🔔 {pending.length} pending friend request{pending.length > 1 ? 's' : ''}
          </div>
          {pending.map(req => (
            <div key={req.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Avatar username={req.requester_profile?.username} avatarUrl={req.requester_profile?.avatar_url} lastSeen={req.requester_profile?.last_seen} size={36} />
                <div>
                  <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: '0.88rem' }}>{req.requester_profile?.username}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>wants to connect</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-primary btn-sm" onClick={() => { acceptRequest(req.id); toast.success(`You and ${req.requester_profile?.username} are now friends!`) }}>Accept</button>
                <button className="btn btn-ghost btn-sm" style={{ fontSize: '0.78rem' }} onClick={() => removeFriend(req.id)}>Decline</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── TABS ── */}
      <div className="tabs" style={{ marginBottom: '1.5rem' }}>
        <button className={`tab ${activeTab === 'friends' ? 'active' : ''}`} onClick={() => setActiveTab('friends')}>
          👥 My Friends {!loading && `(${friends.length})`}
        </button>
        <button className={`tab ${activeTab === 'search' ? 'active' : ''}`} onClick={() => setActiveTab('search')}>
          🔍 Find Collectors
        </button>
        <button className={`tab ${activeTab === 'leaderboard' ? 'active' : ''}`} onClick={() => setActiveTab('leaderboard')}>
          🏆 Leaderboard
        </button>
      </div>

      {/* ══════════════════
          FRIENDS TAB
          ══════════════════ */}
      {activeTab === 'friends' && (
        <>
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: '1rem' }}>
              {[...Array(4)].map((_,i) => <div key={i} className="skeleton" style={{ height: 160, borderRadius: 12 }} />)}
            </div>
          ) : friends.length === 0 ? (
            <div className="card empty-state">
              <div className="empty-icon">👥</div>
              <div className="empty-title">No friends yet</div>
              <div className="empty-body">Find other collectors and compare your vaults</div>
              <button className="btn btn-primary" onClick={() => setActiveTab('search')}><IconSearch size={13} /> Find Collectors</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: '1rem' }}>
              {friends.map(friend => {
                const status = onlineStatus(friend.last_seen)
                const dot    = STATUS_DOT[status]
                return (
                  <div key={friend.id} className="card"
                    style={{ borderColor: compareWith?.id === friend.id ? 'var(--purple)' : undefined, transition: 'border-color 0.2s' }}>

                    {/* Friend header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1rem' }}>
                      <Avatar username={friend.username} avatarUrl={friend.avatar_url} lastSeen={friend.last_seen} size={44} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: '0.95rem', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {friend.username}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontFamily: 'var(--font-ui)', fontSize: '0.7rem' }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: dot.color, flexShrink: 0 }} />
                          <span style={{ color: dot.color }}>{dot.label}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFriend(friend.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1rem', padding: '2px', flexShrink: 0, transition: 'color 0.15s' }}
                        title="Remove friend"
                        onMouseEnter={e => e.target.style.color = 'var(--red)'}
                        onMouseLeave={e => e.target.style.color = 'var(--muted)'}
                      >✕</button>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }}
                        onClick={() => handleCompare(friend)}>
                        ⚖️ Compare Vaults
                      </button>
                      {onViewProfile && (
                        <button className="btn btn-outline btn-sm" style={{ flex: 1, justifyContent: 'center' }}
                          onClick={() => handleViewProfile(friend)}>
                          👤 View Profile
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ── COMPARE PANEL ── */}
          {compareWith && (
            <div style={{ marginTop: '2rem' }}>
              <div className="section-header" style={{ marginBottom: '1.25rem' }}>
                <h2 className="section-title" style={{ fontSize: '1.5rem' }}>
                  {profile?.username || 'You'} vs {compareWith.username}
                </h2>
                <button className="btn btn-outline btn-sm" onClick={() => { setCompareWith(null); setCompareData(null) }}>✕ Close</button>
              </div>

              {compareLoading ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  {[...Array(2)].map((_,i) => <div key={i} className="skeleton" style={{ height: 280, borderRadius: 12 }} />)}
                </div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.25rem' }}>
                    {[
                      { label: profile?.username || 'You', collection: myCollection, avatarUrl: profile?.avatar_url, lastSeen: null, isMe: true },
                      { label: compareWith.username, collection: compareData || [], avatarUrl: compareWith.avatar_url, lastSeen: compareWith.last_seen, isMe: false },
                    ].map((side) => {
                      const val   = fValue(side.collection)
                      const spent = fSpent(side.collection)
                      const roi   = spent > 0 ? (((val - spent) / spent) * 100).toFixed(0) : 0
                      const pubs  = [...new Set(side.collection.map(c => c.comics?.publisher).filter(Boolean))].length
                      return (
                        <div key={side.label} className={`card ${side.isMe ? 'card-glow' : ''}`}
                          style={{ borderColor: side.isMe ? 'rgba(139,92,246,0.35)' : undefined }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                            <Avatar username={side.label} avatarUrl={side.avatarUrl} lastSeen={side.lastSeen} size={40} />
                            <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 800, fontSize: '1rem' }}>{side.label}</div>
                            {side.isMe && <span className="badge badge-purple" style={{ marginLeft: 'auto' }}>You</span>}
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', marginBottom: '1rem' }}>
                            {[
                              ['Comics',     side.collection.length, 'var(--text)'],
                              ['Value',      `£${Number(val || 0).toLocaleString()}`, 'var(--gold)'],
                              ['Spent',      `£${Number(spent || 0).toLocaleString()}`, 'var(--text)'],
                              ['ROI',        `${Number(roi) >= 0 ? '+' : ''}${roi}%`, Number(roi) >= 0 ? 'var(--green)' : 'var(--red)'],
                            ].map(([label, value, color]) => (
                              <div key={label} className="stat-card" style={{ padding: '0.65rem 0.85rem' }}>
                                <div className="stat-label">{label}</div>
                                <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 800, fontSize: '1rem', color }}>{value}</div>
                              </div>
                            ))}
                          </div>

                          <div className="stat-label" style={{ marginBottom: '0.5rem' }}>Top 4 issues</div>
                          {side.collection.slice(0, 4).map((c, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.82rem' }}>
                              <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: '0.5rem' }}>
                                {c.comics?.title} {c.comics?.issue_number}
                              </span>
                              <span style={{ fontFamily: 'var(--font-ui)', color: 'var(--gold)', fontWeight: 700, flexShrink: 0 }}>£{Number(c.current_value).toLocaleString()}</span>
                            </div>
                          ))}
                          {side.collection.length === 0 && (
                            <div style={{ color: 'var(--muted)', fontSize: '0.82rem', fontStyle: 'italic' }}>Empty vault</div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Winner banner */}
                  {compareData && (() => {
                    const myVal    = fValue(myCollection)
                    const theirVal = fValue(compareData)
                    if (myVal === theirVal) return null
                    const winner = myVal > theirVal ? (profile?.username || 'You') : compareWith.username
                    const diff   = Math.abs(myVal - theirVal)
                    const isMe   = myVal > theirVal
                    return (
                      <div className="card" style={{ textAlign: 'center', background: isMe ? 'rgba(139,92,246,0.08)' : 'rgba(245,158,11,0.06)', borderColor: isMe ? 'rgba(139,92,246,0.35)' : 'rgba(245,158,11,0.3)' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>🏆</div>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', letterSpacing: '0.08em', marginBottom: '0.3rem' }}>
                          {winner} wins!
                        </div>
                        <div style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>
                          by £{diff.toLocaleString()} in collection value
                        </div>
                      </div>
                    )
                  })()}
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* ══════════════════
          SEARCH TAB
          ══════════════════ */}
      {activeTab === 'search' && (
        <div>
          <div className="card" style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, marginBottom: '0.75rem' }}>Find a Collector</div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <input className="form-input" style={{ flex: 1 }} placeholder="Search by username..."
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()} />
              <button className="btn btn-primary" onClick={handleSearch} disabled={searching}>
                {searching ? '⏳ Searching...' : '🔍 Search'}
              </button>
            </div>
          </div>

          {searchResults.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {searchResults.map(u => {
                const alreadyFriend = friends.some(f => f.id === u.id)
                const status = onlineStatus(u.last_seen)
                const dot    = STATUS_DOT[status]
                return (
                  <div key={u.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Avatar username={u.username} avatarUrl={u.avatar_url} lastSeen={u.last_seen} size={44} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: '0.95rem' }}>{u.username}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontFamily: 'var(--font-ui)', fontSize: '0.7rem', marginTop: '2px' }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: dot.color, flexShrink: 0 }} />
                        <span style={{ color: dot.color }}>{dot.label}</span>
                      </div>
                    </div>
                    {alreadyFriend ? (
                      <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.8rem', color: 'var(--green)', fontWeight: 700 }}>✓ Friends</span>
                    ) : requestSent[u.id] ? (
                      <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 700 }}>Request sent</span>
                    ) : (
                      <button className="btn btn-primary btn-sm" onClick={() => handleSendRequest(u.id)}><IconAddFriend size={13} /> Add Friend</button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════
          LEADERBOARD TAB
          ══════════════════ */}
      {activeTab === 'leaderboard' && (
        <div>
          <div className="card card-glow" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border)', background: 'var(--bg3)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: '0.78rem', flex: 1 }}>Collector</span>
              <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: '0.7rem', color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Vault Value</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.9rem 1.25rem', borderBottom: '1px solid var(--border)', background: 'rgba(139,92,246,0.05)' }}>
              <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 800, fontSize: '0.85rem', color: 'var(--gold)', width: 20, flexShrink: 0 }}>1</span>
              <Avatar username={profile?.username} avatarUrl={profile?.avatar_url} lastSeen={null} size={36} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: '0.88rem' }}>{profile?.username || 'You'} <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.62rem', background: 'rgba(139,92,246,0.2)', color: 'var(--purple-light)', padding: '1px 7px', borderRadius: 20, border: '1px solid rgba(139,92,246,0.3)', fontWeight: 700 }}>YOU</span></div>
              </div>
              <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 800, color: 'var(--gold)', fontSize: '0.95rem' }}>£{Number(myStats.totalValue || 0).toLocaleString()}</div>
            </div>
            {friends.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--muted)', fontSize: '0.85rem' }}>
                Add friends to see how you compare
              </div>
            ) : (
              friends.map((friend, i) => {
                const status = onlineStatus(friend.last_seen)
                const dot    = STATUS_DOT[status]
                return (
                  <div key={friend.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.9rem 1.25rem', borderBottom: i < friends.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.15s', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(139,92,246,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}
                    onClick={() => { setActiveTab('friends'); handleCompare(friend) }}>
                    <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 800, fontSize: '0.85rem', color: 'var(--muted)', width: 20, flexShrink: 0 }}>{i + 2}</span>
                    <Avatar username={friend.username} avatarUrl={friend.avatar_url} lastSeen={friend.last_seen} size={36} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{friend.username}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--font-ui)', fontSize: '0.65rem', marginTop: '1px' }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: dot.color }} />
                        <span style={{ color: dot.color }}>{dot.label}</span>
                      </div>
                    </div>
                    <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 800, color: 'var(--muted)', fontSize: '0.85rem' }}>
                      —
                      <span style={{ fontSize: '0.65rem', color: 'var(--muted)', fontWeight: 400, marginLeft: 4 }}>tap to compare</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
          <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--muted)', fontStyle: 'italic', textAlign: 'center' }}>
            Friend vault values load when you compare — privacy preserved by default
          </div>
        </div>
      )}
    </div>
  )
}
