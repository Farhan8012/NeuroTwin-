import React, { useState } from 'react'
import { useAppState } from '../../context/AppStateContext'

export function MemoryLibraryView() {
  const { memoryAlbums, isLoadingMemories, saveMemoryAlbum, deleteMemoryAlbum, showToast, registeredPeople } = useAppState()
  const [showAdd, setShowAdd] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Family')
  const [year, setYear] = useState('')
  const categories = ['Family', 'Travel', 'Music', 'Milestones', 'Recipes']

  const handleSave = async () => {
    if (!title.trim()) { showToast('Please enter a title', 'error'); return }
    await saveMemoryAlbum({ title, description, category, year })
    setShowAdd(false); setTitle(''); setDescription(''); setYear('')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--nt-on-surface)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--nt-primary)' }}>psychology</span>
          Memory Library
        </h2>
        <button className="nt-btn nt-btn-primary" onClick={() => setShowAdd(true)} style={{ fontSize: 13, padding: '10px 16px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span> Add Memory
        </button>
      </div>

      {isLoadingMemories ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1,2,3].map(i => <div key={i} className="nt-skeleton" style={{ height: 96 }} />)}
        </div>
      ) : memoryAlbums.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {memoryAlbums.map((m) => (
            <div key={m.id} className="nt-card" style={{ padding: 'var(--sp-md)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span className="nt-badge nt-badge-info">{m.category}</span>
                    {m.year && <span style={{ fontSize: 12, color: 'var(--nt-on-surface-variant)' }}>{m.year}</span>}
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--nt-on-surface)' }}>{m.title}</h3>
                  {m.description && <p style={{ fontSize: 13, color: 'var(--nt-on-surface-variant)', marginTop: 4, lineHeight: 1.4 }}>{m.description}</p>}
                  {m.contributor && <p style={{ fontSize: 11, color: 'var(--nt-secondary)', marginTop: 4 }}>By {m.contributor}</p>}
                </div>
                <button className="nt-btn-ghost" onClick={() => deleteMemoryAlbum(m.id)} style={{ color: 'var(--nt-error)', padding: 6, minHeight: 'auto' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="nt-empty">
          <span className="material-symbols-outlined nt-empty-icon">psychology</span>
          <h4 className="nt-empty-title">No memories yet</h4>
          <p className="nt-empty-desc">Add your first memory to build the patient's cognitive support library.</p>
          <button className="nt-btn nt-btn-primary" onClick={() => setShowAdd(true)} style={{ marginTop: 8 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span> Add First Memory
          </button>
        </div>
      )}

      {/* Add Memory Modal */}
      {showAdd && (
        <div className="nt-modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="nt-modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--nt-on-surface)', marginBottom: 16 }}>Add Memory</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div><label className="nt-label">Title</label><input className="nt-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Family dinner in 1985" /></div>
              <div><label className="nt-label">Description</label><textarea className="nt-input" value={description} onChange={e => setDescription(e.target.value)} placeholder="Details about this memory..." rows={3} style={{ resize: 'vertical' }} /></div>
              <div>
                <label className="nt-label">Category</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {categories.map(c => (
                    <button key={c} type="button" onClick={() => setCategory(c)} style={{
                      padding: '6px 14px', borderRadius: 'var(--r-full)', fontSize: 13, fontWeight: 600,
                      border: `1.5px solid ${category === c ? 'var(--nt-primary)' : 'var(--nt-outline-variant)'}`,
                      background: category === c ? 'var(--nt-primary-fixed)' : 'transparent',
                      color: category === c ? 'var(--nt-primary)' : 'var(--nt-on-surface-variant)',
                      cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                    }}>{c}</button>
                  ))}
                </div>
              </div>
              <div><label className="nt-label">Year</label><input className="nt-input" value={year} onChange={e => setYear(e.target.value)} placeholder="1985" /></div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button className="nt-btn nt-btn-secondary" onClick={() => setShowAdd(false)} style={{ flex: 1 }}>Cancel</button>
                <button className="nt-btn nt-btn-primary" onClick={handleSave} style={{ flex: 1 }}>Save Memory</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
