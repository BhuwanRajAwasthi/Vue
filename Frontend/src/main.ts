import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

import PrimeVue from 'primevue/config';
import Aura from '@primeuix/themes/aura';
import { Button } from 'primevue';
import 'primeicons/primeicons.css'
const app = createApp(App);
app.use(router);
app.use(PrimeVue);
app.use(PrimeVue, {
    theme: {
        preset: Aura
    }
});
app.use(createPinia());
app.mount('#app');

