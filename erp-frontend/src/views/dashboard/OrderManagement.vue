<template>
  <div class="order-management-container">
    <div class="header">
      <h1>订单管理</h1>
      <p>进行订单与订单生产BOM管理</p>
      <el-button class="history-btn" @click="goToHistory">历史订单</el-button>
    </div>

    <div class="controls">
      <el-button type="warning" @click="addOrder">添加新订单</el-button>
      <el-select v-model="filters.status" placeholder="订单状态" clearable style="width: 140px;">
        <el-option label="未开始" value="未开始"></el-option>
        <el-option label="审批中" value="审批中"></el-option>
        <el-option label="采购中" value="采购中"></el-option>
        <el-option label="生产中" value="生产中"></el-option>
      </el-select>
      <el-input v-model="filters.search" placeholder="订单号/名称/客户" clearable class="search-input">
        <template #append>
          <el-button :icon="Search" @click="fetchOrders" />
        </template>
      </el-input>
      <el-select v-model="filters.order" placeholder="排序方式" style="width: 180px;">
        <el-option label="按更新时间倒序" value="desc"></el-option>
        <el-option label="按更新时间正序" value="asc"></el-option>
      </el-select>
    </div>

    <div v-if="loading" class="loading-state">加载中...</div>
    <div v-else-if="orders.length === 0" class="empty-state">
      <p>暂无进行中的订单...</p>
    </div>
    <div v-else class="order-list">
      <div v-for="order in orders" :key="order._id" class="order-card">
        <div class="card-item order-number">{{ order.orderNumber }}</div>
        <div class="card-item order-name">{{ order.orderName }}</div>
        <div class="card-item customer-name">{{ order.customerName }}</div>
        <div class="card-item order-date">{{ new Date(order.orderDate).toLocaleDateString() }}</div>
        <div class="card-item status-tag">
          <el-tag :type="getStatusType(order.status)" disable-transitions>{{ order.status }}</el-tag>
        </div>
        <div class="card-item actions">
          <el-button type="warning" size="small" @click="viewDetails(order._id)">订单详情</el-button>
          <el-button type="danger" plain size="small" @click="handleDelete(order._id)">删除订单</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import orderService from '@/services/order.service';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search } from '@element-plus/icons-vue';

const router = useRouter();
const loading = ref(true);
const orders = ref([]);
const filters = reactive({
  search: '',
  status: '',
  sortBy: 'updatedAt',
  order: 'desc'
});

const fetchOrders = async () => {
  loading.value = true;
  try {
    orders.value = await orderService.getOrders(filters);
  } catch (error) {
    ElMessage.error('获取订单列表失败');
  } finally {
    loading.value = false;
  }
};

watch(filters, fetchOrders, { deep: true });
onMounted(fetchOrders);

const getStatusType = (status) => {
  const statusMap = {
    '未开始': 'info',
    '审批中': 'primary',
    '采购中': 'warning',
    '生产中': 'success',
  };
  return statusMap[status] || 'default';
};

const addOrder = () => router.push('/dashboard/orders/new');
const viewDetails = (id) => router.push(`/dashboard/orders/edit/${id}`);
const goToHistory = () => router.push('/dashboard/orders/history');

const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除此订单吗？删除后可在历史订单中恢复。', '删除确认', { type: 'warning' });
    await orderService.deleteOrder(id);
    ElMessage.success('订单已删除');
    fetchOrders(); // 刷新列表
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败');
    }
  }
};
</script>

<style scoped>
.order-management-container { padding: 20px; }
.header { position: relative; border-bottom: 1px solid #e4e7ed; padding-bottom: 20px; margin-bottom: 20px; }
.header h1 { font-size: 28px; margin: 0; }
.header p { color: #909399; margin-top: 5px; }
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