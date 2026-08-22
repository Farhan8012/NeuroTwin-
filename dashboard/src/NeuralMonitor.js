/**
 * NeuralMonitor.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Premium 3D Neural Brain — scroll-driven cinematic experience.
 * 
 * Quality targets (matching reference):
 *   · 120k+ surface-dense particles with bright cyan edge glow
 *   · Dark interior, luminous boundary — anatomically accurate silhouette
 *   · Full device pixel ratio (no cap) for Retina/4K crispness
 *   · Unreal Bloom post-processing with animated intensity
 *   · Smooth 60 FPS lerp-driven camera rig
 *   · 10k ambient starfield for depth
 *   · Scroll/touch/keyboard driven section navigation
 */

import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass }     from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass }     from 'three/examples/jsm/postprocessing/OutputPass.js'

export class NeuralMonitor {
  constructor(container, options = {}) {
    this.container = container
    this.options = {
      particleCount:   options.particleCount   || 120000,
      starCount:       options.starCount       || 10000,
      bloomStrength:   options.bloomStrength    || 2.4,
      bloomRadius:     options.bloomRadius      || 0.55,
      bloomThreshold:  options.bloomThreshold   || 0.45,
      cameraZ:         options.cameraZ         || 14,
      ...options,
    }

    this.scene    = null
    this.camera   = null
    this.renderer = null
    this.composer = null
    this.brain    = null
    this.stars    = null
    this.clock    = new THREE.Clock()
    this._rafId   = null

    this.currentSection   = 0
    this.scrollAccumulated = 0
    this.scrollThreshold  = 60

    this.mouse     = new THREE.Vector2()
    this.targetRot = new THREE.Vector2()

    this.baseRotY       = 0
    this.baseRotX       = 0
    this.targetBaseRotY = 0
    this.targetBaseRotX = 0
    this.targetZ        = this.options.cameraZ
    this.currentZ       = this.options.cameraZ

    this.onSectionChange = options.onSectionChange || (() => {})
    this.onComplete      = options.onComplete      || (() => {})

    // 5 Keynote Camera Chapters (matching reference video sequence)
    this.sections = [
      { index: 0, rotY: 0,              rotX: 0,     z: 12.5, posX: 1.6, posY: 0,    label: 'ARRIVAL' },
      { index: 1, rotY: Math.PI * 0.42, rotX: 0.15,  z: 11.0, posX: 1.4, posY: 0.15, label: 'CORTEX' },
      { index: 2, rotY: Math.PI * 0.95, rotX: -0.12, z: 11.5, posX: 1.5, posY: -0.1, label: 'VISION' },
      { index: 3, rotY: Math.PI * 1.45, rotX: 0.22,  z: 11.0, posX: 1.4, posY: 0.2,  label: 'BALANCE' },
      { index: 4, rotY: Math.PI * 2.00, rotX: 0,     z: 13.2, posX: 1.6, posY: 0,    label: 'THE WHOLE' },
    ]

    this._boundWheel      = this._onWheel.bind(this)
    this._boundTouchStart = this._onTouchStart.bind(this)
    this._boundTouchMove  = this._onTouchMove.bind(this)
    this._boundTouchEnd   = this._onTouchEnd.bind(this)
    this._boundKeyDown    = this._onKeyDown.bind(this)
    this._boundMouseMove  = this._onMouseMove.bind(this)
    this._boundResize     = this._onResize.bind(this)
    this._animate         = this._animate.bind(this)
  }

  init() {
    this._setupScene()
    this._setupPostProcessing()
    this._createBrain()
    this._createStars()
    this._setupLights()
    this._bindEvents()
    this._animate()
    return this
  }

  destroy() {
    if (this._rafId) cancelAnimationFrame(this._rafId)
    window.removeEventListener('wheel',      this._boundWheel)
    window.removeEventListener('touchstart', this._boundTouchStart)
    window.removeEventListener('touchmove',  this._boundTouchMove)
    window.removeEventListener('touchend',   this._boundTouchEnd)
    window.removeEventListener('keydown',    this._boundKeyDown)
    window.removeEventListener('mousemove',  this._boundMouseMove)
    window.removeEventListener('resize',     this._boundResize)
    if (this.renderer) {
      if (this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement)
      }
      this.renderer.dispose()
    }
  }

  // ─── Scene Setup ───────────────────────────────────────────────────────────
  _setupScene() {
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x040d21)
    this.scene.fog = new THREE.FogExp2(0x040d21, 0.008)

    const w = this.container.clientWidth
    const h = this.container.clientHeight

    this.camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 500)
    this.camera.position.set(0, 0.5, this.options.cameraZ)

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      precision: 'highp',
      alpha: false,
      stencil: false,
    })
    this.renderer.setSize(w, h)
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.8
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.container.appendChild(this.renderer.domElement)
  }

  _setupPostProcessing() {
    this.composer = new EffectComposer(this.renderer)
    this.composer.addPass(new RenderPass(this.scene, this.camera))

    const w = this.container.clientWidth
    const h = this.container.clientHeight
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(w, h),
      this.options.bloomStrength,
      this.options.bloomRadius,
      this.options.bloomThreshold,
    )
    this.composer.addPass(this.bloomPass)
    this.composer.addPass(new OutputPass())
  }

  _setupLights() {
    // Subtle ambient fill
    this.scene.add(new THREE.AmbientLight(0x1a3a5c, 0.3))

    // Bottom rim light — cyan uplight
    this.bottomGlow = new THREE.PointLight(0x0ea5e9, 4.0, 35)
    this.bottomGlow.position.set(0, -8, 8)
    this.scene.add(this.bottomGlow)

    // Top-right rim — indigo accent
    this.rimLight = new THREE.PointLight(0x4f46e5, 2.5, 30)
    this.rimLight.position.set(8, 6, -4)
    this.scene.add(this.rimLight)

    // Front fill — subtle blue
    this.frontFill = new THREE.PointLight(0x38bdf8, 1.5, 25)
    this.frontFill.position.set(-3, 2, 12)
    this.scene.add(this.frontFill)
  }

  // ─── Premium Brain Point Cloud ─────────────────────────────────────────────
  _createBrain() {
    const count = this.options.particleCount
    const positions = new Float32Array(count * 3)
    const colors    = new Float32Array(count * 3)
    const sizes     = new Float32Array(count)
    const randoms   = new Float32Array(count)

    // Color palette — matching reference: deep blue interior → bright cyan surface
    const cDeep    = new THREE.Color(0x0a2463)  // dark interior
    const cMid     = new THREE.Color(0x1e6091)  // mid layer
    const cBright  = new THREE.Color(0x38bdf8)  // sky blue surface
    const cHot     = new THREE.Color(0x7dd3fc)  // hot surface highlights
    const cAccent  = new THREE.Color(0x22d3ee)  // cyan accents

    // Fractal brownian motion for cortical folds
    const fbm = (x, y, z) => {
      let val = 0, amp = 0.5, freq = 1
      for (let i = 0; i < 5; i++) {
        val += amp * (
          Math.sin(x * freq * 2.3 + z * 1.1) *
          Math.cos(y * freq * 1.7 + x * 0.8) *
          Math.sin(z * freq * 2.1 + y * 1.3)
        )
        amp  *= 0.45
        freq *= 2.1
      }
      return val
    }

    // Brain generation with hemisphere separation, cortical folds, cerebellum, brainstem & cognitive hotspot
    let idx = 0
    const mainCount = Math.floor(count * 0.76)        // main cerebrum
    const hotspotCount = Math.floor(count * 0.12)     // upper-right cognitive flare hotspot
    const cerebellumCount = Math.floor(count * 0.07)   // cerebellum
    const brainstemCount = count - mainCount - hotspotCount - cerebellumCount // brainstem

    // === CEREBRUM (two hemispheres) ===
    for (let i = 0; i < mainCount; i++) {
      const side = i < mainCount * 0.5 ? -1 : 1
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)

      // Surface-heavy distribution: 85% shell, 15% interior
      let r
      const rnd = Math.random()
      if (rnd < 0.85) {
        r = 2.4 + Math.pow(Math.random(), 0.4) * 0.9  // dense surface shell
      } else {
        r = 0.8 + Math.random() * 1.6  // sparse interior
      }

      let x = r * Math.sin(phi) * Math.cos(theta)
      let y = r * Math.sin(phi) * Math.sin(theta) * 0.80  // slightly compressed vertically
      let z = r * Math.cos(phi) * 0.95

      // Hemisphere offset
      x += side * 1.2

      // Cortical folding — gyri and sulci
      const n1 = fbm(x * 0.8, y * 0.8, z * 0.8)
      const n2 = fbm(x * 2.0 + 50, y * 2.0, z * 2.0)
      const nx = x - side * 1.2
      const ny = y
      const nz = z
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1

      x += (nx / len) * (n1 * 0.5 + n2 * 0.2)
      y += (ny / len) * (n1 * 0.4 + n2 * 0.15)
      z += (nz / len) * (n1 * 0.4 + n2 * 0.15)

      // Flatten the medial surface (between hemispheres)
      const medialDist = Math.abs(x)
      if (medialDist < 0.3) {
        x *= 0.6 + medialDist * 1.3
      }

      positions[idx * 3]     = x
      positions[idx * 3 + 1] = y
      positions[idx * 3 + 2] = z

      // Color based on depth — surface gets bright, interior stays dark
      const surfDist = Math.sqrt(nx * nx + ny * ny + nz * nz)
      const depth = Math.min(1, surfDist / 3.2)
      const fc = new THREE.Color()

      if (depth < 0.4) {
        fc.lerpColors(cDeep, cMid, depth / 0.4)
      } else if (depth < 0.75) {
        fc.lerpColors(cMid, cBright, (depth - 0.4) / 0.35)
      } else {
        fc.lerpColors(cBright, cHot, (depth - 0.75) / 0.25)
      }

      // Random accent injection
      if (Math.random() < 0.08) fc.lerp(cAccent, 0.5)

      const br = 0.8 + Math.random() * 0.3
      colors[idx * 3]     = fc.r * br
      colors[idx * 3 + 1] = fc.g * br
      colors[idx * 3 + 2] = fc.b * br

      sizes[idx]   = depth > 0.65 ? 2.2 + Math.random() * 2.8 : 1.0 + Math.random() * 1.5
      randoms[idx] = Math.random()
      idx++
    }

    // === COGNITIVE FLARE HOTSPOT (upper right parietal lobe matching reference image) ===
    for (let i = 0; i < hotspotCount; i++) {
      const theta = Math.random() * Math.PI * 1.0 - Math.PI * 0.1
      const phi = Math.random() * Math.PI * 0.42
      const r = 0.2 + Math.pow(Math.random(), 0.5) * 0.85

      let x = 1.0 + r * Math.sin(phi) * Math.cos(theta) * 0.95
      let y = 1.2 + r * Math.sin(phi) * Math.sin(theta) * 0.85
      let z = 0.6 + r * Math.cos(phi) * 0.95

      positions[idx * 3]     = x
      positions[idx * 3 + 1] = y
      positions[idx * 3 + 2] = z

      const fc = new THREE.Color(0xdffff) // brilliant white cyan flare
      const br = 1.3 + Math.random() * 0.6
      colors[idx * 3]     = fc.r * br
      colors[idx * 3 + 1] = fc.g * br
      colors[idx * 3 + 2] = fc.b * br

      sizes[idx]   = 3.5 + Math.random() * 4.5
      randoms[idx] = Math.random()
      idx++
    }

    // === CEREBELLUM (bottom-back, dense layered structure) ===
    for (let i = 0; i < cerebellumCount; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = 1.3 + Math.pow(Math.random(), 0.5) * 0.7

      let x = r * Math.sin(phi) * Math.cos(theta) * 1.1
      let y = -2.8 + r * Math.sin(phi) * Math.sin(theta) * 0.5
      let z = -0.8 + r * Math.cos(phi) * 0.7

      // Cerebellar folia (fine parallel folds)
      const folia = Math.sin(y * 18 + x * 3) * 0.06 + Math.sin(y * 25) * 0.03
      x += folia
      z += folia * 0.5

      positions[idx * 3]     = x
      positions[idx * 3 + 1] = y
      positions[idx * 3 + 2] = z

      const fc = new THREE.Color()
      fc.lerpColors(cMid, cBright, 0.5 + Math.random() * 0.5)
      const br = 0.85 + Math.random() * 0.25
      colors[idx * 3]     = fc.r * br
      colors[idx * 3 + 1] = fc.g * br
      colors[idx * 3 + 2] = fc.b * br

      sizes[idx]   = 1.8 + Math.random() * 2.0
      randoms[idx] = Math.random()
      idx++
    }

    // === BRAINSTEM (narrow vertical column) ===
    for (let i = 0; i < brainstemCount; i++) {
      const t = Math.random()
      const angle = Math.random() * Math.PI * 2
      const r = 0.3 + Math.random() * 0.35

      const x = Math.cos(angle) * r
      const y = -3.3 - t * 1.8  // extends downward
      const z = -0.5 + Math.sin(angle) * r * 0.6

      positions[idx * 3]     = x
      positions[idx * 3 + 1] = y
      positions[idx * 3 + 2] = z

      const fc = new THREE.Color()
      fc.lerpColors(cMid, cBright, 0.3 + Math.random() * 0.4)
      const br = 0.7 + Math.random() * 0.3
      colors[idx * 3]     = fc.r * br
      colors[idx * 3 + 1] = fc.g * br
      colors[idx * 3 + 2] = fc.b * br

      sizes[idx]   = 1.2 + Math.random() * 1.4
      randoms[idx] = Math.random()
      idx++
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color',    new THREE.BufferAttribute(colors,    3))
    geo.setAttribute('size',     new THREE.BufferAttribute(sizes,     1))
    geo.setAttribute('random',   new THREE.BufferAttribute(randoms,   1))

    const pr  = this.renderer.getPixelRatio()
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime:       { value: 0 },
        uPixelRatio: { value: pr },
      },
      vertexShader: /* glsl */`
        attribute float size;
        attribute vec3  color;
        attribute float random;

        varying vec3  vColor;
        varying float vAlpha;

        uniform float uTime;
        uniform float uPixelRatio;

        void main() {
          vColor = color;
          vec3 pos = position;

          // Organic breathing — each particle pulses at its own rhythm
          float breath = sin(uTime * 0.5 + pos.y * 0.6 + random * 6.2832) * 0.025;
          float dist = length(pos);
          if (dist > 0.1) pos += normalize(pos) * breath;

          // Neural firing sparkle — random neurons brighten briefly
          float sparkle = sin(uTime * 3.0 + random * 100.0);
          float fire = smoothstep(0.92, 1.0, sparkle) * 0.5;

          vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = (size + fire * 2.0) * uPixelRatio * (380.0 / -mvPos.z);
          gl_Position  = projectionMatrix * mvPos;

          // Distance fade for depth
          vAlpha = smoothstep(60.0, 3.0, -mvPos.z) * (1.0 + fire);
        }
      `,
      fragmentShader: /* glsl */`
        varying vec3  vColor;
        varying float vAlpha;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;

          // Multi-layer glow: tight hot core → soft halo
          float core = 1.0 - smoothstep(0.0, 0.12, dist);
          float mid  = 1.0 - smoothstep(0.0, 0.25, dist);
          float ring = 1.0 - smoothstep(0.12, 0.42, dist);
          float halo = pow(1.0 - smoothstep(0.0, 0.50, dist), 2.5);

          // Core brightens toward white-cyan for hot neuron look
          vec3 hotCore = mix(vColor, vec3(0.90, 0.97, 1.0), core * 0.65);
          vec3 finalColor = hotCore * (core * 2.0 + mid * 0.9 + ring * 0.4 + halo * 0.15);
          float alpha = (core * 1.0 + mid * 0.45 + ring * 0.2 + halo * 0.06) * vAlpha;

          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      transparent: true,
      depthWrite:  false,
      blending:    THREE.AdditiveBlending,
    })

    this.brain = new THREE.Points(geo, mat)
    this.scene.add(this.brain)
  }

  _createStars() {
    const count     = this.options.starCount
    const positions = new Float32Array(count * 3)
    const sizes     = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 120
      positions[i * 3 + 1] = (Math.random() - 0.5) * 120
      positions[i * 3 + 2] = (Math.random() - 0.5) * 100 - 20
      sizes[i] = 0.3 + Math.random() * 1.6
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('size',     new THREE.BufferAttribute(sizes,     1))

    const pr  = this.renderer.getPixelRatio()
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime:       { value: 0 },
        uPixelRatio: { value: pr },
      },
      vertexShader: /* glsl */`
        attribute float size;
        uniform float uTime;
        uniform float uPixelRatio;
        varying float vTwinkle;
        void main() {
          vec3 pos = position;
          pos.y += sin(uTime * 0.08 + pos.x * 0.03) * 0.3;
          // Per-star twinkle
          vTwinkle = 0.5 + 0.5 * sin(uTime * (0.3 + size * 0.5) + pos.x * 2.0 + pos.z);
          vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * uPixelRatio * (180.0 / -mvPos.z);
          gl_Position  = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: /* glsl */`
        varying float vTwinkle;
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float core = 1.0 - smoothstep(0.0, 0.2, dist);
          float glow = 1.0 - smoothstep(0.0, 0.5, dist);
          float a = (core * 0.8 + glow * 0.3) * vTwinkle;
          gl_FragColor = vec4(0.65, 0.88, 1.0, a * 0.55);
        }
      `,
      transparent: true,
      depthWrite:  false,
      blending:    THREE.AdditiveBlending,
    })

    this.stars = new THREE.Points(geo, mat)
    this.scene.add(this.stars)
  }

  goToSection(index) {
    if (index < 0 || index >= this.sections.length) return
    if (index === this.currentSection) return
    this.currentSection = index
    this.onSectionChange(this.sections[index])
    if (index === this.sections.length - 1) this.onComplete()
  }

  next()    { this.goToSection(this.currentSection + 1) }
  prev()    { this.goToSection(this.currentSection - 1) }

  _onWheel(e) {
    e.preventDefault()
    this.scrollAccumulated += e.deltaY
    if (Math.abs(this.scrollAccumulated) > this.scrollThreshold) {
      this.goToSection(this.currentSection + (this.scrollAccumulated > 0 ? 1 : -1))
      this.scrollAccumulated = 0
    }
  }

  _onTouchStart(e) {
    this._touchY = e.touches[0].clientY
  }
  _onTouchMove(e) {
    e.preventDefault()
  }
  _onTouchEnd(e) {
    const diff = this._touchY - e.changedTouches[0].clientY
    if (Math.abs(diff) > 40) this.goToSection(this.currentSection + (diff > 0 ? 1 : -1))
  }

  _onKeyDown(e) {
    if (e.key === 'ArrowDown'  || e.key === 'ArrowRight') this.next()
    if (e.key === 'ArrowUp'    || e.key === 'ArrowLeft')  this.prev()
  }

  _onMouseMove(e) {
    this.mouse.x =  (e.clientX / window.innerWidth)  * 2 - 1
    this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1
  }

  _onResize() {
    const w = this.container.clientWidth
    const h = this.container.clientHeight
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(w, h)
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.composer.setSize(w, h)
    const pr = this.renderer.getPixelRatio()
    if (this.brain) this.brain.material.uniforms.uPixelRatio.value = pr
    if (this.stars) this.stars.material.uniforms.uPixelRatio.value = pr
  }

  setScrollProgress(progress) {
    this.targetScrollProgress = Math.max(0, Math.min(1, progress))
    if (this.scrollProgress === undefined) {
      this.scrollProgress = this.targetScrollProgress
    }
  }

  _bindEvents() {
    window.addEventListener('wheel',      this._boundWheel,      { passive: true })
    window.addEventListener('touchstart', this._boundTouchStart, { passive: true })
    window.addEventListener('touchmove',  this._boundTouchMove,  { passive: true })
    window.addEventListener('touchend',   this._boundTouchEnd)
    window.addEventListener('keydown',    this._boundKeyDown)
    window.addEventListener('mousemove',  this._boundMouseMove)
    window.addEventListener('resize',     this._boundResize)
  }

  _animate() {
    this._rafId = requestAnimationFrame(this._animate)
    const t = this.clock.getElapsedTime()

    if (this.targetScrollProgress !== undefined) {
      this.scrollProgress += (this.targetScrollProgress - this.scrollProgress) * 0.08
      const sp = this.scrollProgress
      this.targetBaseRotY = sp * Math.PI * 2.2
      this.targetBaseRotX = Math.sin(sp * Math.PI * 2) * 0.20
      this.targetZ        = 13.8 - Math.sin(sp * Math.PI) * 2.6
    } else {
      const sec = this.sections[this.currentSection]
      this.targetBaseRotY = sec.rotY
      this.targetBaseRotX = sec.rotX
      this.targetZ        = sec.z
    }

    // Smooth 60 FPS lerp
    const L = 0.08
    this.baseRotY += (this.targetBaseRotY - this.baseRotY) * L
    this.baseRotX += (this.targetBaseRotX - this.baseRotX) * L
    this.currentZ += (this.targetZ        - this.currentZ) * L

    // Slow continuous auto-rotation + section rotation
    if (this.brain) {
      this.brain.rotation.y = this.baseRotY + t * 0.03
      this.brain.rotation.x = this.baseRotX + Math.sin(t * 0.2) * 0.04

      // Mouse parallax
      this.targetRot.x = this.mouse.y * 0.22
      this.targetRot.y = this.mouse.x * 0.22
      this.brain.rotation.x += (this.targetRot.x - (this.brain.rotation.x - this.baseRotX - Math.sin(t * 0.2) * 0.04)) * 0.05
      this.brain.rotation.y += (this.targetRot.y - (this.brain.rotation.y - this.baseRotY - t * 0.03)) * 0.05
    }

    if (this.camera) {
      this.camera.position.z += (this.currentZ - this.camera.position.z) * L
    }

    if (this.brain && this.brain.material.uniforms.uTime) {
      this.brain.material.uniforms.uTime.value = t
    }
    if (this.stars && this.stars.material.uniforms.uTime) {
      this.stars.material.uniforms.uTime.value = t
    }

    // Dynamic bloom — gentle pulse
    if (this.bloomPass) {
      this.bloomPass.strength = this.options.bloomStrength + Math.sin(t * 0.4) * 0.18
    }
    if (this.stars) {
      this.stars.rotation.y = t * 0.005
    }

    if (this.composer) {
      this.composer.render()
    }
  }
}
