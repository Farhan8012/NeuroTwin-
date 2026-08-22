import React from 'react'
import { Badge, Card } from './UIPrimitives'

export function TimelineCard({ event }) {
  return (
    <div className="relative pl-8 pb-8 group">
      {/* Timeline Connector Line */}
      <div className="absolute left-3 top-3 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700 group-last:hidden" />
      
      {/* Timeline Node Dot */}
      <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-[#2B6CB0] border-4 border-white dark:border-slate-900 flex items-center justify-center text-white text-[10px] shadow-sm">
        ●
      </div>

      <Card className="hover:border-[#2B6CB0]/40 transition">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <span className="text-xs font-black text-[#2B6CB0] dark:text-[#63B3ED] uppercase tracking-wider">
            {event.year} • {event.age}
          </span>
          <Badge variant={event.type === 'milestone' ? 'accent' : 'secondary'}>{event.category}</Badge>
        </div>

        <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1.5">{event.title}</h4>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">{event.description}</p>

        {event.image && (
          <div className="rounded-xl overflow-hidden mb-3 max-h-48">
            <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
          </div>
        )}

        {event.aiInsight && (
          <div className="p-3 rounded-xl bg-[#EBF8FF] dark:bg-[#2B6CB0]/20 border border-[#BEE3F8] dark:border-[#2B6CB0]/40 text-xs text-[#1A365D] dark:text-sky-200 flex items-start gap-2">
            <span className="text-base">✨</span>
            <div>
              <strong className="font-bold">AI Memory Recall Cue:</strong> {event.aiInsight}
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
