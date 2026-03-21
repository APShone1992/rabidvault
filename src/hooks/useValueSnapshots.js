// useValueSnapshots.js
// Fetches weekly collection value history for trend charts
// Also provides takeSnapshot() to manually record current value

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useValueSnapshots() {
  const { user } = useAuth()
  const [snapshots, setSnapshots] = useState([])
  const [loading,   setLoading]   = useState(true)

  const fetch = useCallback(async () => {
    if (!user) { setLoading(false); return }
    try {
      const { data } = await supabase
        .from('value_snapshots')
        .select('total_value, total_spent, comic_count, recorded_at')
        .eq('user_id', user?.id)
        .order('recorded_at', { ascending: true })
        .limit(52) // one year of weekly snapshots
      setSnapshots(data || [])
    } catch (_) {
      // Non-critical — snapshots unavailable
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { fetch() }, [fetch])

  // Record a snapshot right now (called after adding/editing comics)
  async function takeSnapshot(totalValue, totalSpent, comicCount) {
    if (!user) return
    try {
      const { data: last } = await supabase
        .from('value_snapshots')
        .select('total_value, recorded_at')
        .eq('user_id', user?.id)
        .order('recorded_at', { ascending: false })
        .limit(1)

      // Don't snapshot more than once per hour
      if (last?.[0]) {
        const hourAgo = Date.now() - 60 * 60 * 1000
        if (new Date(last[0].recorded_at).getTime() > hourAgo) return
      }

      const { data } = await supabase
        .from('value_snapshots')
        .insert({ user_id: user.id, total_value: totalValue, total_spent: totalSpent, comic_count: comicCount })
        .select().single()

      if (data) setSnapshots(prev => [...prev, data])
    } catch (_) { /* non-critical */ }
  }

  // Compute week-over-week change
  const weeklyChange = snapshots.length >= 2
    ? snapshots[snapshots.length - 1].total_value - snapshots[snapshots.length - 2].total_value
    : null

  // Best week gain
  const bestWeek = snapshots.length >= 2
    ? Math.max(...snapshots.slice(1).map((s, i) => s.total_value - snapshots[i].total_value))
    : null

  return { snapshots, loading, takeSnapshot, weeklyChange, bestWeek, refresh: fetch }
}
