
import { useWishlist } from '../hooks/useWishlist'
import { useFriends } from '../hooks/useFriends'
import { supabase } from '../lib/supabase'
import { useState, useEffect } from 'react'
import { useToast } from '../context/ToastContext'
import { IconAdd, IconClose, IconBell } from '../lib/icons'

const PRIORITY_COLOR = {
  High:   { bg: 'rgba(239,68,68,0.15)',    text: '#fca5a5' },
  Medium: { bg: 'rgba(245,158,11,0.15)',   text: '#fcd34d' },
  Low:    { bg: 'rgba(16,185,129,0.15)',   text: '#6ee7b7' },
}

export default function Wishlist() {
  const { wishlist, loading, addItem, removeItem, toggleAlert } = useWishlist()
  const { friendOwns } = useFriends()
  const [friendOwns, setFriendOwns] = useState({}) // { 'title #issue': [username, ...] }

  // Check which wishlist items any friends already own
  useEffect(() => {
    if (!friends?.length || !wishlist?.length) return
    const friendIds = friends.map(f => f.id)
    async function checkFriendCollections() {
      try {
        const { data } = await supabase
          .from('collection')
          .select('comic_id, user_id, comics(title, issue_number), profiles!collection_user_id_fkey(username)')
          .in('user_id', friendIds)
        if (!data?.length) return
        const map = {}
        for (const w of wishlist) {
          const key = `${w.title?.toLowerCase()} ${(w.issue_number || '').toLowerCase()}`.trim()
          const matches = data.filter(c => {
            const ct = (c.comics?.title || '').toLowerCase()
            const ci = (c.comics?.issue_number || '').toLowerCase()
            return ct.includes(w.title?.toLowerCase()) || `${ct} ${ci}`.includes(key)
          })
          if (matches.length) {
            map[w.id] = matches.map(m => m.profiles?.username).filter(Boolean)
          }
        }
        setFriendOwns(map)
      } catch (_) { /* intentional */ }
    }
    checkFriendCollections()
  }, [friends, wishlist])
  const { friends } = useFriends()
  const toast = useToast()
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({
    title: '', issue_number: '', publisher: '',
    target_price: '', priority: 'Medium', notes: '', alert_enabled: false,
  })
  const [saving, setSaving] = useState(false)
  const [filterPriority, setFilterPriority] = useState('All')

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) { toast.error('Please enter a title'); return }
    setSaving(true)
    try {
      await addItem({ ...form, target_price: parseFloat(form.target_price) || 0 })
      toast.success('Added to wishlist!')
      setForm({ title: '', issue_number: '', publisher: '', target_price: '', priority: 'Medium', notes: '', alert_enabled: false })
      setShowAdd(false)
    } catch (err) {
      toast.error('Failed to save — please try again')
    } finally {
      setSaving(false)
    }
  }

  const filtered = wishlist.filter(w => filterPriority === 'All' || w.priority === filterPriority)

  return (
    <div className="page-enter">
      <div className="section-header" style={{ marginBottom: '1.5rem' }}>
        <h1 className="section-title">Wishlist</h1>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div className="tabs" style={{ marginBottom: 0 }}>
            {['All', 'High', 'Medium', 'Low'].map(p => (
              <button key={p} className={`tab ${filterPriority === p ? 'active' : ''}`}
                onClick={() => setFilterPriority(p)}>{p}</button>
            ))}
          </div>
          <button className="btn btn-primary" onClick={() => setShowAdd(!showAdd)}><IconAdd size={13} /> Add Item</button>
        </div>
      </div>

      {/* ADD FORM */}
      {showAdd && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontWeight: 800, marginBottom: '1.25rem' }}>New Wishlist Item</h3>
          <form onSubmit={handleAdd}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input className="form-input" value={form.title} onChange={set('title')} placeholder="e.g. Amazing Fantasy" />
              </div>
              <div className="form-group">
                <label className="form-label">Issue #</label>
                <input className="form-input" value={form.issue_number} onChange={set('issue_number')} placeholder="#15" />
              </div>
              <div className="form-group">
                <label className="form-label">Publisher</label>
                <input className="form-input" value={form.publisher} onChange={set('publisher')} placeholder="Marvel, DC..." />
              </div>
              <div className="form-group">
                <label className="form-label">Target Price (£)</label>
                <input className="form-input" type="number" value={form.target_price} onChange={set('target_price')} placeholder="0.00" />
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-select" value={form.priority} onChange={set('priority')}>
                  <option>High</option><option>Medium</option><option>Low</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <input className="form-input" value={form.notes} onChange={set('notes')} placeholder="1st appearance, signed copy..." />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <input type="checkbox" id="alert_enabled" checked={form.alert_enabled}
                onChange={e => setForm(f => ({ ...f, alert_enabled: e.target.checked }))}
                style={{ width: 16, height: 16, accentColor: 'var(--purple)' }} />
              <label htmlFor="alert_enabled" style={{ fontSize: '0.9rem', cursor: 'pointer' }}>
                🔔 Alert me when this hits my target price
              </label>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : '+ Add to Wishlist'}
              </button>
              <button type="button" className="btn btn-outline" onClick={() => setShowAdd(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* LIST */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 12 }} />)}
      </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⭐</div>
          <div style={{ fontWeight: 700, marginBottom: '0.5rem' }}>
            {filterPriority === 'All' ? 'Your wishlist is empty' : `No ${filterPriority} priority items`}
          </div>
          <div>Add comics you're hunting for to keep track of them.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.map(item => (
            <div key={item.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: 40, height: 55, background: 'var(--bg3)', borderRadius: 6,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.3rem', flexShrink: 0,
                }}>🦸</div>
                <div>
                  <div style={{ fontWeight: 800 }}>{item.title} {item.issue_number}</div>
                  {item.publisher && <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{item.publisher}</div>}
                  {item.notes && <div style={{ fontSize: '0.8rem', color: 'var(--muted)', fontStyle: 'italic' }}>{item.notes}</div>}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                {/* Friend owns badge */}
                {friendOwns(item.title) && (
                  <span style={{
                    padding:'0.2rem 0.6rem', borderRadius:20, fontSize:'0.72rem', fontWeight:700,
                    background:'rgba(16,185,129,0.15)', color:'var(--green)',
                    border:'1px solid rgba(16,185,129,0.3)',
                  }}>🤝 Friend has this</span>
                )}
                {item.target_price > 0 && (
                  <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                    Target: <span style={{ color: 'var(--gold)' }}>£{Number(item.target_price).toLocaleString()}</span>
                  </div>
                )}
                <span style={{
                  padding: '0.2rem 0.6rem', borderRadius: 20, fontSize: '0.75rem', fontWeight: 800,
                  background: PRIORITY_COLOR[item.priority]?.bg,
                  color: PRIORITY_COLOR[item.priority]?.text,
                }}>
                  {item.priority}
                </span>
                {/* Price alert toggle */}
                <button
                  onClick={() => toggleAlert(item.id, !item.alert_enabled)}
                  style={{
                    background: item.alert_enabled ? 'rgba(139,92,246,0.2)' : 'transparent',
                    border: `1.5px solid ${item.alert_enabled ? 'var(--purple)' : 'var(--border)'}`,
                    color: item.alert_enabled ? 'var(--purple-light)' : 'var(--muted)',
                    borderRadius: 8, padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.8rem',
                    fontWeight: 700, fontFamily: 'var(--font-body)',
                  }}
                  title={item.alert_enabled ? 'Disable price alert' : 'Enable price alert'}
                >
                  🔔 {item.alert_enabled ? 'Alert On' : 'Alert Off'}
                </button>
                <button onClick={() => removeItem(item.id)} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SUMMARY */}
      {wishlist.length > 0 && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <div style={{ fontWeight: 700, marginBottom: '0.75rem' }}>Wishlist Summary</div>
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            <div><div className="stat-label">Total Items</div><div style={{ fontWeight: 700 }}>{wishlist.length}</div></div>
            <div>
              <div className="stat-label">Total Target Spend</div>
              <div style={{ fontWeight: 700, color: 'var(--gold)' }}>
                £{wishlist.reduce((s, w) => s + Number(w.target_price || 0), 0).toLocaleString()}
              </div>
            </div>
            <div><div className="stat-label">Alerts Active</div><div style={{ fontWeight: 700, color: 'var(--purple-light)' }}>{wishlist.filter(w => w.alert_enabled).length}</div></div>
            <div><div className="stat-label">High Priority</div><div style={{ fontWeight: 700, color: '#fca5a5' }}>{wishlist.filter(w => w.priority === 'High').length}</div></div>
          </div>
        </div>
      )}
    </div>
  )
}
