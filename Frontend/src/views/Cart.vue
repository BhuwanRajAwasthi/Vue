<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useProductStore } from "@/stores/pinia/productStore";
import { useAuthStore } from "@/stores/pinia/authStore";
const router = useRouter();
const store = useProductStore();
const auth = useAuthStore();
const checkoutOpen = ref(false);
const loading = ref(false);
const message = ref("");
const error = ref("");
const paymentMethod = ref("cash_on_delivery");
const address = ref({
  fullName: "",
  address: "",
  city: "",
  postalCode: "",
  country: "Nepal",
  phone: "",
});
const selectedItems = computed(() =>
  store.CartItems.filter((item) => item.selected),
);
const total = computed(() =>
  selectedItems.value.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  ),
);
const deliveryFee = 50;
const grandTotal = computed(() => total.value + deliveryFee);
function useSavedAddress() {
  if (!auth.user) return;
  paymentMethod.value = auth.user.preferredPayment || 'cash_on_delivery';
  address.value = { fullName: auth.user.name || '', address: auth.user.address || '', city: auth.user.city || '', postalCode: auth.user.postalCode || '', country: 'Nepal', phone: auth.user.phone || '' };
}
function hasSavedAddress() {
  return Boolean(auth.user?.name && auth.user?.phone && auth.user?.address && auth.user?.city && auth.user?.postalCode);
}
async function prepareCheckout() {
  if (hasSavedAddress()) await placeOrder();
  else checkoutOpen.value = true;
}
onMounted(() => {
  if (auth.isLoggedIn) { useSavedAddress(); store.loadCart().catch((err) => { error.value = err instanceof Error ? err.message : 'Unable to load cart.' }); }
});
function changeQuantity(item: any, amount: number) {
  item.quantity = Math.max(1, item.quantity + amount);
  store.saveCart();
}
function remove(item: any) {
  store.CartItems.splice(store.CartItems.indexOf(item), 1);
  store.saveCart();
}
async function placeOrder() {
  error.value = "";
  message.value = "";
  if (!auth.isLoggedIn) {
    router.push("/login");
    return;
  }
  if (!selectedItems.value.length) {
    error.value = "Select at least one item to continue.";
    return;
  }
  loading.value = true;
  try {
    await auth.updateProfile({ name: address.value.fullName, phone: address.value.phone, address: address.value.address, city: address.value.city, postalCode: address.value.postalCode, preferredPayment: paymentMethod.value });
    if (paymentMethod.value === "esewa") {
      const base = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
      const response = await fetch(`${base}/payments/esewa/initiate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${auth.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: grandTotal.value,
          shippingAddress: address.value,
          items: selectedItems.value.map((item) => ({
            product: item.product._id || item.product.id,
            quantity: item.quantity,
          })),
        }),
      });
      if (!response.ok) throw new Error("Unable to start eSewa payment.");
      const payment = await response.json();
      const paymentForm = document.createElement("form");
      paymentForm.method = "POST";
      paymentForm.action = payment.action;
      Object.entries(payment.fields).forEach(([key, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = String(value);
        paymentForm.appendChild(input);
      });
      document.body.appendChild(paymentForm);
      await store.removePurchasedItems();
      paymentForm.submit();
      return;
    }
    await store.checkout(address.value, {
      method: "cash_on_delivery",
      label: "Cash on Delivery",
    });
    await store.removePurchasedItems();
    message.value = "Order placed. Pay when your delivery arrives.";
    checkoutOpen.value = false;
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Unable to place order.";
  } finally {
    loading.value = false;
  }
}
</script>
<template>
  <main v-if="auth.isLoggedIn" class="cart-page">
    <div class="cart-heading">
      <div>
        <p class="kicker">YOUR SHOPPING BAG</p>
        <h1>Take it home.</h1>
      </div>
      <span
        >{{ store.cartCount }} item{{ store.cartCount === 1 ? "" : "s" }}</span
      >
    </div>
    <div v-if="message" class="success">{{ message }}</div>
    <div v-if="error" class="error">{{ error }}</div>
    <div v-if="store.CartItems.length" class="cart-layout">
      <section class="items">
        <article
          v-for="item in store.CartItems"
          :key="item.product._id || item.product.id"
          class="cart-item"
        >
          <input
            v-model="item.selected"
            type="checkbox"
            @change="store.saveCart"
          /><img
            :src="
              item.product.image || 'https://placehold.co/200x200?text=Product'
            "
            :alt="item.product.title"
          />
          <div class="item-info">
            <span>{{ item.product.category }}</span>
            <h2>{{ item.product.title }}</h2>
            <p>Rs. {{ item.product.price }} each</p>
            <div class="quantity">
              <button @click="changeQuantity(item, -1)">−</button
              ><b>{{ item.quantity }}</b
              ><button @click="changeQuantity(item, 1)">+</button>
            </div>
          </div>
          <div class="item-total">
            Rs. {{ item.product.price * item.quantity
            }}<button class="remove" @click="remove(item)">Remove</button>
          </div>
        </article>
      </section>
      <aside class="summary">
        <p class="kicker">ORDER SUMMARY</p>
        <div>
          <span>Subtotal</span><strong>Rs. {{ total }}</strong>
        </div>
        <div><span>Delivery</span><strong>Rs. {{ deliveryFee }}</strong></div>
        <hr />
        <div class="grand">
          <span>Total</span><strong>Rs. {{ grandTotal }}</strong>
        </div>
        <button
          class="checkout-btn"
          :disabled="!selectedItems.length"
          @click="prepareCheckout"
        >
          Prepare checkout <i class="pi pi-arrow-right" /></button
        ><small>Secure checkout · Cash on Delivery available</small>
      </aside>
    </div>
    <div v-else class="empty">
      <i class="pi pi-shopping-bag" />
      <h2>Your bag is waiting</h2>
      <p>Save something good for later.</p>
      <button class="checkout-btn" @click="router.push('/')">
        Browse products
      </button>
    </div>
    <div
      v-if="checkoutOpen"
      class="modal-backdrop"
      @click.self="checkoutOpen = false"
    >
      <form class="checkout-form" @submit.prevent="placeOrder">
        <button type="button" class="close" @click="checkoutOpen = false">
          ×
        </button>
        <p class="kicker">FINAL STEP</p>
        <h2>Save delivery details</h2>
        <input
          v-model="address.fullName"
          required
          placeholder="Full name"
        /><input
          v-model="address.phone"
          required
          placeholder="Phone number"
        /><input
          v-model="address.address"
          required
          placeholder="Street address"
        />
        <div class="split">
          <input v-model="address.city" required placeholder="City" /><input
            v-model="address.postalCode"
            required
            placeholder="Postal code"
          />
        </div>
        <div class="payment-options">
          <label
            ><input
              v-model="paymentMethod"
              type="radio"
              value="cash_on_delivery"
            />
            Cash on Delivery</label
          ><label
            ><input v-model="paymentMethod" type="radio" value="esewa" /> Pay
            with eSewa</label
          >
        </div>
        <button class="checkout-btn" :disabled="loading">
          {{ loading ? "Processing..." : `Place order · Rs. ${grandTotal}` }}
        </button>
      </form>
    </div>
  </main>
  <main v-else class="cart-page auth-required">
    <i class="pi pi-lock" />
    <h1>Sign in to view your bag</h1>
    <p>Your cart is saved securely to your account.</p>
    <button class="checkout-btn" @click="router.push('/login')">Sign in</button>
  </main>
</template>
<style scoped>
.cart-page {
  max-width: 1180px;
  margin: auto;
  padding: 48px 24px;
  color: #17221d;
}
.cart-heading {
  display: flex;
  justify-content: space-between;
  align-items: end;
  margin-bottom: 32px;
}
.kicker {
  color: #a17b31;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  margin: 0 0 12px;
}
.cart-heading h1 {
  font:
    500 3.4rem Georgia,
    serif;
  margin: 0;
}
.cart-heading > span {
  color: #55705d;
}
.cart-layout {
  display: grid;
  grid-template-columns: 1.5fr 0.8fr;
  gap: 35px;
  align-items: start;
}
.items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.cart-item {
  display: grid;
  grid-template-columns: auto 105px 1fr auto;
  gap: 18px;
  align-items: center;
  border-top: 1px solid #dfe7dc;
  padding: 18px 0;
}
.cart-item img {
  width: 105px;
  height: 105px;
  object-fit: contain;
  background: #f1f4ed;
  padding: 10px;
}
.item-info > span {
  font-size: 0.7rem;
  color: #a17b31;
  text-transform: uppercase;
}
.item-info h2 {
  font:
    600 1.15rem Georgia,
    serif;
  margin: 7px 0;
}
.item-info p {
  font-size: 0.83rem;
  color: #718172;
  margin: 0 0 12px;
}
.quantity {
  display: flex;
  align-items: center;
  gap: 15px;
}
.quantity button {
  border: 1px solid #cbd8ca;
  background: white;
  width: 28px;
  height: 28px;
  cursor: pointer;
}
.item-total {
  text-align: right;
  font-weight: 700;
}
.remove {
  display: block;
  border: 0;
  background: none;
  color: #a54e3b;
  cursor: pointer;
  font-size: 0.72rem;
  margin-top: 12px;
}
.summary {
  background: #f1f4ed;
  padding: 25px;
  position: sticky;
  top: 85px;
}
.summary > div {
  display: flex;
  justify-content: space-between;
  margin: 14px 0;
  color: #55705d;
}
.summary hr {
  border: 0;
  border-top: 1px solid #d0dbcf;
}
.summary .grand {
  font-size: 1.2rem;
  color: #17221d;
}
.checkout-btn {
  width: 100%;
  padding: 14px;
  border: 0;
  background: #2e6041;
  color: white;
  font-weight: 700;
  cursor: pointer;
}
.checkout-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.summary small {
  display: block;
  text-align: center;
  color: #718172;
  margin-top: 14px;
}
.empty {
  text-align: center;
  padding: 100px 20px;
  border: 1px dashed #bac9b8;
}
.empty > i {
  font-size: 2rem;
  color: #2e6041;
}
.empty h2 {
  font:
    500 2rem Georgia,
    serif;
}
.empty .checkout-btn {
  width: auto;
  padding: 12px 22px;
}
.success,
.error {
  padding: 12px;
  margin-bottom: 20px;
}
.success {
  background: #e5f3e4;
  color: #28613b;
}
.error {
  background: #fbe8e3;
  color: #a54e3b;
}
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: #17221d99;
  display: grid;
  place-items: center;
  padding: 20px;
  z-index: 20;
}
.checkout-form {
  background: #fbfaf4;
  padding: 30px;
  max-width: 480px;
  width: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.checkout-form h2 {
  font:
    500 2rem Georgia,
    serif;
  margin: 0 0 10px;
}
.checkout-form input {
  padding: 12px;
  border: 1px solid #cbd8ca;
  background: white;
}
.split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.cod {
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid #b9cbb8;
  padding: 13px;
  background: #eff7ed;
  color: #2e6041;
}
.cod span {
  flex: 1;
}
.cod small {
  display: block;
  color: #718172;
  margin-top: 3px;
}
.close {
  position: absolute;
  right: 15px;
  top: 10px;
  border: 0;
  background: none;
  font-size: 1.7rem;
  cursor: pointer;
}
@media (max-width: 760px) {
  .cart-layout {
    grid-template-columns: 1fr;
  }
  .summary {
    position: static;
  }
  .cart-heading h1 {
    font-size: 2.5rem;
  }
  .cart-item {
    grid-template-columns: auto 75px 1fr;
  }
  .cart-item img {
    width: 75px;
    height: 75px;
  }
  .item-total {
    grid-column: 3;
    text-align: left;
  }
  .split {
    grid-template-columns: 1fr;
  }
}
</style>
