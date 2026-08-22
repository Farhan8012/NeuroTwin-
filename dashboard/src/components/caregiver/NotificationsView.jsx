import React from 'react'
import { Card, Badge, Button } from '../common/UIPrimitives'

export function NotificationsView() {
  const notifications = [
    {
      id: 1,
      title: 'New Memory Added by Daughter Sarah',
      desc: 'Sarah added a 1974 photo album "Lake Tahoe Family Camping" with audio narration.',
      time: '10 minutes ago',
      type: 'memory',
      badge: 'New Memory',
      badgeVariant: 'primary',
    },
    {
      id: 2,
      title: 'Routine Completed: Garden Walk',
      desc: 'Eleanor completed her 10:30 AM garden walk routine. Verbal fluency score recorded at 82%.',
      time: '1 hour ago',
      type: 'routine',
      badge: 'Routine',
      badgeVariant: 'secondary',
    },
    {
      id: 3,
      title: 'Safety Check-in Reminder',
      desc: 'Scheduled 05:30 PM family video check-in with Sarah and David.',
      time: '3 hours ago',
      type: 'safety',
      badge: 'Reminder',
      badgeVariant: 'warning',
    },
  ]

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">Caregiver Alert Center</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time memory contributions, routine verifications, and patient safety notifications
          </p>
        </div>
        <Button size="sm" variant="ghost">
          Mark All Read
        </Button>
      </div>

      <div className="space-y-3">
        {notifications.map((n) => (
          <Card key={n.id} className="flex items-start justify-between p-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#EBF8FF] dark:bg-[#2B6CB0]/20 text-[#2B6CB0] flex items-center justify-center text-lg shrink-0">
                🔔
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{n.title}</h4>
                  <Badge variant={n.badgeVariant}>{n.badge}</Badge>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">{n.desc}</p>
                <p className="text-[10px] text-slate-400">{n.time}</p>
              </div>
            </div>
            <Button size="sm" variant="outline">
              View
            </Button>
          </Card>
        ))}
      </div>
    </div>
  )
}
