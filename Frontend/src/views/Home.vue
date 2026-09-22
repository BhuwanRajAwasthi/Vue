<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useProductStore, type product } from "@/stores/pinia/productStore";

const router = useRouter();
const productStore = useProductStore();

const sortBy = ref<string>("featured");
const addedProductId = ref<string | number | null>(null);
const selectedCardImages = ref<Record<string, string>>({});
const currentPage = ref(1);
const pageSize = 8;

onMounted(() => {
  productStore.fetchProducts();
});

function browseCatalog() {
  document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" });
}

function selectCategory(cat: string) {
  productStore.selectedCategory = cat;
}

function productImageList(p: product) {
  return p.images?.filter(Boolean).length ? p.images.filter(Boolean) : (p.image ? [p.image] : []);
}

function cardImage(p: product) {
  return selectedCardImages.value[String(p._id || p.id)] || productImageList(p)[0] || 'https://placehold.co/600x600?text=Product';
}

function selectCardImage(p: product, image: string, event: MouseEvent) {
  event.stopPropagation();
  selectedCardImages.value[String(p._id || p.id)] = image;
}

function quickAddToCart(p: product, event: MouseEvent) {
  event.stopPropagation();
  if (p.sizes?.length || p.colors?.length) {
    router.push({ name: 'product', params: { id: p._id || p.id } });
    return;
  }
  void productStore.addToCart(p, 1);
  const id = p._id || p.id || null;
  addedProductId.value = id;
  setTimeout(() => {
    if (addedProductId.value === id) {
      addedProductId.value = null;
    }
  }, 1500);
}

const sortedProducts = computed(() => {
  const list = [...productStore.filteredProducts];
  if (sortBy.value === "price-asc") {
    return list.sort((a, b) => a.price - b.price);
  } else if (sortBy.value === "price-desc") {
    return list.sort((a, b) => b.price - a.price);
  } else if (sortBy.value === "name-asc") {
    return list.sort((a, b) => a.title.localeCompare(b.title));
  }
  return list;
});
const totalPages = computed(() => Math.max(1, Math.ceil(sortedProducts.value.length / pageSize)));
const pagedProducts = computed(() => sortedProducts.value.slice((currentPage.value - 1) * pageSize, currentPage.value * pageSize));
watch([() => productStore.searchItem, () => productStore.selectedCategory, () => productStore.selectedGender, () => productStore.minPrice, () => productStore.maxPrice, sortBy], () => {
  currentPage.value = 1;
});
watch(totalPages, (pages) => {
  if (currentPage.value > pages) currentPage.value = pages;
});
</script>

<template>
  <main class="home-page">
    <section v-if="!productStore.searchItem.trim()" class="hero-section">
      <div class="hero-container">
        <div class="hero-copy">
          <span class="hero-eyebrow">Curated Marketplace</span>
          <h1>Discover quality products.</h1>
          <p class="hero-subtext">
            Browse hand-picked items from trusted sellers.
          </p>
          <button class="btn-primary" @click="browseCatalog">
            <span>Explore Collection</span>
            <i class="pi pi-arrow-down" />
          </button>
        </div>

      </div>
    </section>

    <!-- Catalog Section -->
    <section id="catalog" class="catalog-section">
      <div class="catalog-header">
        <div class="header-left">
          <span class="section-kicker">DISCOVER OUR CATALOG</span>
          <h2>{{ productStore.searchItem ? `Search: “${productStore.searchItem}”` : "Find Your Next Essential" }}</h2>
        </div>
        <div class="header-right">
          <span class="count-pill">{{ sortedProducts.length }} items available</span>
        </div>
      </div>

      <div class="gender-filter-bar" aria-label="Filter products by audience">
        <span class="filter-label">Shop for</span>
        <button v-for="gender in [{ key: 'all', label: 'Everyone' }, { key: 'men', label: 'Men' }, { key: 'women', label: 'Women' }, { key: 'unisex', label: 'Unisex' }]" :key="gender.key" :class="['gender-pill-btn', { active: productStore.selectedGender === gender.key }]" @click="productStore.selectedGender = gender.key">
          {{ gender.label }}
        </button>
      </div>

      <!-- Category Filter Pills -->
      <div class="category-filter-bar">
        <button
          v-for="cat in productStore.availableCategories"
          :key="cat"
          :class="['category-pill-btn', { active: productStore.selectedCategory === cat }]"
          @click="selectCategory(cat)"
        >
          <span>{{ cat }}</span>
        </button>
      </div>

      <!-- Search & Sort Controls -->
      <div class="controls-bar">
        <div class="sort-box">
          <label for="sort-select">Sort by:</label>
          <select id="sort-select" v-model="sortBy">
            <option value="featured">Featured</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="name-asc">Name: A to Z</option>
          </select>
        </div>
        <div class="price-filter" aria-label="Filter by price">
          <input v-model.number="productStore.minPrice" type="number" min="0" placeholder="Min price" aria-label="Minimum price" />
          <span>to</span>
          <input v-model.number="productStore.maxPrice" type="number" min="0" placeholder="Max price" aria-label="Maximum price" />
        </div>
      </div>

      <!-- Products Grid -->
      <div v-if="sortedProducts.length" class="products-grid">
        <article
          v-for="p in pagedProducts"
          :key="p._id || p.id"
          class="product-card"
          @click="router.push({ name: 'product', params: { id: p._id || p.id } })"
        >
          <div class="card-media">
            <span class="card-badge">{{ p.category }}</span>
            <img
              :src="cardImage(p)"
              :alt="p.title"
              loading="lazy"
            />
            <div v-if="productImageList(p).length > 1" class="card-thumbnails" aria-label="Product images">
              <button
                v-for="image in productImageList(p)"
                :key="image"
                type="button"
                :class="['card-thumbnail', { active: cardImage(p) === image }]"
                @click="selectCardImage(p, image, $event)"
              >
                <img :src="image" :alt="`${p.title} thumbnail`" />
              </button>
            </div>
          </div>

          <div class="card-content">
            <h3 class="card-title">{{ p.title }}</h3>

            <div class="card-footer">
              <div class="card-price">
                <span class="curr">Rs.</span>
                <span class="val">{{ p.price.toLocaleString() }}</span>
              </div>

              <button
                type="button"
                class="btn-quick-add"
                :class="{ 'added': addedProductId === (p._id || p.id) }"
                title="Add to cart"
                @click="quickAddToCart(p, $event)"
              >
                <i v-if="addedProductId === (p._id || p.id)" class="pi pi-check" />
                <i v-else class="pi pi-shopping-bag" />
                <span>{{ addedProductId === (p._id || p.id) ? 'Added' : 'Add' }}</span>
              </button>
            </div>
          </div>
        </article>
      </div>

      <nav v-if="totalPages > 1" class="pagination" aria-label="Product pages">
        <button type="button" :disabled="currentPage === 1" @click="currentPage--"><i class="pi pi-arrow-left" /> Previous</button>
        <button v-for="page in totalPages" :key="page" type="button" :class="{ active: currentPage === page }" @click="currentPage = page">{{ page }}</button>
        <button type="button" :disabled="currentPage === totalPages" @click="currentPage++">Next <i class="pi pi-arrow-right" /></button>
      </nav>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <i class="pi pi-inbox empty-icon" />
        <h3>No matching products found</h3>
        <p>Try searching for a different keyword or select another category.</p>
        <button
          type="button"
          class="btn-reset-filter"
          @click="productStore.searchItem = ''; productStore.selectedCategory = 'All'"
        >
          Reset Filters
        </button>
      </div>
    </section>

  </main>
</template>

<style scoped>
.home-page {
  background-color: #fbfcfb;
  color: #1a202c;
  font-family: inherit;
  overflow-x: hidden;
}
.pagination { display: flex; justify-content: center; align-items: center; gap: 8px; margin: 28px 0 8px; }
.pagination button { border: 1px solid #dfe7dc; background: #fff; color: #294132; min-width: 38px; height: 38px; cursor: pointer; border-radius: 5px; }
.pagination button.active { background: #2e6041; color: #fff; border-color: #2e6041; }
.pagination button:disabled { opacity: .45; cursor: not-allowed; }

/* Hero Section */
.hero-section {
  background: linear-gradient(130deg, #1c3b2d 0%, #2e6041 55%, #3d7954 100%);
  color: #ffffff;
  padding: 64px 24px 80px;
  position: relative;
}

.hero-container {
  max-width: 1240px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 48px;
}

.hero-copy {
  max-width: 620px;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.22);
  padding: 6px 14px;
  border-radius: 9999px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #fce7a7;
  margin-bottom: 22px;
  backdrop-filter: blur(8px);
}

.pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #48bb78;
  box-shadow: 0 0 0 3px rgba(72, 187, 120, 0.35);
}

.hero-section h1 {
  font-family: Georgia, serif;
  font-size: clamp(2.8rem, 5.5vw, 4.2rem);
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.02em;
  margin: 0 0 20px;
}

.hero-section h1 em {
  font-style: italic;
  color: #f4c55d;
}

.hero-subtext {
  font-size: 1.12rem;
  line-height: 1.65;
  color: #d6e8dc;
  margin: 0 0 32px;
  max-width: 520px;
}

.hero-cta-group {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: #f4b942;
  color: #17221d;
  font-size: 1rem;
  font-weight: 700;
  padding: 14px 26px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: 0 4px 14px rgba(244, 185, 66, 0.3);
}

.btn-primary:hover {
  background: #f3ae2a;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(244, 185, 66, 0.4);
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
  font-size: 1rem;
  font-weight: 600;
  padding: 14px 22px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  cursor: pointer;
  transition: all 0.25s ease;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.22);
  transform: translateY(-2px);
}

.hero-trust-metrics {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-top: 40px;
  padding-top: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.15);
}

.metric {
  display: flex;
  flex-direction: column;
}

.metric strong {
  font-size: 1.35rem;
  font-weight: 800;
  color: #ffffff;
}

.metric span {
  font-size: 0.78rem;
  color: #b7d5bf;
}

.metric-divider {
  width: 1px;
  height: 32px;
  background-color: rgba(255, 255, 255, 0.2);
}

.hero-showcase {
  flex: 0 0 380px;
  display: flex;
  justify-content: center;
}

.showcase-card {
  background: #ffffff;
  color: #17221d;
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
  position: relative;
  width: 100%;
  max-width: 360px;
  transform: rotate(2deg);
  transition: transform 0.3s ease;
}

.showcase-card:hover {
  transform: rotate(0deg) scale(1.02);
}

.showcase-tag {
  position: absolute;
  top: 14px;
  left: 14px;
  background: #17221d;
  color: #f4c55d;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  padding: 4px 10px;
  border-radius: 6px;
  z-index: 2;
}

.showcase-img-wrap {
  height: 240px;
  background: #f4f6f3;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.showcase-img-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.showcase-details {
  padding-top: 16px;
}

.showcase-rating {
  color: #e58b10;
  font-size: 0.85rem;
  margin-bottom: 6px;
}

.showcase-rating span {
  color: #64748b;
  font-size: 0.78rem;
}

.showcase-details h4 {
  font-family: Georgia, serif;
  font-size: 1.15rem;
  font-weight: 700;
  margin: 0 0 10px;
  color: #17221d;
}

.showcase-price-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.price-val {
  font-weight: 800;
  color: #2e6041;
  font-size: 1.05rem;
}

.cod-badge {
  font-size: 0.75rem;
  font-weight: 600;
  color: #15803d;
  background: #eef8ee;
  padding: 3px 8px;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

/* Features Strip */
.features-strip {
  background: #ffffff;
  border-bottom: 1px solid #edf2ec;
  padding: 24px 20px;
}

.features-container {
  max-width: 1240px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
}

.feature-card {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 12px;
}

.feature-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: #eef5ee;
  color: #2e6041;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.feature-text strong {
  display: block;
  font-size: 0.95rem;
  color: #17221d;
  margin-bottom: 4px;
}

.feature-text p {
  margin: 0;
  font-size: 0.8rem;
  color: #64748b;
  line-height: 1.45;
}

/* Catalog Section */
.catalog-section {
  max-width: 1240px;
  margin: 48px auto;
  padding: 0 20px;
}

.catalog-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 24px;
  gap: 16px;
}

.section-kicker {
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.15em;
  color: #2e6041;
  display: block;
  margin-bottom: 6px;
}

.catalog-header h2 {
  font-family: Georgia, serif;
  font-size: 2.2rem;
  font-weight: 700;
  color: #17221d;
  margin: 0;
}

.count-pill {
  background: #eef5ee;
  color: #2e6041;
  font-size: 0.85rem;
  font-weight: 600;
  padding: 6px 14px;
  border-radius: 9999px;
  white-space: nowrap;
}

/* Category Filter Bar */
.gender-filter-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 18px 0 12px;
  flex-wrap: wrap;
}

.filter-label { color: #60705f; font-size: .82rem; font-weight: 700; margin-right: 4px; }
.gender-pill-btn { border: 1px solid #d8e2d8; border-radius: 9999px; background: #fff; color: #4a5568; padding: 7px 14px; cursor: pointer; font-size: .82rem; font-weight: 700; }
.gender-pill-btn:hover, .gender-pill-btn.active { border-color: #2e6041; color: #fff; background: #2e6041; }

.category-filter-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 8px;
  margin-bottom: 20px;
  scrollbar-width: thin;
}

.category-pill-btn {
  background: #ffffff;
  border: 1px solid #d8e2d8;
  color: #4a5568;
  font-size: 0.88rem;
  font-weight: 600;
  padding: 9px 18px;
  border-radius: 9999px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.category-pill-btn:hover {
  background: #eef5ee;
  color: #2e6041;
  border-color: #2e6041;
}

.category-pill-btn.active {
  background: #2e6041;
  color: #ffffff;
  border-color: #2e6041;
  box-shadow: 0 2px 8px rgba(46, 96, 65, 0.25);
}

/* Controls Bar */
.controls-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 32px;
  flex-wrap: wrap;
}
.price-filter {
  display: flex;
  align-items: center;
  gap: 8px;
}
.price-filter input {
  width: 105px;
  padding: 10px 12px;
  border: 1px solid #d8e2d8;
  border-radius: 8px;
  background: #fff;
}

.search-box {
  position: relative;
  flex: 1;
  max-width: 520px;
  min-width: 240px;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #718096;
}

.search-box input {
  width: 100%;
  height: 44px;
  padding: 0 40px 0 42px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.search-box input:focus {
  border-color: #2e6041;
  box-shadow: 0 0 0 3px rgba(46, 96, 65, 0.12);
}

.clear-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px;
}

.clear-btn:hover {
  color: #e53e3e;
}

.sort-box {
  display: flex;
  align-items: center;
  gap: 10px;
}

.sort-box label {
  font-size: 0.88rem;
  color: #64748b;
  font-weight: 500;
  white-space: nowrap;
}

.sort-box select {
  height: 44px;
  padding: 0 36px 0 14px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  font-size: 0.9rem;
  color: #1a202c;
  outline: none;
  cursor: pointer;
}

.sort-box select:focus {
  border-color: #2e6041;
}

/* Products Grid */
.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 24px;
}

.product-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  display: flex;
  flex-direction: column;
}

.product-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 16px 32px rgba(23, 34, 29, 0.08);
  border-color: #cbd5e1;
}

.card-media {
  height: 240px;
  background: #f8faf7;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow: hidden;
}

.card-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  background: #ffffff;
  color: #2e6041;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  padding: 4px 10px;
  border-radius: 6px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
  z-index: 2;
}

.card-media img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  transition: transform 0.3s ease;
}

.card-thumbnails {
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 10px;
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding: 4px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.9);
}

.card-thumbnail {
  flex: 0 0 38px;
  width: 38px;
  height: 38px;
  padding: 2px;
  border: 1px solid #d7e2d8;
  border-radius: 5px;
  background: #fff;
  cursor: pointer;
}

.card-thumbnail.active { border: 2px solid #2e6041; }
.card-thumbnail img { width: 100%; height: 100%; object-fit: cover; border-radius: 3px; }

.product-card:hover .card-media img {
  transform: scale(1.06);
}

.card-content {
  padding: 18px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.card-rating {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.card-rating .stars {
  color: #e58b10;
  font-size: 0.85rem;
  letter-spacing: 1px;
}

.card-rating .rating-num {
  font-size: 0.75rem;
  font-weight: 600;
  color: #718096;
}

.card-title {
  font-family: Georgia, serif;
  font-size: 1.05rem;
  font-weight: 600;
  color: #17221d;
  line-height: 1.35;
  margin: 0 0 16px;
  min-height: 42px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid #f1f5f9;
}

.card-price {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.card-price .curr {
  font-size: 0.85rem;
  font-weight: 600;
  color: #17221d;
}

.card-price .val {
  font-size: 1.25rem;
  font-weight: 800;
  color: #2e6041;
}

.btn-quick-add {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #f1f5f9;
  color: #1e293b;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 8px 14px;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-quick-add:hover {
  background: #2e6041;
  color: #ffffff;
  border-color: #2e6041;
}

.btn-quick-add.added {
  background: #15803d;
  color: #ffffff;
  border-color: #15803d;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 64px 20px;
  background: #ffffff;
  border: 2px dashed #cbd5e1;
  border-radius: 16px;
  margin: 32px 0;
}

.empty-icon {
  font-size: 3rem;
  color: #94a3b8;
  margin-bottom: 16px;
}

.empty-state h3 {
  font-size: 1.3rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px;
}

.empty-state p {
  color: #64748b;
  margin: 0 0 20px;
}

.btn-reset-filter {
  background: #2e6041;
  color: #ffffff;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

/* Promo Banner Section */
.promo-banner-section {
  max-width: 1240px;
  margin: 72px auto;
  padding: 0 20px;
}

.promo-banner {
  background: linear-gradient(110deg, #17221d 0%, #294435 60%, #a4823c 100%);
  color: #ffffff;
  border-radius: 20px;
  padding: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
  box-shadow: 0 12px 30px rgba(23, 34, 29, 0.15);
}

.promo-tag {
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.15em;
  color: #f4c55d;
  display: block;
  margin-bottom: 10px;
}

.promo-content h2 {
  font-family: Georgia, serif;
  font-size: 2.2rem;
  font-weight: 700;
  margin: 0 0 12px;
}

.promo-content p {
  color: #d1dfd3;
  font-size: 1.05rem;
  margin: 0 0 24px;
}

.btn-promo {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: #f4b942;
  color: #17221d;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.btn-promo:hover {
  transform: translateY(-2px);
}

.promo-badge-circle {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: #f4b942;
  color: #17221d;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.2);
  transform: rotate(-10deg);
}

.discount-num {
  font-size: 2.2rem;
  font-weight: 900;
  line-height: 1;
}

.discount-text {
  font-size: 0.85rem;
  font-weight: 800;
  letter-spacing: 0.1em;
}

/* Testimonials Section */
.testimonials-section {
  max-width: 1240px;
  margin: 72px auto;
  padding: 0 20px;
}

.testimonials-header {
  text-align: center;
  margin-bottom: 40px;
}

.testimonials-header h2 {
  font-family: Georgia, serif;
  font-size: 2.2rem;
  font-weight: 700;
  color: #17221d;
  margin: 6px 0 0;
}

.testimonials-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}

.testimonial-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 28px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);
}

.testimonial-card .stars {
  color: #e58b10;
  font-size: 1rem;
  margin-bottom: 14px;
}

.testimonial-card p {
  color: #475569;
  font-size: 0.96rem;
  line-height: 1.65;
  font-style: italic;
  margin: 0 0 20px;
  flex: 1;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.author-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #2e6041;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
}

.author-info strong {
  display: block;
  font-size: 0.95rem;
  color: #17221d;
}

.author-info small {
  color: #64748b;
  font-size: 0.78rem;
}

/* Newsletter Section */
.newsletter-section {
  max-width: 1240px;
  margin: 72px auto 80px;
  padding: 0 20px;
}

.newsletter-card {
  background: #f1f7ed;
  border: 1px solid #d4e5ce;
  border-radius: 20px;
  padding: 56px 24px;
  text-align: center;
}

.newsletter-content {
  max-width: 600px;
  margin: 0 auto;
}

.newsletter-content h2 {
  font-family: Georgia, serif;
  font-size: 2.2rem;
  font-weight: 700;
  color: #17221d;
  margin: 0 0 12px;
}

.newsletter-content p {
  color: #4a5d4f;
  font-size: 1rem;
  line-height: 1.6;
  margin: 0 0 28px;
}

.newsletter-form {
  display: flex;
  align-items: center;
  gap: 10px;
  max-width: 480px;
  margin: 0 auto;
}

.newsletter-form input {
  flex: 1;
  height: 48px;
  padding: 0 16px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  font-size: 0.95rem;
  outline: none;
}

.newsletter-form input:focus {
  border-color: #2e6041;
}

.btn-subscribe {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 48px;
  padding: 0 22px;
  background: #2e6041;
  color: #ffffff;
  border: none;
  border-radius: 10px;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background 0.2s ease;
}

.btn-subscribe:hover {
  background: #234b33;
}

.subscribe-success {
  margin-top: 14px;
  color: #15803d;
  font-size: 0.9rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

/* Responsiveness */
@media (max-width: 900px) {
  .hero-container {
    flex-direction: column;
    align-items: flex-start;
  }
  .hero-showcase {
    width: 100%;
    max-width: 100%;
    margin-top: 20px;
  }
  .showcase-card {
    max-width: 100%;
    transform: none;
  }
  .promo-banner {
    flex-direction: column;
    text-align: center;
    padding: 36px 24px;
  }
  .promo-badge-circle {
    margin: 0 auto;
  }
}

@media (max-width: 640px) {
  .hero-section {
    padding: 40px 16px 60px;
  }
  .hero-section h1 {
    font-size: 2.4rem;
  }
  .hero-trust-metrics {
    gap: 14px;
  }
  .metric strong {
    font-size: 1.1rem;
  }
  .catalog-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .products-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }
  .card-media {
    height: 160px;
    padding: 10px;
  }
  .card-content {
    padding: 12px;
  }
  .card-title {
    font-size: 0.92rem;
    min-height: 38px;
    margin-bottom: 8px;
  }
  .card-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  .btn-quick-add {
    width: 100%;
    justify-content: center;
  }
  .newsletter-form {
    flex-direction: column;
    width: 100%;
  }
  .newsletter-form input,
  .btn-subscribe {
    width: 100%;
  }
}

/* Premium minimal hero */
.home-page { font-family: Inter, Manrope, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #fafafa; color: #111318; }
.hero-section { position: relative; overflow: hidden; padding: clamp(72px, 10vw, 132px) 24px clamp(86px, 11vw, 150px); color: #111318; background: #fafafa; }
.hero-section::before { position: absolute; width: 460px; height: 460px; top: -180px; right: 8%; content: ''; border-radius: 50%; background: rgba(226, 230, 235, .5); filter: blur(2px); }
.hero-container { position: relative; z-index: 1; max-width: 1180px; display: grid; grid-template-columns: minmax(0, .95fr) minmax(360px, .85fr); align-items: center; gap: clamp(44px, 8vw, 120px); }
.hero-copy { max-width: 570px; }
.hero-eyebrow { display: block; margin-bottom: 22px; color: #70757d; font-size: .72rem; font-weight: 800; letter-spacing: .18em; text-transform: uppercase; animation: hero-fade-up .7s ease both; }
.hero-section h1 { max-width: 600px; margin: 0 0 24px; color: #111318; font: 700 clamp(3rem, 6vw, 5.7rem)/.98 Inter, Manrope, ui-sans-serif, system-ui, sans-serif; letter-spacing: -.055em; animation: hero-fade-up .7s .08s ease both; }
.hero-subtext { max-width: 430px; margin: 0 0 34px; color: #686e77; font-size: clamp(1rem, 1.5vw, 1.15rem); line-height: 1.65; animation: hero-fade-up .7s .16s ease both; }
.hero-copy .btn-primary { animation: hero-fade-up .7s .24s ease both; }
.btn-primary { display: inline-flex; align-items: center; gap: 12px; padding: 15px 21px; border: 0; border-radius: 12px; color: #fff; background: #111318; box-shadow: 0 10px 22px rgba(17, 19, 24, .14); cursor: pointer; font: 700 .9rem Inter, Manrope, ui-sans-serif, sans-serif; transition: transform .25s ease, box-shadow .25s ease, background .25s ease; }
.btn-primary:hover { background: #34383f; box-shadow: 0 14px 28px rgba(17, 19, 24, .2); transform: translateY(-2px); }
.hero-showcase { flex: initial; width: 100%; }
.showcase-card { width: min(100%, 470px); max-width: none; margin-left: auto; padding: 14px; border: 1px solid #e7e8ea; border-radius: 24px; background: #fff; box-shadow: 0 24px 55px rgba(26, 30, 36, .12); transform: rotate(2deg); animation: hero-float 5s ease-in-out infinite; }
.showcase-card:hover { transform: rotate(0deg) translateY(-5px); }
.showcase-img-wrap { height: clamp(330px, 38vw, 500px); border-radius: 16px; background: #f0f1f2; }
.showcase-img-wrap img { object-fit: contain; mix-blend-mode: multiply; transition: transform .5s ease; }
.showcase-card:hover .showcase-img-wrap img { transform: scale(1.035); }
.showcase-tag, .showcase-details, .hero-badge, .hero-cta-group, .hero-trust-metrics { display: none; }
@keyframes hero-fade-up { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
@keyframes hero-float { 0%, 100% { transform: rotate(2deg) translateY(0); } 50% { transform: rotate(2deg) translateY(-8px); } }
@media (max-width: 900px) {
  .hero-container { grid-template-columns: 1fr; gap: 48px; }
  .hero-copy { max-width: 650px; }
  .showcase-card { margin: 0 auto; }
}
@media (max-width: 640px) {
  .hero-section { padding: 62px 20px 82px; }
  .hero-section h1 { font-size: clamp(2.75rem, 13vw, 4rem); }
  .hero-subtext { margin-bottom: 28px; }
  .showcase-img-wrap { height: 330px; }
}

/* Compact category-preview hero */
.hero-section { min-height: 500px; height: min(650px, calc(100dvh - 118px)); box-sizing: border-box; padding-block: 56px; background: #fafafa; }
.hero-container { height: 100%; grid-template-columns: minmax(0, .9fr) minmax(360px, .8fr); gap: clamp(40px, 8vw, 110px); }
.hero-section h1 { max-width: 540px; font-size: clamp(3rem, 5vw, 3.75rem); letter-spacing: -.045em; }
.hero-eyebrow { color: #3b82f6; }
.hero-subtext { max-width: 390px; font-size: 1.05rem; }
.showcase-card { width: min(100%, 430px); padding: 22px; border-radius: 22px; transform: rotate(1.5deg); }
.showcase-card:hover { transform: rotate(0deg) translateY(-5px); }
.category-preview-header { display: flex; align-items: center; gap: 6px; margin-bottom: 24px; color: #8a919b; }
.category-preview-header > span { width: 7px; height: 7px; border-radius: 50%; background: #d5d9df; }
.category-preview-header small { margin-left: auto; font-size: .68rem; letter-spacing: .12em; text-transform: uppercase; }
.category-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.category-preview { position: relative; display: flex; flex-direction: column; justify-content: space-between; min-height: 128px; padding: 16px; box-sizing: border-box; overflow: hidden; border-radius: 14px; color: #20252c; background: #f0f2f4; transition: transform .25s ease, box-shadow .25s ease; }
.category-preview::after { position: absolute; width: 80px; height: 80px; right: -25px; bottom: -25px; content: ''; border-radius: 50%; background: rgba(255,255,255,.7); }
.category-preview:hover { transform: translateY(-3px); box-shadow: 0 10px 20px rgba(35, 40, 48, .09); }
.category-preview i { position: relative; z-index: 1; width: 31px; height: 31px; display: grid; place-items: center; border-radius: 9px; color: #fff; background: #3b82f6; font-size: .85rem; }
.category-preview span { position: relative; z-index: 1; font-size: .9rem; font-weight: 750; }
.category-preview b { position: absolute; z-index: 1; top: 13px; right: 14px; color: #9aa1aa; font-size: .65rem; font-weight: 700; }
.category-fashion { background: #f3f1ed; }.category-home { background: #eef3f1; }.category-essentials { background: #f1f1f5; }
.preview-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 22px; padding-top: 16px; border-top: 1px solid #eceef0; color: #858c95; font-size: .72rem; }.preview-footer i { color: #3b82f6; font-size: .85rem; }
@media (max-width: 900px) { .hero-section { height: auto; min-height: 0; padding-block: 64px 72px; }.hero-container { height: auto; }.hero-showcase { margin-top: 8px; } }
@media (max-width: 640px) { .hero-section { padding-block: 54px 66px; }.hero-section h1 { font-size: clamp(2.65rem, 12vw, 3.5rem); }.showcase-card { width: 100%; transform: none; }.category-preview { min-height: 112px; } }

/* Centered monochrome hero without category artwork */
.hero-section { min-height: 500px; height: min(620px, calc(100dvh - 118px)); background: #fafafa; }
.hero-container { grid-template-columns: 1fr; justify-items: center; }
.hero-copy { max-width: 720px; text-align: center; }
.hero-eyebrow { color: #70757d; }
.hero-section h1, .hero-subtext { margin-inline: auto; }
.hero-section h1 { max-width: 700px; }
.hero-subtext { max-width: 470px; }
.hero-copy .btn-primary { margin-inline: auto; }
.hero-showcase { display: none; }
@media (max-width: 900px) { .hero-section { height: auto; min-height: 500px; }.hero-container { grid-template-columns: 1fr; } }

/* Soft green compact hero carousel */
.hero-section { min-height: 0; height: clamp(500px, 62vh, 620px); padding: 48px 24px; background: #f7faf7; }
.hero-section::before { width: 420px; height: 420px; top: -190px; right: 12%; background: rgba(196, 220, 201, .42); }
.hero-container { height: 100%; grid-template-columns: minmax(0, .95fr) minmax(330px, .8fr); justify-items: stretch; gap: clamp(40px, 8vw, 110px); }
.hero-copy { max-width: 570px; text-align: left; align-self: center; }
.hero-eyebrow { color: #5c8064; }
.hero-section h1, .hero-subtext { margin-inline: 0; }
.hero-section h1 { max-width: 560px; font-size: clamp(3rem, 5vw, 3.75rem); }
.hero-subtext { max-width: 410px; }
.hero-copy .btn-primary { margin-inline: 0; background: #203b29; box-shadow: 0 10px 22px rgba(32, 59, 41, .16); }
.hero-copy .btn-primary:hover { background: #315a3d; box-shadow: 0 14px 28px rgba(32, 59, 41, .22); }
.hero-carousel { align-self: center; width: 100%; max-width: 440px; margin-left: auto; }
.carousel-window { position: relative; height: 330px; overflow: hidden; border: 1px solid #dce8de; border-radius: 24px; background: #eaf3eb; box-shadow: 0 22px 50px rgba(38, 73, 46, .12); }
.carousel-slide { position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: space-between; padding: 34px; overflow: hidden; animation: carousel-in .55s ease both; }
.carousel-slide::before { position: absolute; width: 250px; height: 250px; top: -95px; right: -45px; content: ''; border: 1px solid rgba(65, 111, 75, .18); border-radius: 50%; box-shadow: 0 0 0 24px rgba(65, 111, 75, .05), 0 0 0 48px rgba(65, 111, 75, .04); }
.carousel-slide:nth-child(2) { background: #f0f4ec; }.carousel-slide:nth-child(3) { background: #eef5f0; }
.slide-orbit { position: absolute; border: 1px solid rgba(65, 111, 75, .17); border-radius: 50%; }.orbit-one { width: 155px; height: 155px; right: 20px; bottom: -74px; }.orbit-two { width: 90px; height: 90px; right: 53px; bottom: -42px; }
.slide-icon { position: relative; z-index: 1; display: grid; place-items: center; width: 52px; height: 52px; border-radius: 15px; color: #fff; background: #416f4b; box-shadow: 0 10px 20px rgba(65, 111, 75, .2); font-size: 1.25rem; }
.slide-eyebrow { position: relative; z-index: 1; margin-top: auto; color: #6f8a75; font-size: .7rem; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; }.carousel-slide h2 { position: relative; z-index: 1; max-width: 300px; margin: 10px 0 28px; color: #203b29; font: 600 clamp(1.8rem, 3vw, 2.45rem)/1.05 Inter, Manrope, ui-sans-serif, system-ui, sans-serif; letter-spacing: -.04em; }.slide-footer { position: relative; z-index: 1; display: flex; justify-content: space-between; align-items: center; padding-top: 14px; border-top: 1px solid rgba(65, 111, 75, .16); color: #607663; font-size: .8rem; }.slide-footer i { color: #416f4b; }
.carousel-controls { display: flex; gap: 6px; justify-content: center; margin-top: 16px; }.carousel-controls button { width: 24px; height: 4px; padding: 0; border: 0; border-radius: 99px; background: #cbdacc; cursor: pointer; transition: width .25s, background .25s; }.carousel-controls button.active { width: 42px; background: #416f4b; }
@keyframes carousel-in { from { opacity: 0; transform: translateX(14px); } to { opacity: 1; transform: translateX(0); } }
@media (max-width: 900px) { .hero-section { height: auto; padding-block: 60px 72px; }.hero-container { height: auto; grid-template-columns: 1fr; }.hero-carousel { margin: 8px auto 0; } }
@media (max-width: 640px) { .hero-section { padding: 52px 20px 66px; }.hero-section h1 { font-size: clamp(2.7rem, 12vw, 3.5rem); }.carousel-window { height: 280px; }.carousel-slide { padding: 26px; } }

/* Restored simple hero */
.hero-section { height: auto; min-height: 500px; padding: 82px 24px 96px; background: #f6f1e9; }
.hero-section::before { width: 420px; height: 420px; top: -210px; right: 12%; background: rgba(255, 255, 255, .55); }
.hero-container { height: auto; grid-template-columns: 1fr; justify-items: center; }
.hero-copy { max-width: 720px; text-align: center; }
.hero-eyebrow { color: #756b5f; }
.hero-section h1, .hero-subtext { margin-inline: auto; }
.hero-section h1 { max-width: 700px; color: #24211e; }
.hero-subtext { max-width: 470px; color: #706a63; }
.hero-copy .btn-primary { margin-inline: auto; background: #24211e; box-shadow: 0 10px 22px rgba(36, 33, 30, .16); }
.hero-copy .btn-primary:hover { background: #48423b; box-shadow: 0 14px 28px rgba(36, 33, 30, .22); }
.hero-showcase, .hero-carousel { display: none; }
@media (max-width: 640px) { .hero-section { min-height: 500px; padding: 64px 20px 76px; } }
</style>
