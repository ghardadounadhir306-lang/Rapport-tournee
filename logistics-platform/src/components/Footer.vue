<template>
  <footer class="footer">
    <div class="container footer-content">
      <div class="footer-section">
        <h4>LogisticHub</h4>
        <p>Professional logistics management platform for modern businesses.</p>
      </div>

      <div class="footer-section">
        <h5>Quick Links</h5>
        <ul>
          <li><RouterLink to="/">Home</RouterLink></li>
          <li><a href="#services">Services</a></li>
          <li><RouterLink to="/login">Login</RouterLink></li>
        </ul>
      </div>

      <div class="footer-section">
        <h5>Contact</h5>
        <ul>
          <li>Email: info@logistichub.com</li>
          <li>Phone: +1 (800) 123-4567</li>
          <li>Address: 123 Business St, City, State</li>
        </ul>
      </div>

      <div class="footer-section">
        <h5>Follow Us</h5>
        <div class="social-links">
          <a href="#" class="social-link">Facebook</a>
          <a href="#" class="social-link">Twitter</a>
          <a href="#" class="social-link">LinkedIn</a>
        </div>
      </div>
    </div>

    <div class="footer-bottom">
      <p>&copy; 2024 LogisticHub. All rights reserved.</p>
    </div>
  </footer>
</template>

<script setup lang="ts">
</script>

<style scoped>
.footer {
  background-color: var(--color-primary);
  color: var(--color-white);
  padding: 48px 0 24px;
  margin-top: auto;
}

.footer-content {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 32px;
  margin-bottom: 32px;
}

.footer-section h4,
.footer-section h5 {
  color: var(--color-white);
  margin-bottom: 16px;
}

.footer-section p {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
}

.footer-section ul {
  list-style: none;
}

.footer-section li {
  margin-bottom: 8px;
}

.footer-section a {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  transition: var(--transition);
}

.footer-section a:hover {
  color: var(--color-accent);
}

.social-links {
  display: flex;
  gap: 16px;
}

.social-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background-color: rgba(255, 107, 53, 0.2);
  border-radius: 50%;
  transition: var(--transition);
}

.social-link:hover {
  background-color: var(--color-accent);
  color: var(--color-primary);
}

.footer-bottom {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 24px;
  text-align: center;
}

.footer-bottom p {
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  margin: 0;
}

@media (max-width: 768px) {
  .footer-content {
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
  }
}

@media (max-width: 480px) {
  .footer-content {
    grid-template-columns: 1fr;
  }
}
</style>
