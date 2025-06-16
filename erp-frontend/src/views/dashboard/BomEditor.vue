<template>
  <div>
    <div class="bom-header">
      <h1>编辑款式BOM</h1>
      <div class="header-details">
        <div class="header-row">
          <p><strong>款式名称:</strong> {{ styleInfo.name || '...' }}</p>
          <p><strong>款式编号:</strong> {{ styleInfo.styleNumber || '...' }}</p>
        </div>
        <div class="header-row">
          <p><strong>子ID:</strong> {{ variantInfo.subId || '...' }}</p>
          <p><strong>颜色:</strong> {{ variantInfo.color || '...' }}</p>
          <p><strong>腰围:</strong> {{ variantInfo.waist || '...' }}</p>
          <p><strong>内长:</strong> {{ variantInfo.inseam || '...' }}</p>
        </div>
      </div>
    </div>
    
    <div class="table-controls">
      <el-button @click="addMaterialRow" type="success">新增物料行</el-button>
      <div class="control-buttons">
        <input type="file" ref="fileInput" @change="handleFileImport" accept=".xlsx, .xls" style="display: none;" />
        <el-button @click="triggerFileInput" type="primary">从Excel导入</el-button>
        <el-button @click="exportToExcel" type="info">导出Excel</el-button>
      </div>
    </div>
    
    <div class="table-container">
      <el-table :data="bomData.materials" border style="width: 100%;" size="small">
        <el-table-column type="index" label="序号" width="55"></el-table-column>
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
        
        <el-table-column label="操作" width="160">
          <template #default="scope">
            <el-button type="warning" size="small" @click="toggleRowEdit(scope.row)">{{ scope.row.isEditing ? '完成' : '编辑' }}</el-button>
            <el-button type="danger" size="small" @click="removeMaterialRow(scope.$index)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="footer-actions">
        <el-button @click="cancel">取消</el-button>
        <el-button type="primary" @click="saveBom">保存整个BOM</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
// Script部分与上次完全相同，是稳定可用的
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import styleService from '@/services/style.service'; 
import bomService from '@/services/bom.service';
import { ElMessage, ElMessageBox } from 'element-plus';
import * as XLSX from 'xlsx';

const props = defineProps({ styleId: String, variantId: String });
const router = useRouter();
const fileInput = ref(null);

const styleInfo = reactive({ name: '', styleNumber: '' });
const variantInfo = reactive({ subId: '', color: '', waist: '', inseam: '' });
const bomData = reactive({ materials: [] });

const loadData = async () => {
  try {
    const style = await styleService.getStyle(props.styleId);
    if (!style) throw new Error("Style not found");
    styleInfo.name = style.name;
    styleInfo.styleNumber = style.styleNumber;
    const currentVariant = style.variants.find(v => v._id === props.variantId);
    if (currentVariant) {
      Object.assign(variantInfo, currentVariant);
    } else {
      throw new Error("Variant not found in Style data");
    }
    const bom = await bomService.getBomForVariant(props.variantId);
    if (bom && bom.materials) {
      bomData.materials = bom.materials.map(m => ({ ...m, isEditing: false }));
    }
  } catch (error) {
    console.error("加载BOM页面数据时出错:", error);
    ElMessage.error('加载数据失败，请检查网络或联系管理员。');
  }
};

const addMaterialRow = () => { bomData.materials.unshift({ isEditing: true }); };
const removeMaterialRow = (index) => { ElMessageBox.confirm('确定要删除此行物料吗?', '提示', { type: 'warning' }).then(() => { bomData.materials.splice(index, 1); ElMessage.success('删除成功'); }).catch(() => {}); };
const toggleRowEdit = (row) => { row.isEditing = !row.isEditing; };
const triggerFileInput = () => { fileInput.value.click(); };

const materialKeys = ['bomMaterialName', 'partUsed', 'materialCategory', 'materialItemNumber', 'materialName', 'colorRule', 'specRule', 'consumptionRule', 'color', 'spec', 'unitConsumption', 'unit'];
const createMaterialSignature = (material) => materialKeys.map(key => material[key] || '').join('||');

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
      const importedMaterials = json.map(item => { const newItem = { isEditing: false }; for (const key in reverseHeaderMapping) { if (item[key] !== undefined && reverseHeaderMapping[key] !== 'ignore') { newItem[reverseHeaderMapping[key]] = item[key]; } } return newItem; });
      const existingSignatures = new Set(bomData.materials.map(createMaterialSignature));
      const newUniqueMaterials = [];
      let duplicateCount = 0;
      importedMaterials.forEach(item => { const signature = createMaterialSignature(item); if (!existingSignatures.has(signature)) { newUniqueMaterials.push(item); existingSignatures.add(signature); } else { duplicateCount++; } });
      if (newUniqueMaterials.length > 0) { bomData.materials.push(...newUniqueMaterials); }
      if (newUniqueMaterials.length > 0 && duplicateCount > 0) { ElMessage.success(`操作完成：成功添加 ${newUniqueMaterials.length} 条新物料，${duplicateCount} 条重复数据已跳过。`); } 
      else if (newUniqueMaterials.length > 0) { ElMessage.success(`成功添加 ${newUniqueMaterials.length} 条新物料。`); } 
      else if (duplicateCount > 0) { ElMessage.warning('导入的所有数据均为重复条目，未添加任何新物料。'); } 
      else { ElMessage.info('没有导入任何数据。'); }
    } catch (error) { ElMessage.error('文件解析失败，请确保文件格式或表头正确。'); }
  };
  reader.readAsBinaryString(file);
  event.target.value = ''; 
};

const exportToExcel = () => {
    if (bomData.materials.length === 0) { ElMessage.warning('没有可导出的BOM数据。'); return; }
    const headerMapping = { bomMaterialName: '款式BOM材料名称', partUsed: '使用部位', materialCategory: '材料类别', materialItemNumber: '材料货号', materialName: '材料名称', colorRule: '颜色规则', specRule: '规格规则', consumptionRule: '用量规则', color: '颜色', spec: '规格', unitConsumption: '单件用量', unit: '单位' };
    const dataToExport = bomData.materials.map((item, index) => { const newItem = { '序号': index + 1 }; for (const key in headerMapping) { newItem[headerMapping[key]] = item[key] || ''; } return newItem; });
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, variantInfo.subId || 'BOM');
    const fileName = `${styleInfo.name}-${styleInfo.styleNumber}-${variantInfo.subId}-${variantInfo.color}-${variantInfo.waist}-${variantInfo.inseam}-BOM.xlsx`;
    XLSX.writeFile(workbook, fileName);
};

const saveBom = async () => {
  const validMaterials = bomData.materials.filter(material => materialKeys.some(key => { const value = material[key]; return value !== null && value !== undefined && value !== ''; }));
  if (validMaterials.length !== bomData.materials.length) { ElMessage.info('已自动过滤未填写的空白物料行。'); }
  if (validMaterials.length === 0) { ElMessage.warning('没有可保存的有效物料数据。'); return; }
  const materialsToSave = validMaterials.map(m => { const { isEditing, ...rest } = m; return rest; });
  try {
    const payload = { styleId: props.styleId, variantId: props.variantId, materials: materialsToSave };
    await bomService.saveBomForVariant(payload);
    ElMessage.success('BOM保存成功');
    router.back();
  } catch (error) { ElMessage.error(error.response?.data?.message || 'BOM保存失败'); }
};

const cancel = () => router.back();

onMounted(loadData);
</script>

<style scoped>
.bom-header { background-color: #F8FAFC; padding: 15px 20px; margin-bottom: 20px; border-radius: var(--erp-border-radius); border: 1px solid var(--erp-border-color); }
.header-details { margin-top: 15px; font-size: 14px; }
.header-row { display: flex; gap: 30px; margin-bottom: 8px; }
.header-details p { margin: 2px 0; color: var(--erp-text-secondary); }
.header-details p strong { color: var(--erp-text-primary); min-width: 70px; display: inline-block; }
.table-controls { display: flex; justify-content: space-between; align-items: center; }
.control-buttons { display: flex; gap: 10px; }
.table-container { margin-top: 10px; }
.footer-actions { margin-top: 20px; text-align: right; }
</style>