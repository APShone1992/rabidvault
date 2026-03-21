import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '60vh', padding: '2rem', textAlign: 'center',
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🦝</div>
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: '2rem',
          letterSpacing: '0.1em', marginBottom: '0.75rem',
          textShadow: '0 2px 16px rgba(139,92,246,0.4)',
        }}>
          Something went wrong
        </div>
        <div style={{ color: 'var(--muted)', marginBottom: '2rem', maxWidth: 400, fontSize: '0.95rem' }}>
          The vault hit an unexpected error. Your collection data is safe.
        </div>
        {this.state.error && (
          <div style={{
            fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--red)',
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1.5rem',
            maxWidth: 480, wordBreak: 'break-all',
          }}>
            {this.state.error.message}
          </div>
        )}
        <button
          className="btn btn-primary"
          onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload() }}
        >
          Reload The Vault
        </button>
      </div>
    )
  }
}
