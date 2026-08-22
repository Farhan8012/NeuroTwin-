import React from 'react'

export function SessionCard({ title, time, type, responsiveness, notes, icon = 'psychology' }) {
  return (
    <div className="p-lg bg-surface-container-low/50 dark:bg-slate-800/60 rounded-2xl border border-outline-variant/20 dark:border-slate-700 hover:border-primary/20 transition-all cursor-default">
      <div className="flex items-center gap-lg">
        <div className="w-14 h-14 bg-primary-fixed dark:bg-primary-container rounded-2xl flex items-center justify-center text-primary dark:text-primary-fixed shadow-sm shrink-0">
          <span className="material-symbols-outlined text-[28px]">{icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-1">
            <h4 className="font-bold text-base tracking-tight truncate dark:text-slate-100">{title}</h4>
            <span className="text-[11px] font-black text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-300 px-2 py-0.5 rounded-full uppercase shrink-0">
              {time}
            </span>
          </div>
          <p className="text-sm text-on-surface-variant dark:text-slate-300 font-medium leading-relaxed">
            {notes}
          </p>
          {responsiveness && (
            <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-primary dark:text-primary-fixed">
              <span className="material-symbols-outlined !text-[16px]">bolt</span>
              <span>Responsiveness: {responsiveness}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
