import React from 'react'
import { useAppState } from '../../context/AppStateContext'

export function Sidebar() {
  const { currentView, navigateTo, setAddMemoryOpen, activePatient } = useAppState()

  const navItems = [
    { key: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { key: 'patients', label: 'Patients Roster', icon: 'groups', badge: '3' },
    { key: 'patient-profile', label: 'Patient Profile', icon: 'medical_services' },
    { key: 'memories', label: 'Memory Library', icon: 'collections_bookmark', badge: '142' },
    { key: 'family', label: 'Family Members', icon: 'family_restroom', badge: '6' },
    { key: 'timeline', label: 'Life Timeline', icon: 'timeline' },
    { key: 'ai-assistant', label: 'AI Assistant', icon: 'psychology_alt' },
    { key: 'notifications', label: 'Notifications', icon: 'notifications', badge: '3' },
    { key: 'settings', label: 'Settings', icon: 'settings' },
  ]

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 flex flex-col bg-surface-container-low dark:bg-[#121212] border-r border-outline-variant/40 dark:border-slate-800 z-50 transition-all">
      <div className="flex flex-col h-full py-xl px-lg">
        {/* Brand Logo Header */}
        <div
          onClick={() => navigateTo('dashboard')}
          className="mb-xl flex items-center gap-md px-xs cursor-pointer group"
        >
          <div className="w-10 h-10 bg-primary dark:bg-primary-fixed rounded-xl flex items-center justify-center shadow-md">
            <span className="material-symbols-outlined text-on-primary dark:text-primary text-[24px]">
              psychology
            </span>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-primary dark:text-primary-fixed">NeuroTwin</h1>
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-on-surface-variant/70 dark:text-slate-400">
              Professional SaaS
            </p>
          </div>
        </div>

        {/* Quick Add Button */}
        <button
          onClick={() => setAddMemoryOpen(true)}
          className="w-full mb-lg py-2.5 px-md bg-primary dark:bg-primary-fixed text-on-primary dark:text-primary rounded-xl font-bold text-sm shadow-md hover:opacity-90 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
        >
          <span className="material-symbols-outlined !text-[18px]">add_circle</span>
          <span>Add Memory</span>
        </button>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = currentView === item.key
            return (
              <button
                key={item.key}
                onClick={() => navigateTo(item.key)}
                className={`w-full flex items-center justify-between px-md py-3 rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? 'bg-surface-container-highest dark:bg-primary-container text-primary dark:text-primary-fixed font-semibold border border-outline-variant/30 dark:border-primary-fixed/20'
                    : 'text-on-surface-variant dark:text-slate-300 hover:bg-surface-container-high dark:hover:bg-slate-800 font-medium'
                }`}
              >
                <div className="flex items-center gap-md">
                  <span className="material-symbols-outlined">{item.icon}</span>
                  <span className="text-sm tracking-premium">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive
                        ? 'bg-primary text-on-primary dark:bg-primary-fixed dark:text-primary'
                        : 'bg-surface-container-high dark:bg-slate-700 text-on-surface-variant dark:text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* User / Caregiver Profile at bottom */}
        <div className="mt-auto pt-lg border-t border-outline-variant/30 dark:border-slate-800">
          <div
            onClick={() => navigateTo('settings')}
            className="flex items-center gap-md p-md bg-surface-container-low dark:bg-slate-800 rounded-xl border border-outline-variant/20 dark:border-slate-700 cursor-pointer"
          >
            <img
              alt={activePatient.name}
              className="w-9 h-9 rounded-full object-cover shadow-sm"
              src={activePatient.avatar}
            />
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-bold truncate dark:text-slate-100">{activePatient.name}</p>
              <p className="text-[10px] text-on-surface-variant dark:text-slate-400 truncate">Caregiver View</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
