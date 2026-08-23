import React from 'react'
import { useAppState } from '../../context/AppStateContext'

export function PatientProfileView() {
  const { activePatient, fontScale, setFontScale, isDarkMode, setIsDarkMode, logout, backendOnline } = useAppState()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--nt-on-surface)' }}>Profile & Settings</h2>

      {/* Profile Card */}
      <div className="nt-card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'var(--nt-primary-fixed)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24, fontWeight: 700, color: 'var(--nt-primary)',
        }}>
          {activePatient.name ? activePatient.name.charAt(0) : 'U'}
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--nt-on-surface)' }}>{activePatient.name || 'Patient'}</div>
          <div style={{ fontSize: 13, color: 'var(--nt-on-surface-variant)' }}>Patient Companion</div>
          <div style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, color: backendOnline ? 'var(--nt-success)' : 'var(--nt-on-surface-variant)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: backendOnline ? 'var(--nt-success)' : 'var(--nt-outline-variant)' }} />
            {backendOnline ? 'Connected' : 'Offline'}
          </div>
        </div>
      </div>

      {/* Font Size */}
      <div className="nt-card">
        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--nt-on-surface-variant)', marginBottom: 12, letterSpacing: '0.01em' }}>Text Size</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[
            { value: 'normal', label: 'Normal', sample: 'Aa' },
            { value: 'large', label: 'Large', sample: 'Aa' },
            { value: 'xlarge', label: 'Extra Large', sample: 'Aa' },
          ].map((s) => (
            <button
              key={s.value}
              onClick={() => setFontScale(s.value)}
              style={{
                padding: '12px 8px', borderRadius: 'var(--r-md)',
                border: `2px solid ${fontScale === s.value ? 'var(--nt-primary)' : 'var(--nt-outline-variant)'}`,
                background: fontScale === s.value ? 'var(--nt-primary-fixed)' : 'transparent',
                cursor: 'pointer', textAlign: 'center', fontFamily: 'Inter, sans-serif',
              }}
            >
              <div style={{ fontSize: s.value === 'xlarge' ? 22 : s.value === 'large' ? 18 : 14, fontWeight: 700, color: 'var(--nt-primary)' }}>{s.sample}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--nt-on-surface-variant)', marginTop: 4 }}>{s.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Dark Mode */}
      <div className="nt-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--nt-on-surface-variant)' }}>dark_mode</span>
          <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--nt-on-surface)' }}>Dark Mode</span>
        </div>
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          style={{
            width: 48, height: 28, borderRadius: 'var(--r-full)',
            background: isDarkMode ? 'var(--nt-primary)' : 'var(--nt-outline-variant)',
            border: 'none', cursor: 'pointer', position: 'relative',
            transition: 'background 0.2s ease',
          }}
        >
          <span style={{
            position: 'absolute', top: 2, left: isDarkMode ? 22 : 2,
            width: 24, height: 24, borderRadius: '50%', background: 'white',
            transition: 'left 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }} />
        </button>
      </div>

      {/* Sign Out */}
      <button className="nt-btn nt-btn-secondary" onClick={logout} style={{ width: '100%', color: 'var(--nt-error)' }}>
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>logout</span>
        Sign Out
      </button>
    </div>
  )
}
