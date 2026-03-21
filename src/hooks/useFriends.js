import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useFriends() {
  const { user } = useAuth()
  const [friends,           setFriends]           = useState([])
  const [pending,           setPending]           = useState([])
  const [loading,           setLoading]           = useState(true)
  const [friendOwnedTitles, setFriendOwnedTitles] = useState(new Set())

  const fetch = useCallback(async () => {
    if (!user) { setLoading(false); return }
    setLoading(true)
    try {
      const { data } = await supabase
        .from('friendships')
        .select(`
          *,
          requester_profile:profiles!friendships_requester_fkey(id, username, avatar_url, last_seen),
          addressee_profile:profiles!friendships_addressee_fkey(id, username, avatar_url, last_seen)
        `)
        .or(`requester.eq.${user.id},addressee.eq.${user.id}`)

      const accepted = (data || []).filter(f => f.status === 'accepted').map(f =>
        f.requester === user.id ? f.addressee_profile : f.requester_profile
      )
      const incoming = (data || []).filter(f => f.status === 'pending' && f.addressee === user.id)

      setFriends(accepted)
      setPending(incoming)

      // Fetch comic titles owned by friends for wishlist badge
      if (accepted.length > 0) {
        try {
          const friendIds = accepted.map(f => f?.id).filter(Boolean)
          const { data: friendComics } = await supabase
            .from('collection')
            .select('user_id, comics(title)')
            .in('user_id', friendIds)
          const titles = new Set(
            (friendComics || [])
              .map(c => c.comics?.title?.toLowerCase().trim())
              .filter(Boolean)
          )
          setFriendOwnedTitles(titles)
        } catch (_) { /* non-critical */ }
      }
    } catch (_) {
      // Network error - leave existing state
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { fetch() }, [fetch])

  // Heartbeat — update last_seen every 60s
  useEffect(() => {
    if (!user) return
    let alive = true
    const ping = async () => {
      if (!alive) return
      await supabase.from('profiles').update({ last_seen: new Date().toISOString() }).eq('id', user.id)
    }
    ping()
    const interval = setInterval(ping, 60000)
    return () => { alive = false; clearInterval(interval) }
  }, [user?.id])

  async function searchUser(username) {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, last_seen')
        .ilike('username', `%${username}%`)
        .neq('id', user?.id)
        .limit(10)
      return data || []
    } catch (_) { return [] }
  }

  async function sendRequest(addresseeId) {
    try {
      const { error } = await supabase
        .from('friendships')
        .insert({ requester: user?.id, addressee: addresseeId })
      return { error }
    } catch (err) {
      return { error: { message: 'Connection error. Please try again.' } }
    }
  }

  async function acceptRequest(friendshipId) {
    await supabase.from('friendships').update({ status: 'accepted' }).eq('id', friendshipId)
    fetch()
  }

  async function removeFriend(friendId) {
    await supabase.from('friendships').delete()
      .or(
        `and(requester.eq.${user.id},addressee.eq.${friendId}),` +
        `and(requester.eq.${friendId},addressee.eq.${user.id})`
      )
    setFriends(prev => prev.filter(f => f.id !== friendId))
  }

  function friendOwns(title) {
    if (!title) return false
    return friendOwnedTitles.has(title.toLowerCase().trim())
  }

  return { friends, pending, loading, friendOwnedTitles, searchUser, sendRequest, acceptRequest, removeFriend, friendOwns, refresh: fetch }
}
