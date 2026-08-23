import React, { useState } from 'react'
import { useAppState } from '../../context/AppStateContext'

export function FamilyMembersView() {
  const { familyMembers, isLoadingFamily, saveFamilyMember, deleteFamilyMember, showToast } = useAppState()
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')
  const [relationship, setRelationship] = useState('')
  const [phone, setPhone] = useState('')
  const [isPrimary, setIsPrimary] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) { showToast('Please enter a name', 'error'); return }
    await saveFamilyMember({ name, relationship, phone, is_primary: isPrimary })
    setShowAdd(false); setName(''); setRelationship(''); setPhone(''); setIsPrimary(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--nt-on-surface)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--nt-primary)' }}>group</span>
          Family & Friends
        </h2>
        <button className="nt-btn nt-btn-primary" onClick={() => setShowAdd(true)} style={{ fontSize: 13, padding: '10px 16px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>person_add</span> Add
        </button>
      </div>

      {isLoadingFamily ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1,2,3].map(i => <div key={i} className="nt-skeleton" style={{ height: 80 }} />)}
        </div>
      ) : familyMembers.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {familyMembers.map((f) => (
            <div key={f.id} className="nt-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--sp-md)', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: f.is_primary ? 'var(--nt-success-light)' : 'var(--nt-primary-fixed)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, fontWeight: 700, color: f.is_primary ? 'var(--nt-success-dark)' : 'var(--nt-primary)',
                }}>
                  {f.name.charAt(0)}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--nt-on-surface)' }}>{f.name}</span>
                    {f.is_primary && <span className="nt-badge nt-badge-success" style={{ fontSize: 10 }}>PRIMARY</span>}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--nt-on-surface-variant)' }}>{f.relationship}</div>
                  {f.phone && <div style={{ fontSize: 12, color: 'var(--nt-secondary)' }}>{f.phone}</div>}
                </div>
              </div>
              <button className="nt-btn-ghost" onClick={() => deleteFamilyMember(f.id)} style={{ color: 'var(--nt-error)', padding: 6, minHeight: 'auto' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="nt-empty">
          <span className="material-symbols-outlined nt-empty-icon">group</span>
          <h4 className="nt-empty-title">No family members yet</h4>
          <p className="nt-empty-desc">Add family members and emergency contacts for the patient.</p>
          <button className="nt-btn nt-btn-primary" onClick={() => setShowAdd(true)} style={{ marginTop: 8 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>person_add</span> Add First Contact
          </button>
        </div>
      )}

      {/* Add Family Member Modal */}
      {showAdd && (
        <div className="nt-modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="nt-modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--nt-on-surface)', marginBottom: 16 }}>Add Family Member</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div><label className="nt-label">Full Name</label><input className="nt-input" value={name} onChange={e => setName(e.target.value)} placeholder="Sarah Varma" /></div>
              <div><label className="nt-label">Relationship</label><input className="nt-input" value={relationship} onChange={e => setRelationship(e.target.value)} placeholder="Daughter" /></div>
              <div><label className="nt-label">Phone Number</label><input className="nt-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (555) 123-4567" type="tel" /></div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={isPrimary} onChange={e => setIsPrimary(e.target.checked)} style={{ width: 18, height: 18 }} />
                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--nt-on-surface)' }}>Primary emergency contact</span>
              </label>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button className="nt-btn nt-btn-secondary" onClick={() => setShowAdd(false)} style={{ flex: 1 }}>Cancel</button>
                <button className="nt-btn nt-btn-primary" onClick={handleSave} style={{ flex: 1 }}>Save Contact</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
