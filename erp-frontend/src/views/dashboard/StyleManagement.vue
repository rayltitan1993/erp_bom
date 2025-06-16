<template>
  <div>
    <div class="header-controls">
      <h1>款式产品库</h1>
      <div class="actions">
        <el-select v-model="sortOrder" placeholder="排序方式" style="width: 150px; margin-right: 10px;"><el-option label="按添加时间倒序" value="desc"></el-option><el-option label="按添加时间正序" value="asc"></el-option></el-select>
        <el-radio-group v-model="viewMode" style="margin-right: 20px;"><el-radio-button label="grid">模块</el-radio-button><el-radio-button label="list">列表</el-radio-button></el-radio-group>
        <el-button type="primary" @click="addStyle">添加款式产品</el-button>
      </div>
    </div>
    <el-table v-if="viewMode === 'list'" :data="sortedStyles" style="width: 100%"><el-table-column prop="name" label="款式名称" /><el-table-column prop="styleNumber" label="款式编号" /><el-table-column prop="brand" label="品牌" /><el-table-column prop="createdAt" label="添加时间"><template #default="scope">{{ new Date(scope.row.createdAt).toLocaleString() }}</template></el-table-column><el-table-column label="操作"><template #default="scope"><el-button size="small" @click="goToDetails(scope.row._id)">款式详情</el-button><el-button size="small" type="danger" @click="deleteStyle(scope.row._id)">删除款式</el-button></template></el-table-column></el-table>
    <div v-if="viewMode === 'grid'" class="grid-container">
      <el-card v-for="style in sortedStyles" :key="style._id" class="grid-item"><div class="card-content"><h3>{{ style.name }}</h3><p>款号: {{ style.styleNumber }}</p><p>品牌: {{ style.brand }}</p><p>添加于: {{ new Date(style.createdAt).toLocaleDateString() }}</p></div><div class="card-actions"><el-button text @click="goToDetails(style._id)">款式详情</el-button><el-button text type="danger" @click="deleteStyle(style._id)">删除款式</el-button></div></el-card>
    </div>
  </div>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import styleService from '../../services/style.service';
import { ElMessage, ElMessageBox } from 'element-plus';
const router = useRouter();
const styles = ref([]);
const viewMode = ref('grid');
const sortOrder = ref('desc');
const sortedStyles = computed(() => [...styles.value].sort((a, b) => { const dateA = new Date(a.createdAt); const dateB = new Date(b.createdAt); return sortOrder.value === 'asc' ? dateA - dateB : dateB - dateA; }));
async function fetchStyles() { try { styles.value = await styleService.getStyles(); } catch (error) { ElMessage.error('获取款式列表失败'); } }
function addStyle() { router.push('/dashboard/styles/new'); }
function goToDetails(id) { router.push(`/dashboard/styles/edit/${id}`); }
async function deleteStyle(id) { ElMessageBox.confirm('确定要永久删除这个款式及其所有相关数据吗?', '警告', { type: 'warning', }).then(async () => { try { await styleService.deleteStyle(id); ElMessage.success('删除成功'); fetchStyles(); } catch (error) { ElMessage.error('删除失败'); } }); }
onMounted(fetchStyles);
</script>
<style scoped>
.header-controls { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.grid-container { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px; }
.grid-item { display: flex; flex-direction: column; justify-content: space-between; }
.card-actions { border-top: 1px solid #ebeef5; padding-top: 10px; margin-top: 10px; text-align: right; }
</style>