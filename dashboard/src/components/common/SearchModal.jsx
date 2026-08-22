import React, { useState } from 'react'
import { Modal, Input, Badge } from './UIPrimitives'
import { useAppState } from '../../context/AppStateContext'

export function SearchModal() {
  const { searchOpen, setSearchOpen, navigateTo } = useAppState()
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')

  const searchResults = [
    { title: '1974 Lake Tahoe Summer Cabin', type: 'Memory', category: 'Travel', date: 'July 1974', route: 'memories' },
    { title: 'Sarah Vance (Daughter)', type: 'Family Member', category: 'Primary Caregiver', phone: '+1 555-0192', route: 'family' },
    { title: 'Chopin Prelude in E Minor (Favorite Music)', type: 'Audio Note', category: 'Music Therapy', route: 'memories' },
    { title: 'Eleanor Vance Clinical Cognitive Log', type: 'Patient Log', category: 'Stage 2 Alzheimer\'s', route: 'patient-profile' },
  ].filter((item) => item.title.toLowerCase().includes(query.toLowerCase()) || query === '')

  return (
    <Modal isOpen={searchOpen} onClose={() => setSearchOpen(false)} title="🔍 Instant Memory Search" maxWidth="max-w-2xl">
      <div className="space-y-4">
        <Input
          placeholder="Search memories, family members, tags, or dates..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />

        {/* Filter Tabs */}
        <div className="flex gap-2 text-xs border-b border-slate-200 dark:border-slate-700 pb-2">
          {['all', 'memories', 'family', 'logs'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 rounded-lg font-semibold uppercase tracking-wider transition ${
                activeTab === tab
                  ? 'bg-[#2B6CB0] text-white'
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {searchResults.map((res, i) => (
            <div
              key={i}
              onClick={() => {
                setSearchOpen(false)
                navigateTo(res.route)
              }}
              className="p-3 bg-slate-50 dark:bg-slate-800/60 hover:bg-[#EBF8FF] dark:hover:bg-[#2B6CB0]/20 rounded-xl border border-slate-200/80 dark:border-slate-700 cursor-pointer flex items-center justify-between transition"
            >
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h5 className="text-sm font-bold text-slate-900 dark:text-slate-100">{res.title}</h5>
                  <Badge variant="primary">{res.type}</Badge>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{res.category}</p>
              </div>
              <span className="text-xs text-[#2B6CB0] dark:text-[#63B3ED] font-semibold">Jump ➔</span>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  )
}
