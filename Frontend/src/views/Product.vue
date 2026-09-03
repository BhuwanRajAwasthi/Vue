<script setup>
import { useProductStore } from '@/stores/pinia/productStore';
import { ref, onMounted, onBeforeMount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
const route = useRoute();
const router = useRouter();
const productStore = useProductStore();
const product = ref(null);
const showPreview = ref(false);
const previewImage = ref('');
const product_count = ref(1);
const deliveryDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

const pictureclick = (imageSrc) => {
    previewImage.value = imageSrc;
    showPreview.value = true;

}
const closePreview = () => {
    showPreview.value = false;
    previewImage.value = '';
}
onMounted(async () => {
    const productId = String(route.params.id);
    if (productStore.products.length === 0) {
        await productStore.fetchProducts();
    }
    product.value = productStore.products.find(p => String(p._id || p.id) === productId);
    if (!product.value) {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/products/${productId}`);
            if (res.ok) {
                product.value = await res.json();
            }
        } catch (error) {
            console.error('Failed to load product details', error);
        }
    }
})
const AddToCart = (product, quantity) => {
    productStore.addToCart(product, quantity);
}
const BuyNow = (product, quantity) => {
    productStore.addToCart(product, quantity);
    router.push('/cart');
}

</script>
<template>
    <div class="product-page" v-if="product">
        <div class="product">
            <div class="image-section">
                <img class="product-image" @click="pictureclick(product.image || 'https://placehold.co/600x600?text=Product')" :src="product.image || 'https://placehold.co/600x600?text=Product'" :alt="product.title">
                <span class="click-hint"><i class="pi pi-search-plus" /> Click to enlarge</span>
            </div>
            <div class="product_info">
                <span class="category-pill">{{ product.category }}</span>
                <h1 class="product-title">{{ product.title }}</h1>
                <div class="price-row">
                    <span class="currency">Rs.</span>
                    <span class="amount">{{ product.price.toLocaleString() }}</span>
                </div>
                <div class="stock-info">
                    <span>Availability: </span>
                    <strong :class="product.stock > 0 ? 'in-stock' : 'out-of-stock'">
                        {{ product.stock > 0 ? `In Stock (${product.stock} available)` : 'Out of Stock' }}
                    </strong>
                </div>
                <div class="delivery-info">
                    <i class="pi pi-truck" />
                    <div>
                        <strong>Estimated Delivery by {{ deliveryDate }}</strong>
                        <small>Free doorstep delivery on every order</small>
                    </div>
                </div>
                <div class="cod-info">
                    <i class="pi pi-wallet" />
                    <div>
                        <strong>Cash on Delivery Available</strong>
                        <small>Pay safely with cash or QR code when package arrives</small>
                    </div>
                </div>
                <div class="quantity-wrap">
                    <span>Quantity</span>
                    <div class="quantity-stepper">
                        <button type="button" :disabled="product_count <= 1" @click="product_count--">-</button>
                        <span>{{ product_count }}</span>
                        <button type="button" :disabled="product_count >= Math.min(10, product.stock || 5)" @click="product_count++">+</button>
                    </div>
                </div>
                <div class="buy-add">
                    <button class="btn-buy" @click="BuyNow(product, product_count)">Buy Now</button>
                    <button class="btn-cart" @click="AddToCart(product, product_count)">Add to Cart</button>
                </div>
            </div>
        </div>

        <div class="description">
            <h3>Description:</h3>
            <p>
                {{ product.description }}
            </p>
        </div>
    </div>
    <div v-else class="loading-wrap">
        <div class="loading-spinner"></div>
        <p>Loading product details...</p>
    </div>

    <div v-if="showPreview" class="preview-modal" @click="closePreview">
        <div class="preview-content" @click.stop>
            <img :src="previewImage" alt="" class="preview-image">
            <button @click="closePreview" class="close-btn" aria-label="Close image preview">×</button>
        </div>
    </div>
</template>

<style scoped>
.product-page {
    max-width: 1140px;
    margin: 30px auto 60px;
    padding: 0 20px;
}

.loading-wrap {
    min-height: 50vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #55705d;
    gap: 16px;
    font-size: 1.1rem;
}

.loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #e2e8f0;
    border-top-color: #2e6041;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

.product {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    display: flex;
    align-items: center;
    gap: 48px;
    padding: 36px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
}

.image-section {
    flex: 0 0 420px;
    display: flex;
    flex-direction: column;
    align-items: center;
    background: #f8faf7;
    border-radius: 12px;
    padding: 24px;
    border: 1px solid #edf2ec;
}

.product-image {
    max-width: 100%;
    max-height: 380px;
    object-fit: contain;
    cursor: zoom-in;
    transition: transform 0.25s ease;
}

.product-image:hover {
    transform: scale(1.03);
}

.click-hint {
    margin-top: 12px;
    font-size: 0.78rem;
    color: #64748b;
    display: flex;
    align-items: center;
    gap: 6px;
}

.product_info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.category-pill {
    align-self: flex-start;
    background: #eef5ee;
    color: #2e6041;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 4px 10px;
    border-radius: 6px;
}

.product-title {
    font-family: Georgia, serif;
    font-size: 1.85rem;
    font-weight: 700;
    color: #17221d;
    line-height: 1.3;
    margin: 0;
    word-break: break-word;
    overflow-wrap: anywhere;
}

.price-row {
    display: flex;
    align-items: baseline;
    gap: 6px;
    margin-top: 4px;
}

.currency {
    font-size: 1.2rem;
    font-weight: 600;
    color: #17221d;
}

.amount {
    font-size: 2rem;
    font-weight: 800;
    color: #e58b10;
}

.stock-info {
    font-size: 0.92rem;
    color: #64748b;
}

.in-stock {
    color: #15803d;
}

.out-of-stock {
    color: #b91c1c;
}

.delivery-info, .cod-info {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    padding: 12px 14px;
    background: #f4f8f3;
    border: 1px solid #e1eee0;
    border-radius: 8px;
    color: #244b39;
    font-size: 0.9rem;
}

.delivery-info i, .cod-info i {
    font-size: 1.25rem;
    color: #2e6041;
    margin-top: 2px;
}

.delivery-info small, .cod-info small {
    display: block;
    color: #5b7363;
    font-size: 0.78rem;
    margin-top: 2px;
}

.quantity-wrap {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-top: 6px;
    font-weight: 600;
    font-size: 0.95rem;
    color: #374151;
}

.quantity-stepper {
    display: inline-flex;
    align-items: center;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    overflow: hidden;
    background: #f9fafb;
}

.quantity-stepper button {
    padding: 6px 14px;
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 1.1rem;
    font-weight: bold;
    color: #374151;
    transition: background 0.15s ease;
}

.quantity-stepper button:hover:not(:disabled) {
    background: #e5e7eb;
}

.quantity-stepper button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

.quantity-stepper span {
    padding: 0 12px;
    min-width: 24px;
    text-align: center;
    font-weight: 700;
}

.buy-add {
    display: flex;
    gap: 14px;
    margin-top: 10px;
}

.btn-buy, .btn-cart {
    flex: 1;
    padding: 13px 20px;
    border-radius: 8px;
    font-size: 0.95rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid transparent;
}

.btn-buy {
    background: #e58b10;
    color: #ffffff;
}

.btn-buy:hover {
    background: #ca7607;
}

.btn-cart {
    background: #2e6041;
    color: #ffffff;
}

.btn-cart:hover {
    background: #244b39;
}

.description {
    margin-top: 28px;
    padding: 28px 32px;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
}

.description h3 {
    font-family: Georgia, serif;
    font-size: 1.35rem;
    font-weight: 700;
    color: #17221d;
    margin: 0 0 14px 0;
    padding-bottom: 10px;
    border-bottom: 1px solid #edf2f7;
}

.description p {
    color: #4b5563;
    font-size: 1.02rem;
    line-height: 1.8;
    white-space: pre-wrap;       /* Makes long description wrap onto another line & preserves formatting */
    word-break: break-word;      /* Breaks long words onto a new line */
    overflow-wrap: anywhere;     /* Ensures no horizontal overflow */
    margin: 0;
}

.preview-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(4px);
}

.preview-content {
    position: relative;
    max-width: 90vw;
    max-height: 90vh;
    display: flex;
    align-items: center;
    justify-content: center;
}

.preview-image {
    max-width: 100%;
    max-height: 85vh;
    object-fit: contain;
    border-radius: 8px;
}

.close-btn {
    font-size: 28px;
    position: absolute;
    top: -16px;
    right: -16px;
    background: white;
    border: none;
    border-radius: 50%;
    width: 36px;
    height: 36px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    color: #1a202c;
}

@media (max-width: 820px) {
    .product {
        flex-direction: column;
        align-items: stretch;
        gap: 24px;
        padding: 20px;
    }
    .image-section {
        flex: none;
        width: 100%;
    }
    .product-image {
        max-height: 280px;
    }
    .description {
        padding: 20px;
    }
    .buy-add {
        flex-direction: column;
    }
}
</style>