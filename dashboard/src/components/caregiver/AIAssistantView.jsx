import React from 'react'
import { Card, Badge } from '../common/UIPrimitives'
import { AIChatWidget } from '../common/AIChatWidget'
import { useAppState } from '../../context/AppStateContext'

export function AIAssistantView() {
  const { activePatient } = useAppState()

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">AI Assistant & Synthesizer</h2>
          <Badge variant="secondary">HIPAA Compliant Engine</Badge>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Search indexed memory logs, generate daily orientation prompts, or analyze emotional triggers for <strong>{activePatient.name}</strong>.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[680px]">
        <div className="lg:col-span-2 h-full">
          <AIChatWidget patientName={activePatient.name} isPatientView={false} />
        </div>

        <div className="space-y-4">
          <Card>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">Clinical Prompt Library</h3>
            <p className="text-xs text-slate-500 mb-3">Pre-tested prompts for Alzheimer's caregiver workflow:</p>

            <div className="space-y-2">
              {[
                'Generate 10-minute morning orientation script',
                'What memories calm Eleanor during evening agitation?',
                'Summarize family contributions from daughter Sarah this week',
                'Create a memory quiz for grandson Leo\'s visit',
              ].map((p, i) => (
                <div key={i} className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300 font-medium hover:bg-[#EBF8FF] dark:hover:bg-[#2B6CB0]/20 border border-slate-200 dark:border-slate-700 cursor-pointer transition">
                  💡 {p}
                </div>
              ))}
            </div>
          </Card>

          <Card className="bg-slate-900 text-white">
            <h4 className="text-sm font-bold mb-1">Vector Indexing Stats</h4>
            <div className="space-y-2 text-xs text-slate-300 pt-2">
              <div className="flex justify-between">
                <span>Memories Embedded:</span>
                <span className="font-bold text-[#38B2AC]">142 vectors</span>
              </div>
              <div className="flex justify-between">
                <span>Audio Transcriptions:</span>
                <span className="font-bold text-[#38B2AC]">28 clips</span>
              </div>
              <div className="flex justify-between">
                <span>Emotions Recognized:</span>
                <span className="font-bold text-amber-400">Joy, Calm, Nostalgia</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
