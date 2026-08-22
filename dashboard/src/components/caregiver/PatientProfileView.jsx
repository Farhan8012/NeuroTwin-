import React, { useState } from 'react'
import { Card, Badge, Button, Tabs } from '../common/UIPrimitives'
import { useAppState } from '../../context/AppStateContext'

export function PatientProfileView() {
  const { activePatient, navigateTo } = useAppState()
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="space-y-6">
      {/* Patient Header Card */}
      <Card className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-6">
        <div className="flex items-center gap-5">
          <img
            src={activePatient.avatar}
            alt={activePatient.name}
            className="w-20 h-20 rounded-2xl object-cover ring-4 ring-[#2B6CB0]/20"
          />
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">{activePatient.name}</h2>
              <Badge variant="primary">{activePatient.condition}</Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Age {activePatient.age} • Joined {activePatient.joinDate} • Location: {activePatient.location}
            </p>
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Primary Caregiver: <strong>{activePatient.primaryCaregiver}</strong> ({activePatient.caregiverPhone})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigateTo('memories')}>
            🖼️ View Memory Bank (#142)
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigateTo('timeline')}>
            ⏳ Life Timeline
          </Button>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'overview', label: 'Clinical Overview' },
          { id: 'routine', label: 'Daily Care Routine' },
          { id: 'contacts', label: 'Care Team & Emergency' },
          { id: 'notes', label: 'Caregiver Notes & Logs' },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* Tab Content: Clinical Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4">
                Cognitive Engagement & Memory Trends
              </h3>
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Morning Verbal Memory Recall</span>
                  <span className="font-bold text-[#2B6CB0]">82% (Strong)</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#2B6CB0] h-full w-[82%]" />
                </div>

                <div className="flex items-center justify-between text-xs pt-2">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Facial Recognition Cues (Family)</span>
                  <span className="font-bold text-[#38B2AC]">91% (Optimal)</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#38B2AC] h-full w-[91%]" />
                </div>

                <div className="flex items-center justify-between text-xs pt-2">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Time & Location Orientation</span>
                  <span className="font-bold text-amber-600">68% (Moderate)</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full w-[68%]" />
                </div>
              </div>
            </Card>

            <Card>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-3">AI Memory Cues Strategy</h3>
              <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-[#2B6CB0]">•</span>
                  <span><strong>Music Cues:</strong> Chopin Preludes and 1970s Folk Guitar evoke deep relaxation.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#2B6CB0]">•</span>
                  <span><strong>Family Triggers:</strong> Mentioning her grandson Leo's soccer games prompts instant laughter.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#2B6CB0]">•</span>
                  <span><strong>Visual Prompts:</strong> 1974 Lake Tahoe photo album is her favorite memory anchor.</span>
                </li>
              </ul>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">Primary Contacts</h3>
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-100">Dr. Marcus Vance, MD</p>
                    <p className="text-slate-500">Attending Neurologist</p>
                  </div>
                  <Button size="sm" variant="ghost">Call</Button>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-100">Sarah Vance</p>
                    <p className="text-slate-500">Daughter & Power of Attorney</p>
                  </div>
                  <Button size="sm" variant="ghost">Call</Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Tab Content: Daily Routine */}
      {activeTab === 'routine' && (
        <Card>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4">Structured Memory Routine</h3>
          <p className="text-xs text-slate-500 mb-4">Daily schedule optimized to maintain emotional calm and cognitive stimulation.</p>
          <div className="space-y-3">
            {[
              { time: '08:00 AM', title: 'Morning Orientation & Breakfast', desc: 'Greeting prompt with today\'s day/date and photo of daughter Sarah.' },
              { time: '10:30 AM', title: 'Outdoor Walk & Audio Memory Cue', desc: 'Listening to 1970s Lake Tahoe story dictation while walking in garden.' },
              { time: '02:00 PM', title: 'Cognitive Piano Memory Session', desc: 'Interactive Chopin music memory reel.' },
              { time: '05:30 PM', title: 'Family Video Check-in', desc: 'Evening video call with family care circle.' },
            ].map((r, idx) => (
              <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-start gap-4">
                <span className="px-2.5 py-1 bg-[#2B6CB0] text-white font-bold rounded-lg text-xs shrink-0">{r.time}</span>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{r.title}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
