<template>
  <div>
    <div class="header-controls">
      <h1>款式产品库</h1>
      <div class="actions">
        <el-input
          v-model="searchQuery"
          placeholder="搜索款式名称/编号/品牌"
          clearable
          style="width: 240px; margin-right: 10px;"
        />
        
        <el-select v-model="sortOrder" placeholder="排序方式" style="width: 150px; margin-right: 20px;">
          <el-option label="按添加时间倒序" value="desc"></el-option>
          <el-option label="按添加时间正序" value="asc"></el-option>
        </el-select>
        
        <el-button type="primary" @click="addStyle">添加款式产品</el-button>
      </div>
    </div>

    <el-table :data="filteredAndSortedStyles" style="width: 100%">
      <el-table-column prop="name" label="款式名称" />
      <el-table-column prop="styleNumber" label="款式编号" />
      <el-table-column prop="brand" label="品牌" />
      <el-table-column prop="createdAt" label="添加时间">
        <template #default="scope">{{ new Date(scope.row.createdAt).toLocaleString() }}</template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="scope">
          <el-button size="small" @click="goToDetails(scope.row._id)">款式详情</el-button>
          <el-button size="small" type="danger" @click="deleteStyle(scope.row._id)">删除款式</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import styleService from '../../services/style.service';
import { ElMessage, ElMessageBox } from 'element-plus';

const router = useRouter();

// --- 状态管理 ---
const styles = ref([]); // 原始的、从后端获取的完整列表
const sortOrder = ref('desc'); // 排序状态
const searchQuery = ref(''); // 新增：搜索查询字符串状态

// --- 核心逻辑：计算属性 ---
// 这个计算属性会响应式地根据 searchQuesry 和 sortOrder 的变化，自动返回最终要显示的数据
const filteredAndSortedStyles = computed(() => {
  let processedStyles = [...styles.value];

  // 第一步：执行筛选
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase().trim();
    processedStyles = processedStyles.filter(style => 
      (style.name && style.name.toLowerCase().includes(query)) ||
      (style.styleNumber && style.styleNumber.toLowerCase().includes(query)) ||
      (style.brand && style.brand.toLowerCase().includes(query))
    );
  }

  // 第二步：在筛选结果的基础上执行排序
  processedStyles.sort((a, b) => {
    const dateA = new Date(a.createdAt);
    const dateB = new Date(b.createdAt);
    return sortOrder.value === 'asc' ? dateA - dateB : dateB - a;
  });

  return processedStyles;
});


// --- 方法 ---
async function fetchStyles() {
  try {
    styles.value = await styleService.getStyles();
  } catch (error) {
    ElMessage.error('获取款式列表失败');
  }
}

function addStyle() {
  router.push('/dashboard/styles/new');
}

function goToDetails(id) {
  router.push(`/dashboard/styles/edit/${id}`);
}

async function deleteStyle(id) {
  ElMessageBox.confirm('确定要永久删除这个款式及其所有相关数据吗?', '警告', {
    type: 'warning',
  }).then(async () => {
    try {
      await styleService.deleteStyle(id);
      ElMessage.success('删除成功');
      fetchStyles(); // 删除后重新获取完整列表
    } catch (error) {
      ElMessage.error('删除失败');
    }
  });
}

onMounted(fetchStyles);
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