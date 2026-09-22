<template>
  <footer class="site-footer">
    <div class="footer-inner">
      <div>
        <strong>NepKart</strong>
        <p>Everyday essentials, delivered with care.</p>
      </div>
      <div class="footer-links">
        <router-link to="/">Shop</router-link>
        <router-link to="/cart">Cart</router-link>
        <router-link to="/orders">Orders</router-link>
        <router-link to="/contact">Contact us</router-link>
      </div>
      <div class="footer-contact">
        <span><i class="pi pi-map-marker" /> Bagar, Pokhara, Nepal</span>
        <span><i class="pi pi-envelope" /> {{ supportEmail }}</span>
      </div>
      <div class="social-icons" aria-label="Social media">
        <span title="Facebook"><i class="pi pi-facebook" /></span>
        <span title="Instagram"><i class="pi pi-instagram" /></span>
        <span title="TikTok"><i class="pi pi-video" /></span>
      </div>
      <small>© {{ new Date().getFullYear() }} NepKart. Secure shopping for everyone.</small>
    </div>
  </footer>
</template>

<script setup>
const supportEmail = import.meta.env.VITE_SUPPORT_EMAIL || 'support email coming soon'
</script>

<style scoped>
.site-footer { margin-top: 56px; background: #17221d; color: #e8f0e8; }
.footer-inner { max-width: 1280px; margin: auto; padding: 28px 24px; display: flex; gap: 32px; align-items: center; justify-content: space-between; flex-wrap: wrap; }
.footer-inner strong { color: #f4b942; font: 700 1.3rem Georgia, serif; }
.footer-inner p { margin: 6px 0 0; color: #aebcaf; font-size: .85rem; }
.footer-links { display: flex; gap: 18px; }
.footer-links a { color: #e8f0e8; text-decoration: none; font-size: .9rem; }
.footer-links a:hover { color: #f4b942; }
.footer-contact { display: grid; gap: 7px; color: #aebcaf; font-size: .82rem; }
.footer-contact span, .social-icons span { display: inline-flex; align-items: center; gap: 8px; }
.footer-contact i, .social-icons i { color: #f4b942; }
.social-icons { display: flex; gap: 14px; color: #e8f0e8; font-size: 1.1rem; }
.footer-inner small { color: #aebcaf; }
@media (max-width: 680px) { .footer-inner { align-items: flex-start; flex-direction: column; gap: 18px; } }
</style>
