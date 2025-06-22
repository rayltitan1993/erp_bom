<template>
  <div class="page-container" v-if="style && variant && bom">
    <div class="page-header">
      <el-button :icon="ArrowLeft" @click="goBack">返回款式详情</el-button>
    </div>

    <div class="bom-header">
      </div>

    <div class="table-controls">
      </div>
    
    <el-table :data="bom.materials" border style="width: 100%; margin-top:20px;" size="small">
        <el-table-column type="index" label="序号" width="55" />
        <el-table-column label="款式BOM材料名称" width="150"><template #default="scope"><el-input v-model="scope.row.bomMaterialName" /></template></el-table-column>
        <el-table-column label="使用部位" width="120"><template #default="scope"><el-input v-model="scope.row.partUsed" /></template></el-table-column>
        <el-table-column label="材料类别" width="120"><template #default="scope"><el-input v-model="scope.row.materialCategory" /></template></el-table-column>
        <el-table-column label="材料货号" width="150"><template #default="scope"><el-input v-model="scope.row.materialItemNumber" /></template></el-table-column>
        <el-table-column label="材料名称" width="150"><template #default="scope"><el-input v-model="scope.row.materialName" /></template></el-table-column>
        
        <el-table-column label="颜色规则" width="120"><template #default="scope"><el-input v-model="scope.row.colorRule" /></template></el-table-column>
        <el-table-column label="规格规则" width="120"><template #default="scope"><el-input v-model="scope.row.specRule" /></template></el-table-column>
        <el-table-column label="用量规则" width="120"><template #default="scope"><el-input v-model="scope.row.consumptionRule" /></template></el-table-column>

        <el-table-column label="颜色" width="120"><template #default="scope"><el-input v-model="scope.row.color" /></template></el-table-column>
        <el-table-column label="规格" width="120"><template #default="scope"><el-input v-model="scope.row.spec" /></template></el-table-column>
        <el-table-column label="单件用量" width="150"><template #default="scope"><el-input-number v-model="scope.row.unitConsumption" :precision="3" :step="0.001" controls-position="right" style="width: 100%" /></template></el-table-column>
        <el-table-column label="单位" width="80"><template #default="scope"><el-input v-model="scope.row.unit" /></template></el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
            <template #default="scope">
                <el-button type="danger" size="small" @click="removeMaterialRow(scope.$index)">删除</el-button>
            </template>
        </el-table-column>
    </el-table>

    <div class="page-footer">
      <el-button @click="goBack">取消</el-button>
      <el-button type="primary" @click="saveBom">保存BOM模板</el-button>
    </div>
  </div>
  <div v-else class="loading-full-page">正在加载BOM模板数据...</div>
</template>

<script setup>
// The script section remains the same as the last version.
// For completeness, it's included here.
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import bomService from '@/services/bom.service';
import styleService from '@/services/style.service';
import { ElMessage } from 'element-plus';
import { ArrowLeft } from '@element-plus/icons-vue';
import * as XLSX from 'xlsx';

const props = defineProps({ styleId: String, variantId: String });
const router = useRouter();
const fileInput = ref(null);

const style = ref(null);
const variant = ref(null);
const bom = ref(null);

onMounted(async () => {
    try {
        const fetchedStyle = await styleService.getStyle(props.styleId);
        style.value = fetchedStyle;
        variant.value = fetchedStyle.variants.find(v => v._id === props.variantId);

        if (!variant.value) throw new Error('在款式中未找到指定的SKU');

        const templateBom = await bomService.getTemplateBom(props.styleId, props.variantId);
        bom.value = templateBom || { materials: [] };
    } catch (error) {
        ElMessage.error(error.message || '加载页面数据失败');
    }
});

const addMaterialRow = () => { if(bom.value) bom.value.materials.unshift({}); };
const removeMaterialRow = (index) => { if(bom.value) bom.value.materials.splice(index, 1); };

const saveBom = async () => {
    try {
        const payload = {
            styleId: props.styleId,
            variantId: props.variantId,
            materials: bom.value.materials,
        };
        await bomService.saveTemplateBom(payload);
        ElMessage.success('BOM模板保存成功！');
        goBack();
    } catch (error) {
        ElMessage.error('保存失败');
    }
};

const goBack = () => {
    router.push(`/dashboard/styles/edit/${props.styleId}`);
};

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
            const importedMaterials = json.map(item => { const newItem = {}; for (const key in reverseHeaderMapping) { if (item[key] !== undefined && reverseHeaderMapping[key] !== 'ignore') { newItem[reverseHeaderMapping[key]] = item[key]; } } return newItem; });
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
    const headerMapping = { bomMaterialName: '款式BOM材料名称', partUsed: '使用部位', materialCategory: 'materialCategory', materialItemNumber: '材料货号', materialName: '材料名称', colorRule: '颜色规则', specRule: '规格规则', consumptionRule: '用量规则', color: '颜色', spec: '规格', unitConsumption: '单件用量', unit: '单位' };
    const dataToExport = bom.value.materials.map((item, index) => {
        const newItem = { '序号': index + 1 };
        for (const key in headerMapping) {
            newItem[headerMapping[key]] = item[key] || '';
        }
        return newItem;
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'BOM模板');
    
    const attributesString = Object.entries(variant.value.attributes)
        .map(([key, value]) => `${key}${value}`)
        .join('-')
        .replace(/[\\/?*[\]]/g, '');
    
    const fileName = `${style.value.name}-${variant.value.subId}-${attributesString}-BOM模板.xlsx`;
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