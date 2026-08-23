import React from 'react'
import { Card, Button, Select } from '../common/UIPrimitives'
import { useAppState } from '../../context/AppStateContext'

export function PatientProfileView() {
  const { activePatient, fontScale, setFontScale } = useAppState()

  return (
    <div className="space-y-6 max-w-3xl mx-auto patient-mode-root">
      <div>
        <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100">My Profile</h2>
        <p className="text-base text-slate-600 dark:text-slate-300 mt-1">Your personal preferences and settings</p>
      </div>

      <Card className="p-6 space-y-6 border-2 border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-6">
          <img src={activePatient.avatar} alt={activePatient.name} className="w-24 h-24 rounded-full object-cover ring-4 ring-[#2B6CB0]/20" />
          <div>
            <h3 className="text-3xl font-black text-slate-900 dark:text-slate-100">{activePatient.name}</h3>
            <p className="text-base text-slate-600 dark:text-slate-300">{activePatient.location}</p>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100">Text Size Preference</h4>
          <Select
            value={fontScale}
            onChange={(e) => setFontScale(e.target.value)}
            options={[
              { value: 'normal', label: 'Normal Size' },
              { value: 'large', label: 'Large High-Readability (Recommended)' },
              { value: 'xlarge', label: 'Extra Large Senior Mode' },
            ]}
          />
        </div>
      </Card>
    </div>
  )
}
