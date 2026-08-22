import React from 'react'
import { useAppState } from '../../context/AppStateContext'

export function Navbar() {
  const {
    isAuthenticated,
    mode,
    switchRole,
    logout,
    navigateTo,
    isDarkMode,
    setIsDarkMode,
    fontScale,
    setFontScale,
    setSearchOpen,
    activePatient,
    profileMenuOpen,
    setProfileMenuOpen,
  } = useAppState()

  // Calculate dynamic header width based on active sidebar
  const mainHeaderWidthClass =
    !isAuthenticated || mode === 'auth'
      ? 'w-full'
      : mode === 'patient'
      ? 'w-[calc(100%-18rem)]' // Offset by 288px (18rem) Patient Sidebar
      : 'w-[calc(100%-16rem)]' // Offset by 256px (16rem) Caregiver Sidebar

  return (
    <header className={`fixed top-0 right-0 h-20 ${mainHeaderWidthClass} z-40 bg-background/90 dark:bg-[#0f172a]/90 backdrop-blur-md border-b border-outline-variant/40 dark:border-slate-800 transition-all`}>
      <div className="flex items-center justify-between px-xl h-full">
        {/* Left Search Bar (Properly Offset, Never Overlapping Sidebar) */}
        <div className="flex items-center gap-xl">
          {isAuthenticated && (
            <div className="relative group hidden sm:block">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant dark:text-slate-400 transition-colors group-focus-within:text-primary">
                search
              </span>
              <input
                onClick={() => setSearchOpen(true)}
                readOnly
                className="w-72 lg:w-96 pl-12 pr-6 py-2.5 bg-surface-container-low dark:bg-slate-800 border border-outline-variant/50 dark:border-slate-700 rounded-2xl text-sm outline-none cursor-pointer placeholder:text-on-surface-variant/60 dark:placeholder:text-slate-400"
                placeholder="Search insights, memories, or logs... (⌘K)"
                type="text"
              />
            </div>
          )}

          {!isAuthenticated && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary dark:bg-primary-fixed rounded-xl flex items-center justify-center text-on-primary dark:text-primary shadow-sm">
                <span className="material-symbols-outlined text-[24px]">psychology</span>
              </div>
              <span className="text-lg font-bold tracking-tight text-primary dark:text-primary-fixed">NeuroTwin</span>
            </div>
          )}
        </div>

        {/* Right Tools & Profile Dropdown */}
        <div className="flex items-center gap-md sm:gap-lg">
          {/* Font Accessibility Scaler */}
          <div className="hidden xl:flex items-center bg-surface-container-low dark:bg-slate-800 rounded-xl p-1 border border-outline-variant/40 dark:border-slate-700 text-xs font-bold">
            <button
              onClick={() => setFontScale('normal')}
              className={`px-2 py-1 rounded-lg transition ${fontScale === 'normal' ? 'bg-white dark:bg-slate-700 text-primary shadow-xs' : 'text-on-surface-variant dark:text-slate-400'}`}
              title="Normal Font Size"
            >
              A
            </button>
            <button
              onClick={() => setFontScale('large')}
              className={`px-2 py-1 rounded-lg transition ${fontScale === 'large' ? 'bg-white dark:bg-slate-700 text-primary shadow-xs' : 'text-on-surface-variant dark:text-slate-400'}`}
              title="Large Font Size"
            >
              A+
            </button>
            <button
              onClick={() => setFontScale('xlarge')}
              className={`px-2 py-1 rounded-lg transition ${fontScale === 'xlarge' ? 'bg-white dark:bg-slate-700 text-primary shadow-xs' : 'text-on-surface-variant dark:text-slate-400'}`}
              title="Extra Large Font Size"
            >
              A++
            </button>
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            aria-label="Toggle Dark Mode"
            className="p-2.5 bg-surface-container-low dark:bg-slate-800 border border-outline-variant/50 dark:border-slate-700 rounded-xl hover:bg-surface-container-high transition-all text-on-surface-variant dark:text-slate-200 active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined">{isDarkMode ? 'light_mode' : 'dark_mode'}</span>
          </button>

          {isAuthenticated ? (
            <>
              {/* Notification Button */}
              <button
                onClick={() => navigateTo('notifications')}
                aria-label="View Notifications"
                className="p-2.5 text-on-surface-variant dark:text-slate-200 hover:bg-surface-container-low rounded-xl transition-all relative cursor-pointer"
              >
                <span className="material-symbols-outlined">notifications</span>
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-error border-2 border-background rounded-full" />
              </button>

              {/* Profile Avatar Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex items-center gap-2 p-1 bg-surface-container-low dark:bg-slate-800 border border-outline-variant/40 dark:border-slate-700 rounded-2xl hover:bg-surface-container-high transition cursor-pointer"
                >
                  <img
                    src={activePatient.avatar}
                    alt={activePatient.name}
                    className="w-9 h-9 rounded-xl object-cover ring-2 ring-primary/20"
                  />
                  <div className="hidden md:block text-left pr-2">
                    <p className="text-xs font-bold leading-tight text-primary dark:text-slate-100">{activePatient.name}</p>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant text-sm">expand_more</span>
                </button>

                {profileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-2xl border border-outline-variant/40 dark:border-slate-700 shadow-2xl py-2 z-50 animate-in fade-in duration-150">
                    <div className="px-4 py-3 border-b border-outline-variant/20 dark:border-slate-700">
                      <p className="text-xs font-bold text-primary dark:text-slate-100">{activePatient.name}</p>
                      <p className="text-[10px] text-on-surface-variant dark:text-slate-400 capitalize">
                        {mode === 'caregiver' ? 'Caregiver Account' : 'Patient Account'}
                      </p>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setProfileMenuOpen(false)
                          navigateTo('settings')
                        }}
                        className="w-full px-4 py-2.5 text-xs font-semibold text-on-surface-variant dark:text-slate-300 hover:bg-surface-container-low flex items-center gap-3 transition cursor-pointer"
                      >
                        <span className="material-symbols-outlined">settings</span>
                        <span>Account Settings</span>
                      </button>
                    </div>

                    <div className="pt-1 border-t border-outline-variant/20 dark:border-slate-700">
                      <button
                        onClick={logout}
                        className="w-full px-4 py-2.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-3 transition cursor-pointer"
                      >
                        <span className="material-symbols-outlined">logout</span>
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <button
              onClick={() => navigateTo('signin')}
              className="bg-primary text-on-primary px-lg py-2 rounded-xl font-bold text-xs shadow-md cursor-pointer hover:opacity-90"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
