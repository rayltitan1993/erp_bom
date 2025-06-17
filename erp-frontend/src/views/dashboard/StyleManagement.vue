<template>
  <div>
    <div class="header-controls">
      <h1>款式管理</h1>
      </div>
    <div class="header-controls">
      <el-radio-group v-model="activeView">
        <el-radio-button label="active">当前款式</el-radio-button>
        <el-radio-button label="archived">已删除款式</el-radio-button>
      </el-radio-group>
      
      <div class="actions">
        <el-input v-model="searchQuery" placeholder="搜索款式名称/编号/品牌" clearable style="width: 240px; margin-right: 10px;" />
        <el-select v-model="sortOrder" placeholder="排序方式" style="width: 150px; margin-right: 20px;">
          <el-option label="按更新时间倒序" value="desc"></el-option>
          <el-option label="按更新时间正序" value="asc"></el-option>
        </el-select>
        <el-button type="primary" @click="addStyle" v-if="activeView === 'active'">添加款式产品</el-button>
      </div>
    </div>

    <el-table :data="displayedStyles" style="width: 100%" :empty-text="activeView === 'active' ? '没有找到款式' : '回收站为空'">
      <el-table-column prop="name" label="款式名称" />
      <el-table-column prop="styleNumber" label="款式编号" />
      <el-table-column prop="brand" label="品牌" />
      <el-table-column prop="updatedAt" :label="activeView === 'active' ? '最后更新' : '删除时间'">
        <template #default="scope">{{ new Date(scope.row.updatedAt).toLocaleString() }}</template>
      </el-table-column>
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="scope">
          <div v-if="activeView === 'active'">
            <el-button size="small" @click="goToDetails(scope.row._id)">款式详情</el-button>
            <el-button size="small" type="danger" @click="archiveStyle(scope.row._id)">删除款式</el-button>
          </div>
          <div v-else>
            <el-button size="small" type="success" @click="restoreStyle(scope.row._id)">恢复</el-button>
            <el-button size="small" type="danger" @click="permanentlyDelete(scope.row._id)">彻底删除</el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import styleService from '@/services/style.service';
import { ElMessage, ElMessageBox } from 'element-plus';

const router = useRouter();
const activeStyles = ref([]);
const archivedStyles = ref([]); // 新增state
const activeView = ref('active'); // active | archived
const sortOrder = ref('desc');
const searchQuery = ref('');

// 监听视图切换，并加载对应数据
watch(activeView, (newView) => {
  if (newView === 'active') {
    fetchActiveStyles();
  } else {
    fetchArchivedStyles();
  }
});

const displayedStyles = computed(() => {
  let sourceData = activeView.value === 'active' ? activeStyles.value : archivedStyles.value;
  // 筛选逻辑
  if (searchQuery.value) { /* ... 保持不变 ... */ }
  // 排序逻辑 (按updatedAt排序)
  sourceData.sort((a, b) => {
    const dateA = new Date(a.updatedAt);
    const dateB = new Date(b.updatedAt);
    return sortOrder.value === 'asc' ? dateA - dateB : dateB - a;
  });
  return sourceData;
});

// --- 数据获取 ---
const fetchActiveStyles = async () => { try { activeStyles.value = await styleService.getStyles(); } catch (e) { ElMessage.error('获取款式列表失败'); } };
const fetchArchivedStyles = async () => { try { archivedStyles.value = await styleService.getArchivedStyles(); } catch (e) { ElMessage.error('获取已删除列表失败'); } };

// --- 操作方法 ---
const addStyle = () => router.push('/dashboard/styles/new');
const goToDetails = (id) => router.push(`/dashboard/styles/edit/${id}`);

const archiveStyle = async (id) => {
  await ElMessageBox.confirm('确定要删除此款式吗？您可以在回收站中找回。', '删除确认', { type: 'warning' });
  try {
    await styleService.deleteStyle(id); // 调用软删除API
    ElMessage.success('已移至回收站');
    fetchActiveStyles();
  } catch (e) { ElMessage.error('删除失败'); }
};

const restoreStyle = async (id) => {
  try {
    await styleService.restoreStyle(id);
    ElMessage.success('款式已恢复');
    fetchArchivedStyles(); // 从回收站移除
    // 可选：切换回主列表 fetchActiveStyles(); activeView.value = 'active';
  } catch (e) { ElMessage.error('恢复失败'); }
};

const permanentlyDelete = async (id) => {
  await ElMessageBox.confirm('此操作将永久删除该款式及其所有数据，且无法恢复！确定要继续吗？', '永久删除警告', { type: 'error' });
  try {
    await styleService.permanentlyDeleteStyle(id);
    ElMessage.success('款式已永久删除');
    fetchArchivedStyles();
  } catch (e) { ElMessage.error('操作失败'); }
};

onMounted(fetchActiveStyles);
</script>

<style scoped>
.header-controls { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  margin-bottom: 20px; 
}
.actions {
  display: flex;
  align-items: center;
}
</style>