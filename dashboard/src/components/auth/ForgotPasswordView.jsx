import React, { useState } from 'react'
import { useAppState } from '../../context/AppStateContext'

export function ForgotPasswordView() {
  const { navigateTo } = useAppState()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setSent(true)
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '24px 16px',
      background: 'linear-gradient(180deg, var(--nt-surface) 0%, var(--nt-surface-low) 100%)',
    }}>
      {/* Brand */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: 'var(--nt-primary-container)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
        }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--nt-on-primary-container)', fontSize: 28 }}>psychology</span>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--nt-primary)', letterSpacing: '-0.02em' }}>NeuroTwin</h1>
      </div>

      <div className="nt-card" style={{ width: '100%', maxWidth: 400, padding: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--nt-on-surface)', marginBottom: 8 }}>Reset Password</h2>
        <p style={{ fontSize: 14, color: 'var(--nt-on-surface-variant)', marginBottom: 24 }}>
          Enter your email address and we'll send you a link to reset your password.
        </p>

        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: 'var(--nt-success-light)', color: 'var(--nt-success-dark)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 24 }}>check_circle</span>
            </div>
            <p style={{ fontSize: 14, color: 'var(--nt-on-surface)', marginBottom: 24 }}>
              Check your email for a link to reset your password.
            </p>
            <button className="nt-btn nt-btn-primary" onClick={() => navigateTo('signin')} style={{ width: '100%' }}>
              Return to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="nt-label">Email</label>
              <input
                type="email"
                className="nt-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="nt-btn nt-btn-primary" style={{ width: '100%' }}>
              Send Reset Link
            </button>
          </form>
        )}

        {!sent && (
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <button
              onClick={() => navigateTo('signin')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 14, fontWeight: 600, color: 'var(--nt-primary)',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              Back to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
