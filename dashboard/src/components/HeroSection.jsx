/**
 * HeroSection.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * NeuroTwin — Apple Keynote-Level Cinematic Hero Section
 * 
 * Features:
 *   · Pure 3D WebGL Neural Brain focal point (no smartwatches or product boxes)
 *   · Deep midnight space background with 15k twinkling starfield & soft volumetric cyan glow
 *   · Apple Keynote-level editorial typography, spacing & motion
 *   · 5 Keynote Storytelling Chapters (ARRIVAL, CORTEX, VISION, BALANCE, THE WHOLE)
 *   · Interactive scientific metadata badges & chapter controls
 */

import { motion, AnimatePresence } from 'framer-motion'

export const HERO_CHAPTERS = [
  {
    id: 'arrival',
    tag: 'ARRIVAL · NEURAL ARCHITECTURE',
    title: 'Eighty-six billion neurons,\none quiet field.',
    body: 'A specimen resolves out of the dark. The scan holds it steady while the system maps its surface, point by point—the most complex object we have ever tried to understand.',
    metadata: [
      { label: 'SPECIMEN', val: 'HUMAN CEREBRUM' },
      { label: 'STATUS', val: 'LIVE MAPPING' },
      { label: 'LATENCY', val: '<28ms ON-DEVICE' },
    ],
  },
  {
    id: 'cortex',
    tag: 'THE CORTEX · SURFACE SYNTHESIS',
    title: 'The folded sheet where\nthought happens.',
    body: 'Two millimetres thick, crumpled into ridges and valleys to fit. The system pushes in on the cortical surface—every fold buys more thinking room without a larger skull.',
    metadata: [
      { label: 'REGION', val: 'FRONTAL CORTEX' },
      { label: 'DENSITY', val: 'HIGH-PRECISION' },
      { label: 'PRIVACY', val: '100% SECURED' },
    ],
  },
  {
    id: 'vision',
    tag: 'VISION · SPATIAL OPTICS',
    title: 'The world arrives at the\nback of your head.',
    body: 'The scan swings behind the brain to the occipital pole—where light becomes shape, motion, and depth long before you know you are seeing.',
    metadata: [
      { label: 'REGION', val: 'OCCIPITAL LOBE' },
      { label: 'SIGNAL', val: 'SPATIAL OPTICS' },
      { label: 'PRECISION', val: '99.4%' },
    ],
  },
  {
    id: 'balance',
    tag: 'BALANCE · CONTINUOUS REASSURANCE',
    title: 'The quiet half that keeps\nyou upright.',
    body: 'Tucked beneath and behind, the cerebellum holds a stem at the root—providing continuous cognitive reassurance and calm coordination.',
    metadata: [
      { label: 'REGION', val: 'CEREBELLUM' },
      { label: 'REASSURANCE', val: 'CONTINUOUS' },
      { label: 'FREQ', val: '12.8 Hz' },
    ],
  },
  {
    id: 'whole',
    tag: 'THE WHOLE · LIVING CONSTELLATION',
    title: 'Then it becomes the network\nit always was.',
    body: 'The surface lets go and the points scatter into constellation—the brain resolving into the living web of what it has been all along.',
    metadata: [
      { label: 'CONVERGENCE', val: '99.4%' },
      { label: 'SYSTEM', val: 'SYNTHESIS COMPLETE' },
      { label: 'TRIAL', val: 'EARLY ACCESS OPEN' },
    ],
  },
]

const CARD_VARIANTS = {
  initial: { opacity: 0, y: 28, filter: 'blur(14px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -20, filter: 'blur(10px)', transition: { duration: 0.35, ease: [0.7, 0, 0.84, 0] } },
}

export function HeroSection({ activeIndex, onChapterChange }) {
  const chapter = HERO_CHAPTERS[activeIndex] || HERO_CHAPTERS[0]

  return (
    <div className="hero-viewport">
      {/* Top Minimal Navigation Bar */}
      <header className="hero-nav">
        <div className="hero-nav-inner">
          <button className="nav-brand" onClick={() => onChapterChange(0)}>
            <span className="brand-dot" />
            <span className="brand-name">NeuroTwin</span>
          </button>

          {/* Chapter Links */}
          <nav className="nav-chapter-links" aria-label="Hero Chapters">
            {HERO_CHAPTERS.map((ch, idx) => (
              <button
                key={ch.id}
                className={`chapter-link ${idx === activeIndex ? 'active' : ''}`}
                onClick={() => onChapterChange(idx)}
              >
                <span className="chapter-prefix">–</span> {ch.tag.split('·')[0].trim()}
              </button>
            ))}
          </nav>

          {/* CTA Action */}
          <button className="nav-cta-btn" onClick={() => onChapterChange(4)}>
            Request Early Access
          </button>
        </div>
      </header>

      {/* Main Editorial Keynote Content (Left-Aligned) */}
      <main className="hero-stage">
        <AnimatePresence mode="wait">
          <motion.div
            key={chapter.id}
            className="hero-keynote-card"
            variants={CARD_VARIANTS}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {/* Tag Line */}
            <div className="keynote-tag">
              <span className="tag-pulse" />
              {chapter.tag}
            </div>

            {/* Display Headline */}
            <h1 className="keynote-headline">
              {chapter.title.split('\n').map((line, idx) => (
                <span key={idx} className="headline-line">
                  {idx === 1 ? <em>{line}</em> : line}
                  {idx < chapter.title.split('\n').length - 1 && <br />}
                </span>
              ))}
            </h1>

            {/* Scientific Body Copy */}
            <p className="keynote-body">{chapter.body}</p>

            {/* Scientific Metadata Badges */}
            <div className="keynote-meta-bar">
              {chapter.metadata.map((m, idx) => (
                <div key={idx} className="meta-item">
                  <span className="meta-lbl">+ {m.label}</span>
                  <span className="meta-val">{m.val}</span>
                </div>
              ))}
            </div>

            {/* Hero Action Buttons */}
            <div className="keynote-actions">
              <button
                className="btn-hero-primary"
                onClick={() => onChapterChange(activeIndex < 4 ? activeIndex + 1 : 0)}
              >
                <span className="shine-effect" />
                {activeIndex === 4 ? 'Begin Clinical Access' : 'Next Chapter →'}
              </button>
              <button
                className="btn-hero-ghost"
                onClick={() => onChapterChange(1)}
              >
                Explore Architecture
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Chapter Progress Bar */}
      <footer className="hero-footer-bar">
        <div className="chapter-tracker">
          {HERO_CHAPTERS.map((ch, idx) => (
            <button
              key={ch.id}
              className={`tracker-item ${idx === activeIndex ? 'active' : ''}`}
              onClick={() => onChapterChange(idx)}
            >
              <span className="tracker-num">0{idx + 1}</span>
              <span className="tracker-name">{ch.tag.split('·')[0].replace('–', '').trim()}</span>
              <span className="tracker-line" />
            </button>
          ))}
        </div>
      </footer>
    </div>
  )
}
