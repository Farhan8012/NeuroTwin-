import React, { useState } from 'react'
import { useAppState } from '../../context/AppStateContext'
import { AIChatWidget } from '../common/AIChatWidget'

export function PatientHomeView() {
  const { activePatient, navigateTo, showToast, memoryAlbums, familyMembers } = useAppState()
  const [selectedMood, setSelectedMood] = useState(null)
  
  const featuredAlbum = memoryAlbums.find(a => a.isFeatured) || memoryAlbums[0] || null
  const recentAlbums = memoryAlbums.slice(0, 3)
  const upcomingVisit = familyMembers.length > 0 ? familyMembers[0] : null

  const [medications, setMedications] = useState([
    { id: 1, name: 'Aricept 10mg (Memory support)', time: '08:00 AM', taken: true },
    { id: 2, name: 'Vitamin D3 & Calcium', time: '12:30 PM', taken: true },
    { id: 3, name: 'Evening Heart Care', time: '07:00 PM', taken: false },
  ])

  const toggleMed = (id) => {
    setMedications((prev) =>
      prev.map((m) => (m.id === id ? { ...m, taken: !m.taken } : m))
    )
    showToast('Updated medication status', 'info')
  }

  const moods = [
    { label: 'Happy & Peaceful', icon: '😊' },
    { label: 'Calm & Rested', icon: '😌' },
    { label: 'Nostalgic', icon: '💭' },
    { label: 'Need a Hug', icon: '🤗' },
  ]

  return (
    <div className="space-y-lg max-w-[1400px] mx-auto font-sans">
      {/* Personalized Companion Banner (Zero Excessive Whitespace) */}
      <section
        role="region"
        aria-label="Digital Companion Greeting"
        className="premium-card p-xl bg-gradient-to-r from-primary via-primary/95 to-secondary text-white shadow-md border-none relative overflow-hidden"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-xl relative z-10">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-md">
              <span className="text-2xl">🌞</span>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                Good Morning, {activePatient.name.split(' ')[0]}
              </h1>
            </div>

            <p className="text-base sm:text-lg font-medium text-slate-100 leading-relaxed">
              Today <strong>{upcomingVisit ? `${upcomingVisit.name.split(' ')[0]} might visit` : 'is a peaceful day'}</strong>. You listened to your favorite jazz yesterday. Would you like to revisit your <strong>{featuredAlbum ? featuredAlbum.title : 'recent memories'}</strong> or talk to NeuroTwin?
            </p>

            <div className="flex flex-wrap items-center gap-md pt-2">
              <button
                onClick={() => navigateTo('todays-memories')}
                className="px-md py-2.5 bg-white text-primary rounded-xl font-bold text-xs shadow-md hover:bg-slate-100 transition cursor-pointer flex items-center gap-2"
              >
                <span className="material-symbols-outlined !text-[18px]">photo_library</span>
                <span>{featuredAlbum ? 'Open Featured Album' : 'Open Albums'}</span>
              </button>

              <button
                onClick={() => navigateTo('ask-neurotwin')}
                className="px-md py-2.5 bg-secondary-container text-on-secondary-container rounded-xl font-bold text-xs shadow-sm hover:opacity-90 transition cursor-pointer flex items-center gap-2"
              >
                <span className="material-symbols-outlined !text-[18px]">psychology_alt</span>
                <span>Talk to NeuroTwin Companion</span>
              </button>
            </div>
          </div>

          {/* Quick Visit Countdown Badge */}
          {upcomingVisit && (
            <div className="p-lg bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-center shrink-0 min-w-[200px]">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-200">Family Check-in</p>
              <p className="text-lg font-black text-white mt-1">Available to Call</p>
              <p className="text-xs text-emerald-300 font-semibold mt-1">{upcomingVisit.relationship}</p>
            </div>
          )}
        </div>
      </section>

      {/* Main 2-Column Responsive Companion Content Grid */}
      <div className="bento-grid">
        {/* Left Column: Interactive Mood Check, Reminders & AI Companion */}
        <div className="col-span-12 lg:col-span-7 space-y-lg">
          {/* Mood Check-in Card */}
          <div className="premium-card p-xl space-y-md">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-primary dark:text-primary-fixed tracking-tight flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-500">mood</span>
                <span>How are you feeling this morning, {activePatient.name.split(' ')[0]}?</span>
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-md">
              {moods.map((m, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedMood(m.label)
                    showToast(`Recorded mood: ${m.label}`, 'success')
                  }}
                  className={`p-lg rounded-2xl border transition-all flex flex-col items-center gap-2 cursor-pointer ${
                    selectedMood === m.label
                      ? 'bg-primary-fixed border-primary text-primary font-bold shadow-sm'
                      : 'bg-surface-container-low dark:bg-slate-800 border-outline-variant/30 text-on-surface-variant dark:text-slate-200 hover:border-primary/40'
                  }`}
                >
                  <span className="text-3xl">{m.icon}</span>
                  <span className="text-xs font-bold text-center">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Medication & Routine Reminders Card */}
          <div className="premium-card p-xl space-y-md">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-primary dark:text-primary-fixed tracking-tight flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">medication</span>
                <span>Today's Reminders & Medication</span>
              </h3>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40 px-2.5 py-0.5 rounded-full">
                2 of 3 Done
              </span>
            </div>

            <div className="space-y-3">
              {medications.map((m) => (
                <div
                  key={m.id}
                  onClick={() => toggleMed(m.id)}
                  className={`p-md rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                    m.taken
                      ? 'bg-surface-container-low/50 dark:bg-slate-800/40 border-outline-variant/20 dark:border-slate-700 opacity-75'
                      : 'bg-surface-container-lowest dark:bg-slate-800 border-primary/30 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center gap-md">
                    <span className={`material-symbols-outlined text-[24px] ${m.taken ? 'text-emerald-600' : 'text-primary'}`}>
                      {m.taken ? 'check_circle' : 'schedule'}
                    </span>
                    <div>
                      <h4 className={`text-sm font-bold ${m.taken ? 'line-through text-on-surface-variant' : 'text-primary dark:text-slate-100'}`}>
                        {m.name}
                      </h4>
                      <p className="text-xs text-on-surface-variant/70 dark:text-slate-400 font-medium">Scheduled for {m.time}</p>
                    </div>
                  </div>

                  <input
                    type="checkbox"
                    checked={m.taken}
                    onChange={() => toggleMed(m.id)}
                    className="w-5 h-5 rounded text-primary focus:ring-primary/20 cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Interactive AI Companion Widget */}
          <div className="h-[420px]">
            <AIChatWidget patientName={activePatient.name} isPatientView={true} />
          </div>
        </div>

        {/* Right Column: Featured Memory, Family Activity, Photo Reel & SOS */}
        <div className="col-span-12 lg:col-span-5 space-y-lg">
          {/* Featured Memory Card */}
          <div className="premium-card p-xl space-y-md border-2 border-primary/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-primary dark:text-primary-fixed uppercase tracking-wider flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">favorite</span> Featured Memory Album
              </span>
              <button onClick={() => navigateTo('todays-memories')} className="text-xs font-bold text-primary hover:underline">
                View All ({memoryAlbums.length}) ➔
              </button>
            </div>

            {featuredAlbum ? (
              <>
                <div className="relative h-56 rounded-2xl overflow-hidden bg-slate-900 shadow-md">
                  <img
                    src={featuredAlbum.image}
                    alt={featuredAlbum.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-lg">
                    <div className="text-white">
                      <h4 className="text-lg font-black">{featuredAlbum.title}</h4>
                      <p className="text-xs text-slate-200 font-medium mt-0.5">{featuredAlbum.year}</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => showToast(`Playing audio memory narration for ${featuredAlbum.title}...`, 'info')}
                  className="w-full py-3 bg-primary-fixed text-primary rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-primary-fixed/80 transition cursor-pointer"
                >
                  <span className="material-symbols-outlined">play_circle</span>
                  <span>Listen to Audio Memory Story</span>
                </button>
              </>
            ) : (
              <div className="h-56 rounded-2xl bg-surface-container-low dark:bg-slate-800 border border-outline-variant/30 flex flex-col items-center justify-center text-center p-6">
                <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">photo_library</span>
                <h4 className="text-base font-bold text-slate-700 dark:text-slate-300">No Featured Memories</h4>
                <p className="text-xs text-slate-500 mt-1">Your family hasn't featured any albums yet.</p>
              </div>
            )}
          </div>

          {/* Family Activity & Upcoming Visit Card */}
          <div className="premium-card p-xl space-y-md">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-primary dark:text-primary-fixed tracking-tight flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">family_restroom</span>
                <span>Family Connections</span>
              </h3>
            </div>

            {upcomingVisit ? (
              <div className="p-lg bg-secondary-container/40 dark:bg-slate-800 rounded-2xl border border-secondary/20 flex items-center justify-between">
                <div className="flex items-center gap-md">
                  <img
                    src={upcomingVisit.avatar}
                    alt={upcomingVisit.name}
                    className="w-12 h-12 rounded-full object-cover shadow-sm ring-2 ring-white"
                  />
                  <div>
                    <p className="text-sm font-bold text-primary dark:text-slate-100">{upcomingVisit.name}</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">{upcomingVisit.relationship}</p>
                  </div>
                </div>

                <button
                  onClick={() => showToast(`Dialing ${upcomingVisit.name}...`, 'info')}
                  className="p-2.5 bg-primary text-on-primary rounded-xl hover:opacity-90 transition cursor-pointer"
                  title={`Call ${upcomingVisit.name}`}
                >
                  <span className="material-symbols-outlined text-[20px]">call</span>
                </button>
              </div>
            ) : (
              <div className="p-6 bg-surface-container-low dark:bg-slate-800 rounded-2xl border border-outline-variant/30 text-center">
                <p className="text-xs text-slate-500">Your loved ones will appear here once added.</p>
              </div>
            )}
          </div>

          {/* Recent Photo Gallery Reel */}
          <div className="premium-card p-xl space-y-md">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-primary dark:text-primary-fixed tracking-tight flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">photo_camera</span>
                <span>Recent Albums</span>
              </h3>
            </div>

            {recentAlbums.length > 0 ? (
              <div className="grid grid-cols-3 gap-md">
                {recentAlbums.map((p, idx) => (
                  <div key={p.id || idx} className="h-24 rounded-xl overflow-hidden shadow-xs border border-outline-variant/30 cursor-pointer hover:opacity-95 transition" onClick={() => navigateTo('todays-memories')}>
                    <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            ) : (
               <div className="h-24 bg-surface-container-low dark:bg-slate-800 rounded-xl border border-outline-variant/30 flex items-center justify-center">
                 <p className="text-xs text-slate-500">No albums added yet.</p>
               </div>
            )}
          </div>

          {/* Emergency SOS Call Card */}
          <div className="p-xl bg-rose-50 dark:bg-rose-950/60 rounded-2xl border-2 border-rose-300 dark:border-rose-800 flex items-center justify-between gap-md">
            <div className="flex items-center gap-md">
              <span className="material-symbols-outlined text-[36px] text-rose-600">sos</span>
              <div>
                <h4 className="text-base font-black text-rose-900 dark:text-rose-200">Need Immediate Help?</h4>
                <p className="text-xs text-rose-700 dark:text-rose-300 font-medium">Tap to send SOS alert to Sarah & care team</p>
              </div>
            </div>

            <button
              onClick={() => showToast('🚨 SOS ALERT SENT! Care team notified.', 'danger')}
              className="px-lg py-3 bg-rose-600 text-white rounded-xl font-bold text-xs shadow-md hover:bg-rose-700 transition cursor-pointer active:scale-95 shrink-0"
            >
              SEND SOS
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

