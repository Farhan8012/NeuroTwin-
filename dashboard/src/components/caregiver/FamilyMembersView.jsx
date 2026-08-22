import React, { useState } from 'react'
import { Card, Badge, Button } from '../common/UIPrimitives'
import { useAppState } from '../../context/AppStateContext'
import { FamilyMemberModal } from '../common/FamilyMemberModal'

export function FamilyMembersView() {
  const { familyMembers, activePatient, showToast, saveFamilyMember, deleteFamilyMember } = useAppState()
  
  const [modalOpen, setModalOpen] = useState(false)
  const [editingMember, setEditingMember] = useState(null)

  const handleSaveMember = async (memberData) => {
    try {
      await saveFamilyMember(editingMember ? { ...memberData, id: editingMember.id } : memberData)
      showToast(editingMember ? 'Family member updated' : 'Family member added', 'success')
    } catch (err) {
      showToast(`Save failed: ${err.message}`, 'error')
    }
    setModalOpen(false)
    setEditingMember(null)
  }

  const handleDeleteMember = async (id) => {
    await deleteFamilyMember(id)
    showToast('Family member removed', 'info')
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">Care Circle & Family</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Authorized family members contributing memories and monitoring <strong>{activePatient.name}</strong>
          </p>
        </div>
        <Button variant="primary" size="md" onClick={() => { setEditingMember(null); setModalOpen(true); }}>
          ➕ Add Family Member
        </Button>
      </div>

      {/* Grid or Empty State */}
      {familyMembers.length === 0 ? (
        <div className="py-20 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700">
          <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4 block">family_restroom</span>
          <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">No Family Members Yet</h3>
          <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
            Build your care circle by adding loved ones. They will appear here and in the patient's companion app.
          </p>
          <Button variant="primary" className="mt-6 mx-auto block" onClick={() => { setEditingMember(null); setModalOpen(true); }}>
            Add Loved One
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {familyMembers.map((m) => (
            <Card key={m.id} className="flex flex-col sm:flex-row items-start justify-between p-5 gap-4">
              <div className="flex items-start gap-4">
                <img src={m.avatar} alt={m.name} className="w-14 h-14 rounded-2xl object-cover ring-2 ring-[#2B6CB0]/20" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{m.name}</h3>
                    {m.role && <Badge variant={m.role.includes('Admin') ? 'primary' : 'secondary'}>{m.role}</Badge>}
                  </div>
                  <p className="text-xs font-semibold text-[#2B6CB0] dark:text-[#63B3ED]">{m.relationship}</p>
                  <p className="text-xs text-slate-500">
                    {m.email && <span>{m.email} • </span>} 
                    {m.phone}
                  </p>
                  {m.contributions && (
                    <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 pt-1">
                      ✨ {m.contributions}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-row sm:flex-col gap-2 shrink-0 w-full sm:w-auto mt-4 sm:mt-0">
                <Button size="sm" variant="ghost" className="w-full sm:w-auto justify-center" onClick={() => { setEditingMember(m); setModalOpen(true); }}>
                  Edit
                </Button>
                <Button size="sm" variant="ghost" className="text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 w-full sm:w-auto justify-center" onClick={() => handleDeleteMember(m.id)}>
                  Remove
                </Button>
              </div>
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

