<script setup>
import { useProductStore } from '@/stores/pinia/productStore';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/pinia/authStore';
const router = useRouter();
const productStore = useProductStore();
const authStore = useAuthStore();
function Search_related(){
  router.push('/');
}

// watch(useProductStore().searchItem,()=>{

// })
//  import {Icon} from 'primevue';
function logout() { if (window.confirm('Are you sure you want to log out?')) { authStore.logout(); router.push('/') } }
</script>
<template>
  <header class="site-header">
    <nav>
      <router-link class="brand" to="/"><span>NepKart</span></router-link>
      <div class="search-wrap"><i @click="Search_related" class="pi pi-search search-icon"></i>
        <input @keyup.enter="Search_related" class="search_input" v-model="productStore.searchItem" type="search" placeholder="Search the collection..."></div>
      <div class="header-right">
        <router-link v-if="authStore.isAdmin" class="nav-link" to="/admin"><i class="pi pi-chart-bar"></i><span>Admin</span></router-link>
        <div v-if="authStore.isLoggedIn" class="account">
          <img v-if="authStore.user?.avatar" :src="authStore.user?.avatar" class="avatar avatar-img" alt="User avatar" />
          <span v-else class="avatar">{{ (authStore.user?.name || authStore.user?.email || 'U').charAt(0).toUpperCase() }}</span>
          <router-link class="account-name profile-link" to="/profile">{{ authStore.user?.name || 'Account' }}</router-link>
          <router-link class="nav-link" to="/orders"><i class="pi pi-list"></i><span>Orders</span></router-link>
          <button class="logout" @click="logout">Log out</button>
        </div>
        <router-link v-else class="nav-link" to="/login"><i class="pi pi-user"></i><span>Sign in</span></router-link>
        <router-link class="nav-link cart-view" to="/cart"><i class="pi pi-shopping-bag"></i><span>Bag</span><b>{{ productStore.cartCount }}</b></router-link>
      </div>

    </nav>
  </header>
</template>
<style>
.site-header { background: #fbfaf4; border-bottom: 1px solid #dfe7dc; position: sticky; top: 0; z-index: 10; }
nav {
  display: flex;
  align-content: center;
  gap: 20px;
  padding: 10px 10px;
  justify-content: space-between;
  max-width: 1280px; margin: auto; align-items: center;
}

.cart-view {
  cursor: pointer;
}

.brand { display: flex; align-items: center; gap: 8px; color: #17221d; text-decoration: none; font: 700 1.35rem Georgia, serif; white-space: nowrap; }
.brand img { width: 42px; height: 42px; object-fit: contain; }
.search-wrap {
  position: relative;
}

.search_input {
  padding-left: 30px;
  width: min(48vw, 540px);
  box-sizing: border-box;
  min-width: 100px;
  height: 42px; outline: none; border: 1px solid #ced9ce; border-radius: 5px; background: white;
}
.search-icon { position: absolute; top: 13px; right: 15px; color: #55705d; cursor: pointer;
}

.search_input::placeholder {
  padding: 2px 8px;
}

.header-right {
  display: flex; gap: 16px; align-items: center;
}
.nav-link, .logout { color: #294132; text-decoration: none; font: 600 .88rem inherit; display: flex; align-items: center; gap: 6px; background: none; border: 0; cursor: pointer; }
.nav-link b { background: #e8a928; color: #17221d; border-radius: 50%; min-width: 19px; height: 19px; text-align: center; font-size: .7rem; line-height: 19px; }
.account { display: flex; align-items: center; gap: 7px; }
.avatar { width: 29px; height: 29px; border-radius: 50%; display: grid; place-items: center; background: #2e6041; color: white; }
.avatar-img { object-fit: cover; }
.account-name { max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.logout { color: #a54e3b; font-size: .78rem; }
@media (max-width: 760px) { nav { flex-wrap: wrap; padding: 10px 16px; } .search-wrap { order: 3; width: 100%; } .account-name, .logout { display: none; } .header-right { margin-left: auto; gap: 10px; } .nav-link span { display: none; } }
</style>