import React from 'react'
import { useAppState } from '../../context/AppStateContext'
import { AIChatWidget } from '../common/AIChatWidget'

export function AIAssistantView() {
  const { activePatient } = useAppState()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)', height: 'calc(100vh - var(--top-bar-h) - var(--bottom-nav-h) - 32px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span className="material-symbols-outlined" style={{ color: 'var(--nt-primary)', fontSize: 24 }}>smart_toy</span>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--nt-on-surface)' }}>Caregiver AI Assistant</h2>
      </div>
      <p style={{ fontSize: 14, color: 'var(--nt-on-surface-variant)', marginBottom: 8 }}>
        Ask for cognitive insights, behavioral summaries, or help drafting memory descriptions for {activePatient.name}.
      </p>
      
      <div style={{ flex: 1, minHeight: 0, border: '1px solid var(--nt-outline-variant)', borderRadius: 'var(--r-xl)', overflow: 'hidden' }}>
        <AIChatWidget patientName={activePatient.name} isPatientView={false} />
      </div>
    </div>
  )
}
