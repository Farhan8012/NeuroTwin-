import { useState, useEffect } from 'react'

export function useMemoriesQuery(patientId: string = 'pt-001', category?: string) {
  const [data, setData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMemories = async () => {
    setIsLoading(true)
    try {
      const url = `/api/memories?patientId=${patientId}${category ? `&category=${category}` : ''}`
      const res = await fetch(url)
      const json = await res.json()
      if (json.success) {
        setData(json.data)
      } else {
        setError(json.error?.message || 'Failed to load memories')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMemories()
  }, [patientId, category])

  return { data, isLoading, error, refetch: fetchMemories }
}
