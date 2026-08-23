import React, { useState } from 'react'
import { useAppState } from '../../context/AppStateContext'

export function PhotoAlbumsView() {
  const { albums, isLoadingAlbums, saveAlbum, deleteAlbum, showToast } = useAppState()
  const [showAdd, setShowAdd] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')

  const handleSave = async () => {
    if (!title.trim()) { showToast('Please enter a title', 'error'); return }
    await saveAlbum({ title, description, date })
    setShowAdd(false); setTitle(''); setDescription(''); setDate('')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--nt-on-surface)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--nt-primary)' }}>photo_library</span>
          Photo Albums
        </h2>
        <button className="nt-btn nt-btn-primary" onClick={() => setShowAdd(true)} style={{ fontSize: 13, padding: '10px 16px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span> Create
        </button>
      </div>

      {isLoadingAlbums ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {[1,2,3,4].map(i => <div key={i} className="nt-skeleton" style={{ height: 180 }} />)}
        </div>
      ) : albums.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {albums.map((a) => (
            <div key={a.id} className="nt-card nt-card-interactive" style={{ padding: 0, overflow: 'hidden' }}>
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
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 4 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--nt-on-surface)' }}>{a.title}</div>
                    {a.date && <div style={{ fontSize: 11, color: 'var(--nt-on-surface-variant)' }}>{a.date}</div>}
                    <div style={{ fontSize: 11, color: 'var(--nt-secondary)' }}>{(a.photo_urls || []).length} photos</div>
                  </div>
                  <button className="nt-btn-ghost" onClick={(e) => { e.stopPropagation(); deleteAlbum(a.id) }} style={{ color: 'var(--nt-error)', padding: 4, minHeight: 'auto' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="nt-empty">
          <span className="material-symbols-outlined nt-empty-icon">photo_library</span>
          <h4 className="nt-empty-title">No photo albums yet</h4>
          <p className="nt-empty-desc">Create photo albums to organize the patient's memories and special moments.</p>
          <button className="nt-btn nt-btn-primary" onClick={() => setShowAdd(true)} style={{ marginTop: 8 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span> Create First Album
          </button>
        </div>
      )}

      {/* Add Album Modal */}
      {showAdd && (
        <div className="nt-modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="nt-modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--nt-on-surface)', marginBottom: 16 }}>Create Photo Album</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div><label className="nt-label">Album Title</label><input className="nt-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Lake Tahoe Summer 1974" /></div>
              <div><label className="nt-label">Description</label><textarea className="nt-input" value={description} onChange={e => setDescription(e.target.value)} placeholder="Family trip memories..." rows={3} style={{ resize: 'vertical' }} /></div>
              <div><label className="nt-label">Date</label><input className="nt-input" type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button className="nt-btn nt-btn-secondary" onClick={() => setShowAdd(false)} style={{ flex: 1 }}>Cancel</button>
                <button className="nt-btn nt-btn-primary" onClick={handleSave} style={{ flex: 1 }}>Create Album</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
