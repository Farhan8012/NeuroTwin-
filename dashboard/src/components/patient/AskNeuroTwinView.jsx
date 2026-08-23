import React from 'react'
import { AIChatWidget } from '../common/AIChatWidget'
import { useAppState } from '../../context/AppStateContext'

export function AskNeuroTwinView() {
  const { activePatient } = useAppState()

  return (
    <div className="space-y-6 max-w-4xl mx-auto patient-mode-root">
      <div className="p-6 bg-[#EBF8FF] dark:bg-slate-800 rounded-3xl border-2 border-[#BEE3F8] dark:border-slate-700">
        <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100">Ask NeuroTwin</h2>
        <p className="text-base text-slate-600 dark:text-slate-300 mt-1">
          Your friendly memory companion. Speak or tap any topic to remember together.
        </p>
      </div>

      <div className="h-[600px]">
        <AIChatWidget patientName={activePatient.name} isPatientView={true} />
      </div>
    </div>
  )
}
