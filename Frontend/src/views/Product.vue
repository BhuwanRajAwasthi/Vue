<script setup>
import { useProductStore } from '@/stores/pinia/productStore';
import { ref, onMounted, onBeforeMount } from 'vue';
import { useRoute } from 'vue-router';
const route = useRoute();
const productStore = useProductStore();
const product = ref(null);
const showPreview = ref(false);
const previewImage = ref('');
const product_count = ref(1);

const pictureclick = (imageSrc) => {
    previewImage.value = imageSrc;
    showPreview.value = true;

}
const closePreview = () => {
    showPreview.value = false;
    previewImage.value = '';
}
onMounted(async () => {
    const productId = parseInt(route.params.id);
    if (productStore.products.length === 0) {
        await productStore.fetchProducts();
    }
    product.value = productStore.products.find(p => p.id == productId);
})
const AddToCart = (product, quantity) => {
    productStore.addToCart(product, quantity);
    alert('Added to cart!');
}

</script>
<template>
    <div v-if="product" class="product">
        <div>
            <img class="product-image" @click="pictureclick(product.image)" :src="product.image" alt="product.title">
        </div>
        <div class="product_info">
            <div style="font-size: 30px; font-weight: bold; padding: 4px 10px; margin: 4px;">
                {{ product.title }}
            </div>
            <div><span>Rs.</span><span style="color: orange;">{{ product.price }}</span></div>
            <div><span>rating: </span><span>{{ product.rating.rate }}</span></div>
            <div class="quantity-wrap">
                <span>Quantity</span>
                <button style="padding: 4px 10px; border: none; cursor: pointer;" :disabled="product_count == 0"
                    @click="product_count--">-</button>
                <span>{{ product_count }}</span>
                <button style="padding: 4px 10px; border: none; cursor: pointer;" :disabled="product_count == 5"
                    @click="product_count++">+</button>
            </div>
            <div class="buy-add">
                <button>Buy Now</button>
                <button @click="AddToCart(product, product_count)">Add to Cart</button>
            </div>
        </div>

    </div>
    <div v-else>
        Loading product...
    </div>
    <div v-if="product">
        <div class="description">
            <h3>Description:</h3>
            <p>
                {{ product.description }}
            </p>
        </div>
    </div>
    <div v-if="showPreview" class="preview-modal">
        <div class="preview-content" @click.stop>
            <img :src="previewImage" alt="" class="preview-image">
            <button @click="closePreview" class="close-btn">*</button>
        </div>
    </div>
</template>
<style scoped>
.buy-add {
    gap: 10px;

}

.product_info {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.product {
    width: 100%;
    margin: 10px;
    border: 2px solid #f5f5f5;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
}

.quantity-wrap {
    display: flex;
    gap: 5px;
    align-items: center;
}

.product-image {
    height: 450px;

}

.preview-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.preview-content {
    position: relative;
    max-width: 90%;
    max-height: 90%;

}

.preview-image {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
}

.close-btn {
    font-size: 50px;
    position: absolute;
    top: -10px;
    right: -10px;
    background: white;
    border: none;
    border-radius: 50%;
    width: 30px;
    height: 30px;
    cursor: pointer;
    display: flex;
    align-items: cen;
    justify-content: center;
}
</style>