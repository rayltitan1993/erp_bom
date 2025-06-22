<template>
  <div class="page-container">
    <div class="page-header">
      <el-button :icon="ArrowLeft" @click="goBack">返回订单详情</el-button>
    </div>

    <div v-if="isLoading" class="loading-full-page">正在加载数据...</div>

    <div v-else-if="!productionBom" class="main-card">
        <div class="main-card-header">
            <div class="version-info">
                <strong>当前版本:</strong> <el-tag type="info" effect="dark" round>N/A</el-tag>
            </div>
             <el-button type="warning" @click="generateNewVersion" :loading="isGenerating">首次生成BOM</el-button>
        </div>
        <el-empty description="此订单尚未生成生产BOM，请点击右上角按钮首次生成。"></el-empty>
    </div>

    <div v-else>
      <div class="info-card" v-if="orderInfo">
        <h2>订单生产BOM</h2>
        <div class="info-grid">
          <div><label>订单名称</label><span>{{ orderInfo.orderName }}</span></div>
          <div><label>客户名称</label><span>{{ orderInfo.customerName }}</span></div>
          <div><label>订货日期</label><span>{{ new Date(orderInfo.orderDate).toLocaleDateString() }}</span></div>
          <div><label>总订货数量</label><span class="total-qty">{{ totalQuantity }}</span></div>
        </div>
      </div>

      <div class="main-card">
          <div class="main-card-header">
              <div class="version-info">
                  <strong>当前版本:</strong>
                  <el-tag type="success" effect="dark" round>{{ currentVersionLabel }}</el-tag>
              </div>
              <div class="actions">
                  <el-dropdown @command="handleVersionChange">
                      <el-button>版本管理<el-icon class="el-icon--right"><arrow-down /></el-icon></el-button>
                      <template #dropdown>
                          <el-dropdown-menu>
                              <el-dropdown-item v-for="v in productionBom.versions" :key="v.version" :command="v.version">
                                  BOM_V{{ v.version }} ({{ new Date(v.createdAt).toLocaleString() }})
                              </el-dropdown-item>
                          </el-dropdown-menu>
                      </template>
                  </el-dropdown>
                  <el-button @click="exportToExcel">导出</el-button>
                  <el-button type="warning" @click="generateNewVersion" :loading="isGenerating">
                      生成新版本
                  </el-button>
              </div>
          </div>

          <el-table :data="currentVersion?.materials" style="width: 100%; margin-top: 20px;" border v-loading="isGenerating">
              <el-table-column prop="productionBomItemId" label="编号" width="180" />
              <el-table-column prop="bomMaterialName" label="款式BOM材料名称" width="150" />
              <el-table-column prop="partUsed" label="使用部位" width="120" />
              <el-table-column prop="materialCategory" label="材料类别" width="120" />
              <el-table-column prop="materialItemNumber" label="材料货号" width="150" />
              <el-table-column prop="materialName" label="材料名称" width="150" />
              <el-table-column prop="color" label="颜色" width="120" />
              <el-table-column prop="spec" label="规格" width="120" />
              <el-table-column prop="totalConsumption" label="总用量" width="120">
                  <template #default="scope">{{ (scope.row.totalConsumption || 0).toFixed(3) }}</template>
              </el-table-column>
              <el-table-column prop="unit" label="单位" width="80" />
              </el-table>

          <div v-if="currentVersion && currentVersion.diff && !isDiffEmpty(currentVersion.diff)" class="diff-section">
              <h3>变更项目 (对比 V{{ currentVersion.version - 1 }})</h3>
              <div v-if="currentVersion.diff.added.length > 0" class="diff-block">
                  <h4>新增物料</h4>
                  <el-table :data="currentVersion.diff.added" size="small" style="width: 100%"><el-table-column prop="bomMaterialName" label="材料名称"/><el-table-column prop="totalConsumption" label="总用量"/></el-table>
              </div>
             <div v-if="currentVersion.diff.changed.length > 0" class="diff-block">
                  <h4>用量变更</h4>
                  <el-table :data="currentVersion.diff.changed" size="small" style="width: 100%"><el-table-column prop="after.bomMaterialName" label="材料名称"/><el-table-column label="变更前用量"><template #default="scope">{{scope.row.before.totalConsumption.toFixed(3)}}</template></el-table-column><el-table-column label="变更后用量"><template #default="scope">{{scope.row.after.totalConsumption.toFixed(3)}}</template></el-table-column></el-table>
             </div>
             <div v-if="currentVersion.diff.removed.length > 0" class="diff-block">
                  <h4>删除物料</h4>
                 <el-table :data="currentVersion.diff.removed" size="small" style="width: 100%"><el-table-column prop="bomMaterialName" label="材料名称"/><el-table-column prop="totalConsumption" label="原用量"/></el-table>
             </div>
          </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Script section remains the same as the last version.
// For completeness, it's included here.
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import productionBomService from '@/services/productionBom.service';
import orderService from '@/services/order.service';
import { ElMessage } from 'element-plus';
import { ArrowLeft, ArrowDown } from '@element-plus/icons-vue';
import * as XLSX from 'xlsx';

const props = defineProps({ orderId: String });
const router = useRouter();
const orderInfo = ref(null);
const productionBom = ref(null);
const currentVersion = ref(null);
const isGenerating = ref(false);
const isLoading = ref(true);

const totalQuantity = computed(() => orderInfo.value?.items.reduce((sum, item) => sum + item.quantity, 0) || 0);
const currentVersionLabel = computed(() => currentVersion.value ? `BOM_V${currentVersion.value.version}` : 'N/A');

const fetchData = async () => {
    isLoading.value = true;
    try {
        orderInfo.value = await orderService.getOrder(props.orderId);
        const bomData = await productionBomService.get(props.orderId);
        if (bomData) {
            updateProductionBomData(bomData);
        }
    } catch (e) {
        ElMessage.error("加载数据失败");
    } finally {
        isLoading.value = false;
    }
};

onMounted(fetchData);

const updateProductionBomData = (bomData) => {
    if (!bomData || !bomData.versions || bomData.versions.length === 0) {
        productionBom.value = null;
        currentVersion.value = null;
        return;
    }
    bomData.versions.sort((a, b) => a.version - b.version);
    productionBom.value = bomData;
    const latestVersion = bomData.versions[bomData.versions.length - 1];
    if (latestVersion) {
        handleVersionChange(latestVersion.version);
    }
};

const handleVersionChange = (versionNumber) => {
    if (!productionBom.value) return;
    currentVersion.value = productionBom.value.versions.find(v => v.version === versionNumber);
};

const generateNewVersion = async () => {
    isGenerating.value = true;
    try {
        const fullProdBom = await productionBomService.generate(props.orderId);
        updateProductionBomData(fullProdBom);
        ElMessage.success(`已成功生成版本 BOM_V${currentVersion.value.version}`);
    } catch(e) {
        ElMessage.error("生成新版本失败");
    } finally {
        isGenerating.value = false;
    }
};

const goBack = () => router.push(`/dashboard/orders/edit/${props.orderId}`);
const isDiffEmpty = (diff) => !diff || (diff.added.length === 0 && diff.changed.length === 0 && diff.removed.length === 0);
const exportToExcel = () => {
    if (!currentVersion.value || !currentVersion.value.materials || currentVersion.value.materials.length === 0) {
        ElMessage.warning('没有可导出的BOM数据。');
        return;
    }

    // 定义表头
    const headerMapping = {
        productionBomItemId: "编号",
        bomMaterialName: "款式BOM材料名称",
        partUsed: "使用部位",
        materialCategory: "材料类别",
        materialItemNumber: "材料货号",
        materialName: "材料名称",
        color: "颜色",
        spec: "规格",
        totalConsumption: "总用量",
        unit: "单位",
    };

    // 格式化数据以匹配表头
    const dataToExport = currentVersion.value.materials.map((item, index) => {
        const newItem = { '序号': index + 1 };
        for (const key in headerMapping) {
            newItem[headerMapping[key]] = item[key] || '';
        }
        return newItem;
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    const sheetName = currentVersionLabel.value.replace(/_/, '-');
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    // 生成文件名
    const fileName = `${orderInfo.value.orderName}-${orderInfo.value.orderNumber}-${currentVersionLabel.value}.xlsx`;
    
    // 触发下载
    XLSX.writeFile(workbook, fileName);
};
</script>

<style scoped>
/* Styles remain the same as the last version. */
.page-container { background-color: #f0f2f5; padding: 20px; }
.page-header { margin-bottom: 20px; }
.info-card, .main-card { background-color: #fff; padding: 24px; border-radius: 8px; margin-bottom: 20px; }
.info-card h2 { margin-top: 0; font-size: 18px; color: #303133; }
.info-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; }
.info-grid label { color: #909399; font-size: 14px; }
.info-grid span { font-size: 16px; color: #303133; }
.total-qty { font-weight: bold; color: #f56c6c; }
.main-card-header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 16px; border-bottom: 1px solid #e4e7ed;}
.version-info { display: flex; align-items: center; gap: 10px; font-size: 16px; }
.actions { display: flex; gap: 10px; }
.diff-section { margin-top: 30px; border-top: 1px dashed #dcdfe6; padding-top: 20px; }
.diff-section h3 { margin-top: 0; margin-bottom: 15px; }
.diff-block { margin-bottom: 10px; }
.diff-block h4 { font-size: 14px; margin-bottom: 8px; color: #303133; }
.page-footer { text-align: center; margin-top: 20px; }
.loading-full-page { text-align: center; padding: 100px; font-size: 18px; color: #909399;}
</style>