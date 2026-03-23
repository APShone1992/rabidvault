import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const AchievementsContext = createContext(null)
const XP_PER_LEVEL = 1000

export function AchievementsProvider({ children }) {
  const { user, profile } = useAuth()
  const [achievements,     setAchievements]     = useState([])
  const [userAchievements, setUserAchievements] = useState([])
  const [loading,          setLoading]          = useState(true)

  const fetch = useCallback(async () => {
    if (!user) { setLoading(false); return }
    setLoading(true)
    try {
      const [{ data: all }, { data: mine }] = await Promise.all([
        supabase.from('achievements').select('*').order('xp_reward'),
        supabase.from('user_achievements').select('achievement_id, unlocked_at, achievements(id,name,icon,description,xp_reward,tier)').eq('user_id', user?.id),
      ])
      setAchievements(all || [])
      setUserAchievements(mine || [])
    } catch (_) {
      // Achievements unavailable - non-critical feature
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => { fetch() }, [fetch])

  async function awardXP(amount, reason) {
    if (!user || !profile) return
    const newXP    = (profile.xp    || 0) + amount
    const newLevel = Math.floor(newXP / XP_PER_LEVEL) + 1
    await Promise.all([
      supabase.from('profiles').update({ xp: newXP, level: newLevel }).eq('id', user.id),
      supabase.from('xp_log').insert({ user_id: user.id, amount, reason }),
    ])
  }

  async function checkAchievement(achievementId) {
    if (!user) return false
    if (userAchievements.some(ua => ua.achievement_id === achievementId)) return false
    const { error } = await supabase.from('user_achievements')
      .insert({ user_id: user.id, achievement_id: achievementId })
    if (!error) {
      const ach = achievements.find(a => a.id === achievementId)
      if (ach) {
        await awardXP(ach.xp_reward, `Achievement: ${ach.name}`)
        setUserAchievements(prev => [...prev, { achievement_id: achievementId, achievements: ach }])
        return true
      }
    }
    return false
  }

  const unlockedIds = useMemo(() =>
    new Set(userAchievements.map(ua => ua.achievement_id)),
    [userAchievements]
  )

  const xp         = profile?.xp    || 0
  const level      = profile?.level || 1
  const xpInLevel  = xp % XP_PER_LEVEL
  const xpProgress = (xpInLevel / XP_PER_LEVEL) * 100

  return (
    <AchievementsContext.Provider value={{
      achievements, userAchievements, unlockedIds,
      loading, xp, level, xpInLevel, xpProgress,
      awardXP, checkAchievement, refresh: fetch,
    }}>
      {children}
    </AchievementsContext.Provider>
  )
}

export const useAchievements = () => {
  const ctx = useContext(AchievementsContext)
  if (!ctx) throw new Error('useAchievements must be used within AchievementsProvider')
  return ctx
}
