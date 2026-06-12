import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface User {
  id: string
  email: string
  name: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)

  const isAuthenticated = computed(() => !!token.value && !!user.value)

  // Initialize from localStorage
  const initAuth = () => {
    const storedToken = localStorage.getItem('authToken')
    const storedUser = localStorage.getItem('authUser')

    if (storedToken && storedUser) {
      token.value = storedToken
      user.value = JSON.parse(storedUser)
    }
  }

  const login = (email: string, password: string) => {
    // Simulate API call - in production, validate against backend
    if (email && password && email.includes('@')) {
      const newUser: User = {
        id: '1',
        email: email,
        name: email.split('@')[0],
      }
      const newToken = 'token_' + Date.now()

      user.value = newUser
      token.value = newToken

      localStorage.setItem('authToken', newToken)
      localStorage.setItem('authUser', JSON.stringify(newUser))

      return true
    }
    return false
  }

  const logout = () => {
    user.value = null
    token.value = null
    localStorage.removeItem('authToken')
    localStorage.removeItem('authUser')
  }

  return {
    user,
    token,
    isAuthenticated,
    initAuth,
    login,
    logout,
  }
})
