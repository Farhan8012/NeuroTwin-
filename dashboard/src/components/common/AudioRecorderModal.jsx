import React, { useState, useEffect } from 'react'
import { Modal, Button, Input, Select } from './UIPrimitives'
import { useAppState } from '../../context/AppStateContext'

export function AudioRecorderModal() {
  const { audioRecorderOpen, setAudioRecorderOpen, showToast, activePatient } = useAppState()
  const [isRecording, setIsRecording] = useState(false)
  const [timer, setTimer] = useState(0)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('Family')

  useEffect(() => {
    let interval
    if (isRecording) {
      interval = setInterval(() => setTimer((t) => t + 1), 1000)
    } else {
      clearInterval(interval)
    }
    return () => clearInterval(interval)
  }, [isRecording])

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  const handleSave = () => {
    if (!title) {
      showToast('Please enter a title for this audio memory', 'warning')
      return
    }
    setIsRecording(false)
    setTimer(0)
    setTitle('')
    setAudioRecorderOpen(false)
    showToast(`Voice memory "${title}" saved and added to ${activePatient.name}'s library!`, 'success')
  }

  return (
    <Modal
      isOpen={audioRecorderOpen}
      onClose={() => setAudioRecorderOpen(false)}
      title="🎙️ Record Audio Memory Dictation"
    >
      <div className="space-y-5">
        <p className="text-xs text-slate-600 dark:text-slate-300">
          Record a voice story, daily check-in, or memory prompt for <strong>{activePatient.name}</strong>. Our AI automatically transcribes and tags key emotional cues.
        </p>

        {/* Visual Waveform Box */}
        <div className="p-6 bg-slate-900 rounded-2xl flex flex-col items-center justify-center gap-4 border border-slate-800">
          <div className="text-3xl font-mono font-bold text-[#38B2AC]">{formatTimer(timer)}</div>

          {/* Animated Waveform Visualizer */}
          <div className="flex items-center gap-1 h-12">
            {[40, 70, 30, 90, 60, 100, 45, 80, 55, 30, 85, 95, 40, 60, 75, 35].map((height, i) => (
              <div
                key={i}
                style={{ height: isRecording ? `${height}%` : '20%' }}
                className={`w-1.5 rounded-full transition-all duration-150 ${
                  isRecording ? 'bg-gradient-to-t from-[#2B6CB0] to-[#38B2AC] animate-pulse' : 'bg-slate-700'
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => setIsRecording(!isRecording)}
            className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold transition shadow-lg ${
              isRecording ? 'bg-rose-600 animate-pulse' : 'bg-[#2B6CB0] hover:bg-[#2C5282]'
            }`}
          >
            {isRecording ? '⏹' : '🎙️'}
          </button>

          <span className="text-xs text-slate-400 font-medium">
            {isRecording ? 'Recording in progress... Tap stop when finished' : 'Tap mic to start recording'}
          </span>
        </div>

        {/* Details Input */}
        <Input
          label="Memory Title"
          placeholder="e.g., Story about 1978 Summer Trip to Maine"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <Select
          label="Category Tag"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          options={[
            { value: 'Family', label: '❤️ Family & Children' },
            { value: 'Travel', label: '✈️ Travel & Vacation' },
            { value: 'Music', label: '🎵 Music & Songs' },
            { value: 'Milestones', label: '🏆 Milestones & Achievements' },
          ]}
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={() => setAudioRecorderOpen(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Save to Memory Library
          </Button>
        </div>
      </div>
    </Modal>
  )
}
