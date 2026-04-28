import { apiUrl } from '../utils/apiBase'

export const tarifApi = {
  async calculate(payload) {
    const response = await fetch(apiUrl('/api/tarif/calculate'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData?.message || 'Erreur de connexion au serveur')
    }

    return response.json()
  },

  async getStores() {
    const response = await fetch(apiUrl('/api/tarif/stores'))
    if (!response.ok) {
      throw new Error('Impossible de charger la liste des magasins')
    }
    return response.json()
  },
}
