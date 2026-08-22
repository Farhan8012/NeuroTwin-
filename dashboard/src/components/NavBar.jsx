/**
 * NavBar.jsx
 */

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

export function NavBar({
  onNavigate,
  activeIndex,
  mode,
  onModeChange,
}) {
  const navRef = useRef()
  const inited = useRef(false)

  useEffect(() => {
    if (inited.current) return
    inited.current = true

    gsap.set(navRef.current, { opacity: 0, y: -12 })
    gsap.to(navRef.current, {
      opacity: 1,
      y: 0,
      duration: 1.1,
      ease: 'expo.out',
      delay: 0.3,
    })
  }, [])

  const navItems = [
    { label: 'Overview',   index: 0 },
    { label: 'Cortex',     index: 1 },
    { label: 'Signals',    index: 2 },
    { label: 'Network',    index: 3 },
    { label: 'Vision',     index: 4 },
    { label: 'Balance',    index: 5 },
  ]

  return (
    <nav ref={navRef} className="navbar" aria-label="Main navigation">
      <div className="nav-inner">
        <button onClick={() => onNavigate(0)} className="nav-logo" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <span className="logo-mark" aria-hidden="true" />
          <span className="logo-text">NeuroTwin</span>
        </button>

        {/* Live 3D Status Badge */}
        <div className="status-badge">
          <span className="badge-pulse" />
          <span className="badge-text">LIVE 3D NEURAL</span>
        </div>

        <ul className="nav-links" role="list">
          {navItems.map((item) => (
            <li key={item.index}>
              <button
                onClick={() => onNavigate(item.index)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: activeIndex === item.index ? 'var(--accent)' : 'var(--text-2)',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: activeIndex === item.index ? 500 : 400,
                  transition: 'color 0.2s ease',
                }}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>

        <button
          onClick={() => onNavigate(6)}
          className="nav-cta"
          style={{ border: 'none', cursor: 'pointer' }}
        >
          Early Access
        </button>
      </div>
    </nav>
  )
}
