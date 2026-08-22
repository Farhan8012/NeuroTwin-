import { generateMemorySynthesisPrompt, transcribeAudioWithWhisper } from '../lib/ai/groq'
import { querySimilarMemories } from '../lib/ai/qdrant'

export class AIService {
  async processCompanionPrompt(patientId: string, promptText: string) {
    // 1. Search similar vector memories in Qdrant
    const relevantMemories = await querySimilarMemories(patientId, promptText)

    // 2. Synthesize natural language response using Groq Llama 3
    const aiText = await generateMemorySynthesisPrompt('Eleanor', promptText)

    return {
      response: aiText,
      citedMemories: relevantMemories,
      confidenceScore: 0.92,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  }

  async transcribeAudioMemory(audioBuffer: Buffer | string) {
    return transcribeAudioWithWhisper(audioBuffer)
  }
}

export const aiService = new AIService()
