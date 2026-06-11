<script setup>
import { useProductStore } from '@/stores/pinia/productStore';
import { onMounted,ref } from 'vue';
import { useRouter } from 'vue-router';
const router = useRouter();
const productStore = useProductStore();
onMounted(async()=>{
        await productStore.fetchProducts();
});
function handleProductClick(productId){
    router.push({name:'product', params:{id: productId}});
}

</script>
<template>
    <div class="product-container">

        <div class="product" @click="handleProductClick(p.id)" v-for="p in productStore.filteredProducts" :key="p.id">
            <div><img class="product_image" :src="p.image"></div>
             <div>{{ p.title }}</div>
            <div>
               <span>Rs. </span>
               <span>{{ p.price }}</span>
            </div>
            
           <!-- <div></div> -->
        </div>

    </div>
      
 </template>
 <style scoped>
    .product-container{
        display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        margin: 10px;
        gap: 10px;
    }
    .product{
        border: 1px solid #f5f5f5;
        cursor: pointer;
        width: fit-content;

    }
    .product_image{
        height: 200px;
        width: 200px;
        padding: 4px 6px;
        
    }
</style>