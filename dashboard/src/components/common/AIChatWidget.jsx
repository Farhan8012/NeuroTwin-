import React, { useState } from 'react'
import { Button } from './UIPrimitives'
import { useAppState } from '../../context/AppStateContext'
import { api } from '../../lib/api'

export function AIChatWidget({ patientName = 'Eleanor', isPatientView = false }) {
  const { backendOnline, systemHealth, showToast } = useAppState()

  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: isPatientView
        ? `Hello ${patientName}! I'm your NeuroTwin companion. Ask me about your family, your memories, or where you left something — I remember with you.`
        : `Hello! I'm connected to the live NeuroTwin engine (Qdrant + Ollama). Ask me anything about ${patientName}'s registered faces, memories, medications, or object locations.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedPrompts: isPatientView
        ? ['Who is my daughter?', 'Where are my glasses?', 'Tell me a happy memory']
        : ['Who did the patient see today?', 'Where are the reading glasses?', 'What medicines are scheduled?'],
    },
  ])

  const [input, setInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [playingId, setPlayingId] = useState(null)

  const playTTS = async (msg) => {
    if (!msg.audioUrl) return
    try {
      setPlayingId(msg.id)
      const audio = new Audio(msg.audioUrl)
      audio.onended = () => setPlayingId(null)
      audio.onerror = () => { setPlayingId(null); showToast('Audio playback failed', 'error') }
      await audio.play()
    } catch {
      setPlayingId(null)
    }
  }

  const handleSend = async (textToSend) => {
    const text = (textToSend || input).trim()
    if (!text || isThinking) return

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, userMsg])
    if (!textToSend) setInput('')
    setIsThinking(true)

    if (!backendOnline) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: "I can't reach the NeuroTwin server right now. Please make sure the backend is running on port 8000 and try again.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ])
      setIsThinking(false)
      return
    }

    try {
      const res = await api.voiceQuery(text)
      const aiMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        text: res.llm_response || res.response || '(empty response)',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        audioUrl: api.audioUrl(res.tts_audio_url),
        persona: res.persona,
      }
      setMessages((prev) => [...prev, aiMsg])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: `Sorry, the memory engine hit an error (${err.message}). Please try again.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ])
    } finally {
      setIsThinking(false)
    }
  }

  const components = systemHealth?.components

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#2B6CB0] to-[#38B2AC] flex items-center justify-center text-white text-xs font-bold">
            ✨
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">NeuroTwin AI Memory Engine</h4>
            <p className={`text-[11px] font-medium ${backendOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
              ● {backendOnline ? 'Live • Qdrant + LLM + TTS' : 'Offline — backend unreachable'}
            </p>
          </div>
        </div>
        {components && (
          <div className="hidden sm:flex gap-1.5">
            {['qdrant_vector_db', 'ollama_llm', 'whisper_stt', 'tts_piper'].map((k) => (
              <span
                key={k}
                title={`${k}: ${components[k]}`}
                className={`w-2 h-2 rounded-full ${
                  String(components[k]).match(/connected|active|ready/) ? 'bg-emerald-400' : 'bg-red-400'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Messages Scroll View */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 min-h-[300px]">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
            <div
              className={`max-w-[82%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-[#2B6CB0] text-white rounded-br-none'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-bl-none border border-slate-200 dark:border-slate-600'
              }`}
            >
              {msg.text}
            </div>

            <div className="flex items-center gap-2 mt-1 px-1">
              <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
              {msg.audioUrl && (
                <button
                  onClick={() => playTTS(msg)}
                  disabled={playingId === msg.id}
                  className="text-[10px] font-semibold text-[#2B6CB0] hover:text-[#38B2AC] transition"
                >
                  {playingId === msg.id ? '🔊 playing…' : '▶ play voice'}
                </button>
              )}
            </div>

            {/* Prompt Chips */}
            {msg.suggestedPrompts && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {msg.suggestedPrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(prompt)}
                    className="px-3 py-1 bg-[#EBF8FF] dark:bg-[#2B6CB0]/20 text-[#2B6CB0] dark:text-[#63B3ED] text-xs font-semibold rounded-full border border-[#BEE3F8] dark:border-[#2B6CB0]/40 hover:bg-[#BEE3F8]/50 transition"
                  >
                    💬 {prompt}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {isThinking && (
          <div className="flex items-center gap-2 p-3 bg-slate-100 dark:bg-slate-700/60 rounded-2xl w-24">
            <div className="w-2 h-2 rounded-full bg-[#2B6CB0] animate-bounce" />
            <div className="w-2 h-2 rounded-full bg-[#38B2AC] animate-bounce delay-100" />
            <div className="w-2 h-2 rounded-full bg-[#D69E2E] animate-bounce delay-200" />
          </div>
        )}
      </div>

      {/* Input Bar */}
      <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={isPatientView ? "Ask me anything..." : "Query the live memory engine..."}
          className="flex-1 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm outline-none focus:border-[#2B6CB0]"
        />
        <Button size="sm" onClick={() => handleSend()} disabled={isThinking}>
          Send ➔
        </Button>
      </div>
    </div>
  )
}
