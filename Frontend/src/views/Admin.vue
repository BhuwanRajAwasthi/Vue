<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/pinia/authStore'

const router = useRouter()
const authStore = useAuthStore()

const base = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
const products = ref<any[]>([])
const orders = ref<any[]>([])
const loading = ref(false)
const loadingOrders = ref(false)
const error = ref('')
const editingId = ref('')
const activeTab = ref<'overview' | 'products' | 'orders'>('overview')

const form = ref({
  title: '',
  description: '',
  price: 0,
  category: '',
  image: '',
  stock: 0
})

onMounted(async () => {
  if (authStore.isLoggedIn && !authStore.user) {
    await authStore.fetchMe()
  }

  if (!authStore.isLoggedIn || !authStore.isAdmin) {
    router.push('/login')
    return
  }

  await loadProducts()
  await loadOrders()
})

const totalProducts = computed(() => products.value.length)
const totalInventory = computed(() => products.value.reduce((sum, item) => sum + Number(item.stock || 0), 0))
const lowStockProducts = computed(() => products.value.filter(item => Number(item.stock || 0) < 10))
const totalRevenue = computed(() => orders.value.reduce((sum, order) => sum + Number(order.total || 0), 0))
const recentProducts = computed(() => [...products.value].slice(0, 5))

function setActiveTab(tab: 'overview' | 'products' | 'orders') {
  activeTab.value = tab
}

async function loadOrders() {
  loadingOrders.value = true

  try {
    const token = localStorage.getItem('token')
    const res = await fetch(`${base}/orders`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.message || `Unable to load orders (${res.status})`)
    }

    orders.value = await res.json()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load orders'
  } finally {
    loadingOrders.value = false
  }
}

async function onImageSelected(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const formData = new FormData()
  formData.append('image', file)

  const res = await fetch(`${base}/products/upload`, {
    method: 'POST',
    body: formData
  })

  const data = await res.json()
  form.value.image = data.url
}

async function loadProducts() {
  loading.value = true
  error.value = ''

  try {
    const token = localStorage.getItem('token')
    const res = await fetch(`${base}/products`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.message || `Unable to load products (${res.status})`)
    }

    products.value = await res.json()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load products'
  } finally {
    loading.value = false
  }
}

function resetForm() {
  editingId.value = ''
  form.value = {
    title: '',
    description: '',
    price: 0,
    category: '',
    image: '',
    stock: 0
  }
}

function editProduct(product: any) {
  editingId.value = product._id
  form.value = {
    title: product.title,
    description: product.description,
    price: product.price,
    category: product.category,
    image: product.image || '',
    stock: product.stock || 0
  }
}

async function submitProduct() {
  const token = localStorage.getItem('token')

  const payload = {
    ...form.value,
    price: Number(form.value.price),
    stock: Number(form.value.stock)
  }

  try {
    const url = editingId.value
      ? `${base}/products/${editingId.value}`
      : `${base}/products`

    const method = editingId.value ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({ message: 'Request failed' }))
      throw new Error(data.message || 'Operation failed')
    }

    resetForm()
    await loadProducts()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Something went wrong'
  }
}

async function deleteProduct(id: string) {
  const token = localStorage.getItem('token')

  try {
    const res = await fetch(`${base}/products/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({ message: 'Delete failed' }))
      throw new Error(data.message || 'Delete failed')
    }

    await loadProducts()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Delete failed'
  }
}

async function updateOrderStatus(order: any, status: string) {
  const token = localStorage.getItem('token')
  try {
    const res = await fetch(`${base}/orders/${order._id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status })
    })
    if (!res.ok) throw new Error('Unable to update order status')
    order.status = status
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unable to update order status'
  }
}
</script>

<template>
  <div class="page-shell">
    <div class="header-row">
      <div>
        <p class="eyebrow">Dashboard</p>
        <h1>Admin Panel</h1>
      </div>

      <button @click="router.go(0)" class="primary-button">Refresh</button>
    </div>

    <div v-if="error" class="error-banner">{{ error }}</div>

    <div class="admin-layout">
      <aside class="sidebar" aria-label="Admin sections">
        <p>Manage store</p>
        <button :class="['tab-button', activeTab === 'overview' ? 'tab-button-active' : '']" @click="setActiveTab('overview')"><i class="pi pi-chart-bar" /> Overview</button>
        <button :class="['tab-button', activeTab === 'products' ? 'tab-button-active' : '']" @click="setActiveTab('products')"><i class="pi pi-box" /> Products</button>
        <button :class="['tab-button', activeTab === 'orders' ? 'tab-button-active' : '']" @click="setActiveTab('orders')"><i class="pi pi-shopping-bag" /> Orders</button>
      </aside>
      <div class="admin-content">
    <section v-if="activeTab === 'overview'" class="space-y-6">
      <div class="stats-grid">
        <div class="stat-card">
          <p>Total Products</p>
          <h3>{{ totalProducts }}</h3>
        </div>
        <div class="stat-card">
          <p>Stock Items</p>
          <h3>{{ totalInventory }}</h3>
        </div>
        <div class="stat-card warning">
          <p>Low Stock</p>
          <h3>{{ lowStockProducts.length }}</h3>
        </div>
        <div class="stat-card success">
          <p>Revenue</p>
          <h3>Rs. {{ totalRevenue }}</h3>
        </div>
      </div>

      <div class="panel-grid">
        <div class="panel-card">
          <h2>Recent Products</h2>
          <div class="list-group">
            <div v-for="product in recentProducts" :key="product._id" class="list-item">
              <div>
                <strong>{{ product.title }}</strong>
                <small>{{ product.category }}</small>
              </div>
              <span>Rs. {{ product.price }}</span>
            </div>
          </div>
        </div>

        <div class="panel-card">
          <h2>Low Stock Alerts</h2>
          <div v-if="lowStockProducts.length === 0" class="muted-text">All products are well stocked.</div>
          <div v-else class="list-group">
            <div v-for="product in lowStockProducts" :key="product._id" class="alert-item">
              <div>
                <strong>{{ product.title }}</strong>
                <small>Only {{ product.stock }} left</small>
              </div>
              <span>Restock</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section v-if="activeTab === 'products'" class="content-grid">
      <form @submit.prevent="submitProduct" class="panel-card form-card">
        <h2>{{ editingId ? 'Edit Product' : 'Add New Product' }}</h2>

        <input v-model="form.title" type="text" placeholder="Title" required />
        <textarea v-model="form.description" rows="3" placeholder="Description" required />
        <div class="split-fields">
          <input v-model="form.price" type="number" step="0.01" placeholder="Price" required />
          <input v-model="form.stock" type="number" placeholder="Stock" required />
        </div>
        <input v-model="form.category" type="text" placeholder="Category" required />
        <input type="file" @change="onImageSelected" />

        <div class="button-row">
          <button type="submit" class="primary-button">{{ editingId ? 'Update Product' : 'Add Product' }}</button>
          <button type="button" class="secondary-button" @click="resetForm">Reset</button>
        </div>
      </form>

      <div class="panel-card">
        <div class="header-inline">
          <h2>Products</h2>
          <span>{{ products.length }} total</span>
        </div>

        <div v-if="loading" class="muted-text">Loading...</div>

        <div v-else class="product-list">
          <div v-for="product in products" :key="product._id" class="product-row">
            <div>
              <strong>{{ product.title }}</strong>
              <small>{{ product.category }} • Rs. {{ product.price }}</small>
            </div>
            <div class="mini-actions">
              <button class="warning-button" @click="editProduct(product)">Edit</button>
              <button class="danger-button" @click="deleteProduct(product._id)">Delete</button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section v-if="activeTab === 'orders'" class="panel-card orders-card">
      <h2>Latest Orders</h2>

      <div v-if="loadingOrders" class="muted-text">Loading orders...</div>
      <div v-else-if="orders.length === 0" class="muted-text">No orders yet.</div>

      <div v-else class="orders-list">
        <div v-for="order in orders.slice(0, 8)" :key="order._id" class="order-row">
          <div>
            <strong>Order #{{ order._id.slice(-6) }}</strong>
            <small>{{ order.items.length }} items • {{ order.status }}</small>
          </div>

          <div class="order-meta">
            <strong>Rs. {{ order.total }}</strong>
            <small>{{ new Date(order.createdAt).toLocaleDateString() }}</small>
          </div>
          <select :value="order.status" @change="updateOrderStatus(order, ($event.target as HTMLSelectElement).value)">
            <option v-for="status in ['pending', 'processing', 'shipped', 'delivered', 'cancelled']" :key="status" :value="status">{{ status }}</option>
          </select>
        </div>
      </div>
    </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-shell {
  max-width: 1280px;
  margin: 0 auto;
  padding: 24px 16px 48px;
}

.header-row,
.header-inline,
.button-row,
.mini-actions,
.tab-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.admin-layout { display: grid; grid-template-columns: 190px minmax(0, 1fr); gap: 24px; align-items: start; }
.sidebar { display: flex; flex-direction: column; gap: 8px; position: sticky; top: 88px; }
.sidebar p { margin: 0 0 8px; color: #64748b; font-size: .72rem; font-weight: 700; text-transform: uppercase; letter-spacing: .12em; }
.sidebar .tab-button { display: flex; align-items: center; gap: 10px; text-align: left; width: 100%; }
.admin-content > section { margin-bottom: 18px; }

.header-row {
  margin-bottom: 20px;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: #2563eb;
  font-size: 0.72rem;
  font-weight: 700;
  margin: 0 0 8px;
}

h1 {
  margin: 0;
  font-size: 2.2rem;
}

.primary-button,
.secondary-button,
.warning-button,
.danger-button,
.tab-button {
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
}

.primary-button {
  background: #2563eb;
  color: white;
  padding: 10px 18px;
}

.secondary-button {
  background: #e2e8f0;
  color: #0f172a;
  padding: 10px 18px;
}

.warning-button {
  background: #fbbf24;
  color: #111827;
  padding: 6px 10px;
}

.danger-button {
  background: #ef4444;
  color: white;
  padding: 6px 10px;
}

.error-banner {
  background: #fee2e2;
  color: #b91c1c;
  border: 1px solid #fecaca;
  border-radius: 12px;
  padding: 12px 16px;
  margin-bottom: 20px;
}

.tab-row {
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.tab-button {
  background: #f1f5f9;
  color: #334155;
  padding: 10px 16px;
}

.tab-button-active {
  background: #2563eb;
  color: white;
}

.stats-grid,
.panel-grid,
.content-grid {
  display: grid;
  gap: 18px;
}

.stats-grid {
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.stat-card,
.panel-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  box-shadow: 0 8px 16px rgba(15, 23, 42, 0.04);
}

.stat-card {
  padding: 20px;
}

.stat-card p {
  margin: 0;
  color: #64748b;
  font-size: 0.85rem;
}

.stat-card h3 {
  margin: 12px 0 0;
  font-size: 2rem;
}

.warning {
  background: #fff7ed;
}

.success {
  background: #ecfdf5;
}

.panel-grid {
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.panel-card {
  padding: 22px;
}

.panel-card h2 {
  margin: 0 0 18px;
  font-size: 1.2rem;
}

.list-group,
.product-list,
.orders-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.list-item,
.product-row,
.order-row,
.alert-item {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px solid #f1f5f9;
}

.list-item:last-child,
.product-row:last-child,
.order-row:last-child,
.alert-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.list-item strong,
.product-row strong,
.alert-item strong,
.order-row strong {
  display: block;
  margin-bottom: 4px;
}

.list-item small,
.product-row small,
.alert-item small,
.order-row small,
.muted-text {
  color: #64748b;
  font-size: 0.8rem;
}

.alert-item {
  background: #fffbeb;
  border: 1px solid #fef3c7;
  border-radius: 12px;
  padding: 12px 14px;
}

.content-grid {
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
}

.form-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-card input,
.form-card textarea {
  width: 100%;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  padding: 10px 12px;
  font: inherit;
  box-sizing: border-box;
}

.split-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.header-inline {
  margin-bottom: 18px;
}

.header-inline span {
  color: #64748b;
  font-size: 0.8rem;
}

.mini-actions {
  gap: 8px;
}

.orders-card {
  margin-top: 18px;
}

.order-meta {
  text-align: right;
}

@media (max-width: 640px) {
  .admin-layout { grid-template-columns: 1fr; }
  .sidebar { position: static; flex-direction: row; overflow-x: auto; }
  .sidebar p { display: none; }
  .sidebar .tab-button { width: auto; white-space: nowrap; }
  .split-fields {
    grid-template-columns: 1fr;
  }

  .header-row,
  .header-inline,
  .product-row,
  .order-row,
  .button-row {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>