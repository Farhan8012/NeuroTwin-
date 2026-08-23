import React, { useState, useEffect } from 'react'
import { Card, Button, Input } from './UIPrimitives'
import { useAppState } from '../../context/AppStateContext'

export function FamilyMemberModal({ isOpen, onClose, member = null, onSave }) {
  const { showToast } = useAppState()
  
  const [formData, setFormData] = useState({
    name: '',
    relationship: '',
    phone: '',
    note: '',
    avatar: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=400&q=80'
  })

  useEffect(() => {
    if (member) {
      setFormData(member)
    } else {
      setFormData({
        name: '',
        relationship: '',
        phone: '',
        note: '',
        avatar: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=400&q=80'
      })
    }
  }, [member, isOpen])

  if (!isOpen) return null

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setFormData((prev) => ({ ...prev, avatar: url }))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.name || !formData.relationship) {
      showToast('Name and Relationship are required.', 'error')
      return
    }
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
      <Card className="w-full max-w-lg p-6 space-y-6 max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 border border-outline-variant/40 dark:border-slate-700 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {member ? 'Edit Loved One' : 'Add Loved One'}
          </h2>
          <button onClick={onClose} type="button" className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition cursor-pointer">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col items-center gap-3">
            <img 
              src={formData.avatar} 
              alt="Avatar preview" 
              className="w-24 h-24 rounded-full object-cover shadow-sm ring-2 ring-primary/20"
            />
            <div>
              <input 
                type="file" 
                id="member-avatar" 
                accept="image/*" 
                className="hidden"
                onChange={handleAvatarChange}
              />
              <Button size="sm" variant="outline" type="button" onClick={() => document.getElementById('member-avatar').click()}>
                Upload Photo
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <Input 
              label="Name *"
              placeholder="e.g. David Vance" 
              value={formData.name} 
              onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))} 
            />
            <Input 
              label="Relationship *"
              placeholder="e.g. Son, Daughter, Friend" 
              value={formData.relationship} 
              onChange={(e) => setFormData(prev => ({...prev, relationship: e.target.value}))} 
            />
            <Input 
              label="Phone Number"
              placeholder="e.g. +1 (555) 123-4567" 
              value={formData.phone} 
              onChange={(e) => setFormData(prev => ({...prev, phone: e.target.value}))} 
            />
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                Note / Details
              </label>
              <textarea 
                className="w-full bg-surface-container-low dark:bg-slate-900 border border-outline-variant/50 dark:border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary/20 min-h-[80px]"
                placeholder="e.g. Calls every Sunday. Loves classical music."
                value={formData.note}
                onChange={(e) => setFormData(prev => ({...prev, note: e.target.value}))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {member ? 'Save Changes' : 'Add Person'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
