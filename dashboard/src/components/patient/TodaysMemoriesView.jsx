import React from 'react'
import { useAppState } from '../../context/AppStateContext'

export function TodaysMemoriesView() {
  const { memoryAlbums, isLoadingMemories, navigateTo } = useAppState()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="material-symbols-outlined" style={{ color: 'var(--nt-primary)' }}>auto_awesome</span>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--nt-on-surface)' }}>Your Memories</h2>
      </div>

      {isLoadingMemories ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1,2,3].map(i => <div key={i} className="nt-skeleton" style={{ height: 200, borderRadius: 'var(--r-lg)' }} />)}
        </div>
      ) : memoryAlbums.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {memoryAlbums.map((m) => (
            <div key={m.id} className="nt-card nt-card-interactive" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }}>
              {m.image && (
                <div style={{ height: 160, overflow: 'hidden' }}>
                  <img src={m.image} alt={m.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
              <div style={{ padding: 'var(--sp-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span className="nt-badge nt-badge-info">{m.category}</span>
                  {m.year && <span style={{ fontSize: 12, color: 'var(--nt-on-surface-variant)' }}>{m.year}</span>}
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--nt-on-surface)', marginBottom: 4 }}>{m.title}</h3>
                <p style={{ fontSize: 14, color: 'var(--nt-on-surface-variant)', lineHeight: 1.4 }}>{m.description}</p>
                {m.contributor && (
                  <p style={{ fontSize: 12, color: 'var(--nt-secondary)', marginTop: 8, fontWeight: 500 }}>
                    Added by {m.contributor}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="nt-empty">
          <span className="material-symbols-outlined nt-empty-icon">auto_awesome</span>
          <h4 className="nt-empty-title">No memories yet</h4>
          <p className="nt-empty-desc">Your family will add memories here to help you remember special moments.</p>
        </div>
      )}
    </div>
  )
}
