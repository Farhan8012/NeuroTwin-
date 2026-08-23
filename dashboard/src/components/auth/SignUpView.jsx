import React, { useState } from 'react'
import { useAppState } from '../../context/AppStateContext'

export function SignUpView() {
  const { signUp, navigateTo } = useAppState()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('caregiver')

  const handleSubmit = (e) => {
    e.preventDefault()
    signUp(fullName, email, role)
  }

  return (
    <div style={{
      minHeight: '100vh', minHeight: '100dvh',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '24px 16px',
      background: 'linear-gradient(180deg, var(--nt-surface) 0%, var(--nt-surface-low) 100%)',
    }}>
      {/* Brand */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: 'var(--nt-primary-container)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
        }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--nt-on-primary-container)', fontSize: 28 }}>psychology</span>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--nt-primary)', letterSpacing: '-0.01em' }}>Create Account</h1>
        <p style={{ fontSize: 14, color: 'var(--nt-on-surface-variant)', marginTop: 4 }}>Join the NeuroTwin care network</p>
      </div>

      <div className="nt-card" style={{ width: '100%', maxWidth: 400, padding: 24 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Role */}
          <div>
            <label className="nt-label">I am a</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {['caregiver', 'patient'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  style={{
                    padding: '12px 16px', borderRadius: 'var(--r-md)',
                    border: `2px solid ${role === r ? 'var(--nt-primary)' : 'var(--nt-outline-variant)'}`,
                    background: role === r ? 'var(--nt-primary-fixed)' : 'transparent',
                    color: role === r ? 'var(--nt-primary)' : 'var(--nt-on-surface-variant)',
                    fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                    {r === 'caregiver' ? 'medical_services' : 'person'}
                  </span>
                  {r === 'caregiver' ? 'Caregiver' : 'Patient'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="nt-label">Full Name</label>
            <input type="text" className="nt-input" placeholder="Sarah Varma" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>

          <div>
            <label className="nt-label">Email</label>
            <input type="email" className="nt-input" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div>
            <label className="nt-label">Password</label>
            <input type="password" className="nt-input" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          <button type="submit" className="nt-btn nt-btn-primary" style={{ width: '100%' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>person_add</span>
            Create Account
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <span style={{ fontSize: 14, color: 'var(--nt-on-surface-variant)' }}>Already have an account? </span>
          <button
            onClick={() => navigateTo('signin')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 14, fontWeight: 600, color: 'var(--nt-primary)',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  )
}
