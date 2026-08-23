import React from 'react'
import { useAppState } from '../../context/AppStateContext'

export function SettingsView() {
  const { isDarkMode, setIsDarkMode, fontScale, setFontScale, logout, activePatient, backendOnline, systemHealth } = useAppState()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="material-symbols-outlined" style={{ color: 'var(--nt-primary)' }}>settings</span>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--nt-on-surface)' }}>Settings</h2>
      </div>

      <div className="nt-card" style={{ padding: 'var(--sp-lg)', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Appearance */}
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--nt-on-surface)', marginBottom: 16 }}>Appearance</h3>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--nt-on-surface)' }}>Dark Mode</div>
              <div style={{ fontSize: 13, color: 'var(--nt-on-surface-variant)' }}>Adjust for low light environments</div>
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

          <div>
            <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--nt-on-surface)', marginBottom: 4 }}>Text Size</div>
            <div style={{ fontSize: 13, color: 'var(--nt-on-surface-variant)', marginBottom: 12 }}>Adjust the scale of text across the app</div>
            
            <div style={{ display: 'flex', gap: 8 }}>
              {['normal', 'large', 'xlarge'].map((s) => (
                <button
                  key={s}
                  onClick={() => setFontScale(s)}
                  style={{
                    flex: 1, padding: '10px', borderRadius: 'var(--r-md)',
                    border: `2px solid ${fontScale === s ? 'var(--nt-primary)' : 'var(--nt-outline-variant)'}`,
                    background: fontScale === s ? 'var(--nt-primary-fixed)' : 'transparent',
                    color: fontScale === s ? 'var(--nt-primary)' : 'var(--nt-on-surface-variant)',
                    cursor: 'pointer', textAlign: 'center', fontFamily: 'Inter, sans-serif',
                    fontSize: 14, fontWeight: 600, textTransform: 'capitalize'
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--nt-outline-variant)' }} />

        {/* System Status */}
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--nt-on-surface)', marginBottom: 16 }}>System Status</h3>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 14, color: 'var(--nt-on-surface-variant)' }}>Backend Connection</span>
            <span className={`nt-badge ${backendOnline ? 'nt-badge-success' : 'nt-badge-error'}`}>
              {backendOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          
          {systemHealth && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 14, color: 'var(--nt-on-surface-variant)' }}>Version</span>
                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--nt-on-surface)' }}>{systemHealth.version || '1.0.0'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 14, color: 'var(--nt-on-surface-variant)' }}>Uptime</span>
                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--nt-on-surface)' }}>{systemHealth.uptime ? `${(systemHealth.uptime / 3600).toFixed(1)} hrs` : 'N/A'}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Sign Out */}
      <button className="nt-btn nt-btn-secondary" onClick={logout} style={{ width: '100%', color: 'var(--nt-error)', marginTop: 16 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>logout</span>
        Sign Out
      </button>
    </div>
  )
}
