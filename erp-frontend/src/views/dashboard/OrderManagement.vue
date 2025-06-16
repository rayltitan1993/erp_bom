<template>
  <div>
    <div class="header-controls">
      <h1>订单管理</h1>
      </div>

    <el-card class="placeholder-card">
      <el-empty description="订单管理功能正在开发中..."></el-empty>
    </el-card>
  </div>
</template>

<script setup>
// 目前不需要任何逻辑
</script>

<style scoped>
.header-controls { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  margin-bottom: 20px; 
}
.placeholder-card {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}
</style>