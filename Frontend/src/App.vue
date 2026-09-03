<script setup lang="ts">
import Navbar from './views/Navbar.vue';
import Footer from './views/Footer.vue';
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/pinia/authStore'
import { useProductStore } from '@/stores/pinia/productStore'

const authStore = useAuthStore()
const productStore = useProductStore()

onMounted(() => {
      authStore.fetchMe().then(() => productStore.loadCart().catch(() => undefined))
})

</script>
<template>
      <Navbar />
      <router-view v-slot="{ Component }" :key="$route.path">
            <component :is="Component" />
      </router-view>
      <Footer />
</template>
<style></style>
