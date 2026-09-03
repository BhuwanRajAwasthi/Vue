import { createRouter, createWebHistory, type RouteLocation } from 'vue-router'
import Home from './views/Home.vue';
import Product from './views/Product.vue';
import Cart from './views/Cart.vue';
import Login from './views/Login.vue';
import Register from './views/Register.vue';
import Admin from './views/Admin.vue';
import Profile from './views/Profile.vue';
import Orders from './views/Orders.vue';

const routes = [
  { path: '/', name: 'home', component: Home },
  { path: '/product/:id', name: 'product', component: Product },
  { path: '/cart', name: 'cart', component: Cart },
  { path: '/login', name: 'login', component: Login },
  { path: '/register', name: 'register', component: Register },
  { path: '/admin', name: 'admin', component: Admin },
  { path: '/profile', name: 'profile', component: Profile },
  { path: '/orders', name: 'orders', component: Orders },

  { path: '/Admin', redirect: '/admin' },
  { path: '/Login', redirect: '/login' },
  { path: '/Register', redirect: '/register' },
  { path: '/Cart', redirect: '/cart' },
  { path: '/Product/:id', redirect: (to: RouteLocation) => ({ name: 'product', params: { id: to.params.id } }) }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router