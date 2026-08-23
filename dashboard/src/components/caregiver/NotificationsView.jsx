import React from 'react'

export function NotificationsView() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="material-symbols-outlined" style={{ color: 'var(--nt-primary)' }}>notifications</span>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--nt-on-surface)' }}>Notifications</h2>
      </div>

      <div className="nt-empty">
        <span className="material-symbols-outlined nt-empty-icon">notifications_off</span>
        <h4 className="nt-empty-title">All caught up</h4>
        <p className="nt-empty-desc">You don't have any new notifications or alerts right now.</p>
      </div>
    </div>
  )
}
