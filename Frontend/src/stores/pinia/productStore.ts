
import { defineStore } from "pinia";
import { ref, computed, watch } from 'vue';

export interface product {
    _id?: string
    id?: string | number
    title: string
    price: number,
    description: string,
    category: string,
    image: string,
    images?: string[]
    sizes?: string[]
    colors?: string[]
       gender?: 'men' | 'women' | 'unisex',
    stock?: number,
    rating?: {
        rate: number,
        count: number
    }
}

export interface CartItem {
    product: product;
    quantity: number;
    selected: boolean;
    selectedSize?: string;
    selectedColor?: string;
}


export const useProductStore = defineStore('products', () => {
    const products = ref<product[]>([]);
    const CartItems = ref<CartItem[]>([]);
    const cartCount = computed(() => CartItems.value.reduce((sum, item) => sum + item.quantity, 0));
    const cartTotal = computed(() => CartItems.value.reduce((sum, item) => sum + item.product.price * item.quantity, 0));
    const selectedCategory = ref<string>('All');
    const selectedGender = ref<string>('all');
    const searchItem = ref<string>('');
    const searchDraft = ref<string>('');
    const isSearching = ref(false);
    const minPrice = ref<number | null>(null);
    const maxPrice = ref<number | null>(null);
    const availableCategories = computed(() => {
        const categories = new Set(products.value.map((p: { category: any; }) => p.category))
        return ['All', ...Array.from(categories)]
    })

    const filteredProducts = computed(() => {
        const query = searchItem.value.trim().toLowerCase()

        return products.value.filter(p =>
            (!query || p.title.toLowerCase().includes(query) || String(p.category || '').toLowerCase().includes(query)) &&
            (selectedCategory.value === 'All' || p.category === selectedCategory.value) &&
               (selectedGender.value === 'all' || (p.gender || 'unisex') === selectedGender.value) &&
            (minPrice.value === null || p.price >= minPrice.value) &&
            (maxPrice.value === null || p.price <= maxPrice.value)
        )
    })

    let searchTimer: ReturnType<typeof setTimeout> | undefined;
    watch(searchDraft, (value) => {
        isSearching.value = true;
        if (searchTimer) clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
            searchItem.value = value;
            isSearching.value = false;
        }, 1200);
    });



    async function fetchProducts() {
        const base = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
        const url = `${base}/products`;
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Response status: ${response.status}`);
            }
            const result = await response.json();
            products.value = result;
        } catch (error) {
            console.error(error);
        }

    }

    async function addToCart(product: product, quantity: number, options: { size?: string; color?: string } = {}) {
        if (Number(product.stock || 0) <= 0) return false;
        const authStore = await import('./authStore').then(m => m.useAuthStore) ;
        const auth = authStore();
        if (!auth.token || auth.isAdmin) return false;
        const productId = (product as any)._id || product.id;
        const existingItem = CartItems.value.find(item =>
            ((item.product as any)._id === productId || item.product.id === productId) &&
            item.selectedSize === options.size && item.selectedColor === options.color
        );
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            CartItems.value.push({ product, quantity, selected: true, selectedSize: options.size, selectedColor: options.color });
        }
        await saveCart();
        return true;
        }

    async function saveCart() {
        const authStore = await import('./authStore').then(m => m.useAuthStore) ;
        const auth = authStore();
        if (!auth.token) return;
        const base = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
        await fetch(`${base}/cart`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.token}` },
            body: JSON.stringify({ items: CartItems.value.map(item => ({ product: (item.product as any)._id || item.product.id, quantity: item.quantity, selected: item.selected, selectedSize: item.selectedSize, selectedColor: item.selectedColor })) })
        });
    }

    async function loadCart() {
        const authStore = await import('./authStore').then(m => m.useAuthStore) ;
        const auth = authStore();
        if (!auth.token) { CartItems.value = []; return; }
        const base = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
        const response = await fetch(`${base}/cart`, { headers: { Authorization: `Bearer ${auth.token}` } });
        if (!response.ok) throw new Error('Unable to load cart');
        CartItems.value = await response.json();
    }

    function clearCart() {
        CartItems.value = [];
        void saveCart();
    }

    async function removePurchasedItems() {
        const purchasedIds = new Set(CartItems.value.filter(item => item.selected).map(item => (item.product as any)._id || item.product.id));
        CartItems.value = CartItems.value.filter(item => !purchasedIds.has((item.product as any)._id || item.product.id));
        await saveCart();
    }

    async function checkout(shippingAddress: any, payment: any) {
        const base = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
        const url = `${base}/orders`;
        // build items array
        const items = CartItems.value.filter(i => i.selected).map(i => ({ product: (i.product as any)._id || (i.product as any).id, quantity: i.quantity, selectedSize: i.selectedSize, selectedColor: i.selectedColor }));
        // auth token from auth store
        try {
            const authStore = await import('./authStore').then(m => m.useAuthStore) ;
            const store = authStore();
            const token = store.token;
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ items, shippingAddress, payment })
            });
            if (!res.ok) throw new Error('Checkout failed');
            const result = await res.json();
            return result;
        } catch (err) {
            throw err;
        }
    }

    return {
        products,
        selectedCategory,
        selectedGender,
        searchItem,
        searchDraft,
        isSearching,
        minPrice,
        maxPrice,
        filteredProducts,
        fetchProducts,
        availableCategories,
        CartItems,
        addToCart,
        saveCart,
        loadCart,
        clearCart,
        removePurchasedItems,
        checkout,
        cartCount,
        cartTotal
    }
})
