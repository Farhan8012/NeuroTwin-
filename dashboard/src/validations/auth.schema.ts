import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['CAREGIVER', 'PATIENT', 'FAMILY']).optional().default('CAREGIVER'),
})

export const signUpSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2, 'Full name is required'),
  role: z.enum(['CAREGIVER', 'PATIENT', 'FAMILY']).default('CAREGIVER'),
})

export type LoginInput = z.infer<typeof loginSchema>
export type SignUpInput = z.infer<typeof signUpSchema>
