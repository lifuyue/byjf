<template>
  <section class="page">
    <h2>Teacher Workspace</h2>
    <p>
      This placeholder verifies routing and layout for the teacher experience. Replace it with class management views as
      features are prioritized.
    </p>
    <div class="page__actions">
      <button type="button">Sample Action</button>
      <button type="button" disabled>Coming Soon</button>
    </div>
  </section>
</template>

<script setup lang="ts">
// Composition utilities will live here once business logic arrives.
</script>

<style scoped>
.page {
  max-width: 720px;
  margin: 0 auto;
  padding: 2rem;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.08);
}

.page__actions {
  margin-top: 1.5rem;
  display: flex;
  gap: 1rem;
}

button {
  padding: 0.75rem 1.5rem;
  background: #2563eb;
  border: none;
  color: #ffffff;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s ease;
}

button:hover:enabled {
  background: #1d4ed8;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: #94a3b8;
}
</style>
