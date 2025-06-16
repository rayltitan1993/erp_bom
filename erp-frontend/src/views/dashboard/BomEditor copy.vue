<template>
  <div>
    <div class="bom-header">
      <h1>编辑款式BOM</h1>
      <div><p><strong>款式名称:</strong> {{ styleInfo.name }}</p><p><strong>款式编号:</strong> {{ styleInfo.styleNumber }}</p></div>
    </div>
    <el-button @click="addMaterialRow" type="success" style="margin-bottom: 10px;">新增物料行</el-button>
    <el-table :data="bomData.materials" border style="width: 100%">
      <el-table-column type="index" label="序号" width="60"></el-table-column>
      <el-table-column label="材料名称"><template #default="scope"><el-input v-model="scope.row.materialName" /></template></el-table-column>
      <el-table-column label="使用部位"><template #default="scope"><el-input v-model="scope.row.partUsed" /></template></el-table-column>
      <el-table-column label="材料货号"><template #default="scope"><el-input v-model="scope.row.materialItemNumber" /></template></el-table-column>
      <el-table-column label="颜色"><template #default="scope"><el-input v-model="scope.row.color" /></template></el-table-column>
      <el-table-column label="规格"><template #default="scope"><el-input v-model="scope.row.spec" /></template></el-table-column>
      <el-table-column label="单件用量"><template #default="scope"><el-input-number v-model="scope.row.unitConsumption" :precision="3" :step="0.001" /></template></el-table-column>
      <el-table-column label="单位"><template #default="scope"><el-input v-model="scope.row.unit" /></template></el-table-column>
      <el-table-column label="操作" width="80"><template #default="scope"><el-button type="danger" link @click="removeMaterialRow(scope.$index)">删除</el-button></template></el-table-column>
    </el-table>
    <div class="footer-actions">
      <el-button @click="cancel">取消保存</el-button>
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
const props = defineProps({ styleId: String, variantId: String });
const router = useRouter();
const styleInfo = reactive({ name: '', styleNumber: '' });
const bomData = reactive({ materials: [] });
const addMaterialRow = () => { bomData.materials.push({}); };
const removeMaterialRow = (index) => { bomData.materials.splice(index, 1); };
async function loadData() {
  try {
    const style = await styleService.getStyle(props.styleId);
    styleInfo.name = style.name;
    styleInfo.styleNumber = style.styleNumber;
    // bomService.getBomForVariant is a placeholder for your actual BOM fetching logic
    // const bom = await bomService.getBomForVariant(props.variantId);
    // if (bom && bom.materials) { bomData.materials = bom.materials; }
  } catch (error) { ElMessage.error('加载BOM数据失败'); }
}
async function saveBom() {
  try {
    const payload = {
      styleId: props.styleId,
      variantId: props.variantId,
      materials: bomData.materials
    };
    await bomService.saveBomForVariant(payload); // <--- 取消此行的注释
    ElMessage.success('BOM保存成功');
    router.back();
  } catch (error) {
    ElMessage.error('BOM保存失败');
  }
}
const cancel = () => { router.back(); };
onMounted(loadData);
</script>
<style scoped>
.bom-header { background-color: #fafafa; padding: 10px 20px; margin-bottom: 20px; border-radius: 4px; }
.footer-actions { margin-top: 20px; text-align: right; }
</style>