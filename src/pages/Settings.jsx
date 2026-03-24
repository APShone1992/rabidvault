import { useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { fileToBase64 } from '../lib/vision'
import { IconCamera, IconLink, IconCopy, IconDelete } from '../lib/icons'
import { useToast } from '../context/ToastContext'

export default function Settings() {
  const { user, profile, updateProfile, signOut } = useAuth()

  const [profileForm, setProfileForm] = useState({
    username: profile?.username || '',
    bio:      profile?.bio      || '',
  })
  const [emailForm,    setEmailForm]    = useState({ email: user?.email || '' })
  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' })
  const [avatarPreview, setAvatarPreview] = useState(profile?.avatar_url || '')

  const [saving,  setSaving]  = useState({})
  const toast = useToast()

  const avatarRef = useRef()

  // ── Avatar upload ────────────────────────────────────────────
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast.error('Image must be under 2MB'); return }

    setSaving(s => ({...s, avatar: true}))
    
    try {
      const base64 = await fileToBase64(file)
      const path   = `avatars/${user.id}/${Date.now()}.jpg`

      // Upload to Supabase Storage
      const { error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type })
      if (uploadErr) throw uploadErr

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      await updateProfile({ avatar_url: publicUrl })
      setAvatarPreview(publicUrl)
      toast.success('Profile photo updated!')
    } catch (err) {
      toast.error(err.message)
    }
    setSaving(s => ({...s, avatar: false}))
  }

  // ── Update profile (username / bio) ─────────────────────────
  const handleProfileSave = async (e) => {
    e.preventDefault()
    if (!profileForm.username.trim()) { toast.error('Username is required'); return }
    setSaving(s => ({...s, profile: true}))
    
    const { error } = await updateProfile({ username: profileForm.username.trim(), bio: profileForm.bio.trim() })
    if (error) toast.error(error.message)
    else { toast.success('Profile saved!') }
    setSaving(s => ({...s, profile: false}))
  }

  // ── Update email ─────────────────────────────────────────────
  const handleEmailSave = async (e) => {
    e.preventDefault()
    if (!emailForm.email.trim()) { toast.error('Email is required'); return }
    setSaving(s => ({...s, email: true}))
    
    const { error } = await supabase.auth.updateUser({ email: emailForm.email.trim() })
    if (error) toast.error(error.message)
    else { toast.success('Confirmation sent to your new email address!') }
    setSaving(s => ({...s, email: false}))
  }

  // ── Update password ──────────────────────────────────────────
  const handlePasswordSave = async (e) => {
    e.preventDefault()
    if (passwordForm.newPass.length < 6) { toast.error('Password must be at least 6 characters'); return }
    if (passwordForm.newPass !== passwordForm.confirm) { toast.error('Passwords do not match'); return }
    setSaving(s => ({...s, password: true}))
    
    const { error } = await supabase.auth.updateUser({ password: passwordForm.newPass })
    if (error) toast.error(error.message)
    else {
      setPasswordForm({ current: '', newPass: '', confirm: '' })
      toast.success('Password updated!')
    }
    setSaving(s => ({...s, password: false}))
  }

  // ── Delete account ───────────────────────────────────────────
  const handleDeleteAccount = async () => {
    // Single confirmation using toast notification system
    const confirmed = window.confirm(
      'DELETE ACCOUNT\n\nThis permanently deletes your account and ALL your comics. There is no undo.\n\nType OK to confirm.'
    )
    if (!confirmed) return
    await supabase.rpc('delete_user')
    await signOut()
  }

  if (!profile && !user) return null
  return (
    <div className="page-enter" style={{ maxWidth: 580 }}>
      <h1 className="section-title" style={{ marginBottom: '1.75rem' }}>Settings</h1>

      {/* ── AVATAR ── */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ fontWeight: 800, marginBottom: '1rem' }}>Profile Photo</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
            background: 'var(--purple)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.8rem', fontWeight: 800, border: '2px solid var(--border)',
          }}>
            {avatarPreview
              ? <img loading="lazy" src={avatarPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setAvatarPreview('')} />
              : profile?.username?.[0]?.toUpperCase() || '?'
            }
          </div>
          <div>
            <input ref={avatarRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
            <button className="btn btn-primary btn-sm" onClick={() => avatarRef.current.click()} disabled={saving.avatar}>
              {saving.avatar ? 'Uploading...' : '📷 Change Photo'}
            </button>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.4rem' }}>JPG or PNG, max 2MB</div>
            {errors.avatar   && <div style={{ color: 'var(--red)',   fontSize: '0.8rem', marginTop: '0.3rem' }}>⚠️ {errors.avatar}</div>}
            {success.avatar  && <div style={{ color: 'var(--green)', fontSize: '0.8rem', marginTop: '0.3rem' }}>✓ Photo updated!</div>}
          </div>
        </div>
      </div>

      {/* ── PROFILE ── */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ fontWeight: 800, marginBottom: '1rem' }}>Profile Details</div>
        <form onSubmit={handleProfileSave}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input className="form-input" value={profileForm.username}
              onChange={e => setProfileForm(f => ({ ...f, username: e.target.value }))}
              placeholder="Your username" />
          </div>
          <div className="form-group">
            <label className="form-label">Bio (optional)</label>
            <input className="form-input" value={profileForm.bio}
              onChange={e => setProfileForm(f => ({ ...f, bio: e.target.value }))}
              placeholder="Tell other collectors about yourself..." />
          </div>
          {errors.profile  && <div style={{ color: 'var(--red)',   fontSize: '0.85rem', marginBottom: '0.75rem' }}>⚠️ {errors.profile}</div>}
          {success.profile && <div style={{ color: 'var(--green)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>✓ Profile saved!</div>}
          <button type="submit" className="btn btn-primary" disabled={saving.profile}>
            {saving.profile ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>

      {/* ── EMAIL ── */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ fontWeight: 800, marginBottom: '1rem' }}>Email Address</div>
        <form onSubmit={handleEmailSave}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={emailForm.email}
              onChange={e => setEmailForm({ email: e.target.value })} />
          </div>
          {errors.email  && <div style={{ color: 'var(--red)',   fontSize: '0.85rem', marginBottom: '0.75rem' }}>⚠️ {errors.email}</div>}
          {success.email && <div style={{ color: 'var(--green)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>✓ Confirmation sent to new email address!</div>}
          <button type="submit" className="btn btn-primary" disabled={saving.email}>
            {saving.email ? 'Saving...' : 'Update Email'}
          </button>
        </form>
      </div>

      {/* ── PASSWORD ── */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ fontWeight: 800, marginBottom: '1rem' }}>Change Password</div>
        <form onSubmit={handlePasswordSave}>
          <div className="form-group">
            <label className="form-label">New Password</label>
            <input className="form-input" type="password" placeholder="At least 6 characters"
              value={passwordForm.newPass} onChange={e => setPasswordForm(f => ({ ...f, newPass: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <input className="form-input" type="password" placeholder="Repeat password"
              value={passwordForm.confirm} onChange={e => setPasswordForm(f => ({ ...f, confirm: e.target.value }))} />
          </div>
          {errors.password  && <div style={{ color: 'var(--red)',   fontSize: '0.85rem', marginBottom: '0.75rem' }}>⚠️ {errors.password}</div>}
          {success.password && <div style={{ color: 'var(--green)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>✓ Password updated!</div>}
          <button type="submit" className="btn btn-primary" disabled={saving.password}>
            {saving.password ? 'Saving...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* ── ACCOUNT INFO ── */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ fontWeight: 800, marginBottom: '0.75rem' }}>Account Info</div>
        <div style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 2 }}>
          <div>Account ID: <span style={{ fontFamily: 'monospace', color: 'var(--text)' }}>{user?.id?.substring(0, 16)}...</span></div>
          <div>Created: <span style={{ color: 'var(--text)' }}>{new Date(user?.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
          <div>Email confirmed: <span style={{ color: user?.email_confirmed_at ? 'var(--green)' : 'var(--red)' }}>{user?.email_confirmed_at ? '✓ Yes' : '✗ No'}</span></div>
        </div>
      </div>

      {/* ── PUBLIC PROFILE ── */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ fontWeight: 800, marginBottom: '0.75rem' }}>Public Profile</div>
        <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '1rem' }}>
          Your collection is publicly viewable. Share your vault with other collectors.
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ fontFamily: 'monospace', fontSize: '0.82rem', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 12px', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {window.location.origin}/#/profile/{profile?.username || '...'}
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => {
            navigator.clipboard?.writeText(`${window.location.origin}/#/profile/${profile?.username}`)
            toast.success('Profile URL copied!')
          }}>
            🔗 Copy Link
          </button>
        </div>
      </div>

      {/* ── DANGER ZONE ── */}
      <div className="card" style={{ borderColor: 'rgba(239,68,68,0.3)', marginBottom: '2rem' }}>
        <div style={{ fontWeight: 800, color: 'var(--red)', marginBottom: '0.5rem' }}>Danger Zone</div>
        <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '1rem' }}>
          Permanently delete your account and all your comic data. This cannot be undone.
        </div>
        <button
          className="btn"
          style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--red)', border: '1px solid rgba(239,68,68,0.4)' }}
          onClick={handleDeleteAccount}
        >
          🗑 Delete My Account
        </button>
      </div>
    </div>
  )
}
