import React from 'react'
import { AppStateProvider, useAppState } from './context/AppStateContext'
import { Navbar } from './components/common/Navbar'
import { BottomNavBar } from './components/common/BottomNavBar'
import { ToastContainer } from './components/common/UIPrimitives'

// Auth Screens
import { SignInView } from './components/auth/SignInView'
import { SignUpView } from './components/auth/SignUpView'
import { ForgotPasswordView } from './components/auth/ForgotPasswordView'

// Caregiver Screens
import { CaregiverDashboard } from './components/caregiver/CaregiverDashboard'
import { MemoryLibraryView } from './components/caregiver/MemoryLibraryView'
import { FamilyMembersView } from './components/caregiver/FamilyMembersView'
import { PhotoAlbumsView } from './components/caregiver/PhotoAlbumsView'
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
    // Auth Mode
    if (mode === 'auth') {
      switch (currentView) {
        case 'signup': return <SignUpView />
        case 'forgot-password': return <ForgotPasswordView />
        case 'signin': default: return <SignInView />
      }
    }

    // Caregiver Mode
    if (mode === 'caregiver') {
      switch (currentView) {
        case 'memories': return <MemoryLibraryView />
        case 'family': return <FamilyMembersView />
        case 'photo-albums': return <PhotoAlbumsView />
        case 'timeline': return <TimelineView />
        case 'ai-assistant': return <AIAssistantView />
        case 'notifications': return <NotificationsView />
        case 'settings': return <SettingsView />
        case 'dashboard': default: return <CaregiverDashboard />
      }
    }

    // Patient Mode
    if (mode === 'patient') {
      switch (currentView) {
        case 'ask-neurotwin': return <AskNeuroTwinView />
        case 'todays-memories': return <TodaysMemoriesView />
        case 'patient-family': return <PatientFamilyView />
        case 'patient-photos': return <PatientPhotosView />
        case 'patient-reminders': return <PatientRemindersView />
        case 'patient-emergency': return <PatientEmergencyView />
        case 'patient-profile': return <PatientProfileView />
        case 'settings': return <SettingsView />
        case 'patient-home': default: return <PatientHomeView />
      }
    }

    return <CaregiverDashboard />
  }

  // Auth screens — full screen, no nav
  if (mode === 'auth') {
    return (
      <div className="app-container">
        {renderScreen()}
        <ToastContainer />
      </div>
    )
  }

  return (
    <div className="app-container">
      {/* Top App Bar */}
      <Navbar />

      {/* Main Content */}
      <main className="nt-page animate-fade-in" key={currentView}>
        {renderScreen()}
      </main>

      {/* Mobile Bottom Nav (hidden on desktop) */}
      <BottomNavBar />

      {/* Modals & Overlays */}
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
