import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useWishlist() {
  const { user } = useAuth()
  const [wishlist, setWishlist] = useState([])
  const [loading, setLoading]  = useState(true)

  const fetch = useCallback(async () => {
    if (!user) { setLoading(false); return }
    setLoading(true)
    try {
      const { data } = await supabase
        .from('wishlist')
        .select('*')
        .eq('user_id', user?.id)
        .order('added_at', { ascending: false })
      setWishlist(data || [])
    } catch (_) {
      // Wishlist unavailable - leave empty
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { fetch() }, [fetch])

  async function addItem(item) {
    const { data, error } = await supabase
      .from('wishlist')
      .insert({ ...item, user_id: user?.id })
      .select()
      .single()
    if (error) return { error: error.message }
    setWishlist(prev => [data, ...prev])
    return { data }
  }

  async function removeItem(id) {
    const { error } = await supabase
      .from('wishlist')
      .delete()
      .eq('id', id)
      .eq('user_id', user?.id)
    if (!error) setWishlist(prev => prev.filter(w => w.id !== id))
  }

  async function toggleAlert(id, enabled) {
    const { data } = await supabase
      .from('wishlist')
      .update({ alert_enabled: enabled })
      .eq('id', id)
      .select()
      .single()
    setWishlist(prev => prev.map(w => w.id === id ? data : w))
  }

  return { wishlist, loading, addItem, removeItem, toggleAlert, refresh: fetch }
}

// Call this whenever a comic's price is updated to check wishlist alerts
export async function checkPriceAlerts(supabaseClient, userId, comicTitle, comicIssue, newPrice, coverUrl) {
  try {
    // Find any wishlist items for this user that match this comic and have alerts on
    const { data: matches } = await supabaseClient
      .from('wishlist')
      .select('id, title, issue_number, target_price, alert_enabled')
      .eq('user_id', userId)
      .eq('alert_enabled', true)
      .gt('target_price', 0)

    if (!matches?.length) return

    for (const item of matches) {
      const titleMatch = item.title?.toLowerCase().trim() === comicTitle?.toLowerCase().trim()
      if (!titleMatch) continue
      if (Number(newPrice) > Number(item.target_price)) continue

      // Price has hit target — write a notification
      await supabaseClient.from('activity_feed').insert({
        user_id: userId,
        type:    'price_alert',
        payload: {
          wishlist_id:   item.id,
          title:         item.title,
          issue_number:  item.issue_number || comicIssue || '',
          cover_url:     coverUrl || '',
          current_price: Number(newPrice),
          target_price:  Number(item.target_price),
        },
      })
    }
  } catch (err) {
    console.warn("[useWishlist] error:", err?.message)
  }
}
