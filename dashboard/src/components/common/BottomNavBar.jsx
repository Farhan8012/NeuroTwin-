import React from 'react'
import { useAppState } from '../../context/AppStateContext'

const PATIENT_TABS = [
  { key: 'patient-home', icon: 'home', label: 'Home' },
  { key: 'todays-memories', icon: 'auto_awesome', label: 'Memories' },
  { key: 'patient-family', icon: 'family_restroom', label: 'Family' },
  { key: 'patient-emergency', icon: 'emergency', label: 'Help' },
]

const CAREGIVER_TABS = [
  { key: 'dashboard', icon: 'dashboard', label: 'Dashboard' },
  { key: 'memories', icon: 'psychology', label: 'Memories' },
  { key: 'family', icon: 'group', label: 'People' },
  { key: 'photo-albums', icon: 'photo_library', label: 'Albums' },
  { key: 'settings', icon: 'settings', label: 'Settings' },
]

export function BottomNavBar() {
  const { mode, currentView, navigateTo } = useAppState()

  if (mode === 'auth') return null

  const tabs = mode === 'patient' ? PATIENT_TABS : CAREGIVER_TABS

  return (
    <nav className="nt-bottom-nav sm:hidden" role="navigation" aria-label="Main navigation">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          className={`nt-bottom-nav-item ${currentView === tab.key ? 'active' : ''}`}
          onClick={() => navigateTo(tab.key)}
          aria-current={currentView === tab.key ? 'page' : undefined}
          aria-label={tab.label}
        >
          <span className="material-symbols-outlined">{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}
