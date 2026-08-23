import React, { useState } from 'react'
import { Card, Button } from '../common/UIPrimitives'
import { useAppState } from '../../context/AppStateContext'

export function TodaysMemoriesView() {
  const { showToast } = useAppState()
  const [currentIndex, setCurrentIndex] = useState(0)

  const slides = [
    {
      title: 'Summer at Lake Tahoe (1974)',
      subtitle: 'With your husband Thomas and 5-year-old daughter Sarah',
      image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80',
      description: 'You spent two wonderful weeks camping near the crystal clear lake. Thomas caught fresh trout for dinner.',
    },
    {
      title: 'Playing Chopin Piano Recital (1968)',
      subtitle: 'Boston Conservatory Main Concert Hall',
      image: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?auto=format&fit=crop&w=1000&q=80',
      description: 'You played Chopin Prelude in E Minor and received a standing ovation from your family.',
    },
  ]

  const current = slides[currentIndex]

  return (
    <div className="space-y-6 max-w-4xl mx-auto patient-mode-root">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100">Today's Special Memory</h2>
        <span className="text-base font-bold text-slate-500">
          Slide {currentIndex + 1} of {slides.length}
        </span>
      </div>

      <Card className="p-6 space-y-6 border-3 border-[#2B6CB0]">
        <div className="relative h-96 rounded-2xl overflow-hidden bg-slate-900">
          <img src={current.image} alt={current.title} className="w-full h-full object-cover" />
          <button
            onClick={() => showToast('Playing audio memory narration...', 'info')}
            className="absolute bottom-4 right-4 px-5 py-3 bg-[#2B6CB0] text-white rounded-2xl font-bold text-base shadow-lg hover:bg-[#2C5282] transition flex items-center gap-2"
          >
            <span>▶️</span> <span>Listen to Audio Story</span>
          </button>
        </div>

        <div>
          <h3 className="text-3xl font-black text-slate-900 dark:text-slate-100">{current.title}</h3>
          <p className="text-lg font-bold text-[#2B6CB0] dark:text-[#63B3ED] mt-1">{current.subtitle}</p>
          <p className="text-lg text-slate-700 dark:text-slate-300 mt-3 leading-relaxed">{current.description}</p>
        </div>

        {/* Large Feedback Buttons */}
        <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <Button
            size="xl"
            variant="primary"
            onClick={() => showToast('❤️ Wonderful! Saved to your favorites.', 'success')}
          >
            ❤️ I Remember This!
          </Button>

          <Button
            size="xl"
            variant="outline"
            onClick={() =>
              setCurrentIndex((prev) => (prev + 1) % slides.length)
            }
          >
            ➡️ Next Memory Slide
          </Button>
        </div>
      </Card>
    </div>
  )
}
