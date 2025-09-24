<template>
  <div class="layout">
    <header class="layout__header">
      <h1>PG-Plus Admin Console</h1>
    </header>
    <main class="layout__content">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router';
// TODO: Mount global admin providers (state, permissions) when ready.
</script>

<style scoped>
.layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.layout__header {
  padding: 1rem;
  background: #111827;
  color: #f9fafb;
}

.layout__content {
  flex: 1;
  padding: 2rem;
}
</style>
