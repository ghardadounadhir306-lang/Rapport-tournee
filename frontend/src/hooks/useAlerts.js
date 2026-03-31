import { useCallback, useEffect, useState } from 'react'
import { apiUrl } from '../utils/apiBase'

/**
 * @param {{ tourneeId?: string|null, date?: string|null, pollMs?: number }} opts
 */
export function useAlerts(opts = {}) {
  const { tourneeId, date, pollMs = 60_000 } = opts
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchAlerts = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (tourneeId) params.set('tourneeId', tourneeId)
      if (date) params.set('date', date)
      const q = params.toString()
      const res = await fetch(apiUrl(`/api/alerts${q ? `?${q}` : ''}`))
      if (!res.ok) throw new Error(String(res.status))
      const data = await res.json()
      setAlerts(Array.isArray(data.alerts) ? data.alerts : [])
      setError(null)
    } catch (e) {
      setError(e?.message ?? 'Erreur')
      setAlerts([])
    } finally {
      setLoading(false)
    }
  }, [tourneeId, date])

  useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts])

  useEffect(() => {
    if (!pollMs) return undefined
    const t = setInterval(fetchAlerts, pollMs)
    return () => clearInterval(t)
  }, [fetchAlerts, pollMs])

  const forTournee = (id) => (!id ? [] : alerts.filter((a) => a.tmsFormId === id))

  return { alerts, loading, error, refetch: fetchAlerts, forTournee, count: alerts.length }
}
