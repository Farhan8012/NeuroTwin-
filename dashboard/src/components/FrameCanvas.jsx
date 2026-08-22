/**
 * FrameCanvas.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Smooth scroll-driven canvas renderer for 260 sequential cleaned frames.
 * Features:
 *   · High quality crisp image rendering with maximum smoothing & retina scaling
 *   · High FPS interpolation dampening (lerp 0.25)
 *   · Cover-fit canvas scaling maintaining aspect ratio
 *   · Reads from /frames/ (cleaned, no text/watermarks)
 */

import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react'

export const FRAME_PATHS = (() => {
  const paths = []
  // 001 to 112
  for (let i = 1; i <= 112; i++) {
    const num = String(i).padStart(3, '0')
    paths.push(`/frames/ezgif-frame-${num}.jpg`)
  }
  // 140 to 287
  for (let i = 140; i <= 287; i++) {
    const num = String(i).padStart(3, '0')
    paths.push(`/frames/ezgif-frame-${num}.jpg`)
  }
  return paths
})()

export const FrameCanvas = forwardRef(function FrameCanvas(
  { progress = 0, onFrameChange },
  ref
) {
  const canvasRef = useRef(null)
  const imagesRef = useRef([])
  const currentFrameRef = useRef(0)
  const targetFrameRef = useRef(0)
  const rafIdRef = useRef(null)
  
  const [loadProgress, setLoadProgress] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)

  useImperativeHandle(ref, () => ({
    setFrame: (index) => {
      targetFrameRef.current = Math.max(0, Math.min(index, FRAME_PATHS.length - 1))
    },
    getFrameCount: () => FRAME_PATHS.length
  }))

  useEffect(() => {
    const targetIdx = Math.round(progress * (FRAME_PATHS.length - 1))
    targetFrameRef.current = Math.max(0, Math.min(targetIdx, FRAME_PATHS.length - 1))
  }, [progress])

  // Preload frames into memory
  useEffect(() => {
    let isCancelled = false
    const images = new Array(FRAME_PATHS.length)
    let loadedCount = 0

    const priorityCount = 20

    const loadIndex = (idx) => {
      return new Promise((resolve) => {
        const img = new Image()
        img.src = FRAME_PATHS[idx]
        img.onload = () => {
          if (!isCancelled) {
            images[idx] = img
            loadedCount++
            setLoadProgress(Math.floor((loadedCount / FRAME_PATHS.length) * 100))
          }
          resolve()
        }
        img.onerror = () => {
          resolve()
        }
      })
    }

    const loadAll = async () => {
      const initialPromises = []
      for (let i = 0; i < Math.min(priorityCount, FRAME_PATHS.length); i++) {
        initialPromises.push(loadIndex(i))
      }
      await Promise.all(initialPromises)
      
      if (!isCancelled) {
        imagesRef.current = images
        setIsLoaded(true)
      }

      for (let i = priorityCount; i < FRAME_PATHS.length; i += 10) {
        if (isCancelled) break
        const batch = []
        for (let j = i; j < Math.min(i + 10, FRAME_PATHS.length); j++) {
          batch.push(loadIndex(j))
        }
        await Promise.all(batch)
        if (!isCancelled) {
          imagesRef.current = images
        }
      }
    }

    loadAll()

    return () => {
      isCancelled = true
    }
  }, [])

  // Canvas drawing function with max sharpness & high quality image smoothing
  const drawFrame = (frameIdx) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = imagesRef.current[frameIdx]
    if (!img || !img.complete || img.naturalWidth === 0) return

    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    const canvasWidth = canvas.width
    const canvasHeight = canvas.height
    const imgWidth = img.naturalWidth
    const imgHeight = img.naturalHeight

    const imgAspect = imgWidth / imgHeight
    const canvasAspect = canvasWidth / canvasHeight

    let drawW, drawH, drawX, drawY

    if (canvasAspect > imgAspect) {
      drawW = canvasWidth
      drawH = canvasWidth / imgAspect
      drawX = 0
      drawY = (canvasHeight - drawH) / 2
    } else {
      drawW = canvasHeight * imgAspect
      drawH = canvasHeight
      drawX = (canvasWidth - drawW) / 2
      drawY = 0
    }

    ctx.clearRect(0, 0, canvasWidth, canvasHeight)
    ctx.drawImage(img, drawX, drawY, drawW, drawH)
  }

  // Handle Resize for Retina resolution
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const dpr = window.devicePixelRatio || 1
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      drawFrame(Math.round(currentFrameRef.current))
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Animation Loop: high FPS frame interpolation
  useEffect(() => {
    const loop = () => {
      const target = targetFrameRef.current
      const current = currentFrameRef.current
      const diff = target - current

      // Snappy lerp dampening (0.25 gives crisp, real-time scroll response)
      if (Math.abs(diff) > 0.01) {
        currentFrameRef.current += diff * 0.25
        const frameIdx = Math.round(currentFrameRef.current)
        drawFrame(frameIdx)
        onFrameChange?.(frameIdx, currentFrameRef.current / (FRAME_PATHS.length - 1))
      }

      rafIdRef.current = requestAnimationFrame(loop)
    }

    rafIdRef.current = requestAnimationFrame(loop)
    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current)
    }
  }, [onFrameChange])

  return (
    <>
      {!isLoaded && (
        <div className="frame-loader">
          <div className="loader-box">
            <div className="loader-spinner" />
            <div className="loader-title">Loading Neural Frames...</div>
            <div className="loader-bar-bg">
              <div className="loader-bar-fill" style={{ width: `${loadProgress}%` }} />
            </div>
            <div className="loader-sub">{loadProgress}% initialized</div>
          </div>
        </div>
      )}

      <canvas
        ref={canvasRef}
        className="frame-canvas"
        style={{
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 0,
          objectFit: 'cover',
          pointerEvents: 'none',
        }}
      />
    </>
  )
})
