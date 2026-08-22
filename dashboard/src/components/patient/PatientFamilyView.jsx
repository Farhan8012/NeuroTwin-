import React, { useState } from 'react'
import { Card, Button } from '../common/UIPrimitives'
import { useAppState } from '../../context/AppStateContext'
import { FamilyMemberModal } from '../common/FamilyMemberModal'

export function PatientFamilyView() {
  const { familyMembers, setFamilyMembers, showToast } = useAppState()
  
  const [modalOpen, setModalOpen] = useState(false)
  const [editingMember, setEditingMember] = useState(null)

  const handleSaveMember = (memberData) => {
    if (editingMember) {
      setFamilyMembers(familyMembers.map(m => m.id === memberData.id ? memberData : m))
      showToast('Family member updated', 'success')
    } else {
      const newMember = {
        ...memberData,
        id: `fam-${Date.now()}`
      }
      setFamilyMembers([...familyMembers, newMember])
      showToast('Family member added', 'success')
    }
    setModalOpen(false)
    setEditingMember(null)
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto patient-mode-root">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100">Your Loved Ones</h2>
          <p className="text-base text-slate-600 dark:text-slate-300 mt-1">
            Tap any family member to hear their voice or give them a call.
          </p>
        </div>
        <Button variant="primary" size="lg" onClick={() => { setEditingMember(null); setModalOpen(true); }}>
          ➕ Add Loved One
        </Button>
      </div>

      {familyMembers.length === 0 ? (
        <div className="py-20 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700">
          <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4 block">family_restroom</span>
          <h3 className="text-2xl font-bold text-slate-700 dark:text-slate-300">No Loved Ones Added</h3>
          <p className="text-lg text-slate-500 mt-2 max-w-md mx-auto">
            You can add family members here to easily call them or see their updates.
          </p>
          <Button variant="primary" size="lg" className="mt-8 mx-auto block" onClick={() => { setEditingMember(null); setModalOpen(true); }}>
            Add Loved One Now
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {familyMembers.map((m, idx) => (
            <Card key={m.id || idx} className="p-6 text-center space-y-4 border-2 border-slate-200 dark:border-slate-700 relative group">
              <button 
                onClick={() => { setEditingMember(m); setModalOpen(true); }}
                className="absolute top-4 right-4 p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:text-primary transition shadow-sm opacity-0 group-hover:opacity-100"
                title="Edit Details"
              >
                <span className="material-symbols-outlined text-[18px]">edit</span>
              </button>
              
              <img src={m.avatar} alt={m.name} className="w-28 h-28 rounded-full object-cover mx-auto ring-4 ring-[#2B6CB0]/20" />
              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">{m.name}</h3>
                <p className="text-lg font-bold text-[#2B6CB0] dark:text-[#63B3ED]">{m.relationship}</p>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">{m.note}</p>
              </div>

              <Button
                fullWidth
                size="lg"
                variant="primary"
                onClick={() => showToast(`Dialing ${m.name} at ${m.phone}...`, 'info')}
              >
                📞 Call {m.name.split(' ')[0]}
              </Button>
            </Card>
          ))}
        </div>
      )}

      <FamilyMemberModal 
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingMember(null); }}
        member={editingMember}
        onSave={handleSaveMember}
      />
    </div>
  )
}

