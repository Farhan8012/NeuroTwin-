import React, { useState } from 'react'
import { Card, Button } from '../common/UIPrimitives'
import { TimelineCard } from '../common/TimelineCard'
import { useAppState } from '../../context/AppStateContext'

export function TimelineView() {
  const { activePatient, navigateTo } = useAppState()
  const [selectedDecade, setSelectedDecade] = useState('All')

  const timelineEvents = [
    {
      year: '1948',
      age: 'Age 0',
      type: 'milestone',
      category: 'Birth',
      title: 'Born in Boston, Massachusetts',
      description: 'Eleanor Vance was born to Margaret and Arthur Vance. Raised in a loving home filled with piano music and gardening.',
    },
    {
      year: '1968',
      age: 'Age 20',
      type: 'milestone',
      category: 'Education & Music',
      title: 'Boston Conservatory Graduation Recital',
      description: 'Performed Chopin Nocturne in E-Flat on main stage. Awarded highest honors in classical piano composition.',
      aiInsight: 'Playing classical piano recordings from this era consistently lowers Eleanor\'s evening restlessness.',
    },
    {
      year: '1972',
      age: 'Age 24',
      type: 'milestone',
      category: 'Marriage',
      title: 'Married Thomas Vance',
      description: 'Wedding held at Trinity Church, Boston. Honeymoon trip to Lake Tahoe, California.',
      image: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=600&q=80',
    },
    {
      year: '1974',
      age: 'Age 26',
      type: 'family',
      category: 'Birth of Child',
      title: 'Daughter Sarah Vance Born',
      description: 'Sarah was born in Boston General Hospital. Eleanor composed a lullaby for her firstborn.',
    },
    {
      year: '1995',
      age: 'Age 47',
      type: 'travel',
      category: 'Silver Anniversary',
      title: '25th Wedding Anniversary Trip to Paris',
      description: 'Thomas surprised Eleanor with a 2-week journey across France and dinner under Eiffel Tower.',
      image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=600&q=80',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">Life Narrative Timeline</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Chronological life history & milestone map for <strong>{activePatient.name}</strong>
          </p>
        </div>
        <Button variant="secondary" size="md" onClick={() => navigateTo('ai-assistant')}>
          ✨ AI Synthesize Life Story
        </Button>
      </div>

      {/* Decade Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {['All', '1940s', '1960s', '1970s', '1990s', '2010s-Present'].map((decade) => (
          <button
            key={decade}
            onClick={() => setSelectedDecade(decade)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
              selectedDecade === decade
                ? 'bg-[#2B6CB0] text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            {decade}
          </button>
        ))}
      </div>

      {/* Timeline Stream */}
      <div className="max-w-3xl mx-auto pt-4">
        {timelineEvents.map((evt, idx) => (
          <TimelineCard key={idx} event={evt} />
        ))}
      </div>
    </div>
  )
}

