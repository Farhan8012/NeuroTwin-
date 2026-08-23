import React from 'react'
import { useAppState } from '../../context/AppStateContext'

export function PatientEmergencyView() {
  const { familyMembers, isLoadingFamily, showToast } = useAppState()
  const primary = familyMembers.find(f => f.is_primary) || familyMembers[0] || null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}>
      {/* Large SOS Button */}
      <section style={{
        padding: 'var(--sp-2xl) var(--sp-lg)',
        borderRadius: 'var(--r-xl)',
        background: 'var(--nt-error-container)',
        border: '2px solid var(--nt-error)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 'var(--sp-md)', textAlign: 'center',
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: 64, color: 'var(--nt-error)' }}>sos</span>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--nt-on-error-container)' }}>Emergency Help</h2>
        <p style={{ fontSize: 14, color: 'var(--nt-error)', maxWidth: 280 }}>
          Tap the button below to send an SOS alert to {primary ? primary.name : 'your care team'}
        </p>
        <button
          className="nt-btn nt-btn-danger"
          onClick={() => showToast('🚨 SOS ALERT SENT! Care team notified.', 'error')}
          style={{ width: '100%', maxWidth: 280, fontSize: 16, fontWeight: 700, padding: '16px', minHeight: 56 }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>emergency</span>
          SEND SOS ALERT
        </button>
      </section>

      {/* Emergency Contacts */}
      <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--nt-on-surface)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="material-symbols-outlined" style={{ color: 'var(--nt-primary)' }}>contacts</span>
        Emergency Contacts
      </h3>

      {isLoadingFamily ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1,2].map(i => <div key={i} className="nt-skeleton" style={{ height: 80 }} />)}
        </div>
      ) : familyMembers.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {familyMembers.map((f) => (
            <div key={f.id} className="nt-card" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: 'var(--sp-md)', gap: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: f.is_primary ? 'var(--nt-success-light)' : 'var(--nt-primary-fixed)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, fontWeight: 700,
                  color: f.is_primary ? 'var(--nt-success-dark)' : 'var(--nt-primary)',
                }}>
                  {f.name.charAt(0)}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--nt-on-surface)' }}>{f.name}</span>
                    {f.is_primary && <span className="nt-badge nt-badge-success" style={{ fontSize: 10 }}>PRIMARY</span>}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--nt-on-surface-variant)' }}>{f.relationship}</div>
                  {f.phone && <div style={{ fontSize: 12, color: 'var(--nt-secondary)', fontFamily: 'monospace' }}>{f.phone}</div>}
                </div>
              </div>
              {f.phone && (
                <button
                  className="nt-btn nt-btn-primary"
                  onClick={() => showToast(`Calling ${f.name}...`, 'info')}
                  style={{ padding: '10px 16px', minHeight: 48, flexShrink: 0 }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>call</span>
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="nt-empty">
          <span className="material-symbols-outlined nt-empty-icon">contacts</span>
          <h4 className="nt-empty-title">No emergency contacts</h4>
          <p className="nt-empty-desc">Your caregiver will add emergency contacts here.</p>
        </div>
      )}
    </div>
  )
}
