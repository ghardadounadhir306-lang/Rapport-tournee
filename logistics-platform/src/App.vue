<template>
  <div id="app" class="app">
    <NavBar />
    <main class="main-content">
      <RouterView />
    </main>
    <Footer />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from './stores/auth'
import NavBar from './components/NavBar.vue'
import Footer from './components/Footer.vue'

const authStore = useAuthStore()

onMounted(() => {
  authStore.initAuth()
})
</script>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main-content {
  flex: 1;
}
</style>
