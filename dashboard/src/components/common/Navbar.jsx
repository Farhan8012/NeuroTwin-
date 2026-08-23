import React from 'react'
import { useAppState } from '../../context/AppStateContext'

export function Navbar() {
  const {
    mode, isAuthenticated, activePatient, backendOnline,
    logout, switchRole, userRole, navigateTo,
    profileMenuOpen, setProfileMenuOpen,
    setSearchOpen,
  } = useAppState()

  if (mode === 'auth') return null

  const title = mode === 'caregiver' ? 'NeuroTwin Caregiver' : 'NeuroTwin'
  const initials = activePatient.name ? activePatient.name.split(' ').map(n => n[0]).join('').slice(0, 2) : 'NT'

  return (
    <header className="nt-top-bar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Brand Icon */}
        <div style={{
          width: 32, height: 32, borderRadius: '8px',
          background: 'var(--nt-primary-container)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--nt-on-primary-container)', fontSize: 18 }}>psychology</span>
        </div>
        <span style={{
          fontSize: 16, fontWeight: 700, color: 'var(--nt-primary)',
          letterSpacing: '-0.01em',
        }}>{title}</span>

        {/* Backend status indicator */}
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          fontSize: 11, fontWeight: 500, color: backendOnline ? 'var(--nt-success)' : 'var(--nt-on-surface-variant)',
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: backendOnline ? 'var(--nt-success)' : 'var(--nt-outline-variant)',
          }} />
          {backendOnline ? 'Live' : 'Offline'}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Search */}
        <button className="nt-btn-ghost" onClick={() => setSearchOpen(true)} aria-label="Search">
          <span className="material-symbols-outlined">search</span>
        </button>

        {/* Profile Menu */}
        <div style={{ position: 'relative' }}>
          <button
            className="nt-btn-ghost"
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            aria-label="Profile menu"
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'var(--nt-primary)',
              color: 'var(--nt-on-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, padding: 0, minHeight: 'auto',
            }}
          >
            {initials}
          </button>

          {profileMenuOpen && (
            <div style={{
              position: 'absolute', top: '100%', right: 0, marginTop: 8,
              background: 'var(--nt-surface-lowest)',
              border: '1px solid var(--nt-outline-variant)',
              borderRadius: 'var(--r-lg)',
              padding: '8px 0',
              minWidth: 200,
              boxShadow: 'var(--shadow-float)',
              zIndex: 100,
            }}>
              <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--nt-outline-variant)',
              }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--nt-on-surface)' }}>
                  {activePatient.name || 'User'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--nt-on-surface-variant)', marginTop: 2 }}>
                  {userRole === 'caregiver' ? 'Caregiver Portal' : 'Patient Companion'}
                </div>
              </div>

              {/* Role switch — only for caregivers */}
              {userRole === 'caregiver' && (
                <button
                  onClick={() => switchRole(mode === 'caregiver' ? 'patient' : 'caregiver')}
                  style={{
                    width: '100%', textAlign: 'left', padding: '10px 16px',
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 14, fontWeight: 500, color: 'var(--nt-on-surface)',
                    display: 'flex', alignItems: 'center', gap: 8,
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>swap_horiz</span>
                  Switch to {mode === 'caregiver' ? 'Patient View' : 'Caregiver Portal'}
                </button>
              )}

              <button
                onClick={() => navigateTo('settings')}
                style={{
                  width: '100%', textAlign: 'left', padding: '10px 16px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 14, fontWeight: 500, color: 'var(--nt-on-surface)',
                  display: 'flex', alignItems: 'center', gap: 8,
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>settings</span>
                Settings
              </button>

              <button
                onClick={logout}
                style={{
                  width: '100%', textAlign: 'left', padding: '10px 16px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 14, fontWeight: 500, color: 'var(--nt-error)',
                  display: 'flex', alignItems: 'center', gap: 8,
                  fontFamily: 'Inter, sans-serif',
                  borderTop: '1px solid var(--nt-outline-variant)',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>logout</span>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
