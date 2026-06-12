<template>
  <nav class="navbar">
    <div class="container navbar-content">
      <div class="navbar-brand">
        <RouterLink to="/" class="logo">
          <span class="logo-icon">🚚</span>
          <span class="logo-text">LogisticHub</span>
        </RouterLink>
      </div>

      <div class="navbar-menu" :class="{ active: mobileMenuOpen }">
        <RouterLink to="/" class="nav-link" @click="closeMobileMenu">Home</RouterLink>
        <a href="#services" class="nav-link" @click="closeMobileMenu">Services</a>
        <a href="#stats" class="nav-link" @click="closeMobileMenu">About</a>
      </div>

      <div class="navbar-actions">
        <template v-if="authStore.isAuthenticated">
          <RouterLink to="/dashboard" class="btn btn-primary">Dashboard</RouterLink>
          <button @click="logout" class="btn btn-outline">Logout</button>
        </template>
        <template v-else>
          <RouterLink to="/login" class="btn btn-accent">Login</RouterLink>
        </template>
      </div>

      <button class="mobile-menu-btn" @click="mobileMenuOpen = !mobileMenuOpen">
        <span :class="{ open: mobileMenuOpen }"></span>
        <span :class="{ open: mobileMenuOpen }"></span>
        <span :class="{ open: mobileMenuOpen }"></span>
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const router = useRouter()
const mobileMenuOpen = ref(false)

const logout = () => {
  authStore.logout()
  mobileMenuOpen.value = false
  router.push('/')
}

const closeMobileMenu = () => {
  mobileMenuOpen.value = false
}
</script>

<style scoped>
.navbar {
  background-color: var(--color-primary);
  color: var(--color-white);
  padding: 16px 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.navbar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 40px;
}

.navbar-brand {
  flex-shrink: 0;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-white);
  transition: var(--transition);
}

.logo:hover {
  color: var(--color-accent);
}

.logo-icon {
  font-size: 1.8rem;
}

.logo-text {
  background: linear-gradient(135deg, var(--color-white), var(--color-accent));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.navbar-menu {
  display: flex;
  gap: 32px;
  flex: 1;
}

.nav-link {
  color: var(--color-white);
  font-weight: 500;
  font-size: 14px;
  position: relative;
  transition: var(--transition);
}

.nav-link:hover {
  color: var(--color-accent);
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 0;
  height: 2px;
  background-color: var(--color-accent);
  transition: var(--transition);
}

.nav-link:hover::after {
  width: 100%;
}

.navbar-actions {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-shrink: 0;
}

.mobile-menu-btn {
  display: none;
  flex-direction: column;
  background: none;
  padding: 8px;
  gap: 6px;
}

.mobile-menu-btn span {
  width: 24px;
  height: 2px;
  background-color: var(--color-white);
  border-radius: 1px;
  transition: var(--transition);
}

.mobile-menu-btn span.open:nth-child(1) {
  transform: rotate(45deg) translate(10px, 10px);
}

.mobile-menu-btn span.open:nth-child(2) {
  opacity: 0;
}

.mobile-menu-btn span.open:nth-child(3) {
  transform: rotate(-45deg) translate(8px, -8px);
}

@media (max-width: 768px) {
  .navbar-content {
    gap: 20px;
  }

  .navbar-menu {
    display: none;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background-color: var(--color-primary-dark);
    flex-direction: column;
    gap: 0;
    padding: 16px;
  }

  .navbar-menu.active {
    display: flex;
  }

  .nav-link {
    padding: 12px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .mobile-menu-btn {
    display: flex;
  }

  .navbar-actions {
    display: none;
  }

  .navbar-actions.active {
    display: flex;
  }
}
</style>
