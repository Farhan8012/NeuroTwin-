export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    message: string
    details?: any
  }
}

export function apiSuccess<T>(data: T, status: number = 200) {
  return new Response(
    JSON.stringify({
      success: true,
      data,
      error: null,
    } as ApiResponse<T>),
    {
      status,
      headers: { 'Content-Type': 'application/json' },
    }
  )
}

export function apiError(message: string, status: number = 400, details?: any) {
  return new Response(
    JSON.stringify({
      success: false,
      data: null,
      error: {
        message,
        details,
      },
    } as ApiResponse),
    {
      status,
      headers: { 'Content-Type': 'application/json' },
    }
  )
}
