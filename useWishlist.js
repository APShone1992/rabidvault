import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount,   setUnreadCount]   = useState(0)
  const [loading,       setLoading]       = useState(true)

  const fetch = useCallback(async () => {
    if (!user) { setLoading(false); return }
    try {
      const { data } = await supabase
        .from('activity_feed')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(30)

      const items = data || []
      setNotifications(items)

      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const unread = items.filter(n => n.created_at > cutoff && !n.read_at)
      setUnreadCount(unread.length)
    } catch (_) {
      // Notifications unavailable - non-critical
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetch()

    // Subscribe to real-time inserts so the bell updates instantly
    if (!user) return
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'activity_feed',
        filter: `user_id=eq.${user.id}`,
      }, payload => {
        setNotifications(prev => [payload.new, ...prev])
        setUnreadCount(c => c + 1)
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [fetch, user])

  // Mark all notifications as read
  async function markAllRead() {
    if (!user || !notifications.length) return
    const ids = notifications.filter(n => !n.read_at).map(n => n.id)
    if (!ids.length) return
    await supabase
      .from('activity_feed')
      .update({ read_at: new Date().toISOString() })
      .in('id', ids)
    setUnreadCount(0)
    setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() })))
  }

  // Mark one notification as read
  async function markRead(id) {
    await supabase
      .from('activity_feed')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
    setUnreadCount(c => Math.max(0, c - 1))
  }

  async function deleteNotification(id) {
    await supabase.from('activity_feed').delete().eq('id', id)
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  return { notifications, unreadCount, loading, markAllRead, markRead, deleteNotification, refresh: fetch }
}
