<template>
  <div class="sidebar">
    <div class="user-profile">
      <img :src="authStore.user?.avatarUrl" alt="User Avatar" class="avatar">
      <h3>{{ authStore.user?.applicantName }}</h3>
    </div>
    <nav class="menu">
      <router-link to="/dashboard/styles">款式管理</router-link>
      <router-link v-if="authStore.isAdmin" to="/dashboard/permissions">权限管理</router-link>
    </nav>
    <div class="logout-section">
      <button @click="authStore.logout()">退出系统</button>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '../../store/auth.store';
const authStore = useAuthStore();
</script>

<style scoped>
/* 添加一些基本样式 */
.sidebar { display: flex; flex-direction: column; height: 100vh; width: 200px; background-color: #f4f4f4; }
.user-profile { text-align: center; padding: 20px; }
.avatar { width: 80px; height: 80px; border-radius: 50%; }
.menu { flex-grow: 1; }
.menu a { display: block; padding: 10px 20px; text-decoration: none; color: #333; }
.menu a.router-link-active { background-color: #e0e0e0; }
.logout-section { padding: 20px; }
</style>