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
            <el-tag type="danger">{{ orderItem.quantity }}</el-tag>
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
        <el-table-column label="款式BOM材料名称" width="150"><template #default="scope"><el-input v-model="scope.row.bomMaterialName" :disabled="!scope.row.isEditing" /></template></el-table-column>
        <el-table-column label="使用部位" width="120"><template #default="scope"><el-input v-model="scope.row.partUsed" :disabled="!scope.row.isEditing" /></template></el-table-column>
        <el-table-column label="材料类别" width="120"><template #default="scope"><el-input v-model="scope.row.materialCategory" :disabled="!scope.row.isEditing" /></template></el-table-column>
        <el-table-column label="材料货号" width="150"><template #default="scope"><el-input v-model="scope.row.materialItemNumber" :disabled="!scope.row.isEditing" /></template></el-table-column>
        <el-table-column label="材料名称" width="150"><template #default="scope"><el-input v-model="scope.row.materialName" :disabled="!scope.row.isEditing" /></template></el-table-column>
        <el-table-column label="颜色规则" width="120"><template #default="scope"><el-input v-model="scope.row.colorRule" :disabled="!scope.row.isEditing" /></template></el-table-column>
        <el-table-column label="规格规则" width="120"><template #default="scope"><el-input v-model="scope.row.specRule" :disabled="!scope.row.isEditing" /></template></el-table-column>
        <el-table-column label="用量规则" width="120"><template #default="scope"><el-input v-model="scope.row.consumptionRule" :disabled="!scope.row.isEditing" /></template></el-table-column>
        <el-table-column label="颜色" width="120"><template #default="scope"><el-input v-model="scope.row.color" :disabled="!scope.row.isEditing" /></template></el-table-column>
        <el-table-column label="规格" width="120"><template #default="scope"><el-input v-model="scope.row.spec" :disabled="!scope.row.isEditing" /></template></el-table-column>
        <el-table-column label="单件用量" width="150"><template #default="scope"><el-input-number v-model="scope.row.unitConsumption" :precision="3" :step="0.001" controls-position="right" style="width: 100%" :disabled="!scope.row.isEditing" /></template></el-table-column>
        <el-table-column label="单位" width="80"><template #default="scope"><el-input v-model="scope.row.unit" :disabled="!scope.row.isEditing" /></template></el-table-column>
        <el-table-column label="订单总用量" width="150">
            <template #default="scope">
                <strong style="color: #c02a2a;">{{ (scope.row.unitConsumption * orderItem.quantity).toFixed(3) }}</strong>
            </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="scope">
            <el-button v-if="scope.row.isEditing" type="success" size="small" @click="finishRowEdit(scope.row)">保存</el-button>
            <el-button v-else type="primary" size="small" @click="startRowEdit(scope.row)">编辑</el-button>
            <el-button type="danger" size="small" @click="removeMaterialRow(scope.$index)">删除</el-button>
          </template>
        </el-table-column>
    </el-table>

    <div class="page-footer">
      <el-button @click="goBack">取消</el-button>
      <el-button type="primary" @click="saveBom">保存整个BOM</el-button>
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

        const fetchedBom = await bomService.getOrCreateOrderBom(props.orderId, props.orderItemId);
        
        if (fetchedBom.materials) {
            fetchedBom.materials = fetchedBom.materials.map(m => ({ ...m, isEditing: false }));
        }
        bom.value = fetchedBom;

    } catch (error) {
        ElMessage.error(error.message || '加载页面数据失败');
    }
});

const addMaterialRow = () => {
    if (bom.value) {
        const newMaterial = {
            bomMaterialName: '', partUsed: '', materialCategory: '', materialItemNumber: '',
            materialName: '', colorRule: '', specRule: '', consumptionRule: '',
            color: '', spec: '', unitConsumption: 0, unit: '',
            isEditing: true
        };
        bom.value.materials.unshift(newMaterial);
    }
};

const removeMaterialRow = (index) => { if(bom.value) bom.value.materials.splice(index, 1); };

const saveBom = async () => {
    try {
        const materialsToSave = bom.value.materials.map(m => {
            const { isEditing, ...rest } = m;
            return rest;
        });
        await bomService.updateOrderBom(bom.value._id, materialsToSave);
        ElMessage.success('订单BOM保存成功！');
        goBack();
    } catch (error) {
        ElMessage.error('保存失败');
    }
};

const goBack = () => {
    router.push(`/dashboard/orders/edit/${props.orderId}`);
};

const startRowEdit = (row) => { row.isEditing = true; };
const finishRowEdit = (row) => { row.isEditing = false; };

const triggerFileInput = () => { fileInput.value.click(); };

const handleFileImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = e.target.result;
            const workbook = XLSX.read(data, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(worksheet);
            if (json.length === 0) { ElMessage.warning('Excel文件中没有可导入的数据。'); return; }
            const reverseHeaderMapping = { '序号': 'ignore', '款式BOM材料名称': 'bomMaterialName', '使用部位': 'partUsed', '材料类别': 'materialCategory', '材料货号': 'materialItemNumber', '材料名称': 'materialName', '颜色规则': 'colorRule', '规格规则': 'specRule', '用量规则': 'consumptionRule', '颜色': 'color', '规格': 'spec', '单件用量': 'unitConsumption', '单位': 'unit' };
            const importedMaterials = json.map(item => { 
                const newItem = { isEditing: true }; // Import new rows in edit mode
                for (const key in reverseHeaderMapping) { 
                    if (item[key] !== undefined && reverseHeaderMapping[key] !== 'ignore') { 
                        newItem[reverseHeaderMapping[key]] = item[key]; 
                    } 
                } 
                return newItem; 
            });
            if(!bom.value.materials) bom.value.materials = [];
            bom.value.materials.push(...importedMaterials);
            ElMessage.success(`成功导入 ${importedMaterials.length} 条物料。`);
        } catch (error) { ElMessage.error('文件解析失败，请确保文件格式或表头正确。'); }
    };
    reader.readAsBinaryString(file);
    event.target.value = '';
};

const exportToExcel = () => {
    if (!bom.value || bom.value.materials.length === 0) {
        ElMessage.warning('没有可导出的BOM数据。');
        return;
    }
    const headerMapping = { bomMaterialName: '款式BOM材料名称', partUsed: '使用部位', materialCategory: '材料类别', materialItemNumber: '材料货号', materialName: '材料名称', colorRule: '颜色规则', specRule: '规格规则', consumptionRule: '用量规则', color: '颜色', spec: '规格', unitConsumption: '单件用量', unit: '单位' };
    const dataToExport = bom.value.materials.map((item, index) => {
        const newItem = { '序号': index + 1 };
        for (const key in headerMapping) {
            newItem[headerMapping[key]] = item[key] || '';
        }
        return newItem;
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '订单产品BOM');
    
    const attributesString = Object.entries(orderItem.value.variantAttributes)
        .map(([key, value]) => `${key}${value}`)
        .join('-')
        .replace(/[\\/?*[\]]/g, '');
    
    const fileName = `${orderInfo.value.orderName}-${orderItem.value.styleNumber}-${attributesString}-BOM.xlsx`;
    XLSX.writeFile(workbook, fileName);
};
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