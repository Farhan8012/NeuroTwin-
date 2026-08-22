/**
 * NeuralBrainCanvas.jsx
 * React wrapper for the Three.js NeuralMonitor class.
 * Exposes goToSection() via forwardRef so parent can navigate programmatically.
 */

import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { NeuralMonitor } from '../NeuralMonitor.js'

export const NeuralBrainCanvas = forwardRef(function NeuralBrainCanvas(
  { onSectionChange, scrollProgress = 0 },
  ref,
) {
  const containerRef = useRef()
  const monitorRef   = useRef()

  // Expose goToSection and setScrollProgress to parent
  useImperativeHandle(ref, () => ({
    goToSection: (i) => monitorRef.current?.goToSection(i),
    setScrollProgress: (p) => monitorRef.current?.setScrollProgress(p),
  }))

  useEffect(() => {
    if (!containerRef.current) return

    const monitor = new NeuralMonitor(containerRef.current, {
      particleCount:  130000,
      starCount:      12000,
      bloomStrength:  2.6,
      bloomRadius:    0.55,
      bloomThreshold: 0.40,
      cameraZ:        13.8,
      onSectionChange: (section) => {
        onSectionChange?.(section.index)
      },
    })

    monitor.init()
    monitorRef.current = monitor

    return () => {
      monitor.destroy()
      monitorRef.current = null
    }
  }, []) // eslint-disable-line

  useEffect(() => {
    if (monitorRef.current) {
      monitorRef.current.setScrollProgress(scrollProgress)
    }
  }, [scrollProgress])

  return (
    <div
      ref={containerRef}
      style={{ position: 'fixed', inset: 0, zIndex: 0 }}
      aria-hidden="true"
    />
  )
})
