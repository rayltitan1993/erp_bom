<template>
  <div class="sidebar">
    <div class="user-profile">
      <img src="https://i.pravatar.cc/100" alt="User Avatar" class="avatar">
      <h3>{{ authStore.user?.applicantName || '管理员' }}</h3>
    </div>

    <nav class="menu">
      <router-link to="/dashboard/orders" class="nav-link">订单管理</router-link>      
      <router-link to="/dashboard/styles">款式管理</router-link>
      <router-link v-if="authStore.isAdmin" to="/dashboard/permissions">权限管理</router-link>
    </nav>


    <div class="logout-section">
      <el-button 
        class="logout-button" 
        @click="authStore.logout()"
      >
        退出系统
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '../../store/auth.store';
// 如果需要图标，可以从element-plus/icons-vue中引入
// import { SwitchButton } from '@element-plus/icons-vue';
const authStore = useAuthStore();
</script>

<style scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 240px;
  background-color: var(--erp-bg-sidebar);
  border-right: 1px solid var(--erp-border-color);
  padding: 20px 0;
  transition: width 0.3s ease;
  flex-shrink: 0;
}
.user-profile {
  text-align: center;
  padding: 20px;
  color: var(--erp-text-primary);
  border-bottom: 1px solid var(--erp-border-color);
  margin: 0 20px;
}
.avatar {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  margin-bottom: 10px;
}
.user-profile h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}
.menu {
  flex-grow: 1;
  margin-top: 20px;
  padding: 0 20px;
}
.menu a {
  display: flex;
  align-items: center;
  padding: 12px 15px;
  margin-bottom: 8px;
  text-decoration: none;
  color: var(--erp-text-secondary);
  font-weight: 500;
  border-radius: var(--erp-border-radius);
  transition: all 0.2s ease-in-out;
}
.menu a:hover {
  color: var(--erp-accent-primary);
  background-color: #FEF5EE;
}
.menu a.router-link-active {
  color: var(--erp-accent-primary);
  font-weight: 600;
  background-color: #FEF5EE;
}
.logout-section {
  padding: 20px;
  margin-top: auto; /* 将退出部分推至底部 */
  border-top: 1px solid var(--erp-border-color);
}
/* --- 新增的按钮样式 --- */
.logout-button {
  width: 100%;
  background-color: transparent !important;
  color: var(--erp-text-secondary) !important;
  border: 1px solid var(--erp-border-color) !important;
  font-weight: 500;
}
.logout-button:hover {
  background-color: #fbece0 !important;
  color: var(--erp-accent-primary) !important;
  border-color: var(--erp-accent-primary) !important;
}
</style>