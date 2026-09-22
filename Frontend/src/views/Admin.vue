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
const selectedOrderStatus = ref('all')
const orderStatuses = ['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled']

const form = ref({
  title: '',
  description: '',
  price: 0,
  category: '',
  gender: 'unisex',
  image: '',
  images: [] as string[],
  stock: 0,
  sizes: '',
  colors: ''
})

const categoryOptions = computed(() => {
  const unisexCategories = ['Clothing', 'Footwear', 'Accessories', 'Bags', 'Watches', 'Electronics', 'Home & Kitchen']
  const optionsByGender: Record<string, string[]> = {
    men: ["Men's Clothing", "Men's Footwear", "Men's Accessories", 'Watches', 'Grooming'],
    women: ["Women's Clothing", "Women's Footwear", "Women's Accessories", 'Bags', 'Jewelry', 'Beauty'],
    unisex: unisexCategories
  }
  const options: string[] = optionsByGender[form.value.gender] ?? unisexCategories
  return form.value.category && !options.includes(form.value.category)
    ? [form.value.category, ...options]
    : options
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
const visibleOrders = computed(() => selectedOrderStatus.value === 'all'
  ? orders.value
  : orders.value.filter(order => order.status === selectedOrderStatus.value))
const orderCount = (status: string) => status === 'all'
  ? orders.value.length
  : orders.value.filter(order => order.status === status).length

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
  const files = Array.from(target.files || [])
  if (!files.length) return

  const formData = new FormData()
  files.forEach(file => formData.append('images', file))

  const res = await fetch(`${base}/products/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    body: formData
  })

  const data = await res.json()
  form.value.images = [...form.value.images, ...(data.urls || [])]
  form.value.image = form.value.images[0] || ''
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
    gender: 'unisex',
    image: '',
    images: [],
    stock: 0,
    sizes: '',
    colors: ''
  }
}

function editProduct(product: any) {
  editingId.value = product._id
  form.value = {
    title: product.title,
    description: product.description,
    price: product.price,
    category: product.category,
    gender: product.gender || 'unisex',
    image: product.image || '',
    images: product.images?.length ? [...product.images] : (product.image ? [product.image] : []),
    stock: product.stock || 0,
    sizes: product.sizes?.join(', ') || '',
    colors: product.colors?.join(', ') || ''
  }
}

async function submitProduct() {
  const token = localStorage.getItem('token')

  const payload = {
    ...form.value,
    price: Number(form.value.price),
    stock: Number(form.value.stock),
    sizes: form.value.sizes.split(',').map(value => value.trim()).filter(Boolean),
    colors: form.value.colors.split(',').map(value => value.trim()).filter(Boolean)
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
        <label class="select-label">Audience
          <select v-model="form.gender">
            <option value="unisex">Unisex</option>
            <option value="men">Men</option>
            <option value="women">Women</option>
          </select>
        </label>
        <label class="select-label">Category
          <select v-model="form.category" required>
            <option value="" disabled>Select a category</option>
            <option v-for="category in categoryOptions" :key="category" :value="category">{{ category }}</option>
          </select>
        </label>
        <input v-model="form.sizes" type="text" placeholder="Sizes (comma separated, e.g. S, M, L)" />
        <input v-model="form.colors" type="text" placeholder="Colors (comma separated, e.g. Black, White)" />
        <label class="upload-label">Product photos (select up to 8)
          <input type="file" accept="image/*" multiple @change="onImageSelected" />
        </label>
        <div v-if="form.images.length" class="image-preview-row">
          <img v-for="image in form.images" :key="image" :src="image" alt="Product preview" />
        </div>

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
      <div class="header-inline">
        <div>
          <h2>Orders</h2>
          <p class="muted-text">Review and update every order by its current state.</p>
        </div>
        <span>{{ orders.length }} total</span>
      </div>

      <div v-if="loadingOrders" class="muted-text">Loading orders...</div>
      <div v-else-if="orders.length === 0" class="muted-text">No orders yet.</div>

      <template v-else>
        <div class="order-status-filters" aria-label="Filter orders by status">
          <button v-for="status in orderStatuses" :key="status" type="button" :class="['status-filter-button', { active: selectedOrderStatus === status }]" @click="selectedOrderStatus = status">
            {{ status }} <span>{{ orderCount(status) }}</span>
          </button>
        </div>

        <div v-if="visibleOrders.length" class="orders-list">
          <div v-for="order in visibleOrders" :key="order._id" class="order-card-admin">
            <div class="order-row">
              <div>
                <strong>Order #{{ order._id.slice(-6).toUpperCase() }}</strong>
                <small>{{ order.user?.name || order.shippingAddress?.fullName || 'Customer' }} · {{ order.items.length }} item{{ order.items.length === 1 ? '' : 's' }}</small>
              </div>

              <div class="order-meta">
                <strong>Rs. {{ order.total }}</strong>
                <small>{{ new Date(order.createdAt).toLocaleDateString() }} · <span :class="['order-status', `order-status-${order.status}`]">{{ order.status }}</span></small>
              </div>
              <select :value="order.status" :aria-label="`Update order ${order._id.slice(-6)} status`" @change="updateOrderStatus(order, ($event.target as HTMLSelectElement).value)">
                <option v-for="status in orderStatuses.slice(1)" :key="status" :value="status">{{ status }}</option>
              </select>
            </div>

            <div class="admin-order-items">
              <div v-for="item in order.items" :key="item._id || item.product?._id || item.product" class="admin-order-item">
                <img :src="item.image || item.product?.image || item.product?.images?.[0] || 'https://placehold.co/44x44?text=Product'" :alt="item.title || item.product?.title || 'Product'">
                <div class="admin-item-text">
                  <span>{{ item.title || item.product?.title || 'Product' }}</span>
                  <small>Qty: {{ item.quantity }} · Rs. {{ Number(item.price || item.product?.price || 0).toLocaleString() }} <template v-if="item.selectedSize">· Size: {{ item.selectedSize }}</template><template v-if="item.selectedColor"> · Color: {{ item.selectedColor }}</template></small>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="muted-text empty-orders">No orders in this state.</div>
      </template>
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
.form-card textarea,
.form-card select {
  width: 100%;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  padding: 10px 12px;
  font: inherit;
  box-sizing: border-box;
}

.select-label { display: grid; gap: 6px; color: #475569; font-size: .82rem; font-weight: 700; }

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

.order-card-admin {
  border-bottom: 1px solid #e2e8f0;
  padding: 14px 0;
}
.order-card-admin:last-child {
  border-bottom: none;
}
.admin-order-items {
  margin-top: 10px;
  padding-left: 12px;
  border-left: 2px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.admin-order-item {
  display: flex;
  align-items: center;
  gap: 10px;
}
.admin-order-item img {
  width: 38px;
  height: 38px;
  object-fit: contain;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
}
.admin-item-text span {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: #1e293b;
}
.admin-item-text small {
  color: #64748b;
  font-size: 0.78rem;
}

.header-inline > div p { margin: 5px 0 0; }
.order-status-filters { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 18px; }
.status-filter-button { border: 1px solid #dbe3ed; border-radius: 999px; background: #f8fafc; color: #475569; padding: 8px 12px; cursor: pointer; text-transform: capitalize; }
.status-filter-button span { margin-left: 4px; font-weight: 800; }
.status-filter-button.active { border-color: #2563eb; background: #2563eb; color: white; }
.order-status { font-weight: 700; text-transform: capitalize; }
.order-status-pending { color: #a16207; }.order-status-processing { color: #2563eb; }.order-status-shipped, .order-status-delivered { color: #15803d; }.order-status-cancelled { color: #b91c1c; }
.empty-orders { padding: 16px 0; }

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