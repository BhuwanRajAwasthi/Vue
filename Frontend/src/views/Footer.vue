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
        <router-link to="/login">Account</router-link>
      </div>
      <small>© {{ new Date().getFullYear() }} NepKart. Secure shopping for everyone.</small>
    </div>
  </footer>
</template>

<style scoped>
.site-footer { margin-top: 56px; background: #17221d; color: #e8f0e8; }
.footer-inner { max-width: 1280px; margin: auto; padding: 28px 24px; display: flex; gap: 32px; align-items: center; justify-content: space-between; }
.footer-inner strong { color: #f4b942; font: 700 1.3rem Georgia, serif; }
.footer-inner p { margin: 6px 0 0; color: #aebcaf; font-size: .85rem; }
.footer-links { display: flex; gap: 18px; }
.footer-links a { color: #e8f0e8; text-decoration: none; font-size: .9rem; }
.footer-links a:hover { color: #f4b942; }
.footer-inner small { color: #aebcaf; }
@media (max-width: 680px) { .footer-inner { align-items: flex-start; flex-direction: column; gap: 18px; } }
</style>
