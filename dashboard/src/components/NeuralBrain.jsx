/**
 * NeuralBrain.jsx  (v3 — full rewrite)
 * ─────────────────────────────────────────────────────────────────────────────
 * Issues fixed from v2:
 *   · Neural connections were dominating as a wire-mesh tangle → now nearly
 *     invisible (opacity 0.025), used only as a whisper of structure.
 *   · Brain shape improved: rejection-sampling against a proper ellipsoid with
 *     medial fissure + surface-heavy distribution.
 *   · Particles now larger (8-12 px), more alpha, with organic per-particle
 *     twinkle for the "living neurons" feel.
 *   · Camera moved to z=3.8 so brain fills more of the viewport.
 *   · Colors: vivid deep blue → bright cyan gradient.
 */

import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

// ─── GLSL Shaders ─────────────────────────────────────────────────────────────

const PARTICLE_VERT = /* glsl */`
  uniform float uTime;
  uniform float uSize;
  uniform vec2  uMouse;
  uniform float uMorphProgress;

  attribute float aScale;
  attribute vec3  aDispersedPos;
  attribute float aPhase;

  varying vec3  vColor;
  varying float vAlpha;

  void main() {
    // ── Morph: brain ↔ dispersed memory clusters ───────────────
    vec3 pos = mix(position, aDispersedPos, uMorphProgress);

    // ── Living neuron pulse ────────────────────────────────────
    // Each particle breathes at its own rhythm
    float breath = sin(uTime * 1.1 + aPhase * 6.2832) * 0.016;
    float dist = length(pos);
    if (dist > 0.01) pos += normalize(pos) * breath;

    // ── Per-particle twinkle (random flicker like neurons firing)
    float twinkle = 0.72 + 0.28 * sin(uTime * (0.8 + aPhase * 2.5) + aPhase * 15.7);

    // ── Mouse parallax ─────────────────────────────────────────
    float mouseStr = (1.0 - uMorphProgress * 0.7);
    pos.x += uMouse.x * 0.22 * mouseStr;
    pos.y += uMouse.y * 0.14 * mouseStr;

    // ── Dispersed state: gentle float ──────────────────────────
    pos.y += sin(uTime * 0.36 + aPhase * 5.1) * 0.07 * uMorphProgress;
    pos.x += cos(uTime * 0.25 + aPhase * 4.3) * 0.05 * uMorphProgress;

    // ── Color: deep blue → surface cyan → warm amber (dispersed)
    float depth = clamp(dist / 1.5, 0.0, 1.0);

    vec3 deepBlue   = vec3(0.12, 0.28, 1.00);   // deep interior
    vec3 midCyan    = vec3(0.20, 0.62, 1.00);   // mid brain
    vec3 surfaceCyan = vec3(0.45, 0.88, 1.00);  // surface glow
    vec3 warmAmber  = vec3(0.98, 0.76, 0.40);   // dispersed memory

    vec3 brainCol = depth < 0.45
      ? mix(deepBlue, midCyan, depth / 0.45)
      : mix(midCyan, surfaceCyan, (depth - 0.45) / 0.55);

    vColor = mix(brainCol, warmAmber, uMorphProgress * 0.88);
    vAlpha = aScale * twinkle;

    // ── Projection ─────────────────────────────────────────────
    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);

    // Target: 8-14 px per particle at camera z≈3.8
    // Formula: uSize * aScale * (K / cameraDistance) → K = 16.0
    gl_PointSize = uSize * aScale * (16.0 / -mvPos.z);
    gl_Position  = projectionMatrix * mvPos;
  }
`

const PARTICLE_FRAG = /* glsl */`
  varying vec3  vColor;
  varying float vAlpha;

  void main() {
    vec2  uv = gl_PointCoord - 0.5;
    float r  = length(uv);
    if (r > 0.5) discard;

    // ── Glow: tight hot core + large soft halo ─────────────────
    float core = 1.0 - smoothstep(0.0, 0.22, r);
    float halo = pow(1.0 - smoothstep(0.0, 0.50, r), 1.6);

    // Elevated alpha so particles are clearly visible against any background
    float alpha = (core * 0.45 + halo * 0.15) * vAlpha;

    // Core tints toward bright cyan-white
    vec3 color = mix(vColor, vec3(0.85, 0.96, 1.0), core * 0.45);

    gl_FragColor = vec4(color, alpha);
  }
`

// ── Neural connection shaders (very subtle — texture, not structure) ─────────
const LINE_VERT = /* glsl */`
  uniform float uMorphProgress;
  uniform vec2  uMouse;
  void main() {
    vec3 pos = position;
    pos.x += uMouse.x * 0.22 * (1.0 - uMorphProgress * 0.7);
    pos.y += uMouse.y * 0.14 * (1.0 - uMorphProgress * 0.7);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

const LINE_FRAG = /* glsl */`
  uniform float uLineOpacity;
  void main() {
    gl_FragColor = vec4(0.28, 0.65, 1.0, uLineOpacity);
  }
`

// ─── Brain Position Generator ─────────────────────────────────────────────────
/**
 * Rejection sampling inside an ellipsoid → cleaner brain silhouette.
 *
 * Shape features:
 *  · Ellipsoid proportions: x:y:z = 1.45:1.20:1.05 (wider than tall)
 *  · Brainstem removed (y < -0.80 rejected)
 *  · Longitudinal fissure (top-center groove) via medial indent
 *  · 82% surface-shell, 18% mid-interior → individual particles visible
 *  · Cortical folds applied at surface
 */
function generateBrainPositions(count) {
  const AX = 1.45, AY = 1.20, AZ = 1.05  // ellipsoid semi-axes

  const positions = []
  let safety = 0

  while (positions.length < count * 3 && safety < count * 25) {
    safety++

    // Uniform sample in bounding box
    const x = (Math.random() * 2 - 1) * AX
    const y = (Math.random() * 2 - 1) * AY
    const z = (Math.random() * 2 - 1) * AZ

    // 1. Ellipsoid test
    const nx = x / AX, ny = y / AY, nz = z / AZ
    const ellR2 = nx*nx + ny*ny + nz*nz
    if (ellR2 > 1.0) continue

    // 2. Remove brainstem (clean bottom boundary)
    if (y < -0.80) continue

    // 3. Medial longitudinal fissure at top
    const fissure = Math.exp(-x * x * 5.0) * Math.max(0, y) * 0.44
    if ((y - fissure) > 0.88) continue

    // 4. Surface-heavy radial bias
    const r = Math.sqrt(ellR2)
    if (r < 0.68 && Math.random() > 0.18) continue  // reject 82% of deep interior

    // 5. Cortical surface folds (gyri/sulci texture)
    let fx = x, fy = y, fz = z
    const surfaceness = Math.max(0, (r - 0.72) / 0.28)
    if (surfaceness > 0) {
      const f1 = Math.sin(x * 8.5 + 0.7) * Math.cos(z * 7.2 - 0.5) * Math.sin(y * 7.8 + 1.3)
      const f2 = Math.sin(x * 15.5 - 1.2) * Math.cos(z * 13.8 + 0.9) * Math.sin(y * 14.6)
      const foldAmt = (f1 * 0.072 + f2 * 0.025) * surfaceness

      const nr = Math.sqrt(x*x + y*y + z*z)
      if (nr > 0.01) {
        fx += (x / nr) * foldAmt
        fy += (y / nr) * foldAmt
        fz += (z / nr) * foldAmt
      }
    }

    positions.push(fx, fy, fz)
  }

  // Pad if rejection sampling didn't fill (shouldn't happen with safety * 25)
  while (positions.length < count * 3) {
    positions.push(
      (Math.random() - 0.5) * 1.2,
      (Math.random() - 0.5) * 1.0,
      (Math.random() - 0.5) * 0.9
    )
  }

  return new Float32Array(positions.slice(0, count * 3))
}

// ─── Memory Cluster Positions ─────────────────────────────────────────────────
function generateDispersedPositions(count) {
  const pos = new Float32Array(count * 3)
  const CLUSTERS = 16

  for (let i = 0; i < count; i++) {
    const c     = i % CLUSTERS
    const angle = (c / CLUSTERS) * Math.PI * 2 + (Math.random() - 0.5) * 0.7
    const rad   = 2.5 + Math.random() * 1.8

    const cx = Math.cos(angle) * rad
    const cy = (Math.random() - 0.42) * 3.2
    const cz = Math.sin(angle) * rad * 0.55

    const spread = 0.45 + Math.random() * 0.55
    pos[i * 3]     = cx + (Math.random() - 0.5) * spread
    pos[i * 3 + 1] = cy + (Math.random() - 0.5) * spread
    pos[i * 3 + 2] = cz + (Math.random() - 0.5) * spread * 0.65
  }

  return pos
}

// ─── Neural Connections (Spatial Hash) ───────────────────────────────────────
function generateConnections(brainPos, count) {
  // Fewer, more spread connections = cleaner look
  const maxDist = 0.28
  const N = Math.min(count, 2200)
  const cellSize = maxDist
  const grid = new Map()

  for (let i = 0; i < N; i++) {
    const gx = Math.floor(brainPos[i*3]     / cellSize)
    const gy = Math.floor(brainPos[i*3 + 1] / cellSize)
    const gz = Math.floor(brainPos[i*3 + 2] / cellSize)
    const key = `${gx},${gy},${gz}`
    if (!grid.has(key)) grid.set(key, [])
    grid.get(key).push(i)
  }

  const lines = []
  const connCount = new Uint8Array(N)
  const MAX_CONN = 2  // fewer connections = less wire-mesh clutter

  for (let i = 0; i < N; i++) {
    if (connCount[i] >= MAX_CONN) continue

    const ax = brainPos[i*3], ay = brainPos[i*3+1], az = brainPos[i*3+2]
    const gx = Math.floor(ax / cellSize)
    const gy = Math.floor(ay / cellSize)
    const gz = Math.floor(az / cellSize)

    outer:
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          const cell = grid.get(`${gx+dx},${gy+dy},${gz+dz}`)
          if (!cell) continue
          for (const j of cell) {
            if (j <= i || connCount[i] >= MAX_CONN || connCount[j] >= MAX_CONN) continue
            const d2 = (ax - brainPos[j*3])**2 + (ay - brainPos[j*3+1])**2 + (az - brainPos[j*3+2])**2
            if (d2 < maxDist * maxDist) {
              lines.push(ax, ay, az, brainPos[j*3], brainPos[j*3+1], brainPos[j*3+2])
              connCount[i]++
              connCount[j]++
            }
            if (connCount[i] >= MAX_CONN) continue outer
          }
        }
      }
    }
  }

  return new Float32Array(lines)
}

// ─── Camera Rig ────────────────────────────────────────────────────────────────
export function CameraRig({ scrollProgress }) {
  const { camera } = useThree()
  const smoothZ  = useRef(3.8)
  const smoothSP = useRef(0)

  useFrame(() => {
    smoothSP.current += (scrollProgress - smoothSP.current) * 0.035
    const sp = smoothSP.current

    // Zoom out as brain disperses, return for CTA
    let targetZ
    if      (sp < 0.28) targetZ = 3.8 - sp * 0.3
    else if (sp < 0.65) targetZ = 3.71 + (sp - 0.28) * 4.0
    else if (sp < 0.82) targetZ = 6.20
    else                targetZ = 6.20 - (sp - 0.82) / 0.18 * 2.4

    smoothZ.current += (targetZ - smoothZ.current) * 0.028
    camera.position.z = smoothZ.current
  })

  return null
}

// ─── Main Component ────────────────────────────────────────────────────────────
const PARTICLE_COUNT = 7000

export function NeuralBrain({ scrollProgress, mouse }) {
  const groupRef  = useRef()
  const smoothSP  = useRef(0)
  const smoothMX  = useRef(0)
  const smoothMY  = useRef(0)
  const autoRotY  = useRef(0)

  const { ptGeo, lineGeo, ptMat, lineMat } = useMemo(() => {
    const brainPos      = generateBrainPositions(PARTICLE_COUNT)
    const dispersedPos  = generateDispersedPositions(PARTICLE_COUNT)
    const linePositions = generateConnections(brainPos, PARTICLE_COUNT)

    // Per-particle attributes
    const scales = new Float32Array(PARTICLE_COUNT)
    const phases  = new Float32Array(PARTICLE_COUNT)
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      scales[i] = 0.55 + Math.random() * 0.70  // tighter range → more uniform glow
      phases[i] = Math.random()
    }

    // Particle geometry
    const ptGeo = new THREE.BufferGeometry()
    ptGeo.setAttribute('position',      new THREE.BufferAttribute(brainPos,     3))
    ptGeo.setAttribute('aDispersedPos', new THREE.BufferAttribute(dispersedPos, 3))
    ptGeo.setAttribute('aScale',        new THREE.BufferAttribute(scales,       1))
    ptGeo.setAttribute('aPhase',        new THREE.BufferAttribute(phases,       1))

    // Connection geometry
    const lineGeo = new THREE.BufferGeometry()
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3))

    // Materials
    const ptMat = new THREE.ShaderMaterial({
      vertexShader:   PARTICLE_VERT,
      fragmentShader: PARTICLE_FRAG,
      uniforms: {
        uTime:          { value: 0 },
        uSize:          { value: 2.8 },
        uMouse:         { value: new THREE.Vector2() },
        uMorphProgress: { value: 0 },
      },
      transparent: true,
      depthWrite:  false,
      blending:    THREE.AdditiveBlending,
    })

    const lineMat = new THREE.ShaderMaterial({
      vertexShader:   LINE_VERT,
      fragmentShader: LINE_FRAG,
      uniforms: {
        uMorphProgress: { value: 0 },
        uMouse:         { value: new THREE.Vector2() },
        uLineOpacity:   { value: 0.06 },  // Elegant, visible neural connections
      },
      transparent: true,
      depthWrite:  false,
      blending:    THREE.AdditiveBlending,
    })

    return { ptGeo, lineGeo, ptMat, lineMat }
  }, [])

  useEffect(() => {
    return () => {
      ptGeo.dispose()
      lineGeo.dispose()
      ptMat.dispose()
      lineMat.dispose()
    }
  }, [ptGeo, lineGeo, ptMat, lineMat])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()

    smoothSP.current += (scrollProgress - smoothSP.current) * 0.038
    smoothMX.current += (mouse.x        - smoothMX.current) * 0.055
    smoothMY.current += (mouse.y        - smoothMY.current) * 0.055

    const sp = smoothSP.current
    const mx = smoothMX.current
    const my = smoothMY.current

    // Morph schedule: brain → dispersed → brain
    let morph
    if      (sp < 0.30) morph = 0
    else if (sp < 0.65) morph = (sp - 0.30) / 0.35
    else if (sp < 0.85) morph = 1.0
    else                morph = 1.0 - (sp - 0.85) / 0.15
    morph = Math.max(0, Math.min(1, morph))
    morph = morph * morph * (3.0 - 2.0 * morph)  // smoothstep

    // Particle uniforms
    ptMat.uniforms.uTime.value          = t
    ptMat.uniforms.uMorphProgress.value = morph
    ptMat.uniforms.uMouse.value.set(mx, my)

    // Line uniforms — fade completely by morph 0.4
    lineMat.uniforms.uLineOpacity.value   = Math.max(0, 1 - morph * 2.5) * 0.025
    lineMat.uniforms.uMorphProgress.value = morph
    lineMat.uniforms.uMouse.value.set(mx, my)

    // Brain rotation: slow auto-spin + mouse tilt
    autoRotY.current += 0.0006 + sp * 0.0004
    if (groupRef.current) {
      groupRef.current.rotation.y = autoRotY.current + mx * 0.14
      groupRef.current.rotation.x = my * 0.09 * (1 - morph * 0.5)
      groupRef.current.rotation.z = -mx * 0.035 * (1 - morph * 0.4)
    }
  })

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <lineSegments geometry={lineGeo} material={lineMat} />
      <points       geometry={ptGeo}  material={ptMat}  />
    </group>
  )
}
