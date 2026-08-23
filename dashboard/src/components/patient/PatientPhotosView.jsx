import React from 'react'
import { Card } from '../common/UIPrimitives'
import { useAppState } from '../../context/AppStateContext'

export function PatientPhotosView() {
  const { memoryAlbums } = useAppState()

  return (
    <div className="space-y-6 max-w-4xl mx-auto patient-mode-root">
      <div>
        <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100">Photo Album</h2>
        <p className="text-base text-slate-600 dark:text-slate-300 mt-1">Your treasured family albums & moments</p>
      </div>

      {memoryAlbums.length === 0 ? (
        <div className="py-20 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700">
          <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4 block">photo_library</span>
          <h3 className="text-2xl font-bold text-slate-700 dark:text-slate-300">No Photo Albums Yet</h3>
          <p className="text-lg text-slate-500 mt-2 max-w-md mx-auto">
            Your family will add beautiful memories and photo albums here for you to enjoy.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {memoryAlbums.map((p, idx) => (
            <Card key={p.id || idx} className="p-4 space-y-3 border-2 border-slate-200 dark:border-slate-700 hover:shadow-lg transition cursor-pointer">
              <div className="h-56 rounded-2xl overflow-hidden bg-slate-900">
                <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{p.title}</h3>
                <p className="text-sm font-semibold text-[#2B6CB0]">{p.year}</p>
                {p.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{p.description}</p>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
