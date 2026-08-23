import React from 'react'
import { useAppState } from '../../context/AppStateContext'

export function PatientFamilyView() {
  const { familyMembers, isLoadingFamily, showToast } = useAppState()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="material-symbols-outlined" style={{ color: 'var(--nt-primary)' }}>family_restroom</span>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--nt-on-surface)' }}>Family & Friends</h2>
      </div>
      <p style={{ fontSize: 14, color: 'var(--nt-on-surface-variant)' }}>Your loved ones who care about you</p>

      {isLoadingFamily ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1,2,3].map(i => <div key={i} className="nt-skeleton" style={{ height: 88, borderRadius: 'var(--r-lg)' }} />)}
        </div>
      ) : familyMembers.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {familyMembers.map((f) => (
            <div key={f.id} className="nt-card" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
              padding: 'var(--sp-md)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: '50%',
                  background: 'var(--nt-primary-fixed)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, fontWeight: 700, color: 'var(--nt-primary)', flexShrink: 0,
                }}>
                  {f.avatar ? (
                    <img src={f.avatar} alt={f.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : f.name.charAt(0)}
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--nt-on-surface)' }}>{f.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--nt-success)', fontWeight: 500 }}>{f.relationship}</div>
                  {f.phone && <div style={{ fontSize: 12, color: 'var(--nt-on-surface-variant)', marginTop: 2 }}>{f.phone}</div>}
                </div>
              </div>
              {f.phone && (
                <button
                  className="nt-btn nt-btn-primary"
                  onClick={() => showToast(`Calling ${f.name}...`, 'info')}
                  style={{ padding: '10px 14px', minHeight: 44, fontSize: 13, flexShrink: 0 }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>call</span>
                  Call
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="nt-empty">
          <span className="material-symbols-outlined nt-empty-icon">group</span>
          <h4 className="nt-empty-title">No family members yet</h4>
          <p className="nt-empty-desc">Your caregiver will add your family and friends here.</p>
        </div>
      )}
    </div>
  )
}
