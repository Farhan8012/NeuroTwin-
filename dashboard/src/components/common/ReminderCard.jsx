import React from 'react'

export function ReminderCard({ time, title, description, status = 'upcoming', icon = 'schedule', onToggle }) {
  const isDone = status === 'completed'

  return (
    <div
      className={`p-lg rounded-2xl border transition-all flex items-center gap-lg ${
        isDone
          ? 'bg-surface-container-low/50 dark:bg-slate-800/40 border-outline-variant/20 dark:border-slate-700 opacity-70'
          : 'bg-surface-container-lowest dark:bg-slate-800 border-outline-variant/40 dark:border-slate-700 hover:border-primary/30 shadow-2xs'
      }`}
    >
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs shrink-0 ${isDone ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700' : 'bg-primary-fixed dark:bg-slate-700 text-primary dark:text-primary-fixed'}`}>
        <span className="material-symbols-outlined text-[24px]">{isDone ? 'check_circle' : icon}</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-0.5">
          <h4 className={`font-bold text-sm tracking-tight truncate ${isDone ? 'line-through text-on-surface-variant' : 'text-primary dark:text-slate-100'}`}>
            {title}
          </h4>
          <span className="text-[11px] font-extrabold text-primary dark:text-primary-fixed uppercase tracking-wider ml-2 shrink-0">
            {time}
          </span>
        </div>
        <p className="text-xs text-on-surface-variant dark:text-slate-300 font-medium truncate">{description}</p>
      </div>

      {onToggle && (
        <input
          type="checkbox"
          checked={isDone}
          onChange={onToggle}
          aria-label={`Mark ${title} as completed`}
          className="w-5 h-5 rounded text-primary focus:ring-primary/20 cursor-pointer"
        />
      )}
    </div>
  )
}
