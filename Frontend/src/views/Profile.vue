<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/pinia/authStore'

const router = useRouter()
const auth = useAuthStore()
const form = ref({ name: '', phone: '', address: '', city: '', postalCode: '', avatar: '', preferredPayment: 'cash_on_delivery' })
const message = ref('')
const error = ref('')
const saving = ref(false)

watch(() => auth.user, user => {
  if (user) form.value = { name: user.name || '', phone: user.phone || '', address: user.address || '', city: user.city || '', postalCode: user.postalCode || '', avatar: user.avatar || '', preferredPayment: user.preferredPayment || 'cash_on_delivery' }
}, { immediate: true })

async function uploadAvatar(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  const data = new FormData(); data.append('avatar', file)
  try {
    const base = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
    const response = await fetch(`${base}/auth/me/avatar`, { method: 'POST', headers: { Authorization: `Bearer ${auth.token}` }, body: data })
    if (!response.ok) throw new Error('Profile image upload failed')
    const result = await response.json(); auth.user = result.user; form.value.avatar = result.user.avatar; message.value = 'Profile picture uploaded.'
  } catch (err) { error.value = err instanceof Error ? err.message : 'Profile image upload failed' }
}
async function saveProfile() {
  saving.value = true; message.value = ''; error.value = ''
  try { await auth.updateProfile(form.value); message.value = 'Profile saved.' }
  catch (err) { error.value = err instanceof Error ? err.message : 'Unable to save profile' }
  finally { saving.value = false }
}
function logout() { if (window.confirm('Are you sure you want to log out?')) { auth.logout(); router.push('/') } }
</script>
<template>
  <main v-if="auth.isLoggedIn" class="profile-page">
    <section class="profile-card">
      <div class="profile-heading"><div><p class="kicker">ACCOUNT</p><h1>Your profile</h1><p>Keep your delivery details ready for checkout.</p></div><img v-if="form.avatar" :src="form.avatar" alt="Profile picture" class="profile-image"><span v-else class="profile-placeholder">{{ (form.name || 'U').charAt(0).toUpperCase() }}</span></div>
      <form @submit.prevent="saveProfile">
        <label>Profile picture<input type="file" accept="image/png,image/jpeg,image/webp" @change="uploadAvatar" /><input v-model="form.avatar" type="url" placeholder="Or paste an image URL" /></label>
        <label>Full name<input v-model="form.name" required /></label>
        <label>Email<input :value="auth.user?.email" disabled /></label>
        <label>Phone<input v-model="form.phone" required /></label>
        <label>Street address<input v-model="form.address" required /></label>
        <div class="split"><label>City<input v-model="form.city" required /></label><label>Postal code<input v-model="form.postalCode" required /></label></div>
        <label>Preferred payment<select v-model="form.preferredPayment"><option value="cash_on_delivery">Cash on Delivery</option><option value="esewa">eSewa</option></select></label>
        <p v-if="message" class="success">{{ message }}</p><p v-if="error" class="error">{{ error }}</p>
        <button class="primary-button" :disabled="saving">{{ saving ? 'Saving...' : 'Save profile' }}</button>
      </form>
      <button class="logout-button" @click="logout">Log out</button>
    </section>
  </main>
  <main v-else class="profile-page"><h1>Sign in to view your profile</h1><button class="primary-button" @click="router.push('/login')">Sign in</button></main>
</template>
<style scoped>
.profile-page{max-width:760px;margin:auto;padding:48px 24px;color:#17221d}.profile-card{background:#fff;border:1px solid #dfe7dc;padding:32px;box-shadow:0 12px 30px #29413212}.profile-heading{display:flex;justify-content:space-between;align-items:center;margin-bottom:28px}.kicker{color:#a17b31;font-size:.7rem;font-weight:800;letter-spacing:.16em}.profile-heading h1{font:500 2.8rem Georgia,serif;margin:0 0 8px}.profile-heading p:not(.kicker){color:#718172}.profile-image,.profile-placeholder{width:82px;height:82px;border-radius:50%;object-fit:cover}.profile-placeholder{display:grid;place-items:center;background:#2e6041;color:#fff;font-size:2rem}.profile-card form{display:grid;gap:16px}.profile-card label{display:grid;gap:6px;font-size:.85rem;font-weight:700}.profile-card input{padding:12px;border:1px solid #cbd8ca;border-radius:5px;font:inherit}.profile-card input:disabled{background:#f1f4ed}.split{display:grid;grid-template-columns:1fr 1fr;gap:16px}.primary-button,.logout-button{border:0;padding:12px 18px;font-weight:700;cursor:pointer}.primary-button{background:#2e6041;color:#fff}.logout-button{margin-top:20px;background:#fbe8e3;color:#a54e3b}.success{color:#28613b}.error{color:#a54e3b}@media(max-width:600px){.profile-card{padding:20px}.split{grid-template-columns:1fr}.profile-heading h1{font-size:2.2rem}}
</style>
