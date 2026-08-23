import React, { useState, useRef, useEffect } from 'react'
import { api } from '../../lib/api'

export function AIChatWidget({ patientName = "the patient", isPatientView = true }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: isPatientView ? `Hello ${patientName.split(' ')[0]}. How can I help you today?` : `I'm ready to provide insights on ${patientName}.` }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async (e) => {
    e?.preventDefault()
    if (!input.trim() || isLoading) return

    const query = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: query }])
    setIsLoading(true)

    try {
      const response = await api.voiceQuery(query)
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: response.text,
        audio: response.audio_url 
      }])
      
      // Auto-play audio if in patient mode
      if (isPatientView && response.audio_url) {
        const audio = new Audio(api.audioUrl(response.audio_url))
        audio.play().catch(e => console.log('Audio autoplay prevented:', e))
      }
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm having trouble connecting right now. Please try again later.",
        error: true
      }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: 'var(--nt-surface-lowest)', borderRadius: 'var(--r-xl)',
      border: '1px solid var(--nt-outline-variant)', overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px', background: 'var(--nt-surface-low)',
        borderBottom: '1px solid var(--nt-outline-variant)',
        display: 'flex', alignItems: 'center', gap: 12
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'var(--nt-primary)', color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>psychology_alt</span>
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--nt-on-surface)' }}>NeuroTwin</div>
          <div style={{ fontSize: 11, color: 'var(--nt-success)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} /> Online
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '16px',
        display: 'flex', flexDirection: 'column', gap: 16
      }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            display: 'flex', flexDirection: 'column',
            alignItems: m.role === 'user' ? 'flex-end' : 'flex-start'
          }}>
            <div style={{
              maxWidth: '85%', padding: '12px 16px',
              borderRadius: m.role === 'user' ? '16px 16px 0 16px' : '16px 16px 16px 0',
              background: m.role === 'user' ? 'var(--nt-primary)' : 'var(--nt-surface-high)',
              color: m.role === 'user' ? 'white' : 'var(--nt-on-surface)',
              border: m.role === 'assistant' && m.error ? '1px solid var(--nt-error)' : 'none',
              fontSize: isPatientView ? 16 : 14, lineHeight: 1.5
            }}>
              {m.content}
            </div>
            {m.audio && (
              <button 
                onClick={() => new Audio(api.audioUrl(m.audio)).play()}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 4, marginTop: 4,
                  fontSize: 12, color: 'var(--nt-primary)', fontWeight: 600
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>volume_up</span> Play Audio
              </button>
            )}
          </div>
        ))}
        {isLoading && (
          <div style={{ alignSelf: 'flex-start', padding: '12px 16px', borderRadius: '16px 16px 16px 0', background: 'var(--nt-surface-high)' }}>
            <div style={{ display: 'flex', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--nt-outline)', animation: 'fadeIn 1s infinite alternate' }} />
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--nt-outline)', animation: 'fadeIn 1s infinite alternate 0.2s' }} />
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--nt-outline)', animation: 'fadeIn 1s infinite alternate 0.4s' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} style={{
        padding: '12px', borderTop: '1px solid var(--nt-outline-variant)',
        display: 'flex', gap: 8, background: 'var(--nt-surface-lowest)'
      }}>
        <button type="button" onClick={() => setIsRecording(!isRecording)} style={{
          width: 44, height: 44, borderRadius: '50%', border: 'none', flexShrink: 0,
          background: isRecording ? 'var(--nt-error-container)' : 'var(--nt-surface-low)',
          color: isRecording ? 'var(--nt-error)' : 'var(--nt-on-surface-variant)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}>
          <span className="material-symbols-outlined">{isRecording ? 'mic' : 'mic_none'}</span>
        </button>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={isRecording ? "Listening..." : "Type a message..."}
          disabled={isLoading || isRecording}
          style={{
            flex: 1, padding: '0 16px', borderRadius: 22, border: '1px solid var(--nt-outline-variant)',
            background: 'var(--nt-surface-low)', color: 'var(--nt-on-surface)',
            fontSize: 15, outline: 'none', minWidth: 0
          }}
        />
        <button type="submit" disabled={!input.trim() || isLoading} style={{
          width: 44, height: 44, borderRadius: '50%', border: 'none', flexShrink: 0,
          background: input.trim() ? 'var(--nt-primary)' : 'var(--nt-surface-high)',
          color: input.trim() ? 'white' : 'var(--nt-outline-variant)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}>
          <span className="material-symbols-outlined">send</span>
        </button>
      </form>
    </div>
  )
}
