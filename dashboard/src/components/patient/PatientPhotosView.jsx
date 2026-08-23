import React from 'react'
import { useAppState } from '../../context/AppStateContext'

export function PatientPhotosView() {
  const { albums, isLoadingAlbums } = useAppState()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="material-symbols-outlined" style={{ color: 'var(--nt-primary)' }}>photo_library</span>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--nt-on-surface)' }}>Photo Albums</h2>
      </div>

      {isLoadingAlbums ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {[1,2,3,4].map(i => <div key={i} className="nt-skeleton" style={{ height: 140, borderRadius: 'var(--r-lg)' }} />)}
        </div>
      ) : albums.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {albums.map((a) => (
            <div key={a.id} className="nt-card nt-card-interactive" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }}>
              <div style={{
                height: 120, background: 'var(--nt-surface-high)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {a.photo_urls && a.photo_urls.length > 0 ? (
                  <img src={a.photo_urls[0]} alt={a.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span className="material-symbols-outlined" style={{ fontSize: 36, color: 'var(--nt-outline-variant)' }}>photo</span>
                )}
              </div>
              <div style={{ padding: '10px 12px' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--nt-on-surface)' }}>{a.title}</div>
                {a.date && <div style={{ fontSize: 11, color: 'var(--nt-on-surface-variant)' }}>{a.date}</div>}
                <div style={{ fontSize: 11, color: 'var(--nt-secondary)', marginTop: 2 }}>
                  {a.photo_urls ? a.photo_urls.length : 0} photos
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="nt-empty">
          <span className="material-symbols-outlined nt-empty-icon">photo_library</span>
          <h4 className="nt-empty-title">No photo albums yet</h4>
          <p className="nt-empty-desc">Your caregiver will create photo albums of your special moments.</p>
        </div>
      )}
    </div>
  )
}
