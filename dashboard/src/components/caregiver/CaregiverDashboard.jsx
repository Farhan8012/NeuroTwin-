import React from 'react'
import { useAppState } from '../../context/AppStateContext'

export function CaregiverDashboard() {
  const {
    activePatient, navigateTo, showToast, setAddMemoryOpen,
    backendOnline, systemHealth, familyMembers, memoryAlbums, medicines,
    isLoadingMemories, isLoadingFamily, isLoadingHealth,
  } = useAppState()

  const recallIndex = systemHealth?.system_metrics?.qdrant_vectors?.people ?? 0
  const objectsTracked = systemHealth?.system_metrics?.qdrant_vectors?.objects ?? 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}>
      {/* Patient Header */}
      <section className="nt-card" style={{
        background: 'linear-gradient(135deg, var(--nt-surface-lowest), var(--nt-surface-low))',
        padding: 'var(--sp-lg)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ position: 'relative' }}>
            <div style={{
              width: 64, height: 64, borderRadius: 'var(--r-xl)',
              background: 'var(--nt-primary-fixed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, fontWeight: 700, color: 'var(--nt-primary)',
              border: '3px solid var(--nt-surface-lowest)',
            }}>
              {activePatient.name ? activePatient.name.charAt(0) : 'P'}
            </div>
            <span style={{
              position: 'absolute', bottom: -2, right: -2,
              width: 16, height: 16, borderRadius: '50%',
              background: 'var(--nt-success)', border: '3px solid var(--nt-surface-lowest)',
            }} />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--nt-primary)', letterSpacing: '-0.01em' }}>
              {activePatient.name || 'Patient'}
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
              <span className="nt-badge nt-badge-success">Active & Stable</span>
              <span style={{ fontSize: 12, color: 'var(--nt-on-surface-variant)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>sync</span>
                {backendOnline ? 'Live' : 'Offline'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button className="nt-btn nt-btn-primary" onClick={() => setAddMemoryOpen(true)} style={{ flex: 1, fontSize: 13 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add_circle</span>
            Add Memory
          </button>
          <button className="nt-btn nt-btn-secondary" onClick={() => navigateTo('ai-assistant')} style={{ flex: 1, fontSize: 13 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>smart_toy</span>
            AI Assistant
          </button>
        </div>
      </section>

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--sp-sm)' }}>
        {[
          { label: 'Memories', value: memoryAlbums.length, icon: 'psychology', color: 'var(--nt-primary)' },
          { label: 'Family', value: familyMembers.length, icon: 'group', color: 'var(--nt-secondary)' },
          { label: 'Medications', value: medicines.length, icon: 'medication', color: 'var(--nt-success)' },
          { label: 'People Indexed', value: recallIndex, icon: 'face', color: 'var(--nt-tertiary)' },
        ].map((m, i) => (
          <div key={i} className="nt-card" style={{ padding: 'var(--sp-md)', textAlign: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 24, color: m.color }}>{m.icon}</span>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--nt-on-surface)', marginTop: 4 }}>{m.value}</div>
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--nt-on-surface-variant)', letterSpacing: '0.02em' }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* System Health */}
      {systemHealth && (
        <section className="nt-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--nt-on-surface)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>router</span>
              Device Status
            </h3>
            <span className="nt-badge nt-badge-success">Online</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {[
              { icon: 'dns', label: 'FastAPI', value: 'Healthy' },
              { icon: 'database', label: 'Qdrant', value: systemHealth.components?.qdrant_vector_db || '—' },
              { icon: 'memory', label: 'CPU', value: `${systemHealth.system_metrics?.cpu_percent || 0}%` },
              { icon: 'storage', label: 'Memory', value: `${systemHealth.system_metrics?.memory_used_gb || 0} GB` },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--nt-on-surface-variant)' }}>{s.icon}</span>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--nt-on-surface-variant)', letterSpacing: '0.02em' }}>{s.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--nt-on-surface)' }}>{s.value}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent Memories */}
      <section className="nt-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--nt-on-surface)' }}>Recent Memories</h3>
          <button onClick={() => navigateTo('memories')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--nt-primary)', fontFamily: 'Inter, sans-serif' }}>View All →</button>
        </div>
        {isLoadingMemories ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[1,2].map(i => <div key={i} className="nt-skeleton" style={{ height: 56 }} />)}
          </div>
        ) : memoryAlbums.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {memoryAlbums.slice(0, 3).map((m) => (
              <div key={m.id} style={{
                padding: 12, borderRadius: 'var(--r-md)', border: '1px solid var(--nt-outline-variant)',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <span className="nt-badge nt-badge-info">{m.category}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--nt-on-surface)' }}>{m.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--nt-on-surface-variant)' }}>{m.year}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="nt-empty" style={{ padding: 'var(--sp-lg)' }}>
            <span className="material-symbols-outlined nt-empty-icon">psychology</span>
            <p className="nt-empty-desc">No memories yet. Add your first memory to get started.</p>
          </div>
        )}
      </section>

      {/* Family Quick View */}
      <section className="nt-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--nt-on-surface)' }}>Inner Circle</h3>
          <button onClick={() => navigateTo('family')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--nt-primary)', fontFamily: 'Inter, sans-serif' }}>
            Manage ({familyMembers.length}) →
          </button>
        </div>
        {familyMembers.length > 0 ? (
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }} className="hide-scrollbar">
            {familyMembers.slice(0, 4).map((f) => (
              <div key={f.id} style={{
                minWidth: 140, padding: 12, borderRadius: 'var(--r-md)',
                border: '1px solid var(--nt-outline-variant)', textAlign: 'center', flexShrink: 0,
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', margin: '0 auto 8px',
                  background: 'var(--nt-primary-fixed)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, fontWeight: 700, color: 'var(--nt-primary)',
                }}>
                  {f.name.charAt(0)}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--nt-on-surface)' }}>{f.name}</div>
                <div style={{ fontSize: 11, color: 'var(--nt-on-surface-variant)' }}>{f.relationship}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="nt-empty" style={{ padding: 'var(--sp-md)' }}>
            <p className="nt-empty-desc">No family members added yet.</p>
          </div>
        )}
      </section>
    </div>
  )
}
