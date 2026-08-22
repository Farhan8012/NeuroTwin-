import React, { useState } from 'react'
import { Badge, Card } from './UIPrimitives'

export function MemoryCard({ memory, onClick }) {
  const [isPlaying, setIsPlaying] = useState(false)

  return (
    <Card hoverable onClick={onClick} className="flex flex-col justify-between overflow-hidden group">
      <div>
        {/* Media Preview */}
        {memory.image ? (
          <div className="relative h-44 rounded-xl overflow-hidden mb-4 bg-slate-100 dark:bg-slate-900">
            <img
              src={memory.image}
              alt={memory.title}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            />
            {memory.audioUrl && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setIsPlaying(!isPlaying)
                }}
                className="absolute bottom-3 right-3 px-3 py-1.5 bg-slate-900/80 backdrop-blur-xs text-white rounded-full text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-900 transition"
              >
                <span>{isPlaying ? '⏸️' : '▶️'}</span>
                <span>{memory.audioLength || '0:42'}</span>
              </button>
            )}
            <div className="absolute top-3 left-3">
              <Badge variant={memory.categoryVariant || 'primary'}>{memory.category}</Badge>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between mb-3">
            <Badge variant={memory.categoryVariant || 'primary'}>{memory.category}</Badge>
            <span className="text-xs font-semibold text-slate-400">{memory.date}</span>
          </div>
        )}

        {/* Card Header & Title */}
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#2B6CB0] dark:group-hover:text-[#63B3ED] transition line-clamp-1 mb-1.5">
          {memory.title}
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mb-3 leading-relaxed">
          {memory.description}
        </p>
      </div>

      {/* Footer Info */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          {memory.contributorAvatar && (
            <img src={memory.contributorAvatar} alt={memory.contributor} className="w-5 h-5 rounded-full" />
          )}
          <span className="truncate">{memory.contributor || 'Sarah Vance'}</span>
        </div>
        <span className="font-medium">{memory.year || '1974'}</span>
      </div>
    </Card>
  )
}
