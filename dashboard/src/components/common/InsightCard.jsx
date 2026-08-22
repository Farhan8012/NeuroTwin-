import React from 'react'

export function InsightCard({ title, metric, change, trend = 'up', description, category, icon = 'insights', className = '' }) {
  const isUp = trend === 'up'

  return (
    <div className={`premium-card p-xl flex flex-col justify-between overflow-hidden relative ${className}`}>
      <div className="flex items-center justify-between mb-md">
        <div className="flex items-center gap-sm">
          <span className="material-symbols-outlined text-primary dark:text-primary-fixed">{icon}</span>
          <h4 className="text-sm font-bold text-primary dark:text-primary-fixed tracking-tight">{title}</h4>
        </div>
        {category && (
          <span className="px-2.5 py-0.5 bg-surface-container-high dark:bg-slate-700 rounded-full text-[10px] font-bold text-on-surface-variant dark:text-slate-300 uppercase tracking-wider">
            {category}
          </span>
        )}
      </div>

      <div className="my-md">
        <div className="flex items-baseline gap-md">
          <span className="text-4xl font-black tracking-tight text-primary dark:text-primary-fixed">{metric}</span>
          {change && (
            <div className={`flex items-center gap-0.5 text-xs font-bold ${isUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              <span className="material-symbols-outlined !text-[16px]">{isUp ? 'trending_up' : 'trending_down'}</span>
              <span>{change}</span>
            </div>
          )}
        </div>
        {description && (
          <p className="text-xs text-on-surface-variant dark:text-slate-300 font-medium mt-2 leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </div>
  )
}
