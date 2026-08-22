import { z } from 'zod'

export const createMemorySchema = z.object({
  patientId: z.string().uuid().or(z.string().min(3)),
  title: z.string().min(3, 'Memory title is required'),
  description: z.string().min(5, 'Description is required'),
  category: z.enum(['FAMILY', 'TRAVEL', 'MUSIC', 'MILESTONES', 'RECIPES', 'GENERAL']).default('GENERAL'),
  yearRecorded: z.string().optional(),
  dateOccurred: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.string().min(5)),
  audioUrl: z.string().url().optional().or(z.string().min(5)),
})

export type CreateMemoryInput = z.infer<typeof createMemorySchema>
