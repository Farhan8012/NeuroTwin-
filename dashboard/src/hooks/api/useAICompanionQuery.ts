import { useState } from 'react'

export function useAICompanionQuery(patientId: string = 'pt-001') {
  const [isLoading, setIsLoading] = useState(false)

  const askCompanion = async (promptText: string) => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/ai/companion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, prompt: promptText }),
      })
      const json = await res.json()
      if (json.success) {
        return json.data
      }
      throw new Error(json.error?.message || 'AI request failed')
    } finally {
      setIsLoading(false)
    }
  }

  return { askCompanion, isLoading }
}
