<script setup lang="ts">
const contactEmail = import.meta.env.VITE_SUPPORT_EMAIL || 'support email coming soon'
</script>

<template>
  <main class="contact-page">
    <p class="eyebrow">NEPKART SUPPORT</p>
    <h1>Contact us</h1>
    <p class="intro">We are here to help with product questions, delivery updates, and order support.</p>
    <div class="contact-grid">
      <section>
        <i class="pi pi-map-marker" />
        <h2>Visit us</h2>
        <p>Bagar, Pokhara, Nepal</p>
      </section>
      <section>
        <i class="pi pi-envelope" />
        <h2>Email support</h2>
        <p>{{ contactEmail }}</p>
      </section>
      <section>
        <i class="pi pi-clock" />
        <h2>Support hours</h2>
        <p>Sunday to Friday, 10:00 to 17:00</p>
      </section>
    </div>
  </main>
</template>

<style scoped>
.contact-page { max-width: 980px; margin: auto; padding: 72px 24px 110px; color: #15233d; }
.eyebrow { color: #1769aa; font-size: .72rem; font-weight: 800; letter-spacing: .16em; }
h1 { margin: 8px 0; font: 500 clamp(2.4rem, 6vw, 4.2rem) Georgia, serif; }
.intro { max-width: 560px; color: #60758f; font-size: 1.05rem; line-height: 1.7; }
.contact-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 42px; }
.contact-grid section { border-top: 2px solid #1769aa; padding: 22px 4px; }
.contact-grid i { color: #1769aa; font-size: 1.3rem; }
.contact-grid h2 { margin: 20px 0 8px; font-size: 1.05rem; }
.contact-grid p { color: #60758f; margin: 0; line-height: 1.6; }
@media (max-width: 700px) { .contact-grid { grid-template-columns: 1fr; } }
</style>
