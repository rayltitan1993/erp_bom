<template>
  <div class="order-management-container">
    <div class="header">
      <el-button :icon="ArrowLeft" @click="goBack" circle />
      <h1 style="margin-left: 20px;">历史订单</h1>
      <p>查看已完成或已删除的订单记录</p>
    </div>

    <div class="controls">
      <el-input v-model="filters.search" placeholder="订单号/名称/客户" clearable class="search-input">
        <template #append>
          <el-button :icon="Search" @click="fetchHistory" />
        </template>
      </el-input>
      <el-select v-model="filters.order" placeholder="排序方式" style="width: 180px;">
        <el-option label="按更新时间倒序" value="desc"></el-option>
        <el-option label="按更新时间正序" value="asc"></el-option>
      </el-select>
    </div>

    <div v-if="loading" class="loading-state">加载中...</div>
    <div v-else-if="orders.length === 0" class="empty-state">
      <p>暂无历史订单记录...</p>
    </div>
    <div v-else class="order-list">
      <div v-for="order in orders" :key="order._id" class="order-card">
        <div class="card-item order-number">{{ order.orderNumber }}</div>
        <div class="card-item order-name">{{ order.orderName }}</div>
        <div class="card-item customer-name">{{ order.customerName }}</div>
        <div class="card-item order-date">{{ new Date(order.updatedAt).toLocaleString() }}</div>
        <div class="card-item status-tag">
          <el-tag :type="order.status === '已完成' ? 'success' : 'danger'" disable-transitions>{{ order.status }}</el-tag>
        </div>
        <div class="card-item actions">
          <el-button v-if="order.status === '已完成'" type="success" plain size="small" @click="handleReorder(order._id)">再来一单</el-button>
          <el-button v-if="order.status === '已删除'" type="primary" plain size="small" @click="handleRestore(order._id)">恢复订单</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import orderService from '@/services/order.service';
import { ElMessage } from 'element-plus';
import { Search, ArrowLeft } from '@element-plus/icons-vue';

const router = useRouter();
const loading = ref(true);
const orders = ref([]);
const filters = reactive({
  search: '',
  sortBy: 'updatedAt',
  order: 'desc'
});

const fetchHistory = async () => {
  loading.value = true;
  try {
    orders.value = await orderService.getOrderHistory(filters);
  } catch (error) {
    ElMessage.error('获取历史订单失败');
  } finally {
    loading.value = false;
  }
};

watch(filters, fetchHistory, { deep: true });
onMounted(fetchHistory);

const goBack = () => router.push('/dashboard/orders');

const handleRestore = async (id) => {
  try {
    await orderService.restoreOrder(id);
    ElMessage.success('订单已恢复');
    fetchHistory();
  } catch (error) {
    ElMessage.error('恢复失败');
  }
};

const handleReorder = async (id) => {
  try {
    const newOrder = await orderService.reorder(id);
    ElMessage.success('已成功复制为新订单，正在跳转...');
    router.push(`/dashboard/orders/edit/${newOrder._id}`);
  } catch (error) {
    ElMessage.error('操作失败');
  }
};
</script>

<style scoped>
.order-management-container { padding: 20px; }
.header { position: relative; border-bottom: 1px solid #e4e7ed; padding-bottom: 20px; margin-bottom: 20px; display: flex; align-items: center; }
.header h1 { font-size: 28px; margin: 0; }
.header p { color: #909399; margin-top: 5px; margin-left: 20px; }
.history-btn { position: absolute; right: 0; top: 0; }
.controls { display: flex; gap: 15px; margin-bottom: 20px; align-items: center; }
.search-input { width: 300px; }
.order-list { display: flex; flex-direction: column; gap: 15px; }
.order-card { display: flex; align-items: center; padding: 15px 20px; background-color: #fff; border-radius: 8px; box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1); }
.card-item { padding: 0 15px; border-right: 1px solid #f0f2f5; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.card-item:last-child { border-right: none; }
.order-number { font-weight: bold; flex: 1.2; }
.order-name { flex: 2; }
.customer-name { flex: 1; color: #606266; }
.order-date { flex: 1; color: #909399; }
.status-tag { flex: 0.8; text-align: center; }
.actions { flex: 1.5; text-align: right; }
.empty-state { text-align: center; padding: 80px 0; color: #909399; }
.loading-state { text-align: center; padding: 80px 0; color: #909399; }
</style>