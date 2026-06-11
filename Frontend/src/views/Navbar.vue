<script setup>
import { ref, watch } from 'vue';
import { useProductStore } from '@/stores/pinia/productStore';
import { useRouter } from 'vue-router';
const router = useRouter();
const InputSearch = ref('');
function Search_related(){
  if(InputSearch.value.trim()){
  useProductStore().searchItem = InputSearch.value;
  console.log(useProductStore().searchItem);
  }
}

// watch(useProductStore().searchItem,()=>{

// })
//  import {Icon} from 'primevue';
function OpenCart() {
  router.push('/Cart')
}
</script>
<template>
  <header>
    <nav>
      <router-link class="custom-router-link" [routerLinkActiveOptions]="{exact: true}" to="/">MegaMart</router-link>
      <div class="search-wrap"><i @click="Search_related" style="position: absolute; top: 12px; right: 20px;" class="pi pi-search"></i>
        <input @keyup.enter="Search_related"
          class="search_input" v-model="InputSearch" type="text" placeholder="Search..."></div>
      <div class="header-right">
        <span>sign in /sign up</span>
        <router-link to="/Cart">
          <div class="cart-view"><i class="pi pi-shopping-cart"></i> <span>Cart</span></div>
        </router-link>
      </div>

    </nav>
  </header>
</template>
<style>
nav {
  display: flex;
  align-content: center;
  gap: 20px;
  padding: 10px 10px;
  justify-content: space-around;
}

.cart-view {
  cursor: pointer;
}

.search-wrap {
  position: relative;
}

.search_input {
  padding-left: 30px;
  width: 50vw;
  box-sizing: border-box;
  min-width: 100px;
  height: 40px;
  outline: none;
  border-radius: 10px;
  background-color: rgba(243, 249, 251);
}

.custom-router-link {
  color: rgba(95, 95, 215, 0.868);
  text-decoration: none;
  font-size: 24px;
  font-weight: bold;
  padding: 4px 10px;
}

.search_input::placeholder {
  padding: 2px 8px;
}

.header-right {
  display: flex;
  gap: 20px;
  padding: 0px 20px;
}
</style>