<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/pinia/authStore'

const router = useRouter()
const authStore = useAuthStore()

const name = ref('')
const email = ref('')
const password = ref('')
const phone = ref('')
const address = ref('')
const city = ref('')
const location = ref<{ latitude: number; longitude: number }>()
const error = ref('')
const loading = ref(false)

if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(({ coords }) => {
    location.value = { latitude: coords.latitude, longitude: coords.longitude }
  })
}

async function handleRegister() {
  error.value = ''
  loading.value = true

  try {
    await authStore.register({ name: name.value, email: email.value, password: password.value, phone: phone.value, address: address.value, city: city.value, location: location.value })
    router.push('/')
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Registration failed'
  } finally {
    loading.value = false
  }
}

function loginWithGoogle() {
  const base = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
  window.location.href = `${base}/auth/google`
}

function loginWithGithub() {
  const base = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
  window.location.href = `${base}/auth/github`
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-10">
    <div class="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg">
      <div class="flex justify-center mb-6">
        <router-link to="/">
          <img src="/NepKart-logo.png" alt="Logo" class="w-20 h-20 object-contain" />
        </router-link>
      </div>

      <h2 class="text-2xl font-bold text-center mb-2 text-gray-800">Create Account</h2>
      <p class="text-center text-sm text-gray-500 mb-6">Join NepKart for the best shopping experience</p>

      <div class="space-y-2.5 mb-6">
        <button
          type="button"
          @click="loginWithGoogle"
          class="w-full bg-white border border-gray-300 text-gray-700 font-medium py-2.5 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-3 cursor-pointer shadow-xs"
        >
          <img src="/images.png" alt="Google" class="w-5 h-5 object-contain" />
          <span>Sign up with Google</span>
        </button>

        <button
          type="button"
          @click="loginWithGithub"
          class="w-full bg-[#24292e] text-white font-medium py-2.5 rounded-lg hover:bg-[#1b1f23] transition flex items-center justify-center gap-3 cursor-pointer shadow-xs"
        >
          <img src="/images (1).png" alt="GitHub" class="w-5 h-5 object-contain filter invert" />
          <span>Sign up with GitHub</span>
        </button>
      </div>

      <div class="relative my-6 text-center">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-gray-200"></div>
        </div>
        <span class="relative bg-white px-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
          Or register with email
        </span>
      </div>

      <form class="space-y-4" @submit.prevent="handleRegister">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input
            v-model="name"
            type="text"
            placeholder="Enter your name"
            class="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600"
            required
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            v-model="email"
            type="email"
            placeholder="Enter your email"
            class="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600"
            required
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            v-model="password"
            type="password"
            placeholder="Enter your password"
            class="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600"
            required
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input v-model="phone" type="tel" placeholder="Phone number" class="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600" required />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <input v-model="address" type="text" placeholder="Street address" class="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600" required />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">City</label>
          <input v-model="city" type="text" placeholder="City" class="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600" required />
        </div>

        <p v-if="error" class="text-red-500 text-sm">{{ error }}</p>

        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-[#1769aa] hover:bg-[#124d80] text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-60 cursor-pointer shadow-sm"
        >
          {{ loading ? 'Creating account...' : 'Create Account' }}
        </button>

        <div class="pt-2 text-center">
          <router-link to="/login" class="text-sm font-medium text-[#1769aa] hover:underline">
            Already have an account? Sign in
          </router-link>
        </div>
      </form>
    </div>
  </div>
</template>