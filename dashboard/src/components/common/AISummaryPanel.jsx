import React from 'react'

export function AISummaryPanel({ patientName = 'Eleanor', onActionClick }) {
  return (
    <div className="premium-card p-xl bg-gradient-to-r from-surface-container-lowest via-surface-container-low to-primary-container/10 dark:from-slate-800 dark:to-slate-800/80 border-l-4 border-l-primary dark:border-l-primary-fixed">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-xl">
        <div className="flex items-start gap-lg flex-1">
          <div className="w-12 h-12 bg-primary dark:bg-primary-fixed rounded-2xl flex items-center justify-center text-on-primary dark:text-primary shadow-md shrink-0 mt-1">
            <span className="material-symbols-outlined text-[26px]">psychology_alt</span>
          </div>

          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-md">
              <h3 className="text-lg font-bold tracking-tight text-primary dark:text-primary-fixed">
                Daily AI Memory Synthesis for {patientName}
              </h3>
              <span className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-black rounded-full uppercase tracking-wider">
                Recall Confidence: 84%
              </span>
              <span className="px-2.5 py-0.5 bg-primary/10 dark:bg-primary-fixed/20 text-primary dark:text-sky-300 text-[10px] font-black rounded-full uppercase tracking-wider">
                Mood: Calm & Positive
              </span>
            </div>

            <p className="text-sm text-on-surface-variant dark:text-slate-200 leading-relaxed">
              {patientName} demonstrated strong emotional resonance during morning acoustic guitar sessions. Recognition accuracy for inner circle family members remains at peak (100%). We recommend scheduling a 15-minute 1974 Lake Tahoe photo reel at 02:30 PM.
            </p>

            <div className="flex flex-wrap gap-md pt-2 text-xs font-semibold text-primary dark:text-primary-fixed">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined !text-[16px]">verified</span> 3 Recognition Events Today
              </span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined !text-[16px]">record_voice_over</span> 14 Voice Memory Indexings
              </span>
            </div>
          </div>
        </div>

        {onActionClick && (
          <button
            onClick={onActionClick}
            className="bg-primary dark:bg-primary-fixed text-on-primary dark:text-primary px-lg py-3 rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-md shrink-0 cursor-pointer active:scale-95 flex items-center gap-2"
          >
            <span className="material-symbols-outlined">auto_awesome</span>
            <span>View Full AI Intelligence Log</span>
          </button>
        )}
      </div>
    </div>
  )
}
