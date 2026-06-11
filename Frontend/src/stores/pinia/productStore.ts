
import { number } from "motion-v";
import { defineStore } from "pinia";
import { ref, computed } from 'vue';

export interface product {
    id: number
    title: string
    price: number,
    description: string,
    category: string,
    image: string,
    rating: {
        rate: number,
        count: number
    }
}

export interface CartItem {
    product: product;
    quantity: number;
    selected: false;
    Total_price: number;
}


export const useProductStore = defineStore('products', () => {
    const products = ref<product[]>([]);
    const CartItems = ref<CartItem[]>([]);
    const selectedCategory = ref<string>('All');
    const searchItem = ref<string>('');
    const availableCategories = computed(() => {
        const categories = new Set(products.value.map((p: { category: any; }) => p.category))
        return ['All', ...Array.from(categories)]
    })

    const filteredProducts = computed(() => {
        const query = searchItem.value.trim().toLowerCase()

        return products.value.filter(p =>
            p.title.toLowerCase().includes(query) &&
            (selectedCategory.value === 'All' || p.category === selectedCategory.value)
        )
    })



    async function fetchProducts() {
        const url = 'https://fakestoreapi.com/products';
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Response status: ${response.status}`);
            }
            const result = await response.json();
            console.log(result)
            products.value = result;
        } catch (error) {
            console.error();
        }

    }

    function addToCart(product: product, quantity: number) {
        const existingItem = CartItems.value.find(item => item.product.id === product.id);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            CartItems.value.push({ product, quantity, selected: false, Total_price: 0 });
        }
    }

    return {
        products,
        selectedCategory,
        searchItem,
        filteredProducts,
        fetchProducts,
        availableCategories,
        CartItems,
        addToCart
    }
})
