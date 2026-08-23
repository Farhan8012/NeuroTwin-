import React, { useState } from 'react'
import { useAppState } from '../../context/AppStateContext'
import { AISummaryPanel } from '../common/AISummaryPanel'
import { InsightCard } from '../common/InsightCard'
import { CognitiveTrendChart } from '../common/CognitiveTrendChart'
import { SessionCard } from '../common/SessionCard'
import { ReminderCard } from '../common/ReminderCard'
import { FamilyCard } from '../common/FamilyCard'

export function CaregiverDashboard() {
  const { activePatient, navigateTo, setAudioRecorderOpen, setAddMemoryOpen, showToast } = useAppState()

  const [reminders, setReminders] = useState([
    { id: 1, time: '08:00 AM', title: 'Morning Medication & Breakfast', description: 'Aricept 10mg + Warm Oatmeal', status: 'completed' },
    { id: 2, time: '10:30 AM', title: 'Garden Walk & Audio Cue', description: '1974 Lake Tahoe Memory Dictation', status: 'completed' },
    { id: 3, time: '02:00 PM', title: 'Piano Music Memory Session', description: 'Chopin Nocturne in E-Flat', status: 'upcoming' },
    { id: 4, time: '05:30 PM', title: 'Family Video Call with Sarah', description: 'Evening check-in & photo review', status: 'upcoming' },
  ])

  const toggleReminder = (id) => {
    setReminders((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, status: r.status === 'completed' ? 'upcoming' : 'completed' }
          : r
      )
    )
    showToast('Updated routine status', 'info')
  }

  return (
    <div className="space-y-lg">
      {/* Clinical Patient Header Banner */}
      <section className="premium-card p-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-none shadow-sm bg-gradient-to-r from-surface-container-lowest via-surface-container-low to-slate-100 dark:from-slate-800 dark:to-slate-800/80">
        <div className="flex items-center gap-xl">
          <div className="relative">
            <img
              src={activePatient.avatar}
              alt={activePatient.name}
              className="w-24 h-24 rounded-2xl object-cover shadow-md border-4 border-white dark:border-slate-700"
            />
            <div className="absolute -bottom-2 -right-2 bg-emerald-500 border-4 border-white dark:border-slate-700 w-6 h-6 rounded-full animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-md">
              <h2 className="text-3xl font-bold tracking-tight text-primary dark:text-primary-fixed">{activePatient.name}</h2>
              <span className="px-3 py-1 bg-surface-container-high dark:bg-slate-700 rounded-full text-xs font-bold text-on-surface-variant dark:text-slate-200 uppercase tracking-widest">
                Stage 2 • Early Alzheimer's
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-base mt-2">
              <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">● Live Care Monitoring</span>
              <span className="w-1.5 h-1.5 bg-outline-variant rounded-full" />
              <span className="text-sm text-on-surface-variant dark:text-slate-300 font-medium">
                Location: {activePatient.location}
              </span>
              <span className="w-1.5 h-1.5 bg-outline-variant rounded-full" />
              <span className="text-sm text-on-surface-variant dark:text-slate-300 font-medium">
                Primary Caregiver: {activePatient.primaryCaregiver}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-md sm:gap-xl shrink-0">
          <button
            onClick={() => setAudioRecorderOpen(true)}
            className="bg-secondary-container dark:bg-secondary text-on-secondary-container dark:text-on-secondary px-lg py-3 rounded-xl flex items-center gap-md font-bold shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined">mic</span>
            <span className="text-sm tracking-premium">Record Audio Cue</span>
          </button>

          <button
            onClick={() => setAddMemoryOpen(true)}
            className="bg-primary dark:bg-primary-fixed text-on-primary dark:text-primary px-lg py-3 rounded-xl flex items-center gap-md font-bold shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined">add_circle</span>
            <span className="text-sm tracking-premium">Add Memory</span>
          </button>
        </div>
      </section>

      {/* AI Daily Memory Synthesis Panel */}
      <AISummaryPanel patientName={activePatient.name} onActionClick={() => navigateTo('ai-assistant')} />

      {/* Clinical AI Insight Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-lg">
        <InsightCard
          title="Recall Confidence"
          metric="84%"
          change="+4.2%"
          trend="up"
          category="AI Score"
          icon="psychology"
          description="High emotional resonance detected during family photo reviews."
        />

        <InsightCard
          title="Verbal Fluency"
          metric="78/100"
          change="+2.8%"
          trend="up"
          category="Language"
          icon="record_voice_over"
          description="Morning speech clarity score verified in optimal threshold."
        />

        <InsightCard
          title="Mood Stability"
          metric="92%"
          change="Consistent"
          trend="up"
          category="Behavioral"
          icon="mood"
          description="Zero agitation episodes recorded over last 48 hours."
        />

        <InsightCard
          title="Safety Alerts"
          metric="0 Active"
          change="All Clear"
          trend="up"
          category="Safety"
          icon="shield"
          description="Ambient motion sensors & wearable telemetry operating normally."
        />
      </div>

      {/* Main Bento Grid */}
      <div className="bento-grid">
        {/* Cognitive Vitality Interactive Chart */}
        <div className="col-span-12 lg:col-span-6">
          <CognitiveTrendChart title="Cognitive Vitality & Trajectory" />
        </div>

        {/* System Logs & Active Sessions */}
        <div className="col-span-12 lg:col-span-6 premium-card p-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-lg">
            <h3 className="text-lg font-bold text-primary dark:text-primary-fixed tracking-tight">Active Memory Sessions & Logs</h3>
            <button onClick={() => navigateTo('memories')} className="text-xs text-primary font-bold hover:underline">
              View All ➔
            </button>
          </div>

          <div className="space-y-4">
            <SessionCard
              title="1970s Acoustic Guitar Memory Cue"
              time="LIVE NOW"
              notes="AI stimulated recall through 1970s acoustic folk playlist. Verbal responses recorded."
              responsiveness="High (91%)"
              icon="music_note"
            />

            <SessionCard
              title="Morning Hygiene & Breakfast Routine"
              time="09:15 AM"
              notes="All morning hydration and nutrition goals completed independently. Mood score: 9/10."
              responsiveness="Optimal (100%)"
              icon="task_alt"
            />
          </div>
        </div>

        {/* Upcoming Reminders Checklist */}
        <div className="col-span-12 lg:col-span-6 premium-card p-xl">
          <div className="flex items-center justify-between mb-xl">
            <h3 className="text-lg font-bold text-primary dark:text-primary-fixed tracking-tight">Care Routine & Reminders</h3>
            <span className="px-3 py-1 bg-surface-container-high rounded-full text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Today: Jul 23
            </span>
          </div>

          <div className="space-y-3">
            {reminders.map((r) => (
              <ReminderCard
                key={r.id}
                time={r.time}
                title={r.title}
                description={r.description}
                status={r.status}
                onToggle={() => toggleReminder(r.id)}
              />
            ))}
          </div>
        </div>

        {/* Inner Circle & Family Connections */}
        <div className="col-span-12 lg:col-span-6 premium-card p-xl">
          <div className="flex items-center justify-between mb-xl">
            <h3 className="text-lg font-bold text-primary dark:text-primary-fixed tracking-tight">Inner Circle Recognition</h3>
            <button onClick={() => navigateTo('family')} className="text-xs text-primary font-bold hover:underline">
              Manage Care Circle (#6) ➔
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-lg">
            <FamilyCard
              name="Sarah Vance"
              relationship="Daughter • Primary Caregiver"
              avatar="https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=256&q=80"
              contributions="48"
              onCall={() => showToast('Calling Sarah Vance...', 'info')}
            />

            <FamilyCard
              name="David Vance"
              relationship="Son • Contributor"
              avatar="https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=256&q=80"
              contributions="32"
              onCall={() => showToast('Calling David Vance...', 'info')}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

