<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/pinia/authStore'
import { useProductStore } from '@/stores/pinia/productStore'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const productStore = useProductStore()
const orders = ref<any[]>([])
const loading = ref(true)
const error = ref('')
const selectedStatus = ref('all')
const statuses = ['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled']

const successBanner = computed(() => {
  if (route.query.payment === 'success') {
    return 'eSewa payment verified! Your order has been placed and is being prepared.'
  }
  if (route.query.placed === 'true') {
    return 'Order placed successfully! Thank you for shopping with NepKart.'
  }
  return ''
})

const failureBanner = computed(() => {
  if (route.query.payment === 'failed') {
    return 'eSewa payment was not completed. If you wish to complete your purchase, please try again or select Cash on Delivery.'
  }
  return ''
})

const visibleOrders = computed(() =>
  selectedStatus.value === 'all'
    ? orders.value
    : orders.value.filter(order => order.status === selectedStatus.value)
)

function getDeliveryEstimate(dateString: string) {
  const d = new Date(dateString || Date.now())
  const est = new Date(d.getTime() + 3 * 24 * 60 * 60 * 1000)
  return est.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

onMounted(async () => {
  if (!auth.isLoggedIn) {
    router.push('/login')
    return
  }
  try {
    const base = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
    const response = await fetch(`${base}/orders`, { headers: { Authorization: `Bearer ${auth.token}` } })
    if (!response.ok) throw new Error('Unable to load orders')
    orders.value = await response.json()

    // Sync cart state if returning from checkout
    if (route.query.payment === 'success' || route.query.placed === 'true') {
      await productStore.loadCart()
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unable to load orders'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <main class="orders-page">
    <div class="orders-header">
      <div>
        <p class="kicker">ACCOUNT</p>
        <h1>Your orders</h1>
        <p class="intro">Track every NepKart purchase from confirmation to delivery.</p>
      </div>
      <router-link class="shop-link" to="/">Continue shopping <i class="pi pi-arrow-right" /></router-link>
    </div>

    <!-- Alert Banners -->
    <div v-if="successBanner" class="alert-banner success-banner" role="status">
      <i class="pi pi-check-circle" />
      <div>
        <strong>Order Confirmed!</strong>
        <p>{{ successBanner }}</p>
      </div>
    </div>

    <div v-if="failureBanner" class="alert-banner failure-banner" role="alert">
      <i class="pi pi-exclamation-circle" />
      <div>
        <strong>Payment Alert</strong>
        <p>{{ failureBanner }}</p>
      </div>
    </div>

    <p v-if="loading" class="state-message">Loading orders...</p>
    <p v-else-if="error" class="state-message error">{{ error }}</p>

    <div v-else-if="orders.length" class="status-filter" aria-label="Filter orders by status">
      <button v-for="status in statuses" :key="status" type="button" :class="{ active: selectedStatus === status }" @click="selectedStatus = status">
        {{ status }}
      </button>
    </div>

    <div v-else-if="!orders.length" class="empty-state">
      <i class="pi pi-receipt" />
      <h2>No orders yet</h2>
      <p>Your confirmed purchases will appear here.</p>
      <router-link to="/">Browse the catalogue</router-link>
    </div>

    <section v-else class="orders-list">
      <article v-for="order in visibleOrders" :key="order._id" class="order-card">
        <div class="order-heading">
          <div>
            <span class="order-label">ORDER #{{ order._id.slice(-6).toUpperCase() }}</span>
            <div class="order-meta-dates">
              <time class="placed-date">Placed: {{ new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }}</time>
              <span class="arrival-pill">
                <i class="pi pi-truck" /> Expected Delivery by <strong>{{ getDeliveryEstimate(order.createdAt) }}</strong>
              </span>
            </div>
          </div>

          <div class="payment-badge-wrap">
            <span v-if="order.payment?.method === 'esewa'" class="payment-badge esewa-badge">
              <i class="pi pi-shield" /> Paid via eSewa
            </span>
            <span v-else class="payment-badge cod-badge">
              <i class="pi pi-wallet" /> Cash on Delivery
            </span>
          </div>
        </div>

        <div class="order-items">
          <div v-for="item in order.items" :key="item._id || item.product?._id || item.product" class="order-item">
            <router-link
              v-if="item.product?._id || item.product"
              :to="`/product/${item.product?._id || item.product}`"
              class="item-img-link"
              title="View product details"
            >
              <img
                :src="item.image || item.product?.image || item.product?.images?.[0] || 'https://placehold.co/80x80?text=Product'"
                :alt="item.title || item.product?.title || 'Product'"
              >
            </router-link>
            <img
              v-else
              :src="item.image || 'https://placehold.co/80x80?text=Product'"
              :alt="item.title || 'Product'"
            >
            <div class="item-details">
              <div class="item-header">
                <router-link
                  v-if="item.product?._id || item.product"
                  :to="`/product/${item.product?._id || item.product}`"
                  class="item-title-link"
                >
                  <strong>{{ item.title || item.product?.title || 'Product' }}</strong>
                </router-link>
                <strong v-else>{{ item.title || 'Product' }}</strong>
                <span v-if="item.category || item.product?.category" class="category-pill">
                  {{ item.category || item.product?.category }}
                </span>
              </div>
              <div class="item-specs">
                <span>Quantity: <b>{{ item.quantity }}</b></span>
                <span>Unit Price: Rs. {{ Number(item.price || item.product?.price || 0).toLocaleString() }}</span>
                <span>Line Total: <b>Rs. {{ (Number(item.price || item.product?.price || 0) * (item.quantity || 1)).toLocaleString() }}</b></span>
                <span v-if="item.selectedSize" class="spec-tag">Size: {{ item.selectedSize }}</span>
                <span v-if="item.selectedColor" class="spec-tag">Color: {{ item.selectedColor }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="order-footer">
          <div class="status-wrap">
            <span :class="['status', `status-${order.status}`]">{{ order.status }}</span>
            <small v-if="order.shippingAddress?.city" class="ship-to">
              Deliver to: {{ order.shippingAddress.fullName || 'Recipient' }}, {{ order.shippingAddress.city }}
            </small>
          </div>

          <div class="total-wrap">
            <small>{{ order.items.length }} item{{ order.items.length === 1 ? '' : 's' }} · Delivery Rs. {{ order.deliveryFee || 50 }}</small>
            <strong>Rs. {{ Number(order.total).toLocaleString() }}</strong>
          </div>
        </div>
      </article>
    </section>

    <p v-if="!loading && !error && orders.length && !visibleOrders.length" class="state-message">No orders in this status.</p>
  </main>
</template>

<style scoped>
.orders-page { max-width: 950px; margin: auto; padding: 54px 24px 100px; color: #15233d; }
.orders-header { display: flex; align-items: end; justify-content: space-between; gap: 24px; margin-bottom: 28px; }
.kicker { color: #1769aa; font-size: .7rem; font-weight: 800; letter-spacing: .16em; margin: 0 0 8px; }
h1 { font: 500 clamp(2.4rem, 6vw, 3.6rem) Georgia, serif; margin: 0; color: #17221d; }
.intro { color: #60758f; margin: 10px 0 0; font-size: 1.05rem; }
.shop-link { color: #2e6041; text-decoration: none; font-weight: 700; white-space: nowrap; display: inline-flex; align-items: center; gap: 6px; }
.shop-link:hover { text-decoration: underline; }

.alert-banner { display: flex; align-items: flex-start; gap: 14px; padding: 18px 20px; border-radius: 12px; margin-bottom: 28px; font-size: .95rem; }
.alert-banner i { font-size: 1.5rem; margin-top: 2px; }
.alert-banner p { margin: 4px 0 0; font-size: .88rem; }
.success-banner { background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; }
.success-banner i { color: #059669; }
.failure-banner { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; }
.failure-banner i { color: #dc2626; }

.orders-list { display: grid; gap: 20px; }
.order-card { border: 1px solid #d5e2f0; background: #fff; border-radius: 14px; padding: 24px; box-shadow: 0 4px 16px rgba(0,0,0,0.03); }
.order-heading { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; }
.order-label { display: block; color: #2e6041; font-size: 1.05rem; font-weight: 800; letter-spacing: .08em; margin-bottom: 6px; }
.order-meta-dates { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
.placed-date { color: #71839a; font-size: .84rem; }
.arrival-pill { display: inline-flex; align-items: center; gap: 6px; background: #f0fdf4; color: #166534; padding: 4px 10px; border-radius: 999px; font-size: .82rem; border: 1px solid #bbf7d0; }
.arrival-pill strong { font-weight: 700; color: #14532d; }

.payment-badge-wrap { display: flex; align-items: center; }
.payment-badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 8px; font-size: .82rem; font-weight: 700; }
.esewa-badge { background: #e8f5e9; color: #2e7d32; border: 1px solid #c8e6c9; }
.cod-badge { background: #fff8e1; color: #f57f17; border: 1px solid #ffecb3; }

.order-items { display: grid; gap: 14px; border-block: 1px solid #edf2f7; margin: 18px 0; padding: 16px 0; }
.order-item { display: flex; align-items: center; gap: 16px; }
.item-img-link { display: block; flex-shrink: 0; }
.order-item img { width: 68px; height: 68px; object-fit: contain; background: #f8faf7; border-radius: 8px; border: 1px solid #e2e8f0; transition: transform .2s ease; }
.item-img-link:hover img { transform: scale(1.05); }
.item-header { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 4px; }
.item-title-link { color: #17221d; text-decoration: none; }
.item-title-link:hover strong { color: #2e6041; text-decoration: underline; }
.item-details strong { display: block; font-size: 1rem; color: #17221d; }
.category-pill { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; font-size: .72rem; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; padding: 2px 7px; border-radius: 4px; }
.item-specs { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-top: 5px; color: #64748b; font-size: .84rem; }
.item-specs b { color: #1e293b; }
.spec-tag { background: #f1f5f9; padding: 2px 8px; border-radius: 6px; font-size: .78rem; font-weight: 600; color: #475569; }

.order-footer { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; }
.status-wrap { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.status { border-radius: 999px; padding: 6px 12px; font-size: .75rem; font-weight: 800; text-transform: capitalize; }
.status-pending { background: #fff5d8; color: #8a6500; }
.status-processing { background: #e0f2fe; color: #0369a1; }
.status-shipped, .status-delivered { background: #dcfce7; color: #15803d; }
.status-cancelled { background: #fee2e2; color: #b91c1c; }
.ship-to { color: #64748b; font-size: .82rem; }

.total-wrap { text-align: right; display: flex; flex-direction: column; align-items: flex-end; }
.total-wrap small { color: #64748b; font-size: .82rem; margin-bottom: 2px; }
.total-wrap strong { font-size: 1.35rem; color: #17221d; }

.state-message { color: #60758f; padding: 30px 0; text-align: center; }
.error { color: #b34d5b; }
.status-filter { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 22px; }
.status-filter button { border: 1px solid #d5e2f0; background: #fff; color: #60758f; border-radius: 999px; padding: 8px 16px; cursor: pointer; text-transform: capitalize; font-weight: 600; font-size: .85rem; }
.status-filter button.active { background: #2e6041; border-color: #2e6041; color: #fff; }
.empty-state { text-align: center; border: 2px dashed #bfd4e8; border-radius: 16px; padding: 60px 24px; color: #60758f; }
.empty-state i { color: #2e6041; font-size: 2.6rem; }
.empty-state h2 { color: #17221d; margin: 16px 0 6px; }
.empty-state a { color: #2e6041; font-weight: 700; text-decoration: underline; margin-top: 12px; display: inline-block; }

@media (max-width: 640px) {
  .orders-header { display: block; }
  .shop-link { display: inline-block; margin-top: 16px; }
  .order-heading { flex-direction: column; }
  .order-footer { flex-direction: column; align-items: flex-start; }
  .total-wrap { align-items: flex-start; text-align: left; }
}
</style>
