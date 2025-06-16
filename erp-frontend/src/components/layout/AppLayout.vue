<template>
  <div class="app-container">
    <Sidebar />
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import Sidebar from './Sidebar.vue';
</script>

<style scoped>
.app-container {
  display: flex;
}
.main-content {
  flex-grow: 1;
  padding: 20px;
  height: 100vh;
  overflow-y: auto;
}
</style>