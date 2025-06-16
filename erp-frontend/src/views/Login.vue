<template>
  <div class="login-container">
    <el-card class="login-card">
      <h2>ERP 系统登录</h2>
      <el-form @submit.prevent="handleLogin" :model="form" ref="loginForm">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="账号 (admin)"></el-input>
        </el-form-item>
        <el-form-item prop="password">
          <el-input type="password" v-model="form.password" placeholder="密码 (newasia)"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" native-type="submit" style="width: 100%;">登录</el-button>
        </el-form-item>
        <div class="footer-links">
          <router-link to="/register">注册新账号</router-link>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { reactive } from 'vue';
import { useAuthStore } from '../store/auth.store';
import { ElMessage } from 'element-plus';

const authStore = useAuthStore();
const form = reactive({ username: '', password: '' });

async function handleLogin() {
  try {
    await authStore.login(form);
    ElMessage.success('登录成功');
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '登录失败');
  }
}
</script>

<style scoped>
.login-container { display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #f0f2f5; }
.login-card { width: 400px; }
.footer-links { text-align: center; }
</style>