import React from 'react'

export function FamilyCard({ name, relationship, avatar, contributions, lastVisit, onCall }) {
  return (
    <div className="flex items-center gap-md p-md bg-surface-container-low/30 dark:bg-slate-800/40 rounded-2xl hover:bg-surface-container-high transition-all border border-transparent hover:border-outline-variant/30 cursor-pointer">
      <img
        alt={name}
        className="w-14 h-14 rounded-full object-cover shadow-sm ring-2 ring-background dark:ring-slate-700"
        src={avatar}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold tracking-tight dark:text-slate-100 truncate">{name}</p>
        <p className="text-[11px] font-bold text-on-surface-variant/70 dark:text-slate-400 uppercase tracking-widest truncate">
          {relationship}
        </p>
        {contributions && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
            ✨ {contributions} memories
          </p>
        )}
      </div>

      {onCall && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onCall()
          }}
          aria-label={`Call ${name}`}
          className="p-2.5 bg-primary/10 dark:bg-primary-fixed/20 text-primary dark:text-primary-fixed rounded-xl hover:bg-primary hover:text-white transition cursor-pointer"
        >
          <span className="material-symbols-outlined">call</span>
        </button>
      )}
    </div>
  )
}
