import React from 'react'
import { useAppState } from '../../context/AppStateContext'

export function TimelineView() {
  const { activePatient } = useAppState()
  
  // In a real implementation, this would be fetched from a backend timeline API.
  // For the UI rebuild, we implement the layout structure from the Stitch design.
  const timelineEvents = [
    {
      id: 1,
      time: '10:45 AM',
      title: 'Recognized Sarah',
      description: 'AI assisted in confirming identity during visit.',
      icon: 'smart_toy',
      type: 'primary',
      dateStr: 'Today'
    },
    {
      id: 2,
      time: '08:00 AM',
      title: 'Medication Reminder',
      description: 'Donepezil (5mg)',
      icon: 'medication',
      type: 'muted',
      dateStr: 'Today'
    },
    {
      id: 3,
      time: 'Yesterday, 6:30 PM',
      title: 'Object Detected: Keys',
      description: null,
      icon: 'search',
      type: 'muted',
      dateStr: 'Yesterday'
    }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="material-symbols-outlined" style={{ color: 'var(--nt-primary)' }}>history</span>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--nt-on-surface)' }}>Recent AI Memory</h2>
      </div>

      <div className="nt-card" style={{ padding: 'var(--sp-lg)' }}>
        <div className="nt-timeline">
          {timelineEvents.map((event) => (
            <div key={event.id} style={{ position: 'relative', paddingLeft: 8, marginBottom: 24, minHeight: 48 }}>
              {/* Dot */}
              <div className={`nt-timeline-dot ${event.type === 'primary' ? 'nt-timeline-dot-active' : 'nt-timeline-dot-muted'}`} />
              
              {/* Content */}
              <div>
                <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--nt-on-surface-variant)', marginBottom: 4 }}>
                  {event.time}
                </p>
                <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--nt-on-surface)' }}>
                  {event.title}
                </p>
                
                {event.description && (
                  <div style={{
                    marginTop: 8,
                    background: 'var(--nt-surface-low)',
                    padding: 12,
                    borderRadius: 'var(--r-md)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8
                  }}>
                    <span className="material-symbols-outlined" style={{ color: 'var(--nt-primary)', fontSize: 18, marginTop: 2 }}>
                      {event.icon}
                    </span>
                    <p style={{ fontSize: 14, color: 'var(--nt-on-surface-variant)' }}>
                      {event.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
