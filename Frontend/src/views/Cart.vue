<script setup>
    import { useProductStore } from '@/stores/pinia/productStore';
    import { computed, onMounted } from 'vue';
    const productStore = useProductStore();
    const CartItem = productStore.CartItems;
    const Total = computed(()=>{
        return CartItem.filter(i=>i.selected==true).reduce((sum,item)=>sum+item.price,0);
    })
    const price_total =(p,quantity)=>{
        return p*quantity;
    }
    

</script>
<template>
        <div style="display: flex;align-items: center; justify-content: center;" v-if="CartItem.length>0 ">
                <div v-for="p in CartItem" style="display: flex; padding: 10px 20px;  flex-direction: row; gap: 10px; width: fit-content; border: 2px solid #f5f5f5; align-items: center; justify-content: center;"  :key="p.product.id">
                    <input type="checkbox" v-model="p.selected">
                    <img :src="p.product.image" height="150px" width="150px" alt="">
                    <div>
                    <div><h4>{{ p.product.title }}</h4></div>
                    <div style=" display: flex; gap: 20px;"><button class="quantity-btn" :disabled="p.quantity==1" @click="p.quantity--">-</button >{{ p.quantity }}<button class="quantity-btn" @click="p.quantity++">+</button></div>
                    <div><span>Rs.{{ price_total(p.product.price,p.quantity) }}</span></div>
                    </div>
                </div>

        </div>
        <div v-else style="display: flex; justify-content: center; align-items: center; height: 100vh;">
            <span>You  have nothing in the Cart.</span>
        </div>
        <aside class="checkout" >
            <div style="display: flex; flex-direction: column; padding: 20px 20px; gap: 20px;">
                <span class="">Total: Rs.{{ Total }}</span>
                <button style="width: 200px; padding: 6px 10px; border-radius: 10px; background-color: yellow;">Checkout</button>
            </div>
        </aside>
</template>
<style>
    .quantity-btn{
        width: 50px;
        padding: 4px 10px;
        border: none;
    }
    .checkout{
            position: fixed;
            top: 200px;
            right: 100px;
            background-color: aquamarine;
            border: 1px solid;
            border-radius: 4px;
    }
</style>