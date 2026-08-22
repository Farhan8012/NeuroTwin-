import { memoryRepository } from '../repositories/memory.repository'
import { indexMemoryVector } from '../lib/ai/qdrant'
import { createMemorySchema, CreateMemoryInput } from '../validations/memory.schema'

export class MemoryService {
  async getMemoriesForPatient(patientId: string, category?: string) {
    return memoryRepository.findByPatientId(patientId, category)
  }

  async createMemory(input: CreateMemoryInput) {
    const validated = createMemorySchema.parse(input)
    const newMemory = await memoryRepository.create(validated)

    // Trigger async AI Qdrant vector indexing
    const vectorId = await indexMemoryVector({
      memoryId: newMemory.id,
      patientId: validated.patientId,
      title: validated.title,
      text: validated.description,
      category: validated.category,
      year: validated.yearRecorded,
    })

    return {
      ...newMemory,
      vectorIndexed: true,
      vectorId,
    }
  }
}

export const memoryService = new MemoryService()
