/**
 * NeuroTwin — Hero Section JavaScript
 * Handles: Particle canvas · Mouse parallax · Scroll reveal · Nav behavior
 * Structured for future GSAP + Three.js integration
 */

'use strict';

// ─── State ───────────────────────────────────────────────────────────────────
const state = {
  mouse: { x: 0, y: 0, lerpX: 0, lerpY: 0 },
  scroll: 0,
  rafId: null,
  particles: [],
  canvas: null,
  ctx: null,
  resizeTimer: null,
};

// ─── DOM References ───────────────────────────────────────────────────────────
const dom = {
  navbar:       document.getElementById('navbar'),
  heroContent:  document.getElementById('hero-content'),
  heroLabel:    document.getElementById('hero-label'),
  heroHeadline: document.getElementById('hero-headline'),
  heroSub:      document.getElementById('hero-sub'),
  heroActions:  document.getElementById('hero-actions'),
  deviceStage:  document.getElementById('device-stage'),
  deviceFloat:  document.getElementById('device-float'),
  deviceStatus: document.getElementById('device-status'),
  scrollHint:   document.getElementById('scroll-hint'),
  orbs:         document.querySelectorAll('.orb'),
  canvas:       document.getElementById('particle-canvas'),
};

// ─── Particle System ──────────────────────────────────────────────────────────
class Particle {
  constructor(canvas) {
    this.canvas = canvas;
    this.reset(true);
  }

  reset(initial = false) {
    this.x = Math.random() * this.canvas.width;
    this.y = initial
      ? Math.random() * this.canvas.height
      : this.canvas.height + 10;
    this.vx = (Math.random() - 0.5) * 0.15;
    this.vy = -(Math.random() * 0.35 + 0.1);
    this.size = Math.random() * 1.4 + 0.4;
    this.opacity = 0;
    this.maxOpacity = Math.random() * 0.35 + 0.1;
    this.life = 0;
    this.maxLife = Math.random() * 400 + 200;
    this.fadeIn = 60;
    this.fadeOut = 80;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life++;

    if (this.life < this.fadeIn) {
      this.opacity = (this.life / this.fadeIn) * this.maxOpacity;
    } else if (this.life > this.maxLife - this.fadeOut) {
      this.opacity = ((this.maxLife - this.life) / this.fadeOut) * this.maxOpacity;
    } else {
      this.opacity = this.maxOpacity;
    }

    if (this.life >= this.maxLife) {
      this.reset(false);
    }
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(200, 169, 126, ${this.opacity})`;
    ctx.fill();
  }
}

function initParticles() {
  const canvas = dom.canvas;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  state.canvas = canvas;
  state.ctx = ctx;

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  resize();
  window.addEventListener('resize', () => {
    clearTimeout(state.resizeTimer);
    state.resizeTimer = setTimeout(resize, 150);
  });

  // Create particles — keep count low for elegance
  const count = Math.min(60, Math.floor(window.innerWidth / 20));
  for (let i = 0; i < count; i++) {
    state.particles.push(new Particle(canvas));
  }
}

function drawParticles() {
  const { ctx, canvas, particles } = state;
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const p of particles) {
    p.update();
    p.draw(ctx);
  }
}

// ─── Mouse Parallax ───────────────────────────────────────────────────────────
function initMouseParallax() {
  document.addEventListener('mousemove', (e) => {
    // Normalize to [-1, 1]
    state.mouse.x = (e.clientX / window.innerWidth  - 0.5) * 2;
    state.mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  // Reset on leave
  document.addEventListener('mouseleave', () => {
    state.mouse.x = 0;
    state.mouse.y = 0;
  });
}

function applyParallax() {
  const lerpFactor = 0.06;
  state.mouse.lerpX += (state.mouse.x - state.mouse.lerpX) * lerpFactor;
  state.mouse.lerpY += (state.mouse.y - state.mouse.lerpY) * lerpFactor;

  const { lerpX, lerpY } = state.mouse;

  // Device parallax — subtle, elegant
  if (dom.deviceFloat) {
    const dx = lerpX * 14;
    const dy = lerpY * 10;
    dom.deviceFloat.style.transform = `translate(${dx}px, ${dy}px)`;
  }

  // Content subtle shift
  if (dom.heroContent) {
    const cx = lerpX * -5;
    const cy = lerpY * -3;
    dom.heroContent.style.transform = `translate(${cx}px, ${cy}px)`;
  }

  // Orb slow drift based on mouse
  dom.orbs.forEach((orb, i) => {
    const factor = (i + 1) * 8;
    orb.style.transform = `translate(${lerpX * factor}px, ${lerpY * factor}px)`;
  });
}

// ─── Scroll Handler ───────────────────────────────────────────────────────────
function initScroll() {
  window.addEventListener('scroll', () => {
    state.scroll = window.scrollY;

    // Nav background
    if (state.scroll > 30) {
      dom.navbar?.classList.add('scrolled');
    } else {
      dom.navbar?.classList.remove('scrolled');
    }
  }, { passive: true });
}

// ─── Entrance Animations ──────────────────────────────────────────────────────
function runEntrance() {
  // Staggered reveal sequence
  const sequence = [
    { el: dom.navbar,       cls: 'visible', delay: 0   },
    { el: dom.heroLabel,    cls: 'visible', delay: 200 },
    { el: dom.heroHeadline, cls: 'visible', delay: 350 },
    { el: dom.heroSub,      cls: 'visible', delay: 500 },
    { el: dom.heroActions,  cls: 'visible', delay: 650 },
    { el: dom.deviceStage,  cls: 'visible', delay: 500 },
    { el: dom.deviceStatus, cls: 'visible', delay: 1100 },
    { el: dom.scrollHint,   cls: 'visible', delay: 1600 },
  ];

  sequence.forEach(({ el, cls, delay }) => {
    if (!el) return;
    setTimeout(() => el.classList.add(cls), delay);
  });

  // Orbs reveal
  dom.orbs.forEach((orb, i) => {
    setTimeout(() => orb.classList.add('visible'), 400 + i * 200);
  });
}

// ─── Main Render Loop ─────────────────────────────────────────────────────────
function loop() {
  drawParticles();
  applyParallax();
  state.rafId = requestAnimationFrame(loop);
}

// ─── GSAP Hook (future integration) ──────────────────────────────────────────
/**
 * @future
 * When GSAP is added, replace CSS transitions with:
 * gsap.timeline()
 *   .from('.hero-label',    { opacity: 0, y: 16, duration: 0.8, ease: 'expo.out' })
 *   .from('.hero-headline', { opacity: 0, y: 24, duration: 1,   ease: 'expo.out' }, '-=0.5')
 *   ...
 *
 * When Three.js is added, replace the 2D canvas particle system
 * with a WebGL scene. The #particle-canvas element is already in place.
 */

// ─── Init ─────────────────────────────────────────────────────────────────────
function init() {
  initParticles();
  initMouseParallax();
  initScroll();
  runEntrance();
  loop();
}

// Wait for fonts + layout
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// ─── Cleanup on unload ────────────────────────────────────────────────────────
window.addEventListener('beforeunload', () => {
  if (state.rafId) cancelAnimationFrame(state.rafId);
});
