import React from 'react'
import { useAppState } from '../../context/AppStateContext'

export function PatientRemindersView() {
  const { medicines, isLoadingMedicines, showToast } = useAppState()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="material-symbols-outlined" style={{ color: 'var(--nt-primary)' }}>medication</span>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--nt-on-surface)' }}>Medications & Reminders</h2>
      </div>

      {isLoadingMedicines ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1,2,3].map(i => <div key={i} className="nt-skeleton" style={{ height: 80, borderRadius: 'var(--r-lg)' }} />)}
        </div>
      ) : medicines.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {medicines.map((m, i) => (
            <div key={m.id || i} className="nt-card" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
              padding: 'var(--sp-md)', cursor: 'pointer',
            }} onClick={() => showToast(`Marked "${m.name}" as taken`, 'success')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--nt-primary)', fontSize: 24 }}>medication</span>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--nt-on-surface)' }}>{m.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--nt-on-surface-variant)' }}>{m.dosage} — {m.schedule_time}</div>
                  {m.instructions && <div style={{ fontSize: 12, color: 'var(--nt-secondary)', marginTop: 2 }}>{m.instructions}</div>}
                </div>
              </div>
              <div style={{
                width: 28, height: 28, borderRadius: 'var(--r-md)',
                border: '2px solid var(--nt-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--nt-primary)' }}>check</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="nt-empty">
          <span className="material-symbols-outlined nt-empty-icon">medication</span>
          <h4 className="nt-empty-title">No medications scheduled</h4>
          <p className="nt-empty-desc">Your caregiver will add your medications and schedule here.</p>
        </div>
      )}
    </div>
  )
}
