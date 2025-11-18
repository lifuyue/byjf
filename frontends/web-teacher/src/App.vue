<template>
  <div class="layout">
    <header class="layout__header">
      <h1>PG-Plus Teacher Portal</h1>
      <p class="layout__subtitle">Scaffold ready for future classroom features.</p>
    </header>
    <main class="layout__content">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router';
</script>

<style scoped>
.layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f4f5f7;
}

.layout__header {
  padding: 1.5rem 2rem;
  background: #1f2937;
  color: #f9fafb;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.layout__subtitle {
  margin-top: 0.5rem;
  opacity: 0.8;
  font-size: 0.95rem;
}

.layout__content {
  flex: 1;
  padding: 2rem;
}
</style>
