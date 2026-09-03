<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useProductStore, type product } from "@/stores/pinia/productStore";

const router = useRouter();
const productStore = useProductStore();

const sortBy = ref<string>("featured");
const addedProductId = ref<string | number | null>(null);
const newsletterEmail = ref<string>("");
const newsletterSubscribed = ref<boolean>(false);

onMounted(() => {
  productStore.fetchProducts();
});

function browseCatalog() {
  document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" });
}

function selectCategory(cat: string) {
  productStore.selectedCategory = cat;
}

function quickAddToCart(p: product, event: MouseEvent) {
  event.stopPropagation();
  void productStore.addToCart(p, 1);
  const id = p._id || p.id || null;
  addedProductId.value = id;
  setTimeout(() => {
    if (addedProductId.value === id) {
      addedProductId.value = null;
    }
  }, 1500);
}

function handleNewsletter() {
  if (newsletterEmail.value.trim()) {
    newsletterSubscribed.value = true;
    newsletterEmail.value = "";
    setTimeout(() => {
      newsletterSubscribed.value = false;
    }, 4000);
  }
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
</script>

<template>
  <main class="home-page">
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-container">
        <div class="hero-copy">
          <div class="hero-badge">
            <span class="pulse-dot"></span>
            <span>2026 Collection • Fast Delivery Across Nepal</span>
          </div>
          <h1>
            Thoughtful Living.<br />
            <em>Delivered Daily.</em>
          </h1>
          <p class="hero-subtext">
            Explore premium fashion, modern electronics, and everyday essentials curated for quality, longevity, and genuine value.
          </p>
          <div class="hero-cta-group">
            <button class="btn-primary" @click="browseCatalog">
              <span>Explore Collection</span>
              <i class="pi pi-arrow-down" />
            </button>
            <button class="btn-secondary" @click="selectCategory('All'); browseCatalog()">
              <span>View All Items</span>
              <i class="pi pi-arrow-right" />
            </button>
          </div>
          <div class="hero-trust-metrics">
            <div class="metric">
              <strong>5,000+</strong>
              <span>Verified Orders</span>
            </div>
            <div class="metric-divider"></div>
            <div class="metric">
              <strong>100%</strong>
              <span>Authentic Items</span>
            </div>
            <div class="metric-divider"></div>
            <div class="metric">
              <strong>4.9 ★</strong>
              <span>Customer Rating</span>
            </div>
          </div>
        </div>

        <div class="hero-showcase">
          <div class="showcase-card">
            <div class="showcase-tag">Featured Pick</div>
            <div class="showcase-img-wrap">
              <img
                src="https://picsum.photos/seed/ecommerce-1/600/600"
                alt="Featured product"
              />
            </div>
            <div class="showcase-details">
              <div class="showcase-rating">★★★★★ <span>(4.9)</span></div>
              <h4>Everyday Comfort Collection</h4>
              <div class="showcase-price-row">
                <span class="price-val">From Rs. 1,299</span>
                <span class="cod-badge"><i class="pi pi-check-circle" /> COD Ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Value Highlights / Guarantees Strip -->
    <section class="features-strip">
      <div class="features-container">
        <div class="feature-card">
          <div class="feature-icon"><i class="pi pi-truck" /></div>
          <div class="feature-text">
            <strong>Fast Doorstep Delivery</strong>
            <p>Reliable transit to your door across all major cities in Nepal</p>
          </div>
        </div>
        <div class="feature-card">
          <div class="feature-icon"><i class="pi pi-wallet" /></div>
          <div class="feature-text">
            <strong>Cash on Delivery</strong>
            <p>Inspect your items upon arrival before paying safely</p>
          </div>
        </div>
        <div class="feature-card">
          <div class="feature-icon"><i class="pi pi-shield" /></div>
          <div class="feature-text">
            <strong>100% Authentic Quality</strong>
            <p>Every piece is strictly vetted for genuine materials</p>
          </div>
        </div>
        <div class="feature-card">
          <div class="feature-icon"><i class="pi pi-headphones" /></div>
          <div class="feature-text">
            <strong>Dedicated Support</strong>
            <p>Friendly customer care available 7 days a week</p>
          </div>
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
        <div class="search-box">
          <i class="pi pi-search search-icon" />
          <input
            v-model="productStore.searchItem"
            type="search"
            placeholder="Search products by title..."
            aria-label="Search products"
          />
          <button
            v-if="productStore.searchItem"
            type="button"
            class="clear-btn"
            aria-label="Clear search query"
            @click="productStore.searchItem = ''"
          >
            <i class="pi pi-times" />
          </button>
        </div>

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
          v-for="p in sortedProducts"
          :key="p._id || p.id"
          class="product-card"
          @click="router.push({ name: 'product', params: { id: p._id || p.id } })"
        >
          <div class="card-media">
            <span class="card-badge">{{ p.category }}</span>
            <img
              :src="p.image || 'https://placehold.co/600x600?text=Product'"
              :alt="p.title"
              loading="lazy"
            />
          </div>

          <div class="card-content">
            <div class="card-rating">
              <span class="stars">★★★★★</span>
              <span class="rating-num">4.8</span>
            </div>

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

    <!-- Promotional Spotlight Banner -->
    <section class="promo-banner-section">
      <div class="promo-banner">
        <div class="promo-content">
          <span class="promo-tag">LIMITED TIME OFFER</span>
          <h2>Special Discount on First Order</h2>
          <p>Get flat 10% off your entire cart with code <strong>NEPKART10</strong> at checkout.</p>
          <button class="btn-promo" @click="browseCatalog">
            <span>Shop Now & Save</span>
            <i class="pi pi-arrow-right" />
          </button>
        </div>
        <div class="promo-badge-circle">
          <span class="discount-num">10%</span>
          <span class="discount-text">OFF</span>
        </div>
      </div>
    </section>

    <!-- Customer Reviews / Testimonials -->
    <section class="testimonials-section">
      <div class="testimonials-header">
        <span class="section-kicker">COMMUNITY FEEDBACK</span>
        <h2>Trusted by Shoppers Across Nepal</h2>
      </div>

      <div class="testimonials-grid">
        <div class="testimonial-card">
          <div class="stars">★★★★★</div>
          <p>“Received my package in Kathmandu within two days. The fabric quality and fit exceeded expectations, and Cash on Delivery was super smooth!”</p>
          <div class="author-info">
            <span class="author-avatar">A</span>
            <div>
              <strong>Aarav Sharma</strong>
              <small>Verified Buyer • Kathmandu</small>
            </div>
          </div>
        </div>

        <div class="testimonial-card">
          <div class="stars">★★★★★</div>
          <p>“NepKart has become my go-to store. Accurate product descriptions, genuine quality, and really friendly customer support when I had a question.”</p>
          <div class="author-info">
            <span class="author-avatar">P</span>
            <div>
              <strong>Pooja Thapa</strong>
              <small>Verified Buyer • Pokhara</small>
            </div>
          </div>
        </div>

        <div class="testimonial-card">
          <div class="stars">★★★★★</div>
          <p>“Fast checkout and straightforward experience. Ordered an electronic gadget and it arrived in pristine packaging. Highly recommended!”</p>
          <div class="author-info">
            <span class="author-avatar">B</span>
            <div>
              <strong>Bikash Shrestha</strong>
              <small>Verified Buyer • Lalitpur</small>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Newsletter Section -->
    <section class="newsletter-section">
      <div class="newsletter-card">
        <div class="newsletter-content">
          <h2>Join the NepKart Family</h2>
          <p>Subscribe for exclusive access to seasonal drops, flash sales, and early-bird discount codes.</p>
          <form class="newsletter-form" @submit.prevent="handleNewsletter">
            <input
              v-model="newsletterEmail"
              type="email"
              placeholder="Enter your email address..."
              required
              aria-label="Email address for newsletter"
            />
            <button type="submit" class="btn-subscribe">
              <span>Subscribe</span>
              <i class="pi pi-send" />
            </button>
          </form>
          <p v-if="newsletterSubscribed" class="subscribe-success">
            <i class="pi pi-check-circle" /> Thank you! You've been subscribed successfully.
          </p>
        </div>
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
</style>
