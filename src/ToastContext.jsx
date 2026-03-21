import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { saveToCache, loadFromCache } from '../lib/offlineCache'
// snapshot is triggered manually from Dashboard after load

const CollectionContext = createContext(null)

export function CollectionProvider({ children }) {
  const { user } = useAuth()
  const [collection, setCollection] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)

  const fetch = useCallback(async () => {
    if (!user) { setLoading(false); return }
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('collection')
        .select(`
          *,
          comics (
            id, title, issue_number, publisher,
            cover_url, comicvine_id,
            volume_id, volume_issue_count, deck
          )
        `)
        .eq('user_id', user?.id)
        .order('added_at', { ascending: false })

      if (error) {
        const cached = await loadFromCache(`collection-${user.id}`)
        if (cached) { setCollection(cached); setError('') }
        else setError(error.message)
      } else {
        setCollection(data || [])
        if (data) saveToCache(`collection-${user.id}`, data)
      }
    } catch (err) {
      const cached = await loadFromCache(`collection-${user?.id}`)
      if (cached) setCollection(cached)
      else setError('Failed to load collection. Check your connection.')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { fetch() }, [fetch])

  // Allow any component to trigger a collection refresh via custom event
  useEffect(() => {
    const handler = () => fetch()
    window.addEventListener('rv-collection-refresh', handler)
    return () => window.removeEventListener('rv-collection-refresh', handler)
  }, [fetch])

  // ── Memoised stats (only recalculate when collection changes) ──
  const stats = useMemo(() => {
    const safe = collection || []
    return {
    total:      safe.length,
    totalValue: safe.reduce((s, c) => s + Number(c.current_value || 0), 0),
    totalSpent: safe.reduce((s, c) => s + Number(c.paid_price    || 0), 0),
    publishers: [...new Set(safe.map(c => c.comics?.publisher).filter(Boolean))].length,
    read:       safe.filter(c => !!c.read_at).length,
    unread:     safe.filter(c => !c.read_at).length,
    }
  }, [collection])

  // ── Memoised series grouping ────────────────────────────────
  const series = useMemo(() => {
    const map = {}
    ;(collection || []).forEach(c => {
      const vid = c.comics?.volume_id
      if (!vid) return
      if (!map[vid]) {
        map[vid] = {
          volume_id: vid,
          name:      c.comics?.title || 'Unknown',
          publisher: c.comics?.publisher || '',
          total:     c.comics?.volume_issue_count || null,
          owned:     0, issues: [],
        }
      }
      map[vid].owned++
      map[vid].issues.push(c)
    })
    return Object.values(map).sort((a, b) => {
      const ac = a.total && a.owned >= a.total
      const bc = b.total && b.owned >= b.total
      if (ac && !bc) return -1
      if (!ac && bc) return 1
      return b.owned - a.owned
    })
  }, [collection])

  // ── Mutations (optimistic updates — no refetch needed) ──────
  async function addComic({ title, issue_number, publisher, cover_url, comicvine_id,
                            grade, paid_price, current_value, notes,
                            description, deck, volume_id, volume_issue_count }) {
    let comic, comicErr
    if (comicvine_id) {
      const res = await supabase.from('comics')
        .upsert({ title, issue_number, publisher, cover_url, comicvine_id,
                  description, deck, volume_id, volume_issue_count },
                 { onConflict: 'comicvine_id', ignoreDuplicates: false })
        .select().single()
      comic = res.data; comicErr = res.error
    } else {
      const res = await supabase.from('comics')
        .insert({ title, issue_number, publisher, cover_url, description, deck })
        .select().single()
      comic = res.data; comicErr = res.error
    }
    if (comicErr) return { error: comicErr.message }

    const { data, error } = await supabase.from('collection')
      .insert({ user_id: user.id, comic_id: comic.id, grade, paid_price, current_value, notes })
      .select('*, comics(id,title,issue_number,publisher,cover_url,comicvine_id,volume_id,volume_issue_count,deck)')
      .single()
    if (error) return { error: error.message }
    setCollection(prev => [data, ...prev])
    return { data }
  }

  async function updateComic(id, updates) {
    const { data, error } = await supabase.from('collection')
      .update(updates).eq('id', id).eq('user_id', user.id)
      .select('*, comics(id,title,issue_number,publisher,cover_url,comicvine_id,volume_id,volume_issue_count,deck)')
      .single()
    if (error) return { error: error.message }
    setCollection(prev => prev.map(c => c.id === id ? data : c))
    return { data }
  }

  async function removeComic(id) {
    const { error } = await supabase.from('collection')
      .delete().eq('id', id).eq('user_id', user.id)
    if (error) return { error: error.message }
    setCollection(prev => prev.filter(c => c.id !== id))
    return {}
  }

  async function markRead(id) {
    const now = new Date().toISOString()
    const { data, error } = await supabase.from('collection')
      .update({ read_at: now }).eq('id', id).eq('user_id', user.id)
      .select('*, comics(id,title,issue_number,publisher,cover_url,comicvine_id,volume_id,volume_issue_count,deck)')
      .single()
    if (!error) setCollection(prev => prev.map(c => c.id === id ? data : c))
    return { error }
  }

  async function markUnread(id) {
    const { data, error } = await supabase.from('collection')
      .update({ read_at: null }).eq('id', id).eq('user_id', user.id)
      .select('*, comics(id,title,issue_number,publisher,cover_url,comicvine_id,volume_id,volume_issue_count,deck)')
      .single()
    if (!error) setCollection(prev => prev.map(c => c.id === id ? data : c))
    return { error }
  }

  async function setReadingOrder(id, order) {
    try {
      const { data, error } = await supabase
        .from('collection')
        .update({ reading_order: order })
        .eq('id', id)
        .eq('user_id', user?.id)
        .select('*, comics(id,title,issue_number,publisher,cover_url,comicvine_id,volume_id,volume_issue_count,deck)')
        .single()
      if (error) return { error: error.message }
      setCollection(prev => prev.map(c => c.id === id ? data : c))
      return { data }
    } catch (err) {
      return { error: err.message }
    }
  }

  return (
    <CollectionContext.Provider value={{
      collection, loading, error, stats, series,
      addComic, updateComic, removeComic, markRead, markUnread, setReadingOrder,
      refresh: fetch,
    }}>
      {children}
    </CollectionContext.Provider>
  )
}

export const useCollection = () => {
  const ctx = useContext(CollectionContext)
  if (!ctx) throw new Error('useCollection must be used within CollectionProvider')
  return ctx
}
