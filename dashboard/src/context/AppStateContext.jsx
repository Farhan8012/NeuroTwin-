import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'

const AppStateContext = createContext()

// UI category <-> backend memory category mappings
const CATEGORY_TO_BACKEND = { Family: 'story', Travel: 'place', Music: 'song', Milestones: 'life_event', Recipes: 'hobby' }
const BACKEND_TO_CATEGORY = { story: 'Family', anecdote: 'Family', place: 'Travel', song: 'Music', life_event: 'Milestones', hobby: 'Recipes' }
const CATEGORY_VARIANTS = { Family: 'accent', Travel: 'primary', Music: 'secondary', Milestones: 'accent', Recipes: 'secondary' }

function mapBackendMemory(m, index = 0) {
  const year = m.event_date ? String(m.event_date).slice(0, 4) : (m.year || '')
  return {
    id: m.id || `mem-${index}`,
    title: m.title,
    category: BACKEND_TO_CATEGORY[m.category] || m.category || 'Family',
    categoryVariant: CATEGORY_VARIANTS[BACKEND_TO_CATEGORY[m.category]] || 'primary',
    description: m.description,
    image: m.image || m.photo_url || null,
    contributor: m.person_binding || (m.person_id ? `Person ${m.person_id}` : 'Family'),
    year: year || '',
    isFeatured: m.is_featured !== undefined ? !!m.is_featured : (index === 0),
    photos: m.photos || [],
  }
}

function mapBackendContact(c, index = 0) {
  return {
    id: c.id || `fam-${index}`,
    name: c.name,
    relationship: c.relationship || 'Family',
    phone: c.phone || '',
    note: c.note || (c.is_primary ? 'Primary emergency contact • Available anytime' : 'Family member'),
    avatar: c.avatar || null,
    is_primary: !!c.is_primary,
  }
}

export function AppStateProvider({ children }) {
  // ── Auth State ──────────────────────────────────────
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [mode, setMode] = useState('auth') // 'auth' | 'caregiver' | 'patient'
  const [currentView, setCurrentView] = useState('signin')
  const [userRole, setUserRole] = useState(null)

  // ── UI State ────────────────────────────────────────
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [fontScale, setFontScale] = useState('normal')
  const [searchOpen, setSearchOpen] = useState(false)
  const [audioRecorderOpen, setAudioRecorderOpen] = useState(false)
  const [addMemoryOpen, setAddMemoryOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [toast, setToast] = useState(null)

  // ── Patient context (populated from backend, NOT mock) ──
  const [activePatient, setActivePatient] = useState({
    id: null,
    name: '',
    age: null,
    condition: '',
    location: '',
    primaryCaregiver: '',
    caregiverPhone: '',
    avatar: null,
    joinDate: '',
    cognitiveScore: null,
    memoriesCount: 0,
    familyMembersCount: 0,
    dailyStreak: 0,
  })

  // ── Backend-driven state (starts empty, populated from API) ──
  const [backendOnline, setBackendOnline] = useState(false)
  const [systemHealth, setSystemHealth] = useState(null)
  const [familyMembers, setFamilyMembers] = useState([])
  const [memoryAlbums, setMemoryAlbums] = useState([])
  const [medicines, setMedicines] = useState([])
  const [registeredPeople, setRegisteredPeople] = useState([])
  const [albums, setAlbums] = useState([])

  // ── Loading states ──────────────────────────────────
  const [isLoadingFamily, setIsLoadingFamily] = useState(true)
  const [isLoadingMemories, setIsLoadingMemories] = useState(true)
  const [isLoadingMedicines, setIsLoadingMedicines] = useState(true)
  const [isLoadingPeople, setIsLoadingPeople] = useState(true)
  const [isLoadingAlbums, setIsLoadingAlbums] = useState(true)
  const [isLoadingHealth, setIsLoadingHealth] = useState(true)

  // ── Dark mode effect ────────────────────────────────
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

  // ── Font scale effect ───────────────────────────────
  useEffect(() => {
    document.documentElement.classList.remove('font-scale-large', 'font-scale-xlarge')
    if (fontScale === 'large') {
      document.documentElement.classList.add('font-scale-large')
    } else if (fontScale === 'xlarge') {
      document.documentElement.classList.add('font-scale-xlarge')
    }
  }, [fontScale])

  // ── Backend sync ────────────────────────────────────
  const refreshFromBackend = useCallback(async () => {
    // Health check
    try {
      const health = await api.getHealth().catch(() => null)
      if (health) {
        setSystemHealth(health)
        setBackendOnline(true)
      } else {
        setBackendOnline(false)
      }
    } catch {
      setBackendOnline(false)
    }
    setIsLoadingHealth(false)

    // Data sync
    try {
      const [contacts, memories, meds, people, albumsData] = await Promise.all([
        api.listEmergencyContacts().catch(() => []),
        api.listMemories().catch(() => []),
        api.listMedicines().catch(() => []),
        api.listPeople().catch(() => []),
        api.listAlbums().catch(() => []),
      ])

      // Emergency contacts / family
      if (Array.isArray(contacts)) {
        setFamilyMembers(contacts.map(mapBackendContact))
        if (contacts.length > 0) {
          const primary = contacts.find((c) => c.is_primary) || contacts[0]
          setActivePatient((prev) => ({
            ...prev,
            primaryCaregiver: `${primary.name} (${primary.relationship})`,
            caregiverPhone: primary.phone || prev.caregiverPhone,
            familyMembersCount: contacts.length,
          }))
        }
      }
      setIsLoadingFamily(false)

      // Memories
      if (Array.isArray(memories)) {
        setMemoryAlbums(memories.map(mapBackendMemory))
        setActivePatient((prev) => ({
          ...prev,
          memoriesCount: memories.length,
        }))
      }
      setIsLoadingMemories(false)

      // Medicines
      if (Array.isArray(meds)) {
        setMedicines(meds)
      }
      setIsLoadingMedicines(false)

      // People
      if (Array.isArray(people)) {
        setRegisteredPeople(people)
      }
      setIsLoadingPeople(false)

      // Albums
      if (Array.isArray(albumsData)) {
        setAlbums(albumsData)
      }
      setIsLoadingAlbums(false)
    } catch (err) {
      console.warn('Backend sync failed:', err)
      setIsLoadingFamily(false)
      setIsLoadingMemories(false)
      setIsLoadingMedicines(false)
      setIsLoadingPeople(false)
      setIsLoadingAlbums(false)
    }
  }, [])

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
  }, [refreshFromBackend])

  // ── Toast helper ────────────────────────────────────
  const showToast = (message, type = 'info') => {
    setToast({ id: Date.now(), message, type })
    setTimeout(() => setToast(null), 3500)
  }

  // ── Memories CRUD ───────────────────────────────────
  const saveMemoryAlbum = async (albumData) => {
    try {
      const created = await api.createMemory({
        title: albumData.title,
        description: albumData.description,
        category: CATEGORY_TO_BACKEND[albumData.category] || 'story',
        event_date: albumData.year ? `${albumData.year}-01-01` : null,
      })
      setMemoryAlbums((prev) => [mapBackendMemory(created), ...prev])
      showToast('Memory saved', 'success')
      return created
    } catch (err) {
      // Offline fallback
      const offlineItem = {
        ...albumData,
        id: albumData.id || `mem-${Date.now()}`,
        categoryVariant: CATEGORY_VARIANTS[albumData.category] || 'primary',
      }
      setMemoryAlbums((prev) => [offlineItem, ...prev])
      showToast('Saved locally (backend offline)', 'info')
      return offlineItem
    }
  }

  const deleteMemoryAlbum = async (id) => {
    try {
      await api.deleteMemory(id)
    } catch (err) {
      showToast('Failed to delete on server', 'error')
      return
    }
    setMemoryAlbums((prev) => prev.filter((a) => a.id !== id))
    showToast('Memory deleted', 'info')
  }

  // ── Emergency contacts / Family CRUD ────────────────
  const saveFamilyMember = async (memberData) => {
    try {
      if (memberData.id && !String(memberData.id).startsWith('fam-')) {
        const updated = await api.updateEmergencyContact(memberData.id, {
          name: memberData.name,
          relationship: memberData.relationship,
          phone: memberData.phone,
          is_primary: !!memberData.is_primary,
        })
        setFamilyMembers((prev) => prev.map((m) => (m.id === memberData.id ? mapBackendContact(updated) : m)))
        showToast('Contact updated', 'success')
      } else {
        const created = await api.createEmergencyContact({
          name: memberData.name,
          relationship: memberData.relationship,
          phone: memberData.phone,
          is_primary: !!memberData.is_primary,
        })
        setFamilyMembers((prev) => [...prev, mapBackendContact(created)])
        showToast('Contact added', 'success')
      }
    } catch (err) {
      // Offline fallback
      const offlineItem = { ...memberData, id: memberData.id || `fam-${Date.now()}` }
      setFamilyMembers((prev) =>
        prev.map((m) => (m.id === memberData.id ? offlineItem : m)).concat(
          prev.some((m) => m.id === memberData.id) ? [] : [offlineItem]
        )
      )
      showToast('Saved locally (backend offline)', 'info')
    }
  }

  const deleteFamilyMember = async (id) => {
    try {
      await api.deleteEmergencyContact(id)
    } catch (err) {
      showToast('Failed to delete on server', 'error')
      return
    }
    setFamilyMembers((prev) => prev.filter((m) => m.id !== id))
    showToast('Contact removed', 'info')
  }

  // ── Albums CRUD ─────────────────────────────────────
  const saveAlbum = async (albumData) => {
    try {
      if (albumData.id && !String(albumData.id).startsWith('alb-')) {
        const updated = await api.updateAlbum(albumData.id, {
          title: albumData.title,
          description: albumData.description,
          date: albumData.date,
          people_ids: albumData.people_ids || [],
          photo_urls: albumData.photo_urls || [],
          featured_memory_id: albumData.featured_memory_id || null,
        })
        setAlbums((prev) => prev.map((a) => (a.id === albumData.id ? updated : a)))
        showToast('Album updated', 'success')
        return updated
      } else {
        const created = await api.createAlbum({
          title: albumData.title,
          description: albumData.description || '',
          date: albumData.date || null,
          people_ids: albumData.people_ids || [],
          photo_urls: albumData.photo_urls || [],
          featured_memory_id: albumData.featured_memory_id || null,
        })
        setAlbums((prev) => [created, ...prev])
        showToast('Album created', 'success')
        return created
      }
    } catch (err) {
      const offlineItem = { ...albumData, id: albumData.id || `alb-${Date.now()}` }
      setAlbums((prev) => [offlineItem, ...prev])
      showToast('Saved locally (backend offline)', 'info')
      return offlineItem
    }
  }

  const deleteAlbum = async (id) => {
    try {
      await api.deleteAlbum(id)
    } catch (err) {
      showToast('Failed to delete on server', 'error')
      return
    }
    setAlbums((prev) => prev.filter((a) => a.id !== id))
    showToast('Album deleted', 'info')
  }

  // ── Auth functions ──────────────────────────────────
  const login = (targetRole = 'caregiver', userName) => {
    setIsAuthenticated(true)
    setUserRole(targetRole)
    setMode(targetRole)
    if (userName) {
      setActivePatient((prev) => ({ ...prev, name: userName }))
    }
    setCurrentView(targetRole === 'caregiver' ? 'dashboard' : 'patient-home')
    showToast(`Welcome back${userName ? `, ${userName}` : ''}!`, 'success')
    refreshFromBackend()
  }

  const signUp = (fullName, email, role) => {
    setIsAuthenticated(true)
    const targetRole = role === 'patient' ? 'patient' : 'caregiver'
    setUserRole(targetRole)
    setMode(targetRole)
    setActivePatient((prev) => ({ ...prev, name: fullName || 'User' }))
    setCurrentView(targetRole === 'caregiver' ? 'dashboard' : 'patient-home')
    showToast(`Account created for ${fullName || 'User'}! Welcome to NeuroTwin.`, 'success')
    refreshFromBackend()
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
    if (userRole === 'patient') return // Patients cannot switch roles
    setUserRole(newRole)
    setMode(newRole)
    setProfileMenuOpen(false)
    setCurrentView(newRole === 'caregiver' ? 'dashboard' : 'patient-home')
    showToast(`Switched to ${newRole === 'caregiver' ? 'Caregiver Portal' : 'Patient Companion'}`, 'info')
  }

  const navigateTo = (viewKey) => {
    setCurrentView(viewKey)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <AppStateContext.Provider
      value={{
        // Auth
        isAuthenticated, login, signUp, logout,
        mode, userRole, switchRole,
        currentView, navigateTo,
        // UI
        isDarkMode, setIsDarkMode,
        fontScale, setFontScale,
        searchOpen, setSearchOpen,
        audioRecorderOpen, setAudioRecorderOpen,
        addMemoryOpen, setAddMemoryOpen,
        profileMenuOpen, setProfileMenuOpen,
        toast, showToast,
        // Patient context
        activePatient, setActivePatient,
        // Data
        familyMembers, setFamilyMembers,
        memoryAlbums, setMemoryAlbums,
        medicines, registeredPeople,
        albums, setAlbums,
        // Backend status
        backendOnline, systemHealth,
        // Loading
        isLoadingFamily, isLoadingMemories, isLoadingMedicines,
        isLoadingPeople, isLoadingAlbums, isLoadingHealth,
        // Actions
        refreshFromBackend,
        saveMemoryAlbum, deleteMemoryAlbum,
        saveFamilyMember, deleteFamilyMember,
        saveAlbum, deleteAlbum,
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
