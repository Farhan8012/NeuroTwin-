import React from 'react'
import { AppStateProvider, useAppState } from './context/AppStateContext'
import { Navbar } from './components/common/Navbar'
import { Sidebar } from './components/common/Sidebar'
import { PatientSidebar } from './components/common/PatientSidebar'
import { SearchModal } from './components/common/SearchModal'
import { AudioRecorderModal } from './components/common/AudioRecorderModal'
import { ToastContainer } from './components/common/UIPrimitives'

// Auth Screens
import { SignInView } from './components/auth/SignInView'
import { SignUpView } from './components/auth/SignUpView'
import { ForgotPasswordView } from './components/auth/ForgotPasswordView'

// Caregiver Screens
import { CaregiverDashboard } from './components/caregiver/CaregiverDashboard'
import { PatientsView } from './components/caregiver/PatientsView'
import { PatientProfileView as CaregiverPatientProfileView } from './components/caregiver/PatientProfileView'
import { MemoryLibraryView } from './components/caregiver/MemoryLibraryView'
import { FamilyMembersView } from './components/caregiver/FamilyMembersView'
import { TimelineView } from './components/caregiver/TimelineView'
import { AIAssistantView } from './components/caregiver/AIAssistantView'
import { NotificationsView } from './components/caregiver/NotificationsView'
import { SettingsView } from './components/caregiver/SettingsView'

// Patient Screens (Digital Companion)
import { PatientHomeView } from './components/patient/PatientHomeView'
import { AskNeuroTwinView } from './components/patient/AskNeuroTwinView'
import { TodaysMemoriesView } from './components/patient/TodaysMemoriesView'
import { PatientFamilyView } from './components/patient/PatientFamilyView'
import { PatientPhotosView } from './components/patient/PatientPhotosView'
import { PatientRemindersView } from './components/patient/PatientRemindersView'
import { PatientEmergencyView } from './components/patient/PatientEmergencyView'
import { PatientProfileView } from './components/patient/PatientProfileView'

import './styles/global.css'

function AppContent() {
  const { mode, currentView } = useAppState()

  const renderScreen = () => {
    // Auth Mode Screens
    if (mode === 'auth') {
      switch (currentView) {
        case 'signup':
          return <SignUpView />
        case 'forgot-password':
          return <ForgotPasswordView />
        case 'signin':
        default:
          return <SignInView />
      }
    }

    // Caregiver Mode Screens
    if (mode === 'caregiver') {
      switch (currentView) {
        case 'patients':
          return <PatientsView />
        case 'patient-profile':
          return <CaregiverPatientProfileView />
        case 'memories':
          return <MemoryLibraryView />
        case 'family':
          return <FamilyMembersView />
        case 'timeline':
          return <TimelineView />
        case 'ai-assistant':
          return <AIAssistantView />
        case 'notifications':
          return <NotificationsView />
        case 'settings':
          return <SettingsView />
        case 'dashboard':
        default:
          return <CaregiverDashboard />
      }
    }

    // Patient Mode Screens (Digital Companion)
    if (mode === 'patient') {
      switch (currentView) {
        case 'ask-neurotwin':
          return <AskNeuroTwinView />
        case 'todays-memories':
          return <TodaysMemoriesView />
        case 'patient-family':
          return <PatientFamilyView />
        case 'patient-photos':
          return <PatientPhotosView />
        case 'patient-reminders':
          return <PatientRemindersView />
        case 'patient-emergency':
          return <PatientEmergencyView />
        case 'patient-profile':
          return <PatientProfileView />
        case 'settings':
          return <SettingsView />
        case 'patient-home':
        default:
          return <PatientHomeView />
      }
    }

    return <CaregiverDashboard />
  }

  // Exact left margin to match fixed sidebars (w-64 = 16rem, w-72 = 18rem)
  const mainMarginClass =
    mode === 'caregiver'
      ? 'sm:ml-64'
      : mode === 'patient'
      ? 'sm:ml-72'
      : 'ml-0'

  return (
    <div className="app-container min-h-screen bg-background text-on-surface">
      {/* Top App Bar Header */}
      <Navbar />

      {/* Fixed Side Navigation Bars */}
      {mode === 'caregiver' && <Sidebar />}
      {mode === 'patient' && <PatientSidebar />}

      {/* Main Viewport Content (Zero Double Margin) */}
      <main className={`${mainMarginClass} mt-20 p-xl flex-1 transition-all`}>
        <div className="max-w-[1400px] mx-auto space-y-lg">{renderScreen()}</div>
      </main>

      {/* Modals & Overlays */}
      <SearchModal />
      <AudioRecorderModal />
      <ToastContainer />
    </div>
  )
}

export default function App() {
  return (
    <AppStateProvider>
      <AppContent />
    </AppStateProvider>
  )
}
