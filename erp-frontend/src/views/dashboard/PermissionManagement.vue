<template>
  <div>
    <h1>权限审批</h1>
    <el-table :data="pendingUsers" style="width: 100%">
      <el-table-column prop="applicantName" label="申请人" />
      <el-table-column prop="department" label="所属部门" />
      <el-table-column prop="username" label="申请账号" />
      <el-table-column prop="createdAt" label="申请时间">
        <template #default="scope">
            {{ new Date(scope.row.createdAt).toLocaleString() }}
        </template>
      </el-table-column>
      <el-table-column label="操作">
        <template #default="scope">
          <el-button size="small" type="primary" @click="handleApprove(scope.row._id)">批准</el-button>
          <el-button size="small" type="danger" @click="handleReject(scope.row._id)">拒绝</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import userService from '../../services/user.service'; // 封装好的API调用
import { ElMessage } from 'element-plus';

const pendingUsers = ref([]);

async function fetchPendingUsers() {
  try {
    const response = await userService.getPendingUsers();
    pendingUsers.value = response;
  } catch (error) {
    ElMessage.error('获取待审批列表失败');
  }
}

async function handleApprove(id) {
  try {
    await userService.approveUser(id);
    ElMessage.success('操作成功');
    fetchPendingUsers(); // 重新加载列表
  } catch (error) {
    ElMessage.error('操作失败');
  }
}

// handleReject 函数类似

onMounted(() => {
  fetchPendingUsers();
});
</script>