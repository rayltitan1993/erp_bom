<template>
  <div class="register-container">
    <el-card class="register-card">
      <h2>注册申请</h2>
      <el-form @submit.prevent="handleSubmit" :model="form">
        <el-form-item label="申请人">
          <el-input v-model="form.applicantName"></el-input>
        </el-form-item>
        <el-form-item label="所属部门">
          <el-input v-model="form.department"></el-input>
        </el-form-item>
        <el-form-item label="账号">
          <el-input v-model="form.username"></el-input>
        </el-form-item>
        <el-form-item label="密码">
          <el-input type="password" v-model="form.password"></el-input>
        </el-form-item>
        <el-form-item label="确认密码">
          <el-input type="password" v-model="form.confirmPassword"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" native-type="submit">提交申请</el-button>
          <el-button @click="$router.push('/login')">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { reactive } from 'vue';
import authService from '../services/auth.service';
import { ElMessage } from 'element-plus';
import router from '../router';

const form = reactive({ applicantName: '', department: '', username: '', password: '', confirmPassword: '' });

async function handleSubmit() {
  if (form.password !== form.confirmPassword) {
    ElMessage.error('两次输入的密码不一致');
    return;
  }
  try {
    const response = await authService.register(form);
    ElMessage.success(response.message);
    router.push('/login');
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '申请失败');
  }
}
</script>
<style scoped>
.register-container { display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #f0f2f5; }
.register-card { width: 500px; }
</style>