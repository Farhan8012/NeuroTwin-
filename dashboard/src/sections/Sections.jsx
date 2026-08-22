/**
 * Sections.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * 7 cinematic storytelling sections mapped to 7 scroll anchors.
 * Supports showText prop so user can toggle text overlay off for clean full-screen frame viewing.
 */

import { motion, AnimatePresence } from 'framer-motion'

const SECTIONS_DATA = [
  {
    tag: 'AI Cognitive Companion · Wearable Intelligence',
    title: 'When memories fade,\nNeuroTwin remembers.',
    body: "An empathetic AI companion that recognizes loved ones in real time, retrieves cherished life memories, and gently guides individuals living with memory loss through every moment.",
    primaryCta: 'Explore NeuroTwin',
    secondaryCta: 'Discover Technology',
  },
  {
    tag: 'Chapter 01 · Neural Architecture',
    title: '86 billion neurons.\nOne continuous field.',
    body: 'NeuroTwin constantly maps spatial surroundings and facial signatures in sub-30ms intervals—maintaining absolute privacy with zero stored visual feeds.',
    stats: [
      { val: '99.4%', label: 'Recognition Precision' },
      { val: '<28ms', label: 'On-Device Latency' },
      { val: '100%', label: 'Privacy Secured' },
    ],
  },
  {
    tag: 'Chapter 02 · Contextual Signals',
    title: 'Subtle cues.\nInstant recognition.',
    body: 'When a daughter or long-time friend enters the room, whisper-quiet directional audio gently cues identity, shared history, and recent interactions.',
    tags: ['Facial Signature Indexing', 'Directional Whisper Audio', 'On-Device Edge AI'],
  },
  {
    tag: 'Chapter 03 · The Memory Bank',
    title: 'Every face.\nEvery story.\nReconnected.',
    body: 'Caregivers curate a living digital memory vault—cherished photo albums, ambient melodies, and daily habits—reweaving lost connections through AI synthesis.',
    tags: ['Family Memory Vault', 'Routine Anchors', 'Voice Synthesizer', 'Emotional Safety'],
  },
  {
    tag: 'Chapter 04 · Spatial Optics',
    title: 'Guiding every step\nwith calm precision.',
    body: 'Advanced spatial optics identify mislaid objects like reading glasses or home keys, illuminating subtle directions before frustration can set in.',
  },
  {
    tag: 'Chapter 05 · Human Balance',
    title: 'Restoring dignity\nand everyday peace.',
    body: 'Creating a continuous safety net for families and caregivers, reducing cognitive load and rekindling meaningful moments of warmth.',
    quote: '"She didn\'t remember my name at first. But when NeuroTwin whispered in her ear, her face lit up with a smile I hadn\'t seen in years."',
    author: '— Sarah M., Caregiver & Family Partner',
  },
  {
    tag: 'Chapter 06 · Early Access',
    title: 'Give them back\ntheir world.',
    body: 'Be part of our early access clinical trial. Experience how wearable neural intelligence can preserve the moments that matter most.',
    primaryCta: 'Request Early Access',
    isCta: true,
  },
]

const FADE_VARIANTS = {
  initial: { opacity: 0, y: 24, filter: 'blur(12px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.75, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -18, filter: 'blur(10px)', transition: { duration: 0.35, ease: [0.7, 0, 0.84, 0] } },
}

export function SectionContent({ activeIndex, onNavigate, showText = true }) {
  const data = SECTIONS_DATA[activeIndex] || SECTIONS_DATA[0]

  return (
    <div className="overlay-ui">
      {showText && (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndex}
            className={`section-card ${data.isCta ? 'section-card--center' : ''}`}
            variants={FADE_VARIANTS}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <div className="label">
              <span className="label-dot" />
              {data.tag}
            </div>

            <h1 className="headline">
              {data.title.split('\n').map((line, idx) => (
                <span key={idx}>
                  {idx === 1 ? <em>{line}</em> : line}
                  {idx < data.title.split('\n').length - 1 && <br />}
                </span>
              ))}
            </h1>

            <p className="body-text">{data.body}</p>

            {data.stats && (
              <div className="data-row">
                {data.stats.map((s, i) => (
                  <div key={i} className="stat-item">
                    <div className="stat-val">{s.val}</div>
                    <div className="stat-lbl">{s.label}</div>
                  </div>
                ))}
              </div>
            )}

            {data.tags && (
              <div className="pill-row">
                {data.tags.map((t, i) => (
                  <span key={i} className="pill">{t}</span>
                ))}
              </div>
            )}

            {data.quote && (
              <blockquote className="quote-box">
                <p>{data.quote}</p>
                <cite>{data.author}</cite>
              </blockquote>
            )}

            <div className="btn-group" style={{ marginTop: 20 }}>
              {data.primaryCta && (
                <button
                  className="btn btn--primary"
                  onClick={() => onNavigate(activeIndex < 6 ? activeIndex + 1 : 0)}
                >
                  <span className="btn-shine" />
                  {data.primaryCta}
                </button>
              )}
              {data.secondaryCta && (
                <button
                  className="btn btn--ghost"
                  onClick={() => onNavigate(1)}
                >
                  {data.secondaryCta} →
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Section Nav dots always accessible on right */}
      <div className="section-indicator">
        {SECTIONS_DATA.map((s, i) => (
          <button
            key={i}
            className={`indicator-dot ${i === activeIndex ? 'active' : ''}`}
            onClick={() => onNavigate(i)}
            title={s.tag}
          >
            <span className="dot-inner" />
            <span className="dot-tooltip">{s.tag.split('·')[1] || s.tag}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
