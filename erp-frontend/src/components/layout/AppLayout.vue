<template>
  <div class="app-container">
    <Sidebar />
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import Sidebar from './SideBar.vue';
</script>

<style scoped>
.app-container {
  display: flex;
  /* 关键：设置容器高度为整个视口高度 */
  height: 100vh;
  /* 关键：防止容器本身产生滚动条 */
  overflow: hidden; 
  background-color: var(--erp-bg-main);
}

.main-content {
  flex-grow: 1; /* 占据剩余所有空间 */
  padding: 24px;
  /* 关键：当内容超出时，只在主内容区内部产生垂直滚动条 */
  overflow-y: auto; 
}
</style>