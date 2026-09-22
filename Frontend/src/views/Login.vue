<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/pinia/authStore'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const phone = ref('')
const otp = ref('')
const loginMode = ref('email')
const otpSent = ref(false)
const error = ref('')
const success = ref('')
const canResendVerification = ref(false)
const resendMessage = ref('')
const loading = ref(false)

onMounted(async () => {
  if (route.query.error) {
    error.value = String(route.query.error)
  }
  if (route.query.verified === '1') {
    success.value = 'Email verified. You can now sign in.'
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
  success.value = ''
  resendMessage.value = ''
  canResendVerification.value = false
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
    canResendVerification.value = error.value.toLowerCase().includes('verify your email')
  } finally {
    loading.value = false
  }
}

async function resendVerificationEmail() {
  error.value = ''
  resendMessage.value = ''
  loading.value = true
  try {
    const result = await authStore.resendEmailVerification(email.value)
    resendMessage.value = result.message
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unable to send verification email'
  } finally {
    loading.value = false
  }
}

async function sendPhoneOtp() {
  error.value = ''
  loading.value = true
  try {
    await authStore.requestPhoneOtp(phone.value)
    otpSent.value = true
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unable to send verification code'
  } finally {
    loading.value = false
  }
}

async function verifyPhone() {
  error.value = ''
  loading.value = true
  try {
    await authStore.verifyPhoneOtp(phone.value, otp.value)
    router.push(authStore.user?.role === 'admin' ? '/Admin' : '/')
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Verification failed'
  } finally {
    loading.value = false
  }
}

function setLoginMode(mode) {
  loginMode.value = mode
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
  <main class="auth-page">
    <section class="auth-card">
      <aside class="login-illustration" aria-hidden="true">
        <router-link to="/" class="illustration-logo"><span>NepKart</span></router-link>
        <div class="illustration-art">
          <span class="spark spark-one">✦</span><span class="spark spark-two">✦</span>
          <div class="bag-handle"></div><div class="shopping-bag"><i class="pi pi-shopping-bag"></i></div>
          <div class="floating-product product-one"><i class="pi pi-heart-fill"></i></div>
          <div class="floating-product product-two"><i class="pi pi-gift"></i></div>
        </div>
        <div class="illustration-copy"><strong>Everything you love,</strong><span>in one simple place.</span></div>
      </aside>

      <div class="login-form-panel">
        <div class="login-heading">
          <span class="eyebrow">WELCOME TO NEPKART</span>
          <h2>Welcome Back</h2>
          <p>Sign in to continue your shopping journey.</p>
        </div>

        <div v-if="error" class="error-message"><i class="pi pi-exclamation-circle" /><span>{{ error }}</span></div>
        <div v-if="success" class="success-message"><i class="pi pi-check-circle" /><span>{{ success }}</span></div>
        <button v-if="canResendVerification" type="button" class="resend-button" :disabled="loading" @click="resendVerificationEmail">Resend verification email</button>
        <div v-if="resendMessage" class="success-message"><i class="pi pi-check-circle" /><span>{{ resendMessage }}</span></div>

        <div class="login-tabs" role="tablist" aria-label="Sign in method">
          <button type="button" :class="{ active: loginMode === 'email' }" @click="setLoginMode('email')"><i class="pi pi-envelope" /> Email</button>
          <button type="button" :class="{ active: loginMode === 'phone' }" @click="setLoginMode('phone')"><i class="pi pi-mobile" /> Phone OTP</button>
        </div>

        <form v-if="loginMode === 'email'" class="login-form" @submit.prevent="handleLogin">
          <label class="field-label">Email address
            <span class="input-shell"><i class="pi pi-envelope" /><input v-model="email" type="email" placeholder="you@example.com" required /></span>
          </label>
          <label class="field-label">Password
            <span class="input-shell"><i class="pi pi-lock" /><input v-model="password" type="password" placeholder="Enter your password" required /></span>
          </label>
          <button type="submit" :disabled="loading" class="sign-in-button">{{ loading ? 'Logging in...' : 'Sign In' }}<i class="pi pi-arrow-right" /></button>

          <div class="divider"><span>or continue with</span></div>
          <div class="social-buttons">
            <button type="button" @click="loginWithGoogle"><img src="/images.png" alt="Google" /> Google</button>
            <button type="button" @click="loginWithGithub"><img src="/images (1).png" alt="GitHub" /> GitHub</button>
          </div>
          <p class="signup-text">New to NepKart? <router-link to="/register">Create an account</router-link></p>
        </form>

        <form v-else class="login-form" @submit.prevent="otpSent ? verifyPhone() : sendPhoneOtp()">
          <label class="field-label">Phone number
            <span class="input-shell"><i class="pi pi-mobile" /><input v-model="phone" type="tel" placeholder="+977 98XXXXXXXX" required /></span>
          </label>
          <label v-if="otpSent" class="field-label">Verification code
            <span class="input-shell"><i class="pi pi-key" /><input v-model="otp" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="6-digit code" required /></span>
          </label>
          <button type="submit" :disabled="loading" class="sign-in-button">{{ loading ? 'Please wait...' : (otpSent ? 'Verify and sign in' : 'Send verification code') }}<i class="pi pi-arrow-right" /></button>
          <button v-if="otpSent" type="button" class="back-button" @click="otpSent = false">Use a different number</button>
        </form>
      </div>
    </section>
  </main>
</template>

<style scoped>
.auth-page { min-height: clamp(560px, calc(100dvh - 190px), 720px); display: flex; align-items: center; justify-content: center; padding: 30px 18px; box-sizing: border-box; background: radial-gradient(circle at 20% 20%, rgba(132, 91, 255, .5), transparent 32%), radial-gradient(circle at 85% 75%, rgba(42, 196, 255, .35), transparent 30%), linear-gradient(135deg, #182b88 0%, #4d2b9d 52%, #7b42c6 100%); overflow: hidden; }
.auth-card { display: grid; grid-template-columns: 235px minmax(350px, 420px); width: min(100%, 700px); box-sizing: border-box; overflow: hidden; border: 1px solid rgba(255,255,255,.5); border-radius: 25px; background: rgba(255,255,255,.96); box-shadow: 0 24px 70px rgba(12, 15, 67, .35); }
.login-illustration { position: relative; display: flex; flex-direction: column; justify-content: space-between; min-height: 540px; overflow: hidden; padding: 25px 22px 26px; color: white; background: linear-gradient(160deg, #233da5 0%, #6338b5 58%, #9a55c8 100%); }
.login-illustration::before, .login-illustration::after { position: absolute; content: ''; border-radius: 50%; background: rgba(255,255,255,.1); }
.login-illustration::before { width: 180px; height: 180px; top: -64px; right: -58px; }
.login-illustration::after { width: 130px; height: 130px; bottom: 54px; left: -70px; }
.illustration-logo { position: relative; z-index: 1; display: inline-flex; align-items: center; gap: 8px; color: white; text-decoration: none; font: 700 1.2rem Georgia, serif; }
.illustration-logo img { width: 34px; height: 34px; object-fit: contain; filter: brightness(0) invert(1); }
.illustration-art { position: relative; z-index: 1; height: 265px; }
.shopping-bag { position: absolute; left: 50%; top: 80px; display: grid; place-items: center; width: 125px; height: 125px; transform: translateX(-50%) rotate(-5deg); border-radius: 18px 18px 24px 24px; background: linear-gradient(145deg, #ffcf73, #f590a9); box-shadow: 12px 18px 0 rgba(35, 20, 103, .18), 0 15px 30px rgba(18, 13, 85, .25); }
.shopping-bag::before { position: absolute; content: ''; width: 55px; height: 45px; top: -30px; border: 8px solid #ffcf73; border-bottom: 0; border-radius: 40px 40px 0 0; }
.shopping-bag i { color: rgba(89, 39, 131, .75); font-size: 3.5rem; }
.floating-product { position: absolute; z-index: 2; display: grid; place-items: center; width: 48px; height: 48px; border-radius: 14px; color: #7140bb; background: #fff; box-shadow: 0 10px 20px rgba(22, 15, 83, .25); }
.product-one { top: 50px; right: 17px; transform: rotate(12deg); }.product-two { bottom: 18px; left: 20px; transform: rotate(-13deg); }
.spark { position: absolute; color: #ffd96e; font-size: 1.4rem; }.spark-one { top: 31px; left: 23px; }.spark-two { right: 18px; bottom: 30px; font-size: .9rem; }
.illustration-copy { position: relative; z-index: 1; display: grid; gap: 5px; font-size: .85rem; color: #e8e5ff; }.illustration-copy strong { font: 500 1.45rem Georgia, serif; color: white; }
.login-form-panel { padding: 35px 38px 30px; }.login-heading { margin-bottom: 20px; }.eyebrow { color: #7252cb; font-size: .68rem; font-weight: 800; letter-spacing: .16em; }.login-heading h2 { margin: 7px 0 5px; color: #1b2450; font: 700 2rem Georgia, serif; }.login-heading p { margin: 0; color: #7b829d; font-size: .86rem; }
.error-message { display: flex; gap: 8px; align-items: center; margin-bottom: 14px; padding: 10px 12px; border: 1px solid #f3c5d0; border-radius: 9px; color: #a73e5e; background: #fff4f6; font-size: .78rem; }
.success-message { display: flex; gap: 8px; align-items: center; margin-bottom: 14px; padding: 10px 12px; border: 1px solid #c7dfcc; border-radius: 9px; color: #416f4b; background: #f2f8f3; font-size: .78rem; }
.resend-button { margin: -5px 0 8px; border: 0; color: #15171a; background: transparent; cursor: pointer; font-size: .78rem; font-weight: 800; text-align: left; text-decoration: underline; }.resend-button:disabled { cursor: wait; opacity: .6; }
.login-tabs { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-bottom: 16px; padding: 4px; border-radius: 9px; background: #f0effb; }.login-tabs button { display: flex; align-items: center; justify-content: center; gap: 7px; border: 0; border-radius: 7px; padding: 8px; color: #8589a5; background: transparent; cursor: pointer; font-size: .78rem; font-weight: 700; }.login-tabs button.active { color: #5637ac; background: white; box-shadow: 0 2px 8px rgba(57, 39, 133, .12); }
.login-form { display: grid; gap: 13px; }.field-label { display: grid; gap: 6px; color: #414867; font-size: .76rem; font-weight: 700; }.input-shell { display: flex; align-items: center; gap: 9px; height: 43px; padding: 0 12px; box-sizing: border-box; border: 1px solid #e1e2ef; border-radius: 9px; background: #fbfbfe; transition: border-color .2s, box-shadow .2s, background .2s; }.input-shell:focus-within { border-color: #7954d6; background: white; box-shadow: 0 0 0 3px rgba(121, 84, 214, .12); }.input-shell i { color: #8a7ad0; font-size: .9rem; }.input-shell input { width: 100%; border: 0; outline: 0; background: transparent; color: #1b2450; font: inherit; }.input-shell input::placeholder { color: #a6abc0; }
.sign-in-button { display: flex; align-items: center; justify-content: center; gap: 10px; height: 45px; margin-top: 2px; border: 0; border-radius: 9px; color: white; background: linear-gradient(100deg, #4d37c7, #a04bcc); box-shadow: 0 8px 18px rgba(102, 62, 197, .25); cursor: pointer; font-size: .88rem; font-weight: 800; transition: transform .2s, box-shadow .2s, filter .2s; }.sign-in-button:hover:not(:disabled) { transform: translateY(-2px); filter: brightness(1.06); box-shadow: 0 12px 22px rgba(102, 62, 197, .35); }.sign-in-button:disabled { cursor: wait; opacity: .65; }
.divider { display: flex; align-items: center; gap: 10px; color: #a1a5b8; font-size: .7rem; text-transform: uppercase; letter-spacing: .08em; }.divider::before, .divider::after { flex: 1; height: 1px; content: ''; background: #e8e8f1; }
.social-buttons { display: grid; grid-template-columns: 1fr 1fr; gap: 9px; }.social-buttons button { display: flex; align-items: center; justify-content: center; gap: 8px; height: 39px; border: 1px solid #e2e3ee; border-radius: 8px; color: #454b68; background: white; cursor: pointer; font-size: .78rem; font-weight: 700; transition: background .2s, border-color .2s, transform .2s; }.social-buttons button:hover { transform: translateY(-1px); border-color: #b5a4e8; background: #faf9ff; }.social-buttons img { width: 17px; height: 17px; object-fit: contain; }.signup-text { margin: 2px 0 0; text-align: center; color: #9297ad; font-size: .76rem; }.signup-text a, .back-button { color: #6241bb; font-weight: 800; text-decoration: none; }.signup-text a:hover { text-decoration: underline; }.back-button { border: 0; background: transparent; cursor: pointer; font-size: .76rem; }
@media (max-width: 700px) { .auth-page { min-height: 620px; padding: 20px 12px; }.auth-card { grid-template-columns: 1fr; width: min(100%, 430px); }.login-illustration { min-height: 150px; padding: 17px 20px; }.illustration-art { position: absolute; right: 28px; bottom: -50px; width: 145px; transform: scale(.66); transform-origin: bottom right; }.illustration-copy { max-width: 190px; }.illustration-copy strong { font-size: 1.18rem; }.login-form-panel { padding: 26px 25px 24px; } }
@media (max-width: 390px) { .login-form-panel { padding-inline: 18px; }.login-heading h2 { font-size: 1.75rem; } }

/* Minimal neutral login theme */
.auth-page { background: #f1f3f5; }
.auth-card { border-color: #e1e4e8; border-radius: 18px; box-shadow: 0 18px 45px rgba(20, 25, 32, .12); }
.login-illustration { color: #15171a; background: #eef0f2; }
.illustration-logo { color: #111; }
.illustration-logo img { filter: brightness(0); }
.illustration-copy { color: #626a73; }
.illustration-copy strong { color: #15171a; }
.shopping-bag { background: #d4d8dd; box-shadow: 10px 14px 0 rgba(20, 25, 32, .08), 0 15px 30px rgba(20, 25, 32, .12); }
.shopping-bag::before { border-color: #b9bec5; border-bottom: 0; }
.shopping-bag i, .floating-product { color: #343a40; }
.floating-product { box-shadow: 0 10px 20px rgba(20, 25, 32, .14); }
.spark { color: #69717a; }
.eyebrow { color: #6a7078; }
.login-heading h2 { color: #15171a; }
.login-tabs { background: #f1f2f4; }
.login-tabs button.active { color: #15171a; box-shadow: 0 2px 8px rgba(20, 25, 32, .1); }
.input-shell { border-color: #dfe2e6; background: #fafbfc; }
.input-shell:focus-within { border-color: #555d66; box-shadow: 0 0 0 3px rgba(85, 93, 102, .12); }
.input-shell i { color: #737b84; }
.input-shell input { color: #15171a; }
.sign-in-button { background: #15171a; box-shadow: 0 8px 18px rgba(20, 25, 32, .18); }
.sign-in-button:hover:not(:disabled) { background: #343a40; box-shadow: 0 12px 22px rgba(20, 25, 32, .25); }
.signup-text a, .back-button { color: #15171a; }
</style>