import React, { useState } from 'react'

export function CognitiveTrendChart({ title = 'Cognitive Vitality & Trajectory' }) {
  const [timeframe, setTimeframe] = useState('7d')

  const days7 = [
    { day: 'Mon', recall: 72, fluency: 68 },
    { day: 'Tue', recall: 75, fluency: 71 },
    { day: 'Wed', recall: 71, fluency: 70 },
    { day: 'Thu', recall: 78, fluency: 76 },
    { day: 'Fri', recall: 74, fluency: 72 },
    { day: 'Sat', recall: 80, fluency: 79 },
    { day: 'Sun', recall: 82, fluency: 81 },
  ]

  return (
    <div className="premium-card p-xl flex flex-col justify-between overflow-hidden">
      <div className="flex items-center justify-between mb-lg">
        <div>
          <h3 className="text-lg font-bold text-primary dark:text-primary-fixed tracking-tight">{title}</h3>
          <p className="text-xs text-on-surface-variant/70 dark:text-slate-400">Verbal fluency & memory recall index over time</p>
        </div>

        <div className="flex items-center gap-1 bg-surface-container-low dark:bg-slate-700 p-1 rounded-xl border border-outline-variant/30">
          <button
            onClick={() => setTimeframe('7d')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition ${timeframe === '7d' ? 'bg-white dark:bg-slate-800 text-primary dark:text-white shadow-xs' : 'text-on-surface-variant dark:text-slate-400'}`}
          >
            7 Days
          </button>
          <button
            onClick={() => setTimeframe('30d')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition ${timeframe === '30d' ? 'bg-white dark:bg-slate-800 text-primary dark:text-white shadow-xs' : 'text-on-surface-variant dark:text-slate-400'}`}
          >
            30 Days
          </button>
        </div>
      </div>

      <div className="py-md">
        <div className="flex items-center justify-between mb-sm text-xs font-semibold text-on-surface-variant dark:text-slate-300">
          <span>7-Day Recall Score vs Baseline</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-bold">● Peak Score: 82/100</span>
        </div>

        <div className="h-44 flex items-end gap-3 pt-4 px-2">
          {days7.map((item, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
              <div className="w-full bg-surface-container-low dark:bg-slate-700 rounded-t-xl overflow-hidden flex flex-col justify-end h-full relative">
                <div
                  style={{ height: `${item.recall}%` }}
                  className="bg-gradient-to-t from-primary/80 to-primary dark:from-primary-fixed/60 dark:to-primary-fixed rounded-t-xl transition-all duration-500 group-hover:opacity-90"
                />
              </div>
              <span className="text-[11px] font-bold text-on-surface-variant/70 dark:text-slate-400">{item.day}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-md border-t border-outline-variant/20 dark:border-slate-700 flex items-center justify-between text-xs">
        <div className="flex items-center gap-md">
          <span className="flex items-center gap-1 font-semibold text-primary dark:text-primary-fixed">
            <span className="w-2.5 h-2.5 rounded-full bg-primary" /> Memory Recall
          </span>
          <span className="flex items-center gap-1 font-semibold text-secondary dark:text-teal-300">
            <span className="w-2.5 h-2.5 rounded-full bg-secondary" /> Verbal Fluency
          </span>
        </div>
        <span className="font-bold text-emerald-600 dark:text-emerald-400">↑ +3.8% Month-over-Month</span>
      </div>
    </div>
  )
}
