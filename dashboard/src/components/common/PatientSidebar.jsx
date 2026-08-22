import React from 'react'
import { useAppState } from '../../context/AppStateContext'

export function PatientSidebar() {
  const { currentView, navigateTo } = useAppState()

  const patientNavItems = [
    { key: 'patient-home', label: 'Home', icon: 'home' },
    { key: 'ask-neurotwin', label: 'Ask NeuroTwin', icon: 'psychology_alt' },
    { key: 'todays-memories', label: "Today's Memories", icon: 'photo_library' },
    { key: 'patient-family', label: 'Family', icon: 'family_restroom' },
    { key: 'patient-photos', label: 'Photos', icon: 'photo_camera' },
    { key: 'patient-reminders', label: 'Reminders', icon: 'schedule' },
    { key: 'patient-emergency', label: 'Emergency', icon: 'sos', danger: true },
    { key: 'patient-profile', label: 'My Profile', icon: 'person' },
  ]

  return (
    <aside className="h-screen w-72 fixed left-0 top-0 flex flex-col justify-between bg-surface-container-low dark:bg-[#121212] border-r border-outline-variant/40 dark:border-slate-800 z-50 p-lg transition-all">
      <div className="flex flex-col gap-md">
        {/* Companion Patient Header */}
        <div className="p-md bg-surface-container-lowest dark:bg-slate-800 rounded-2xl border border-outline-variant/30 dark:border-slate-700">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-primary dark:text-primary-fixed">
            Hello Eleanor
          </p>
          <h2 className="text-lg font-bold text-primary dark:text-slate-100">Your Companion</h2>
          <p className="text-xs text-on-surface-variant/70 dark:text-slate-400 mt-0.5 leading-snug">
            We are here to help you remember every moment.
          </p>
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-1.5 mt-xs">
          {patientNavItems.map((item) => {
            const isActive = currentView === item.key
            return (
              <button
                key={item.key}
                onClick={() => navigateTo(item.key)}
                className={`w-full flex items-center gap-md px-md py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  item.danger
                    ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100'
                    : isActive
                    ? 'bg-primary dark:bg-primary-fixed text-on-primary dark:text-primary shadow-sm font-bold'
                    : 'text-on-surface-variant dark:text-slate-300 hover:bg-surface-container-high dark:hover:bg-slate-800'
                }`}
              >
                <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Footer Support Pill */}
      <div className="p-md bg-secondary-container/40 dark:bg-slate-800 rounded-2xl border border-secondary/20 text-center">
        <p className="text-xs font-bold text-primary dark:text-teal-300">Need Help?</p>
        <p className="text-[11px] text-on-surface-variant/70 dark:text-slate-400 mt-0.5">Tap Emergency or call Sarah anytime.</p>
      </div>
    </aside>
  )
}
