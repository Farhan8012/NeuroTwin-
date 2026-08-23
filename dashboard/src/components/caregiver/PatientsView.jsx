import React, { useState } from 'react'
import { Card, Badge, Button, Input } from '../common/UIPrimitives'
import { useAppState } from '../../context/AppStateContext'

export function PatientsView() {
  const { setActivePatient, navigateTo } = useAppState()
  const [query, setQuery] = useState('')

  const patients = [
    {
      id: 'pt-001',
      name: 'Eleanor Vance',
      age: 78,
      condition: 'Early Stage Alzheimer\'s (Stage 2)',
      location: 'Cedar Heights Residence, Room 304',
      primaryCaregiver: 'Sarah Vance (Daughter)',
      avatar: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=256&q=80',
      cognitiveScore: '78%',
      memoriesCount: 142,
      status: 'Active',
      statusVariant: 'success',
    },
    {
      id: 'pt-002',
      name: 'Arthur Pendelton',
      age: 82,
      condition: 'Vascular Dementia (Stage 3)',
      location: 'Oakridge Memory Care, Wing B',
      primaryCaregiver: 'Robert Pendelton (Son)',
      avatar: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=256&q=80',
      cognitiveScore: '64%',
      memoriesCount: 98,
      status: 'Needs Attention',
      statusVariant: 'warning',
    },
    {
      id: 'pt-003',
      name: 'Clara Barton',
      age: 75,
      condition: 'Mild Cognitive Impairment (Stage 1)',
      location: 'Home Care (San Francisco)',
      primaryCaregiver: 'Emily Barton (Granddaughter)',
      avatar: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=256&q=80',
      cognitiveScore: '89%',
      memoriesCount: 210,
      status: 'Active',
      statusVariant: 'success',
    },
  ].filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">Patients Roster</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage monitored patients, cognitive tracking logs, and family connections
          </p>
        </div>
        <Button variant="primary" size="md">
          ➕ Register New Patient
        </Button>
      </div>

      {/* Search Input */}
      <div className="max-w-md">
        <Input
          placeholder="Search by patient name, condition, or location..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Patients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {patients.map((pt) => (
          <Card key={pt.id} hoverable className="flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <img src={pt.avatar} alt={pt.name} className="w-12 h-12 rounded-full object-cover border-2 border-[#2B6CB0]" />
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{pt.name}</h3>
                    <p className="text-xs text-slate-500">{pt.age} years old</p>
                  </div>
                </div>
                <Badge variant={pt.statusVariant}>{pt.status}</Badge>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl space-y-1 text-xs">
                <p className="font-semibold text-slate-800 dark:text-slate-200">Diagnosis: {pt.condition}</p>
                <p className="text-slate-500">Location: {pt.location}</p>
                <p className="text-slate-500">Caregiver: {pt.primaryCaregiver}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center pt-2">
                <div className="p-2 bg-[#EBF8FF] dark:bg-[#2B6CB0]/20 rounded-lg">
                  <p className="text-xs text-[#2B6CB0] font-bold">Cognitive Score</p>
                  <p className="text-lg font-black text-[#2B6CB0] dark:text-[#63B3ED]">{pt.cognitiveScore}</p>
                </div>
                <div className="p-2 bg-[#E6FFFA] dark:bg-[#38B2AC]/20 rounded-lg">
                  <p className="text-xs text-[#2C7A7B] font-bold">Memories Indexed</p>
                  <p className="text-lg font-black text-[#2C7A7B] dark:text-teal-300">{pt.memoriesCount}</p>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-700/60 flex items-center gap-2">
              <Button
                fullWidth
                size="sm"
                variant="primary"
                onClick={() => {
                  setActivePatient(pt)
                  navigateTo('patient-profile')
                }}
              >
                Open Patient Profile
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

