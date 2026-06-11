import { createRouter, createWebHistory } from 'vue-router'
import Home from './views/Home.vue';
import Product from './views/Product.vue';
import Cart from './views/Cart.vue';

const routes = [
  { path: '/', component: Home },
  {name:'product', path: '/Product/:id',component:Product},
  {name: 'cart',path:'/Cart',component: Cart}
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router