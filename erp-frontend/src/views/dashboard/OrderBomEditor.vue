<template>
  <div class="page-container" v-if="orderItem && bom">
    <div class="page-header">
      <el-button :icon="ArrowLeft" @click="goBack">返回订单详情</el-button>
    </div>

    <div class="bom-header">
      <div class="header-row primary-info">
        <h1>编辑订单产品BOM</h1>
        <p><strong>订单号:</strong> {{ orderInfo.orderNumber }}</p>
      </div>
      <el-divider style="margin: 12px 0;" />
      <div class="header-row attributes-info">
        <p><strong>款号:</strong> {{ orderItem.styleNumber }}</p>
        <p><strong>款式名称:</strong> {{ orderItem.styleName }}</p>
      </div>
      <div class="header-row attributes-info">
        <div v-for="(value, key) in orderItem.variantAttributes" :key="key" class="attribute-tag">
          <strong>{{ key }}:</strong>
          <el-tag type="info" size="small">{{ value }}</el-tag>
        </div>
        <div class="attribute-tag">
            <strong>订货数量:</strong>
            <el-tag type="danger" size="small">{{ orderItem.quantity }}</el-tag>
        </div>
      </div>
    </div>

    <div class="table-controls">
      <el-button @click="addMaterialRow" type="success">新增物料行</el-button>
      <div>
        <input type="file" ref="fileInput" @change="handleFileImport" accept=".xlsx, .xls" style="display: none;" />
        <el-button @click="triggerFileInput" type="primary">从Excel导入</el-button>
        <el-button @click="exportToExcel" type="info">导出Excel</el-button>
      </div>
    </div>
    
    <el-table :data="bom.materials" border style="width: 100%; margin-top:20px;" size="small">
        <el-table-column type="index" label="序号" width="55" />
        <el-table-column label="款式BOM材料名称" width="150"><template #default="scope"><el-input v-model="scope.row.bomMaterialName" /></template></el-table-column>
        <el-table-column label="使用部位" width="120"><template #default="scope"><el-input v-model="scope.row.partUsed" /></template></el-table-column>
        <el-table-column label="材料类别" width="120"><template #default="scope"><el-input v-model="scope.row.materialCategory" /></template></el-table-column>
        <el-table-column label="材料货号" width="150"><template #default="scope"><el-input v-model="scope.row.materialItemNumber" /></template></el-table-column>
        <el-table-column label="材料名称" width="150"><template #default="scope"><el-input v-model="scope.row.materialName" /></template></el-table-column>
        <el-table-column label="颜色" width="120"><template #default="scope"><el-input v-model="scope.row.color" /></template></el-table-column>
        <el-table-column label="规格" width="120"><template #default="scope"><el-input v-model="scope.row.spec" /></template></el-table-column>
        <el-table-column label="单件用量" width="150"><template #default="scope"><el-input-number v-model="scope.row.unitConsumption" :precision="3" :step="0.001" controls-position="right" style="width: 100%" /></template></el-table-column>
        <el-table-column label="单位" width="80"><template #default="scope"><el-input v-model="scope.row.unit" /></template></el-table-column>
        <el-table-column label="订单总用量" width="150" fixed="right">
            <template #default="scope">
                <strong style="color: #c02a2a;">{{ (scope.row.unitConsumption * orderItem.quantity).toFixed(3) }}</strong>
            </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
            <template #default="scope">
                <el-button type="danger" size="small" @click="removeMaterialRow(scope.$index)">删除</el-button>
            </template>
        </el-table-column>
    </el-table>

    <div class="page-footer">
      <el-button @click="goBack">取消</el-button>
      <el-button type="primary" @click="saveBom">保存BOM</el-button>
    </div>
  </div>
  <div v-else class="loading-full-page">正在加载BOM数据...</div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import bomService from '@/services/bom.service';
import orderService from '@/services/order.service';
import { ElMessage } from 'element-plus';
import { ArrowLeft } from '@element-plus/icons-vue';
import * as XLSX from 'xlsx';

const props = defineProps({ orderId: String, orderItemId: String });
const router = useRouter();
const fileInput = ref(null);

const orderInfo = ref(null);
const orderItem = ref(null);
const bom = ref(null);

onMounted(async () => {
    try {
        const fetchedOrder = await orderService.getOrder(props.orderId);
        orderInfo.value = fetchedOrder;
        orderItem.value = fetchedOrder.items.find(item => item._id === props.orderItemId);

        if (!orderItem.value) throw new Error('在订单中未找到指定的产品行');

        bom.value = await bomService.getOrCreateOrderBom(props.orderId, props.orderItemId);

    } catch (error) {
        ElMessage.error(error.message || '加载页面数据失败');
    }
});

const addMaterialRow = () => { if(bom.value) bom.value.materials.unshift({}); };
const removeMaterialRow = (index) => { if(bom.value) bom.value.materials.splice(index, 1); };

const saveBom = async () => {
    try {
        await bomService.updateOrderBom(bom.value._id, bom.value.materials);
        ElMessage.success('订单BOM保存成功！');
        goBack();
    } catch (error) {
        ElMessage.error('保存失败');
    }
};

const goBack = () => {
    router.push(`/dashboard/orders/edit/${props.orderId}`);
};

// 您可以将之前BomEditor的Excel导入导出逻辑完整地复制到这里
const triggerFileInput = () => { fileInput.value.click(); };
const handleFileImport = (event) => { /* ... 导入逻辑 ... */ };
const exportToExcel = () => { /* ... 导出逻辑 ... */ };

</script>

<style scoped>
.page-container { background-color: #f0f2f5; padding: 20px; }
.page-header { margin-bottom: 20px; }
.bom-header { background-color: #fff; padding: 15px 20px; margin-bottom: 20px; border-radius: 8px; border: 1px solid #e4e7ed; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
.header-row { display: flex; flex-wrap: wrap; gap: 10px 30px; align-items: center; }
.header-row h1 { font-size: 20px; margin: 0; color: #303133; }
.header-row p { margin: 0; font-size: 14px; color: #606266; }
.header-row p strong { color: #303133; margin-right: 5px; }
.attributes-info { margin-top: 5px; }
.attribute-tag { display: flex; align-items: center; gap: 8px; font-size: 14px; }
.attribute-tag strong { font-weight: 600; color: #303133; }
.table-controls { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;}
.page-footer { margin-top: 20px; text-align: center; }
.loading-full-page { text-align: center; padding: 100px; font-size: 18px; color: #909399;}
</style>