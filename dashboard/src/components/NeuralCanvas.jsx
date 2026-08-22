/**
 * NeuralCanvas.jsx
 * R3F Canvas wrapper — fixed behind all content.
 * AdaptiveDpr automatically lowers resolution on low-end devices.
 */

import { Canvas } from '@react-three/fiber'
import { AdaptiveDpr, PerformanceMonitor } from '@react-three/drei'
import { NeuralBrain, CameraRig } from './NeuralBrain'

export function NeuralCanvas({ scrollProgress, mouse }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 3.8], fov: 62, near: 0.1, far: 100 }}
      gl={{
        antialias:       true,
        alpha:           true,
        powerPreference: 'high-performance',
        stencil:         false,
        depth:           true,
      }}
      dpr={[1, 2]}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 2,
        background: 'transparent',
      }}
    >
      {/* Auto-lower DPR when FPS drops */}
      <AdaptiveDpr pixelated />
      <PerformanceMonitor />

      {/* Subtle depth fog */}
      <fog attach="fog" args={['#080809', 12, 28]} />

      {/* Scene */}
      <CameraRig scrollProgress={scrollProgress} />
      <NeuralBrain scrollProgress={scrollProgress} mouse={mouse} />
    </Canvas>
  )
}
