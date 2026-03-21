import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import './Login.css'

export default function Login() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode]   = useState('login')
  const [form, setForm]   = useState({ username: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    let result
    try {
    if (mode === 'register') {
      if (!form.username || !form.email || !form.password) {
        setError('Please fill in all fields.'); setLoading(false); return
      }
      if (form.password.length < 6) {
        setError('Password must be at least 6 characters.'); setLoading(false); return
      }
      result = await signUp(form.email, form.password, form.username)
      if (!result.error) {
        setError('') 
        // Supabase sends a confirmation email by default
        // You can disable this in: Supabase → Authentication → Providers → Email
        setMode('check-email')
      }
    } else {
      result = await signIn(form.email, form.password)
    }

    if (result?.error) setError(result.error.message)
    } catch (err) {
      setError('Connection error. Please check your internet and try again.')
    } finally {
      setLoading(false)
    }
  }

  if (mode === 'check-email') {
    return (
      <div className="login-page">
        <div className="login-bg" />
      <div className="login-panels">
        {[
          { w:60, h:80,  left:'8%',   dur:'18s', delay:'0s',   rot:'-8deg'  },
          { w:45, h:65,  left:'18%',  dur:'22s', delay:'-6s',  rot:'5deg'   },
          { w:70, h:95,  left:'75%',  dur:'16s', delay:'-4s',  rot:'10deg'  },
          { w:50, h:70,  left:'85%',  dur:'24s', delay:'-10s', rot:'-5deg'  },
          { w:40, h:56,  left:'55%',  dur:'20s', delay:'-8s',  rot:'3deg'   },
          { w:65, h:88,  left:'32%',  dur:'26s', delay:'-14s', rot:'-12deg' },
        ].map((p, i) => (
          <div key={i} className="login-panel" style={{
            width: p.w, height: p.h, left: p.left,
            '--rot': p.rot,
            animationDuration: p.dur,
            animationDelay: p.delay,
          }} />
        ))}
      </div>
        <div className="login-box" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📬</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>CHECK YOUR EMAIL</h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            We sent a confirmation link to <strong>{form.email}</strong>.<br />
            Click it to activate your account, then come back and sign in.
          </p>
          <button className="btn btn-outline" onClick={() => setMode('login')}>Back to Sign In</button>
          <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '1rem' }}>
            Tip: to skip email confirmation during dev, go to<br />
            Supabase → Authentication → Providers → Email → disable "Confirm email"
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="login-page">
      <div className="login-bg" />
      <div className="login-box">
        <div className="login-logo">
          <img loading="lazy" src={`${import.meta.env.BASE_URL}logo.png`} alt="The Rabid Vault" />
        </div>
        <h1 className="login-title">THE RABID VAULT</h1>
        <p className="login-sub">Enter the vault. Own every issue.</p>

        <div className="login-tabs">
          <button className={`login-tab ${mode === 'login' ? 'active' : ''}`} onClick={() => setMode('login')}>Sign In</button>
          <button className={`login-tab ${mode === 'register' ? 'active' : ''}`} onClick={() => setMode('register')}>Register</button>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label">Username</label>
              <input className="form-input" type="text" placeholder="raccoon_reader"
                value={form.username} onChange={set('username')} />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" placeholder="you@example.com"
              value={form.email} onChange={set('email')} />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" placeholder="••••••••"
              value={form.password} onChange={set('password')} />
          </div>

          {error && <div className="login-error">{error}</div>}

          <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
            {loading ? '⏳ Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
        <div className="login-footer">THE RABID VAULT · COMIC BOOK TRACKER</div>
      </div>
    </div>
  )
}
