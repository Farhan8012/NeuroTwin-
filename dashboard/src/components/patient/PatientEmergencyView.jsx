import React from 'react'
import { Card, Button } from '../common/UIPrimitives'
import { useAppState } from '../../context/AppStateContext'

export function PatientEmergencyView() {
  const { showToast, activePatient } = useAppState()

  return (
    <div className="space-y-8 max-w-3xl mx-auto text-center patient-mode-root">
      <div className="p-8 bg-rose-600 text-white rounded-3xl shadow-xl space-y-4 border-4 border-rose-400">
        <span className="text-6xl">🆘</span>
        <h1 className="text-4xl font-black">Emergency Help & Call</h1>
        <p className="text-lg opacity-95">
          Tap the big button below anytime you need assistance or want to talk to your daughter Sarah.
        </p>

        <button
          onClick={() => showToast('🚨 SOS ALERT SENT! Sarah & Care Team notified immediately.', 'danger')}
          className="w-full py-6 bg-white text-rose-700 hover:bg-rose-50 rounded-2xl text-2xl font-black shadow-2xl transition cursor-pointer"
        >
          🚨 TAP FOR EMERGENCY SOS CALL
        </button>
      </div>

      <Card className="p-6 space-y-4 border-2 border-slate-200 dark:border-slate-700 text-left">
        <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Your Current Safe Location</h3>
        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1 text-base">
          <p className="font-bold text-[#2B6CB0]">{activePatient.location}</p>
          <p className="text-slate-600 dark:text-slate-300">Cedar Heights Residence • 124 Oak Street, Boston MA</p>
        </div>
      </Card>

      <div className="pt-2">
        <Button size="xl" variant="outline" onClick={() => showToast(`Calling ${activePatient.caregiverPhone}...`, 'info')}>
          📞 Call Sarah Direct: {activePatient.caregiverPhone}
        </Button>
      </div>
    </div>
  )
}
