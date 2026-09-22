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
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.message || 'Login failed')
    saveToken(data.token)
    user.value = data.user
    return data
  }

  async function resendEmailVerification(email: string) {
    const base = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
    const res = await fetch(`${base}/auth/resend-email-verification`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email })
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.message || 'Unable to send verification email')
    return data
  }

  async function requestPhoneOtp(phone: string) {
    const base = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
    const res = await fetch(`${base}/auth/phone/request-otp`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone })
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.message || 'Unable to send verification code')
    return data
  }

  async function verifyPhoneOtp(phone: string, code: string) {
    const base = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
    const res = await fetch(`${base}/auth/phone/verify-otp`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone, code })
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.message || 'Unable to verify code')
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

  async function verifyEmailOtp(email: string, code: string) {
    const base = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
    const res = await fetch(`${base}/auth/verify-email-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code })
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.message || 'Unable to verify email')
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
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.message || 'Unable to update profile')
    user.value = data.user
    return data.user
  }

  function logout() {
    saveToken(null)
    user.value = null
  }

  return { token, user, isLoggedIn, isAdmin, saveToken, login, resendEmailVerification, requestPhoneOtp, verifyPhoneOtp, register, verifyEmailOtp, fetchMe, updateProfile, logout }
})
