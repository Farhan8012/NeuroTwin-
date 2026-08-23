import React from 'react'
import { useAppState } from '../../context/AppStateContext'
import { AIChatWidget } from '../common/AIChatWidget'

export function PatientHomeView() {
  const { activePatient, navigateTo, showToast, memoryAlbums, familyMembers, medicines, isLoadingMemories, isLoadingFamily } = useAppState()

  const featuredAlbum = memoryAlbums.find(a => a.isFeatured) || memoryAlbums[0] || null
  const upcomingVisit = familyMembers.length > 0 ? familyMembers[0] : null

  const getGreeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good Morning'
    if (h < 17) return 'Good Afternoon'
    return 'Good Evening'
  }

  const firstName = activePatient.name ? activePatient.name.split(' ')[0] : 'there'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}>
      {/* Greeting Banner */}
      <section className="nt-card" style={{
        background: 'var(--nt-primary)', color: 'var(--nt-on-primary)',
        border: 'none', padding: 'var(--sp-lg)', borderRadius: 'var(--r-xl)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 28 }}>🌞</span>
          <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.01em' }}>
            {getGreeting()}, {firstName}
          </h1>
        </div>
        <p style={{ fontSize: 15, lineHeight: 1.5, opacity: 0.9, marginBottom: 16 }}>
          {upcomingVisit
            ? `${upcomingVisit.name.split(' ')[0]} is available to call. `
            : 'Today is a peaceful day. '}
          {featuredAlbum
            ? `Would you like to revisit "${featuredAlbum.title}"?`
            : 'Talk to NeuroTwin anytime you want.'}
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="nt-btn" onClick={() => navigateTo('ask-neurotwin')} style={{
            background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)',
            fontSize: 13, padding: '10px 16px', minHeight: 44,
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>psychology_alt</span>
            Talk to NeuroTwin
          </button>
          {featuredAlbum && (
            <button className="nt-btn" onClick={() => navigateTo('todays-memories')} style={{
              background: 'white', color: 'var(--nt-primary)', fontSize: 13,
              padding: '10px 16px', minHeight: 44,
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>photo_library</span>
              Open Memories
            </button>
          )}
        </div>
      </section>

      {/* Medication Reminders */}
      <section className="nt-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--nt-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--nt-primary)' }}>medication</span>
            Today's Medications
          </h3>
          <button onClick={() => navigateTo('patient-reminders')} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 12, fontWeight: 600, color: 'var(--nt-primary)', fontFamily: 'Inter, sans-serif',
          }}>View All →</button>
        </div>
        {medicines.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {medicines.slice(0, 3).map((m, i) => (
              <div key={m.id || i} style={{
                padding: 12, borderRadius: 'var(--r-md)',
                border: '1px solid var(--nt-outline-variant)',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--nt-primary)', fontSize: 22 }}>schedule</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--nt-on-surface)' }}>{m.name} — {m.dosage}</div>
                  <div style={{ fontSize: 12, color: 'var(--nt-on-surface-variant)' }}>{m.schedule_time}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="nt-empty" style={{ padding: 'var(--sp-lg)' }}>
            <span className="material-symbols-outlined nt-empty-icon">medication</span>
            <p className="nt-empty-desc">No medications scheduled. Your caregiver will add them.</p>
          </div>
        )}
      </section>

      {/* Family Connections */}
      <section className="nt-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--nt-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--nt-primary)' }}>family_restroom</span>
            Family & Friends
          </h3>
        </div>
        {isLoadingFamily ? (
          <div style={{ display: 'flex', gap: 12 }}>
            {[1,2].map(i => <div key={i} className="nt-skeleton" style={{ width: 160, height: 80 }} />)}
          </div>
        ) : familyMembers.length > 0 ? (
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }} className="hide-scrollbar">
            {familyMembers.map((f) => (
              <div key={f.id} style={{
                minWidth: 160, padding: 12, borderRadius: 'var(--r-md)',
                border: '1px solid var(--nt-outline-variant)',
                display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'var(--nt-primary-fixed)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, fontWeight: 700, color: 'var(--nt-primary)', flexShrink: 0,
                }}>
                  {f.name.charAt(0)}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--nt-on-surface)' }}>{f.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--nt-success)', fontWeight: 500 }}>{f.relationship}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="nt-empty" style={{ padding: 'var(--sp-lg)' }}>
            <span className="material-symbols-outlined nt-empty-icon">group</span>
            <p className="nt-empty-desc">Your loved ones will appear here once added by your caregiver.</p>
          </div>
        )}
      </section>

      {/* Featured Memory */}
      {featuredAlbum && (
        <section className="nt-card" style={{ border: '2px solid var(--nt-primary-fixed-dim)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--nt-primary)' }}>favorite</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--nt-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Featured Memory</span>
          </div>
          <div style={{
            borderRadius: 'var(--r-lg)', overflow: 'hidden',
            background: 'var(--nt-surface-high)', height: 160,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {featuredAlbum.image ? (
              <img src={featuredAlbum.image} alt={featuredAlbum.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--nt-outline-variant)' }}>photo_library</span>
            )}
          </div>
          <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--nt-on-surface)', marginTop: 12 }}>{featuredAlbum.title}</h4>
          {featuredAlbum.year && <p style={{ fontSize: 13, color: 'var(--nt-on-surface-variant)' }}>{featuredAlbum.year}</p>}
        </section>
      )}

      {/* SOS Card */}
      <section style={{
        padding: 'var(--sp-lg)', borderRadius: 'var(--r-xl)',
        background: 'var(--nt-error-container)', border: '2px solid var(--nt-error)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 32, color: 'var(--nt-error)' }}>sos</span>
          <div>
            <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--nt-on-error-container)' }}>Need Immediate Help?</h4>
            <p style={{ fontSize: 12, color: 'var(--nt-error)' }}>Tap to alert your care team</p>
          </div>
        </div>
        <button className="nt-btn nt-btn-danger" onClick={() => showToast('🚨 SOS ALERT SENT! Care team notified.', 'error')} style={{ flexShrink: 0, fontSize: 13 }}>
          SEND SOS
        </button>
      </section>

      {/* AI Companion */}
      <div style={{ height: 380 }}>
        <AIChatWidget patientName={activePatient.name} isPatientView={true} />
      </div>
    </div>
  )
}
