import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'))
  const user = ref<any>(null)

  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  function saveToken(t: string | null) {
    token.value = t
    if (t) localStorage.setItem('token', t)
    else localStorage.removeItem('token')
  }

  async function login(email: string, password: string) {
    const base = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
    const res = await fetch(`${base}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password })
    })
    if (!res.ok) throw new Error('Login failed')
    const data = await res.json()
    saveToken(data.token)
    user.value = data.user
    return data
  }

  async function register(profile: { name: string; email: string; password: string; phone: string; address: string; city: string; location?: { latitude: number; longitude: number } }) {
    const base = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
    const res = await fetch(`${base}/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(profile)
    })
    if (!res.ok) {
      const err = await res.json().catch(()=>({message:'Register failed'}))
      throw new Error(err.message || 'Register failed')
    }
    const data = await res.json()
    saveToken(data.token)
    user.value = data.user
    return data
  }

  async function fetchMe() {
    if (!token.value) return null
    const base = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
    const res = await fetch(`${base}/auth/me`, { headers: { Authorization: `Bearer ${token.value}` } })
    if (!res.ok) { saveToken(null); user.value = null; return null }
    const data = await res.json()
    user.value = data.user
    return data.user
  }

  async function updateProfile(profile: Record<string, unknown>) {
    const base = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
    const res = await fetch(`${base}/auth/me`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token.value}` },
      body: JSON.stringify(profile)
    })
    if (!res.ok) throw new Error('Unable to update profile')
    const data = await res.json()
    user.value = data.user
    return data.user
  }

  function logout() {
    saveToken(null)
    user.value = null
  }

  return { token, user, isLoggedIn, isAdmin, saveToken, login, register, fetchMe, updateProfile, logout }
})
