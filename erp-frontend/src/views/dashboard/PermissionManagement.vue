<template>
  <div>
    <h1>权限管理</h1>

    <el-divider content-position="left"><h2>待审批用户</h2></el-divider>
    <el-table :data="pendingUsers" style="width: 100%" empty-text="当前没有待审批的申请">
      <el-table-column prop="applicantName" label="申请人" />
      <el-table-column prop="department" label="所属部门" />
      <el-table-column prop="username" label="申请账号" />
      <el-table-column prop="createdAt" label="申请时间">
        <template #default="scope">{{ new Date(scope.row.createdAt).toLocaleString() }}</template>
      </el-table-column>
      <el-table-column label="操作">
        <template #default="scope">
          <el-button size="small" type="primary" @click="handleApprove(scope.row._id)">批准</el-button>
          <el-button size="small" type="danger" @click="handleReject(scope.row._id)">拒绝</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-divider content-position="left" style="margin-top: 40px;"><h2>已授权用户</h2></el-divider>
    <el-table :data="approvedUsers" style="width: 100%" empty-text="当前没有已授权的用户">
      <el-table-column prop="applicantName" label="姓名" />
      <el-table-column prop="department" label="所属部门" />
      <el-table-column prop="username" label="登录账号" />
      <el-table-column prop="role" label="角色" />
      <el-table-column label="操作">
        <template #default="scope">
          <el-button v-if="scope.row.username !== 'admin'" size="small" type="danger" @click="handleDelete(scope.row._id)">
            删除权限
          </el-button>
        </template>
      </el-table-column>
    </el-table>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import userService from '../../services/user.service';
import { ElMessage, ElMessageBox } from 'element-plus';

const pendingUsers = ref([]);
const approvedUsers = ref([]); // 新增 state 用于存放已授权用户

// 获取待审批用户数据
async function fetchPendingUsers() {
  try {
    pendingUsers.value = await userService.getPendingUsers();
  } catch (error) {
    ElMessage.error('获取待审批列表失败');
  }
}

// 获取已授权用户数据 (新增函数)
async function fetchApprovedUsers() {
  try {
    approvedUsers.value = await userService.getApprovedUsers();
  } catch (error) {
    ElMessage.error('获取已授权列表失败');
  }
}

// 批准操作
async function handleApprove(id) {
  try {
    await userService.approveUser(id);
    ElMessage.success('操作成功：已批准');
    // 刷新两个列表，因为一个用户会从待审批移动到已授权
    fetchPendingUsers();
    fetchApprovedUsers();
  } catch (error) {
    ElMessage.error('操作失败');
  }
}

// 拒绝操作
async function handleReject(id) {
    try {
        await userService.rejectUser(id);
        ElMessage.info('操作成功：已拒绝');
        fetchPendingUsers(); // 只刷新待审批列表
    } catch (error) {
        ElMessage.error('操作失败');
    }
}

// 删除权限操作 (新增函数)
async function handleDelete(id) {
  ElMessageBox.confirm('确定要永久删除此用户的权限吗？此操作不可逆。', '警告', {
    type: 'warning',
  }).then(async () => {
    try {
      await userService.deleteUser(id);
      ElMessage.success('用户权限已删除');
      fetchApprovedUsers(); // 刷新已授权列表
    } catch (error) {
      ElMessage.error(error.response?.data?.message || '删除失败');
    }
  });
}

// 组件加载时，同时获取两个列表的数据
onMounted(() => {
  fetchPendingUsers();
  fetchApprovedUsers();
});
</script>