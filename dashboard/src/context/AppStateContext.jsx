import React, { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../lib/api'

const AppStateContext = createContext()

export const MOCK_PATIENT = {
  id: 'pt-001',
  name: 'Eleanor Vance',
  age: 78,
  condition: 'Early Stage Alzheimer\'s (Stage 2)',
  location: 'Cedar Heights Residence, Room 304',
  primaryCaregiver: 'Sarah Vance (Daughter)',
  caregiverPhone: '+1 (555) 234-5678',
  avatar: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=256&q=80',
  joinDate: 'Oct 2025',
  cognitiveScore: '78%',
  memoriesCount: 142,
  familyMembersCount: 6,
  dailyStreak: 14,
}

const MOCK_FAMILY = [
  {
    id: 'fam-1',
    name: 'Sarah Vance',
    relationship: 'Your Daughter',
    phone: '+1 (555) 234-5678',
    note: 'Sarah visits every Tuesday & Thursday. Call her anytime!',
    avatar: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'fam-2',
    name: 'David Vance',
    relationship: 'Your Son',
    phone: '+1 (555) 345-6789',
    note: 'David lives in Seattle and calls every Sunday evening.',
    avatar: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'fam-3',
    name: 'Emily Vance',
    relationship: 'Your Granddaughter',
    phone: '+1 (555) 456-7890',
    note: 'Emily plays violin and loves baking peach pie with you.',
    avatar: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=400&q=80',
  },
]

const MOCK_MEMORIES = [
  {
    id: 'mem-1', title: '1974 Lake Tahoe Family Cabin', category: 'Travel', categoryVariant: 'primary',
    description: 'Summer trip with Thomas and 5-year-old Sarah. Camping by the blue lake, swimming, and eating fresh trout.',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
    contributor: 'Sarah Vance', year: '1974', isFeatured: false, photos: [],
  },
]

// UI category <-> backend memory category
const CATEGORY_TO_BACKEND = { Family: 'story', Travel: 'place', Music: 'song', Milestones: 'life_event', Recipes: 'hobby' }
const BACKEND_TO_CATEGORY = { story: 'Family', anecdote: 'Family', place: 'Travel', song: 'Music', life_event: 'Milestones', hobby: 'Recipes' }
const CATEGORY_VARIANTS = { Family: 'accent', Travel: 'primary', Music: 'secondary', Milestones: 'accent', Recipes: 'secondary' }

function mapBackendMemory(m) {
  const year = m.event_date ? String(m.event_date).slice(0, 4) : ''
  return {
    id: m.id,
    title: m.title,
    category: BACKEND_TO_CATEGORY[m.category] || 'Family',
    categoryVariant: CATEGORY_VARIANTS[BACKEND_TO_CATEGORY[m.category]] || 'primary',
    description: m.description,
    image: null,
    contributor: m.person_id ? `Person ${m.person_id}` : 'Family',
    year,
    isFeatured: false,
    photos: [],
  }
}

function mapBackendContact(c) {
  return {
    id: c.id,
    name: c.name,
    relationship: c.relationship || 'Family',
    phone: c.phone || '',
    note: c.is_primary ? 'Primary emergency contact' : '',
    avatar: null,
    is_primary: !!c.is_primary,
  }
}

export function AppStateProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [mode, setMode] = useState('auth') // 'auth' | 'caregiver' | 'patient'
  const [currentView, setCurrentView] = useState('signin')
  const [userRole, setUserRole] = useState(null)

  const [isDarkMode, setIsDarkMode] = useState(false)
  const [fontScale, setFontScale] = useState('normal')
  const [activePatient, setActivePatient] = useState(MOCK_PATIENT)

  // Overlays
  const [searchOpen, setSearchOpen] = useState(false)
  const [audioRecorderOpen, setAudioRecorderOpen] = useState(false)
  const [addMemoryOpen, setAddMemoryOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [toast, setToast] = useState(null)

  // Backend-driven state (mock fallback when offline)
  const [backendOnline, setBackendOnline] = useState(false)
  const [systemHealth, setSystemHealth] = useState(null)
  const [familyMembers, setFamilyMembers] = useState(MOCK_FAMILY)
  const [memoryAlbums, setMemoryAlbums] = useState(MOCK_MEMORIES)
  const [medicines, setMedicines] = useState([])
  const [registeredPeople, setRegisteredPeople] = useState([])

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

  useEffect(() => {
    document.documentElement.classList.remove('font-scale-large', 'font-scale-xlarge')
    if (fontScale === 'large') {
      document.documentElement.classList.add('font-scale-large')
    } else if (fontScale === 'xlarge') {
      document.documentElement.classList.add('font-scale-xlarge')
    }
  }, [fontScale])

  // ── Initial sync with the FastAPI backend ────────────────────────
  const refreshFromBackend = async () => {
    try {
      const health = await api.getHealth()
      setSystemHealth(health)
      setBackendOnline(true)
    } catch {
      setBackendOnline(false)
      return // backend unreachable — keep mock data
    }

    try {
      const [contacts, memories, meds, people] = await Promise.all([
        api.listEmergencyContacts(),
        api.listMemories(),
        api.listMedicines().catch(() => []),
        api.listPeople().catch(() => []),
      ])
      if (Array.isArray(contacts) && contacts.length > 0) {
        setFamilyMembers(contacts.map(mapBackendContact))
        const primary = contacts.find((c) => c.is_primary) || contacts[0]
        setActivePatient((prev) => ({
          ...prev,
          primaryCaregiver: `${primary.name} (${primary.relationship})`,
          caregiverPhone: primary.phone || prev.caregiverPhone,
        }))
      }
      if (Array.isArray(memories)) setMemoryAlbums(memories.map(mapBackendMemory))
      if (Array.isArray(meds)) setMedicines(meds)
      if (Array.isArray(people)) setRegisteredPeople(people)
    } catch (err) {
      console.warn('Partial backend sync failed:', err)
    }
  }

  useEffect(() => {
    refreshFromBackend()
    const interval = setInterval(async () => {
      try {
        const health = await api.getHealth()
        setSystemHealth(health)
        setBackendOnline(true)
      } catch {
        setBackendOnline(false)
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const showToast = (message, type = 'info') => {
    setToast({ id: Date.now(), message, type })
    setTimeout(() => setToast(null), 3500)
  }

  // ── Memories CRUD (API-backed, local fallback) ───────────────────
  const saveMemoryAlbum = async (albumData) => {
    if (backendOnline && !String(albumData.id).startsWith('mem-')) {
      // update existing backend memory
      await api.createMemory({
        title: albumData.title,
        description: albumData.description,
        category: CATEGORY_TO_BACKEND[albumData.category] || 'story',
        event_date: albumData.year ? `${albumData.year}-01-01` : null,
      })
    } else if (backendOnline) {
      const created = await api.createMemory({
        title: albumData.title,
        description: albumData.description,
        category: CATEGORY_TO_BACKEND[albumData.category] || 'story',
        event_date: albumData.year ? `${albumData.year}-01-01` : null,
      })
      setMemoryAlbums((prev) => [mapBackendMemory(created), ...prev])
      return created
    }
    // offline / legacy-mock path
    setMemoryAlbums((prev) =>
      prev.map((a) => (a.id === albumData.id ? albumData : a)).concat(
        prev.some((a) => a.id === albumData.id) ? [] : [{ ...albumData, id: albumData.id || `mem-${Date.now()}` }]
      )
    )
  }

  const deleteMemoryAlbum = async (id) => {
    if (backendOnline && !String(id).startsWith('mem-')) {
      try { await api.deleteMemory(id) } catch (err) { showToast('Failed to delete on server', 'error'); return }
    }
    setMemoryAlbums((prev) => prev.filter((a) => a.id !== id))
  }

  // ── Emergency contacts CRUD ──────────────────────────────────────
  const saveFamilyMember = async (memberData) => {
    if (!backendOnline) {
      setFamilyMembers((prev) =>
        prev.map((m) => (m.id === memberData.id ? memberData : m)).concat(
          prev.some((m) => m.id === memberData.id) ? [] : [{ ...memberData, id: memberData.id || `fam-${Date.now()}` }]
        )
      )
      return
    }
    if (memberData.id && !String(memberData.id).startsWith('fam-')) {
      const updated = await api.updateEmergencyContact(memberData.id, {
        name: memberData.name,
        relationship: memberData.relationship,
        phone: memberData.phone,
        is_primary: !!memberData.is_primary,
      })
      setFamilyMembers((prev) => prev.map((m) => (m.id === memberData.id ? mapBackendContact(updated) : m)))
    } else {
      const created = await api.createEmergencyContact({
        name: memberData.name,
        relationship: memberData.relationship,
        phone: memberData.phone,
        is_primary: !!memberData.is_primary,
      })
      setFamilyMembers((prev) => [...prev, mapBackendContact(created)])
    }
  }

  const deleteFamilyMember = async (id) => {
    if (backendOnline && !String(id).startsWith('fam-')) {
      try { await api.deleteEmergencyContact(id) } catch (err) { showToast('Failed to delete on server', 'error'); return }
    }
    setFamilyMembers((prev) => prev.filter((m) => m.id !== id))
  }

  // Auth & Sign Up Functions
  const login = (targetRole = 'caregiver', userName) => {
    setIsAuthenticated(true)
    setUserRole(targetRole)
    setMode(targetRole)
    if (userName) {
      setActivePatient((prev) => ({ ...prev, name: userName }))
    }
    if (targetRole === 'caregiver') {
      setCurrentView('dashboard')
    } else {
      setCurrentView('patient-home')
    }
    showToast(`Welcome back${userName ? `, ${userName}` : ''}!`, 'success')
    refreshFromBackend()
  }

  const signUp = (fullName, email, role) => {
    setIsAuthenticated(true)
    const targetRole = role === 'patient' ? 'patient' : 'caregiver'
    setUserRole(targetRole)
    setMode(targetRole)
    setActivePatient((prev) => ({
      ...prev,
      name: fullName || 'User',
    }))
    if (targetRole === 'caregiver') {
      setCurrentView('dashboard')
    } else {
      setCurrentView('patient-home')
    }
    showToast(`Account created successfully for ${fullName || 'User'}! Welcome to NeuroTwin.`, 'success')
  }

  const logout = () => {
    setIsAuthenticated(false)
    setUserRole(null)
    setMode('auth')
    setCurrentView('signin')
    setProfileMenuOpen(false)
    showToast('Signed out of NeuroTwin', 'info')
  }

  const switchRole = (newRole) => {
    if (!isAuthenticated) return
    setUserRole(newRole)
    setMode(newRole)
    setProfileMenuOpen(false)
    if (newRole === 'caregiver') {
      setCurrentView('dashboard')
    } else {
      setCurrentView('patient-home')
    }
    showToast(`Switched view to ${newRole === 'caregiver' ? 'Caregiver Portal' : 'Patient Digital Companion'}`, 'info')
  }

  const navigateTo = (viewKey) => {
    setCurrentView(viewKey)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <AppStateContext.Provider
      value={{
        isAuthenticated,
        login,
        signUp,
        logout,
        mode,
        switchRole,
        currentView,
        navigateTo,
        isDarkMode,
        setIsDarkMode,
        fontScale,
        setFontScale,
        activePatient,
        setActivePatient,
        searchOpen,
        setSearchOpen,
        audioRecorderOpen,
        setAudioRecorderOpen,
        addMemoryOpen,
        setAddMemoryOpen,
        profileMenuOpen,
        setProfileMenuOpen,
        toast,
        showToast,
        familyMembers,
        setFamilyMembers,
        memoryAlbums,
        setMemoryAlbums,
        medicines,
        registeredPeople,
        backendOnline,
        systemHealth,
        refreshFromBackend,
        saveMemoryAlbum,
        deleteMemoryAlbum,
        saveFamilyMember,
        deleteFamilyMember,
      }}
    >
      {children}
    </AppStateContext.Provider>
  )
}

export function useAppState() {
  const context = useContext(AppStateContext)
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider')
  }
  return context
}
