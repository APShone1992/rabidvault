import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { saveToCache, loadFromCache } from '../lib/offlineCache'

export function useCollection(userId = null) {
  const { user } = useAuth()
  const targetId = userId || user?.id
  const [collection, setCollection] = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)

  const fetch = useCallback(async () => {
    if (!targetId) { setLoading(false); return }
    setLoading(true)
    try {
    const { data, error } = await supabase
      .from('collection')
      .select(`
        *,
        comics (
          id, title, issue_number, publisher,
          cover_url, comicvine_id, description
        )
      `)
      .eq('user_id', targetId)
      .order('added_at', { ascending: false })
    if (error) {
      // Network failed — try offline cache
      const cached = await loadFromCache(`collection-${targetId}`)
      if (cached) { setCollection(cached); setError('') }
      else setError(error.message)
    } else {
      setCollection(data || [])
      // Save to offline cache for next time
      if (data) saveToCache(`collection-${targetId}`, data)
    }
    } catch (err) {
      const cached = await loadFromCache(`collection-${targetId}`)
      if (cached) setCollection(cached)
    } finally {
      setLoading(false)
    }
  }, [targetId])

  useEffect(() => { fetch() }, [fetch])

  async function addComic({ title, issue_number, publisher, cover_url, comicvine_id,
                            grade, paid_price, current_value, notes,
                            description, deck, volume_id, volume_issue_count }) {
    // 1. Insert or upsert the comic into master comics table
    // If we have a comicvine_id, upsert on that so duplicates are merged.
    // If not (manual entry / cover scan), just insert a new row.
    let comic, comicErr
    if (comicvine_id) {
      const res = await supabase
        .from('comics')
        .upsert(
          { title, issue_number, publisher, cover_url, comicvine_id,
            description, deck, volume_id, volume_issue_count },
          { onConflict: 'comicvine_id', ignoreDuplicates: false }
        )
        .select()
        .single()
      comic = res.data; comicErr = res.error
    } else {
      const res = await supabase
        .from('comics')
        .insert({ title, issue_number, publisher, cover_url, description, deck })
        .select()
        .single()
      comic = res.data; comicErr = res.error
    }
    if (comicErr) return { error: comicErr.message }

    // 2. Add to user's collection
    const { data, error } = await supabase
      .from('collection')
      .insert({ user_id: user.id, comic_id: comic.id, grade, paid_price, current_value, notes })
      .select(`*, comics(*)`)
      .single()
    if (error) return { error: error.message }
    setCollection(prev => [data, ...prev])
    return { data }
  }

  async function updateComic(id, updates) {
    const { data, error } = await supabase
      .from('collection')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select(`*, comics(*)`)
      .single()
    if (error) return { error: error.message }
    setCollection(prev => prev.map(c => c.id === id ? data : c))
    return { data }
  }

  async function markRead(id) {
    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from('collection')
      .update({ read_at: now })
      .eq('id', id)
      .eq('user_id', user.id)
      .select(`*, comics(*)`)
      .single()
    if (!error) setCollection(prev => prev.map(c => c.id === id ? data : c))
    return { error }
  }

  async function markUnread(id) {
    const { data, error } = await supabase
      .from('collection')
      .update({ read_at: null })
      .eq('id', id)
      .eq('user_id', user.id)
      .select(`*, comics(*)`)
      .single()
    if (!error) setCollection(prev => prev.map(c => c.id === id ? data : c))
    return { error }
  }

  async function removeComic(id) {
    const { error } = await supabase
      .from('collection')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
    if (error) return { error: error.message }
    setCollection(prev => prev.filter(c => c.id !== id))
    return {}
  }

  // Computed stats
  // Compute series completion stats
  const series = useMemo(() => {
    const seriesMap = {}
    collection.forEach(c => {
      const vid = c.comics?.volume_id
      if (!vid) return
      if (!seriesMap[vid]) {
        seriesMap[vid] = {
          volume_id:    vid,
          name:         c.comics?.title || c.comics?.volume_name || 'Unknown',
          publisher:    c.comics?.publisher || '',
          total:        c.comics?.volume_issue_count || null,
          owned:        0,
          issues:       [],
        }
      }
      seriesMap[vid].owned++
      seriesMap[vid].issues.push(c)
    })
    return Object.values(seriesMap).sort((a, b) => {
      const aComplete = a.total && a.owned >= a.total
      const bComplete = b.total && b.owned >= b.total
      if (aComplete && !bComplete) return -1
      if (!aComplete && bComplete) return 1
      return b.owned - a.owned
    })
  }, [collection])

  const stats = useMemo(() => ({
    total:       collection.length,
    totalValue:  collection.reduce((s, c) => s + Number(c.current_value || 0), 0),
    totalSpent:  collection.reduce((s, c) => s + Number(c.paid_price || 0), 0),
    publishers:  [...new Set(collection.map(c => c.comics?.publisher).filter(Boolean))].length,
    read:        collection.filter(c => !!c.read_at).length,
    unread:      collection.filter(c => !c.read_at).length,
  }), [collection])

  return { collection, loading, error, stats, series, addComic, updateComic, removeComic, markRead, markUnread, refresh: fetch }
}
