import { useState } from 'react'
import { tarifApi } from '../services/tarifApi'

export function useCalculateTarif() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const calculate = async (payload) => {
    setLoading(true)
    setError('')
    try {
      const data = await tarifApi.calculate(payload)
      setResult(data)
      return data
    } catch (err) {
      setError(err?.message || 'Erreur lors du calcul')
      setResult(null)
      return null
    } finally {
      setLoading(false)
    }
  }

  return { calculate, result, error, loading, setResult, setError }
}
