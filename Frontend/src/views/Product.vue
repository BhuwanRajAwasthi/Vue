<script setup>
import { useProductStore } from '@/stores/pinia/productStore';
import { useAuthStore } from '@/stores/pinia/authStore';
import { ref, onMounted, onBeforeMount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
const route = useRoute();
const router = useRouter();
const productStore = useProductStore();
const authStore = useAuthStore();
const product = ref(null);
const showPreview = ref(false);
const previewImage = ref('');
const product_count = ref(1);
const selectedSize = ref('');
const selectedColor = ref('');
const stockNotice = ref('');
const selectedImage = ref('');
const currentImageIndex = ref(0);
const deliveryDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

const pictureclick = (imageSrc) => {
    previewImage.value = imageSrc;
    showPreview.value = true;
}

const productImages = () => {
    if (product.value?.images?.length && product.value.images.length > 1) {
        return product.value.images;
    }
    const mainImg = product.value?.image || 'https://placehold.co/600x600?text=Product';
    if (mainImg.includes('picsum.photos/seed/')) {
        const baseSeed = mainImg.replace(/\/800\/800$/, '');
        return [
            mainImg,
            `${baseSeed}-angle1/800/800`,
            `${baseSeed}-angle2/800/800`,
            `${baseSeed}-detail/800/800`
        ];
    }
    return [
        mainImg,
        `https://picsum.photos/seed/${product.value?._id || 'prod'}-side/800/800`,
        `https://picsum.photos/seed/${product.value?._id || 'prod'}-back/800/800`,
        `https://picsum.photos/seed/${product.value?._id || 'prod'}-detail/800/800`
    ];
}

const nextImage = () => {
    const images = productImages();
    if (images.length <= 1) return;
    currentImageIndex.value = (currentImageIndex.value + 1) % images.length;
    selectedImage.value = images[currentImageIndex.value];
    if (showPreview.value) {
        previewImage.value = selectedImage.value;
    }
}

const prevImage = () => {
    const images = productImages();
    if (images.length <= 1) return;
    currentImageIndex.value = (currentImageIndex.value - 1 + images.length) % images.length;
    selectedImage.value = images[currentImageIndex.value];
    if (showPreview.value) {
        previewImage.value = selectedImage.value;
    }
}

const selectImageByIndex = (idx) => {
    const images = productImages();
    if (idx >= 0 && idx < images.length) {
        currentImageIndex.value = idx;
        selectedImage.value = images[idx];
    }
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
    const initialImages = productImages();
    currentImageIndex.value = 0;
    selectedImage.value = initialImages[0];
    selectedSize.value = product.value?.sizes?.[0] || '';
    selectedColor.value = product.value?.colors?.[0] || '';
})

const AddToCart = (product, quantity) => {
    if (Number(product.stock || 0) <= 0) {
        stockNotice.value = 'Out of stock';
        return;
    }
    void productStore.addToCart(product, quantity, { size: selectedSize.value, color: selectedColor.value });
}

const BuyNow = (product, quantity) => {
    if (Number(product.stock || 0) <= 0) {
        stockNotice.value = 'Out of stock';
        return;
    }
    void productStore.addToCart(product, quantity, { size: selectedSize.value, color: selectedColor.value });
    router.push('/cart');
}
</script>
<template>
    <div class="product-page" v-if="product">
        <div class="product">
            <div class="image-section">
                <div class="gallery-layout">
                    <!-- Thumbnails column -->
                    <div v-if="productImages().length > 1" class="thumbnail-list" aria-label="Product photos">
                        <button v-for="(image, idx) in productImages()" :key="image" type="button" :class="['thumbnail-button', { active: currentImageIndex === idx }]" @click="selectImageByIndex(idx)">
                            <img :src="image" :alt="`${product.title} view ${idx + 1}`">
                        </button>
                    </div>

                    <!-- Main Viewer with Next / Prev Overlay -->
                    <div class="main-image-container">
                        <button v-if="productImages().length > 1" type="button" class="nav-arrow-btn prev-btn" @click.stop="prevImage" title="Previous photo" aria-label="Previous photo">
                            <i class="pi pi-chevron-left" />
                        </button>

                        <img class="product-image" @click="pictureclick(selectedImage)" :src="selectedImage" :alt="product.title">

                        <button v-if="productImages().length > 1" type="button" class="nav-arrow-btn next-btn" @click.stop="nextImage" title="Next photo" aria-label="Next photo">
                            <i class="pi pi-chevron-right" />
                        </button>

                        <div v-if="productImages().length > 1" class="image-counter-badge">
                            {{ currentImageIndex + 1 }} / {{ productImages().length }}
                        </div>
                    </div>
                </div>

                <div class="gallery-controls-bottom" v-if="productImages().length > 1">
                    <button type="button" class="action-nav-btn" @click="prevImage"><i class="pi pi-arrow-left" /> Previous</button>
                    <span class="click-hint" @click="pictureclick(selectedImage)"><i class="pi pi-search-plus" /> Click to enlarge</span>
                    <button type="button" class="action-nav-btn next-action-btn" @click="nextImage">Next Image <i class="pi pi-arrow-right" /></button>
                </div>
                <span v-else class="click-hint"><i class="pi pi-search-plus" /> Click to enlarge</span>
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
                <div v-if="product.sizes?.length || product.colors?.length" class="product-options">
                    <label v-if="product.sizes?.length">Size <select v-model="selectedSize"><option v-for="size in product.sizes" :key="size" :value="size">{{ size }}</option></select></label>
                    <label v-if="product.colors?.length">Color <select v-model="selectedColor"><option v-for="color in product.colors" :key="color" :value="color">{{ color }}</option></select></label>
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
                    <button class="btn-buy" :disabled="authStore.isAdmin" @click="BuyNow(product, product_count)">{{ authStore.isAdmin ? 'Admin account' : 'Buy Now' }}</button>
                    <button class="btn-cart" :disabled="authStore.isAdmin" @click="AddToCart(product, product_count)">{{ authStore.isAdmin ? 'Shopping disabled' : 'Add to Cart' }}</button>
                </div>
                <div v-if="stockNotice" class="stock-popup" role="alert"><i class="pi pi-times-circle" /> {{ stockNotice }}</div>
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
            <button v-if="productImages().length > 1" type="button" class="modal-nav-btn modal-prev-btn" @click.stop="prevImage" aria-label="Previous image">
                <i class="pi pi-chevron-left" />
            </button>
            <img :src="previewImage" alt="" class="preview-image">
            <button v-if="productImages().length > 1" type="button" class="modal-nav-btn modal-next-btn" @click.stop="nextImage" aria-label="Next image">
                <i class="pi pi-chevron-right" />
            </button>
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

.main-image-container {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-height: 380px;
    background: #ffffff;
    border-radius: 12px;
    overflow: hidden;
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

.nav-arrow-btn {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 42px;
    height: 42px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.92);
    color: #17221d;
    border: 1px solid #d1d5db;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    z-index: 5;
}

.nav-arrow-btn:hover {
    background: #2e6041;
    color: #ffffff;
    border-color: #2e6041;
    transform: translateY(-50%) scale(1.08);
}

.prev-btn {
    left: 12px;
}

.next-btn {
    right: 12px;
}

.image-counter-badge {
    position: absolute;
    bottom: 12px;
    right: 14px;
    background: rgba(23, 34, 29, 0.78);
    color: #ffffff;
    font-size: 0.75rem;
    font-weight: 700;
    padding: 4px 10px;
    border-radius: 999px;
    backdrop-filter: blur(4px);
    pointer-events: none;
    letter-spacing: 0.05em;
}

.gallery-controls-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    margin-top: 14px;
    padding: 0 4px;
}

.action-nav-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #ffffff;
    border: 1px solid #cbd5e1;
    color: #2e6041;
    font-size: 0.82rem;
    font-weight: 700;
    padding: 7px 14px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.action-nav-btn:hover {
    background: #2e6041;
    color: #ffffff;
    border-color: #2e6041;
}

.next-action-btn {
    background: #2e6041;
    color: #ffffff;
    border-color: #2e6041;
}

.next-action-btn:hover {
    background: #244b39;
    border-color: #244b39;
}

.gallery-layout { display: flex; align-items: center; gap: 14px; width: 100%; justify-content: center; }
.thumbnail-list { display: flex; flex-direction: column; gap: 8px; max-height: 350px; overflow-y: auto; }
.thumbnail-button { width: 58px; height: 58px; padding: 4px; border: 1px solid #d7e2d8; border-radius: 7px; background: #fff; cursor: pointer; }
.thumbnail-button.active { border: 2px solid #2e6041; }
.thumbnail-button img { width: 100%; height: 100%; object-fit: cover; border-radius: 4px; }

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
.stock-popup { display: inline-flex; align-items: center; gap: 7px; align-self: flex-start; padding: 9px 12px; border: 1px solid #f2c8c8; border-radius: 8px; color: #b42318; background: #fff5f5; font-size: .82rem; font-weight: 700; animation: stock-popup-in .2s ease-out; }
@keyframes stock-popup-in { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }

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
    z-index: 12;
}

.modal-nav-btn {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.9);
    color: #17221d;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
    z-index: 12;
    transition: all 0.2s ease;
}

.modal-nav-btn:hover {
    background: #2e6041;
    color: #ffffff;
    transform: translateY(-50%) scale(1.08);
}

.modal-prev-btn {
    left: 12px;
}

.modal-next-btn {
    right: 12px;
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
    .gallery-layout { align-items: flex-start; flex-direction: column-reverse; }
    .thumbnail-list { flex-direction: row; max-width: 100%; max-height: none; overflow-x: auto; }
    .description {
        padding: 20px;
    }
    .buy-add {
        flex-direction: column;
    }
}
</style>