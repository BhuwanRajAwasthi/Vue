<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/pinia/authStore'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

onMounted(async () => {
  if (route.query.error) {
    error.value = String(route.query.error)
  }

  if (route.query.token) {
    const token = String(route.query.token)
    loading.value = true
    try {
      authStore.saveToken(token)
      const profile = await authStore.fetchMe()
      if (!profile) throw new Error('The social login token was rejected')
      if (authStore.user?.role === 'admin') {
        router.push('/Admin')
      } else {
        router.push('/')
      }
    } catch (err) {
      error.value = 'Social sign in failed to load user profile'
    } finally {
      loading.value = false
    }
  }
})

async function handleLogin() {
  error.value = ''
  loading.value = true

  try {
    await authStore.login(email.value, password.value)
    if(authStore.user?.role === 'admin') {
      router.push('/Admin')
    } else {
      router.push('/')
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Login failed'
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

      <h2 class="text-2xl font-bold text-center mb-2 text-gray-800">Welcome Back</h2>
      <p class="text-center text-sm text-gray-500 mb-6">Sign in to your NepKart account</p>

      <div v-if="error" class="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center gap-2">
        <i class="pi pi-exclamation-circle text-red-500" />
        <span>{{ error }}</span>
      </div>

      <form class="space-y-4" @submit.prevent="handleLogin">
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

        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-[#1769aa] hover:bg-[#124d80] text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-60 cursor-pointer shadow-sm"
        >
          {{ loading ? 'Logging in...' : 'Sign In' }}
        </button>

        <div class="relative my-6 text-center">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-200"></div>
          </div>
          <span class="relative bg-white px-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
            Or continue with
          </span>
        </div>

        <div class="space-y-2.5">
          <button
            type="button"
            @click="loginWithGoogle"
            class="w-full bg-white border border-gray-300 text-gray-700 font-medium py-2.5 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-3 cursor-pointer shadow-xs"
          >
            <img src="/images.png" alt="Google" class="w-5 h-5 object-contain" />
            <span>Continue with Google</span>
          </button>

          <button
            type="button"
            @click="loginWithGithub"
            class="w-full bg-[#24292e] text-white font-medium py-2.5 rounded-lg hover:bg-[#1b1f23] transition flex items-center justify-center gap-3 cursor-pointer shadow-xs"
          >
            <img src="/images (1).png" alt="GitHub" class="w-5 h-5 object-contain filter invert" />
            <span>Continue with GitHub</span>
          </button>
        </div>

        <div class="pt-4 text-center">
          <router-link to="/register" class="text-sm font-medium text-[#1769aa] hover:underline">
            Don't have an account? Sign up
          </router-link>
        </div>
      </form>
    </div>
  </div>
</template>