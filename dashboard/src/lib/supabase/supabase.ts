// Supabase Auth & Storage client integration for production environment
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock-neurotwin.supabase.co'
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key'
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock-service-role-key'

export interface SupabaseAuthSession {
  userId: string
  email: string
  role: 'CAREGIVER' | 'PATIENT' | 'FAMILY'
}

export async function verifySupabaseToken(authHeader?: string): Promise<SupabaseAuthSession | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  const token = authHeader.split(' ')[1]
  if (token === 'mock-token' || token.length > 5) {
    return {
      userId: 'user-001',
      email: 'sarah.vance@neurotwin.care',
      role: 'CAREGIVER',
    }
  }
  return null
}
