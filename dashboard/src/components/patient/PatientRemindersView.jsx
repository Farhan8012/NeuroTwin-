import React from 'react'
import { Card } from '../common/UIPrimitives'

export function PatientRemindersView() {
  const reminders = [
    { time: '08:00 AM', text: 'Take Morning Medication & Eat Breakfast', done: true, icon: '💊' },
    { time: '10:30 AM', text: 'Garden Walk & Listen to Lake Tahoe Memory Story', done: true, icon: '🌳' },
    { time: '02:00 PM', text: 'Listen to Chopin Classical Piano Favorites', done: false, icon: '🎹' },
    { time: '05:30 PM', text: 'Evening Video Call with Daughter Sarah', done: false, icon: '📞' },
  ]

  return (
    <div className="space-y-6 max-w-4xl mx-auto patient-mode-root">
      <div>
        <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100">Today's Reminders</h2>
        <p className="text-base text-slate-600 dark:text-slate-300 mt-1">Easy checklist for your day</p>
      </div>

      <div className="space-y-4">
        {reminders.map((r, idx) => (
          <Card
            key={idx}
            className={`p-6 border-3 flex items-center justify-between ${
              r.done
                ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 opacity-70'
                : 'bg-white dark:bg-slate-800 border-[#2B6CB0]'
            }`}
          >
            <div className="flex items-center gap-5">
              <span className="text-4xl">{r.icon}</span>
              <div>
                <span className="text-sm font-bold uppercase tracking-wider text-[#2B6CB0] dark:text-[#63B3ED]">{r.time}</span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{r.text}</h3>
              </div>
            </div>

            <input type="checkbox" checked={r.done} readOnly className="w-8 h-8 rounded-lg text-[#2B6CB0]" />
          </Card>
        ))}
      </div>
    </div>
  )
}
