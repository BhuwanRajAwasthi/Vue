<script setup lang="ts">
import Navbar from './views/Navbar.vue';

</script>
<template>
      <navbar />
      <router-view v-slot="{ Component }" :key="$route.path">
            <keep-alive>
                  <component :is="Component" />
            </keep-alive>
      </router-view>
</template>

<style></style>
