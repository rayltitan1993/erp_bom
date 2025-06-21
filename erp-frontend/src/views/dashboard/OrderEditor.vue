<template>
  <div class="page-container" v-if="orderStore.order">
    <div class="page-header">
      <el-button :icon="ArrowLeft" @click="goBack">返回订单管理</el-button>
    </div>

    <div class="order-details-card">
      <div class="top-section">
        <el-tag size="large">{{ orderStore.order.status }}</el-tag>
        <div class="top-actions">
          <el-button :disabled="isEditing">审批管理</el-button>
          <el-button :disabled="isEditing">导出</el-button>
        </div>
      </div>

      <div class="info-grid">
        <div>
          <label>订单名称</label>
          <el-input v-model="orderStore.order.orderName" :disabled="!isEditing" />
        </div>
        <div>
          <label>客户名称</label>
          <el-input v-model="orderStore.order.customerName" :disabled="!isEditing || !isNewOrder" />
        </div>
        <div>
          <label>订货日期</label>
          <el-date-picker v-model="orderStore.order.orderDate" type="date" style="width: 100%;" :disabled="!isEditing" />
        </div>
        <div>
          <label>总订货数量</label>
          <div class="info-text">{{ totalQuantity }}</div>
        </div>
        <div>
          <label>订单编号</label>
          <div class="info-text">{{ orderStore.order.orderNumber || '保存后自动生成' }}</div>
        </div>
        <div>
          <el-button type="warning" size="large" style="width: 100%; margin-top: 24px;" :disabled="isEditing">订单生产BOM</el-button>
        </div>
      </div>
    </div>

    <div class="products-card">
      <h2>订单产品信息</h2>
      <el-button type="success" @click="openSkuSelector" :icon="Plus" :disabled="!isEditing">添加产品SKU</el-button>
      
      <el-table :data="orderStore.order.items" style="width: 100%; margin-top: 20px;">
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="styleNumber" label="款号" width="150" />
        <el-table-column prop="styleName" label="款式名称" />
        <el-table-column label="颜色/尺码等属性" >
            <template #default="scope">
                <el-tag v-for="([key, value]) in Object.entries(scope.row.variantAttributes || {})" :key="key" type="info" size="small" style="margin-right: 5px;">
                    {{key}}: {{value}}
                </el-tag>
            </template>
        </el-table-column>
        <el-table-column label="订货数量" width="180" align="center">
            <template #default="scope">
                <el-input-number v-model="scope.row.quantity" :min="1" controls-position="right" :disabled="!isEditing" style="width: 120px;" />
            </template>
        </el-table-column>
        <el-table-column label="操作" width="180" align="center">
          <template #default="scope">
            <el-button
              type="primary"
              link
              @click="editOrderBom(scope.row)"
              :disabled="isEditing || !orderStore.order._id"
            >
              编辑BOM
            </el-button>
            <el-button type="danger" link @click="removeItem(scope.$index)" :disabled="!isEditing">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="page-footer">
      <el-button :disabled="!isEditing">提交审批</el-button>
      <el-button type="primary" @click="handleSave" :disabled="!isEditing">保存</el-button>
      <el-button @click="handleEdit" :disabled="isEditing">编辑</el-button>
      <el-button @click="goBack">取消</el-button>
    </div>

    <el-dialog v-model="skuSelectorVisible" title="选择产品SKU" width="70%" top="5vh">
        <el-autocomplete
          v-model="searchStyleQuery"
          :fetch-suggestions="searchStyles"
          placeholder="第一步：通过款号或名称搜索款式"
          @select="handleStyleSelect"
          style="width: 100%; margin-bottom: 20px;"
          size="large"
        />
        
        <div v-if="selectedStyle.variants" class="sku-table-container">
            <p>第二步：勾选需要添加的SKU</p>
            <el-table :data="selectedStyle.variants" height="400" style="width: 100%;" @selection-change="handleSkuSelectionChange">
                <el-table-column type="selection" width="55" />
                <el-table-column v-for="attr in selectedStyle.variantAttributeSchema" :key="attr" :label="attr" :prop="`attributes.${attr}`" />
            </el-table>
        </div>

        <template #footer>
            <span class="dialog-footer">
                <el-button @click="skuSelectorVisible = false">取消</el-button>
                <el-button type="primary" @click="addSelectedSkusToOrder" :disabled="selectedSkus.length === 0">确认添加</el-button>
            </span>
        </template>
    </el-dialog>

  </div>
  <div v-else class="loading-full-page">正在加载订单...</div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router';
import { useOrderStore } from '@/store/order.store.js';
import styleService from '@/services/style.service';
import { ArrowLeft, Plus } from '@element-plus/icons-vue';
import { ElMessageBox, ElMessage } from 'element-plus';

const route = useRoute();
const router = useRouter();
const orderStore = useOrderStore();
const isNewOrder = computed(() => !route.params.id);

const isEditing = ref(false);

const skuSelectorVisible = ref(false);
const searchStyleQuery = ref('');
const selectedStyle = ref({});
const selectedSkus = ref([]);

const totalQuantity = computed(() => {
    if (!orderStore.order || !orderStore.order.items) return 0;
    return orderStore.order.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
});

onMounted(() => {
  const orderId = route.params.id;
  if (orderId) {
    isEditing.value = false;
    orderStore.fetchOrder(orderId);
  } else {
    isEditing.value = true;
    orderStore.setNewOrder();
  }
});

onBeforeUnmount(() => { orderStore.clearOrder(); });

onBeforeRouteLeave((to, from, next) => {
  if (isEditing.value && orderStore.hasUnsavedChanges()) {
    ElMessageBox.confirm('您正在编辑，有未保存的更改，确定要离开吗？', '提示', { type: 'warning' })
      .then(() => next())
      .catch(() => next(false));
  } else {
    next();
  }
});

const openSkuSelector = () => {
    searchStyleQuery.value = '';
    selectedStyle.value = {};
    selectedSkus.value = [];
    skuSelectorVisible.value = true;
};

const searchStyles = async (queryString, cb) => {
    if (!queryString) return cb([]);
    try {
        const styles = await styleService.searchStyles(queryString);
        cb(styles.map(s => ({ ...s, value: `${s.styleNumber} / ${s.name}` })));
    } catch (error) {
        ElMessage.error("搜索款式失败");
        cb([]);
    }
};

const handleStyleSelect = async (style) => {
    try {
        selectedStyle.value = await styleService.getStyle(style._id);
    } catch (e) {
        ElMessage.error("获取款式详情失败");
        selectedStyle.value = {};
    }
};

const handleSkuSelectionChange = (val) => {
    selectedSkus.value = val;
};

const addSelectedSkusToOrder = () => {
    const newItems = selectedSkus.value.map(variant => ({
        styleId: selectedStyle.value._id,
        styleName: selectedStyle.value.name,
        styleNumber: selectedStyle.value.styleNumber,
        variantId: variant._id,
        variantAttributes: variant.attributes,
        quantity: 1,
    }));

    orderStore.order.items = [...orderStore.order.items, ...newItems];
    skuSelectorVisible.value = false;
};

const removeItem = (index) => {
    const newItems = [...orderStore.order.items];
    newItems.splice(index, 1);
    orderStore.order.items = newItems;
};

const handleEdit = () => {
    isEditing.value = true;
};

const handleSave = async () => {
    try {
        const savedOrder = await orderStore.saveOrder();
        isEditing.value = false;
        if (isNewOrder.value && savedOrder) {
            router.replace(`/dashboard/orders/edit/${savedOrder._id}`);
        }
    } catch (e) { /* error handled in store */ }
};

// NEW: Method to navigate to the order BOM editor
const editOrderBom = (item) => {
    router.push(`/dashboard/orders/${orderStore.order._id}/item/${item._id}/bom`);
};

const goBack = () => {
  router.push('/dashboard/orders');
};
</script>

<style scoped>
.page-container { background-color: #f0f2f5; padding: 20px; }
.page-header { margin-bottom: 20px; }
.order-details-card, .products-card { background-color: #fff; padding: 24px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
.top-section { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px 40px; align-items: flex-start; }
.info-grid label { display: block; color: #606266; margin-bottom: 8px; font-size: 14px; }
.info-text { font-size: 16px; font-weight: 500; height: 32px; line-height: 32px; color: #303133; }
.products-card h2 { margin-top: 0; font-size: 18px; color: #303133; }
.page-footer { display: flex; justify-content: center; gap: 15px; margin-top: 30px; }
.loading-full-page { text-align: center; padding: 100px; font-size: 18px; color: #909399;}
.sku-table-container { border-top: 1px solid #e4e7ed; margin-top: 20px; padding-top: 20px; }
.sku-table-container p { font-size: 14px; color: #303133; margin-bottom: 10px; }
.dialog-footer { display: flex; justify-content: flex-end; }
</style>