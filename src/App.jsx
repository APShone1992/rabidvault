import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { CollectionProvider } from './context/CollectionContext'
import { AchievementsProvider } from './context/AchievementsContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Collection from './pages/Collection'
import Wishlist from './pages/Wishlist'
import NewReleases from './pages/NewReleases'
import Friends from './pages/Friends'
import AddComic from './pages/AddComic'
import Analytics from './pages/Analytics'
import Market from './pages/Market'
import Achievements from './pages/Achievements'
import Settings from './pages/Settings'
import { useOnlineStatus, registerServiceWorker } from './lib/offlineCache'
import Sidebar from './components/Sidebar'
import MobileNav from './components/MobileNav'
import { Menu, Search } from 'lucide-react'
import CommandPalette from './components/CommandPalette'
import PublicProfile from './pages/PublicProfile'
import Series       from './pages/Series'
import ReadingOrder from './pages/ReadingOrder'
import ErrorBoundary from './components/ErrorBoundary'
import { ToastProvider } from './context/ToastContext'
import './App.css'

registerServiceWorker()

function AppInner() {
  const { user, profile, loading, signOut } = useAuth()
  const isOnline = useOnlineStatus()
  const [page, setPage] = useState('dashboard')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [cmdOpen, setCmdOpen] = useState(false)
  const [viewProfile, setViewProfile] = useState(null)
  const [pageKey, setPageKey] = useState(0)

  // All hooks before any conditional returns
  const handleSetPage = (p) => { setPage(p); setPageKey(k => k + 1) }

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCmdOpen(o => !o)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)' }}>
      <div style={{ textAlign:'center' }}>
        <img src={`${import.meta.env.BASE_URL}logo.png`} alt="The Rabid Vault" style={{ width:120, height:120, objectFit:'contain', marginBottom:'1rem' }} />
        <div style={{ fontFamily:'var(--font-display)', fontSize:'1.5rem', letterSpacing:'0.1em', color:'var(--text)' }}>LOADING...</div>
      </div>
    </div>
  )

  if (!user) return <Login />

  const renderPage = () => {
    switch (page) {
      case 'dashboard':    return <Dashboard setPage={handleSetPage} />
      case 'analytics':    return <Analytics />
      case 'collection':   return <Collection />
      case 'add':          return <AddComic />
      case 'wishlist':     return <Wishlist />
      case 'releases':     return <NewReleases />
      case 'market':       return <Market />
      case 'friends':      return <Friends onViewProfile={(username) => { setViewProfile(username); handleSetPage('profile') }} />
      case 'achievements': return <Achievements />
      case 'settings':     return <Settings />
      case 'profile':      return <PublicProfile username={viewProfile} onBack={() => handleSetPage('friends')} />
      case 'series':       return <Series />
      case 'reading':      return <ReadingOrder setPage={handleSetPage} />
      default:             return <Dashboard setPage={handleSetPage} />
    }
  }

  return (
    <div className="app-layout">
      {!isOnline && (
        <div style={{
          position:'fixed', top:0, left:0, right:0, zIndex:9999,
          background:'rgba(245,158,11,0.95)', color:'#111',
          padding:'8px 16px', textAlign:'center',
          fontSize:'0.82rem', fontWeight:700,
        }}>
          ⚠️ You are offline — showing cached data. Changes will sync when you reconnect.
        </div>
      )}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:99, backdropFilter:'blur(2px)' }}
        />
      )}
      <Sidebar profile={profile} page={page} setPage={(p) => { handleSetPage(p); setMobileMenuOpen(false) }} onLogout={signOut} open={mobileMenuOpen} />
      <div className="mobile-header">
        <button className="mobile-hamburger" onClick={() => setMobileMenuOpen(o => !o)}>
          <Menu size={20} />
        </button>
        <span className="mobile-header-title">THE RABID VAULT</span>
        <button
          style={{ width:36, height:36, background:'none', border:'none', cursor:'pointer', color:'var(--muted)', display:'flex', alignItems:'center', justifyContent:'center' }}
          onClick={() => setCmdOpen(true)}
        ><Search size={18} /></button>
      </div>
      <main className="main-content" key={pageKey}>{renderPage()}</main>
      <MobileNav page={page} setPage={handleSetPage} />
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} setPage={handleSetPage} />
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider><CollectionProvider><AchievementsProvider><AppInner /></AchievementsProvider></CollectionProvider></AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  )
}
