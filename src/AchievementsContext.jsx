import { createContext, useContext, useState, useCallback, useRef } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef({})

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, leaving: true } : t))
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 300)
  }, [])

  const show = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev.slice(-4), { id, message, type, leaving: false }])
    timers.current[id] = setTimeout(() => dismiss(id), duration)
    return id
  }, [dismiss])

  const success = useCallback((msg, dur)  => show(msg, 'success', dur), [show])
  const error   = useCallback((msg, dur)  => show(msg, 'error',   dur ?? 5000), [show])
  const info    = useCallback((msg, dur)  => show(msg, 'info',    dur), [show])
  const warning = useCallback((msg, dur)  => show(msg, 'warning', dur), [show])

  const ICONS = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' }

  return (
    <ToastContext.Provider value={{ show, success, error, info, warning, dismiss }}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`toast toast-${t.type} ${t.leaving ? 'toast-out' : ''}`}
            onClick={() => dismiss(t.id)}
          >
            <span style={{ fontSize: '1rem' }}>{ICONS[t.type]}</span>
            <span style={{ flex: 1 }}>{t.message}</span>
            <span style={{ opacity: 0.5, fontSize: '0.8rem', cursor: 'pointer' }}>✕</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
