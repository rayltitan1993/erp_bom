<template>
  <div>
    <div class="bom-header">
      <h1>编辑款式BOM</h1>
      <div>
        <p><strong>款式名称:</strong> {{ styleInfo.name }}</p>
        <p><strong>款式编号:</strong> {{ styleInfo.styleNumber }}</p>
      </div>
    </div>
    
    <div class="table-controls">
      <el-button @click="addMaterialRow" type="success">新增物料行</el-button>
      <el-button @click="exportToExcel" type="info">导出Excel</el-button>
    </div>
    
    <el-table :data="bomData.materials" border style="width: 100%; margin-top: 10px;">
      <el-table-column type="index" label="序号" width="60"></el-table-column>
      <el-table-column label="BOM材料名称" prop="bomMaterialName"><template #default="scope"><el-input v-model="scope.row.bomMaterialName" /></template></el-table-column>
      <el-table-column label="使用部位" prop="partUsed"><template #default="scope"><el-input v-model="scope.row.partUsed" /></template></el-table-column>
      <el-table-column label="材料货号" prop="materialItemNumber"><template #default="scope"><el-input v-model="scope.row.materialItemNumber" /></template></el-table-column>
      <el-table-column label="单件用量" prop="unitConsumption"><template #default="scope"><el-input-number v-model="scope.row.unitConsumption" :precision="3" :step="0.001" /></template></el-table-column>
      <el-table-column label="单位" prop="unit"><template #default="scope"><el-input v-model="scope.row.unit" /></template></el-table-column>
      <el-table-column label="操作" width="80">
        <template #default="scope">
          <el-button type="danger" link @click="removeMaterialRow(scope.$index)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="footer-actions">
      <el-button @click="cancel">取消</el-button>
      <el-button type="primary" @click="saveBom">保存BOM</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import styleService from '../../services/style.service'; 
import bomService from '../../services/bom.service';
import { ElMessage } from 'element-plus';
import * as XLSX from 'xlsx'; // 1. 引入 xlsx 库

const props = defineProps({ styleId: String, variantId: String });
const router = useRouter();

const styleInfo = reactive({ name: '', styleNumber: '' });
const bomData = reactive({ materials: [] });

const addMaterialRow = () => bomData.materials.push({});
const removeMaterialRow = (index) => bomData.materials.splice(index, 1);

// 2. 新增导出Excel的函数
const exportToExcel = () => {
  if (bomData.materials.length === 0) {
    ElMessage.warning('没有可导出的BOM数据。');
    return;
  }
  
  // 定义Excel表头的中英文映射
  const headerMapping = {
    bomMaterialName: '款式BOM材料名称',
    partUsed: '使用部位',
    materialCategory: '材料类别',
    materialItemNumber: '材料货号',
    materialName: '材料名称',
    colorRule: '颜色规则',
    specRule: '规格规则',
    consumptionRule: '用量规则',
    color: '颜色',
    spec: '规格',
    unitConsumption: '单件用量',
    unit: '单位'
  };

  // 准备要导出的数据，添加序号并转换表头为中文
  const dataToExport = bomData.materials.map((item, index) => {
    const newItem = { '序号': index + 1 };
    for (const key in headerMapping) {
      newItem[headerMapping[key]] = item[key];
    }
    return newItem;
  });

  // 使用 XLSX 生成工作簿
  const worksheet = XLSX.utils.json_to_sheet(dataToExport);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'BOM_Sheet');

  // 生成文件名并触发下载
  const fileName = `${styleInfo.styleNumber}_BOM.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

const loadData = async () => {
  try {
    const style = await styleService.getStyle(props.styleId);
    styleInfo.name = style.name;
    styleInfo.styleNumber = style.styleNumber;
    
    const bom = await bomService.getBomForVariant(props.variantId);
    if (bom && bom.materials) {
      bomData.materials = bom.materials;
    }
  } catch (error) {
    ElMessage.error('加载BOM数据失败');
  }
};

const saveBom = async () => {
  try {
    const payload = {
      styleId: props.styleId,
      variantId: props.variantId,
      materials: bomData.materials
    };
    await bomService.saveBomForVariant(payload);
    ElMessage.success('BOM保存成功');
    router.back();
  } catch (error) {
    ElMessage.error('BOM保存失败');
  }
};

const cancel = () => router.back();

onMounted(loadData);
</script>

<style scoped>
.bom-header { background-color: #fafafa; padding: 10px 20px; margin-bottom: 20px; border-radius: 4px; }
.table-controls { display: flex; justify-content: space-between; align-items: center; }
.footer-actions { margin-top: 20px; text-align: right; }
</style>