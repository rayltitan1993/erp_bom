<template>
  <div>
    <h1>{{ isEditMode ? '编辑款式详情' : '添加新款式' }}</h1>
    
    <div class="top-layout-grid">
      <el-form :model="styleData" label-width="100px" class="main-info-form">
        <el-form-item label="款式产品名称"><el-input v-model="styleData.name" /></el-form-item>
        <el-form-item label="款式编号"><el-input v-model="styleData.styleNumber" :disabled="isEditMode" /></el-form-item>
        <el-form-item label="品牌"><el-input v-model="styleData.brand" /></el-form-item>
      </el-form>
      <div class="image-upload-section">
        <el-image class="style-image" :src="styleData.imageUrl" fit="contain">
          <template #error><div class="image-slot"><span>暂无图片</span></div></template>
        </el-image>
        <el-upload :action="uploadUrl" :headers="uploadHeaders" :show-file-list="false" :on-success="handleImageSuccess" :on-error="handleImageError" :before-upload="beforeImageUpload" name="file" >
          <el-button type="primary">添加/更改示意图</el-button>
        </el-upload>
      </div>
    </div>
    <el-divider />

    <h2>款式分组 (SKU)</h2>
    <div class="page-controls">
      <el-button @click="openAddDialog" type="success">添加新的分组</el-button>
      <el-button @click="handleBatchExport" type="warning" v-if="isEditMode">批量导出BOM</el-button>
    </div>

    <div v-for="(group, groupIndex) in variantGroups" :key="group.id" class="color-group-card">
      <el-form-item :label="`子ID: ${group.subId || '(保存后生成)'}`" label-width="180px" class="variant-form-item">
        <div class="variant-inputs">
            <div v-for="attr in styleData.variantAttributeSchema" :key="attr" class="attribute-input-wrapper">
                <span class="attribute-label">{{ attr }}:</span>
                <el-input v-model="group.attributes[attr]" :placeholder="attr" :disabled="!group.isEditing" size="small" />
            </div>
        </div>
      </el-form-item>
      <div class="color-group-actions">
        <el-button type="success" @click="handleBom(group)">款式BOM</el-button>
        <el-button type="warning" @click="toggleEditGroup(group)">{{ group.isEditing ? '完成' : '编辑' }}</el-button>
        <el-button type="danger" @click="removeColorGroup(groupIndex)">删除</el-button>
      </div>
    </div>

    <div class="footer-actions">
      <el-button @click="cancel">取消</el-button>
      <el-button type="primary" @click="saveStyle">保存</el-button>
    </div>

    <el-dialog v-model="attributeSchemaDialogVisible" title="定义分组属性" width="600px" :close-on-click-modal="false" :show-close="false">
        <p>请为当前款式定义分组的属性。此设定将应用于该款式下的所有分组，且首次设定后不可更改。</p>
        <el-form :model="attributeSchemaForm" label-width="80px" @submit.prevent>
            <el-form-item v-for="(attr, index) in attributeSchemaForm.attributes" :key="index" :label="`属性 ${index + 1}`">
                <div class="dialog-dimension-input">
                    <el-input v-model="attr.name" placeholder="例如: 颜色, 腰围, 袖长..." />
                    <el-button @click.prevent="removeAttributeSchemaField(index)" type="danger" :icon="Delete" circle />
                </div>
            </el-form-item>
            <el-form-item>
                <el-button @click="addAttributeSchemaField" v-if="attributeSchemaForm.attributes.length < 6">添加属性字段</el-button>
            </el-form-item>
        </el-form>
        <template #footer>
            <el-button @click="cancelCreation">取消创建</el-button>
            <el-button type="primary" @click="confirmAttributeSchema">确认属性并继续</el-button>
        </template>
    </el-dialog>

    <el-dialog v-model="addVariantDialogVisible" title="添加新的分组" width="500px" :close-on-click-modal="false">
      <el-form :model="newVariantForm.attributes" label-width="80px" @submit.prevent>
        <el-form-item v-for="attr in styleData.variantAttributeSchema" :key="attr" :label="attr">
          <el-input v-model="newVariantForm.attributes[attr]" :placeholder="`请输入 ${attr}`" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addVariantDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAddVariantGroup">确认添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { useAuthStore } from '@/store/auth.store';
import styleService from '@/services/style.service';
import bomService from '@/services/bom.service';
import { ElMessage, ElLoading, ElMessageBox } from 'element-plus';
import { useRouter } from 'vue-router';
import { Delete } from '@element-plus/icons-vue';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';

const props = defineProps({ id: String });
const router = useRouter();
const authStore = useAuthStore();
const isEditMode = computed(() => !!props.id);
const backendUrl = 'http://localhost:3000';
const uploadUrl = `${backendUrl}/api/upload/image`;
const uploadHeaders = computed(() => ({ Authorization: `Bearer ${authStore.token}` }));

const styleData = reactive({ name: '', styleNumber: '', brand: '', imageUrl: '', variants: [], variantAttributeSchema: [] });
const variantGroups = ref([]);
const addVariantDialogVisible = ref(false);
const newVariantForm = reactive({ attributes: {} });

const attributeSchemaDialogVisible = ref(false);
const attributeSchemaForm = reactive({ attributes: [{ name: '颜色' }, { name: '尺码' }] });

const openAttributeSchemaDialog = () => { if (!isEditMode.value) { attributeSchemaDialogVisible.value = true; } };
const addAttributeSchemaField = () => { if (attributeSchemaForm.attributes.length < 6) { attributeSchemaForm.attributes.push({ name: '' }); } else { ElMessage.warning('最多只能添加6个属性字段。'); } };
const removeAttributeSchemaField = (index) => { attributeSchemaForm.attributes.splice(index, 1); };
const confirmAttributeSchema = () => {
    const definedAttributes = attributeSchemaForm.attributes.map(a => a.name.trim()).filter(a => a);
    if (new Set(definedAttributes).size !== definedAttributes.length) { ElMessage.error('属性名称不能重复。'); return; }
    if (definedAttributes.length === 0) { ElMessage.error('请至少定义一个有效的属性。'); return; }
    styleData.variantAttributeSchema = definedAttributes;
    attributeSchemaDialogVisible.value = false;
    ElMessage.success('属性已定义，现在可以添加分组了。');
};
const cancelCreation = () => { ElMessageBox.confirm('确定要取消创建当前款式吗？', '提示', { type: 'warning' }).then(() => router.push('/dashboard/styles')).catch(() => {}); };

const openAddDialog = () => {
  if (!isEditMode.value) { ElMessage.warning('请先创建并保存一个基础款式，才能添加分组。'); return; }
  newVariantForm.attributes = {};
  styleData.variantAttributeSchema.forEach(attr => { newVariantForm.attributes[attr] = ''; });
  addVariantDialogVisible.value = true;
};

const confirmAddVariantGroup = async () => {
  const firstAttributeName = styleData.variantAttributeSchema[0];
  if (!newVariantForm.attributes[firstAttributeName]) { ElMessage.error(`${firstAttributeName} 为必填项。`); return; }
  
  addVariantDialogVisible.value = false;
  const loadingInstance = ElLoading.service({ text: '正在创建新分组...', background: 'rgba(0, 0, 0, 0.7)' });
  try {
    const templateVariant = styleData.variants.find(v => v.bom);
    const existingIndices = styleData.variants.map(g => { if (g && g.subId && typeof g.subId === 'string') { const parts = g.subId.split('-'); return parts.length > 1 ? parseInt(parts[parts.length - 1], 10) : 0; } return 0; }).filter(n => !isNaN(n));
    const maxIndex = Math.max(0, ...existingIndices);
    const newSubId = `${styleData.styleNumber}-${maxIndex + 1}`;
    
    const newVariantData = { subId: newSubId, attributes: { ...newVariantForm.attributes } };
    const updatedVariants = [...styleData.variants, newVariantData];
    
    const payload = { ...styleData, variants: updatedVariants };
    const updatedStyle = await styleService.updateStyle(props.id, payload);
    const newlyCreatedVariant = updatedStyle.variants.find(v => v.subId === newSubId);
    
    if (!newlyCreatedVariant) throw new Error('保存新分组后未能找到其ID。');
    
    if (templateVariant) {
      loadingInstance.text = '正在复制BOM模板...';
      const templateBom = await bomService.getBomForVariant(templateVariant._id);
      if (templateBom && templateBom.materials) {
        const newBomPayload = { styleId: props.id, variantId: newlyCreatedVariant._id, materials: templateBom.materials };
        await bomService.saveBomForVariant(newBomPayload);
        ElMessage.success('新分组已添加，并成功复制BOM模板！');
      } else { ElMessage.success('新分组已添加！(未找到可复制的BOM模板)'); }
    } else { ElMessage.success('新分组已添加！'); }
    await loadData();
  } catch (error) {
    console.error("添加并克隆BOM时出错:", error);
    ElMessage.error('操作失败，请重试。');
  } finally {
    loadingInstance.close();
  }
};

const removeColorGroup = (index) => { variantGroups.value.splice(index, 1); };
const toggleEditGroup = (group) => { group.isEditing = !group.isEditing; };
const handleImageSuccess = (response) => { if (response.success && response.url) { styleData.imageUrl = `${backendUrl}${response.url}`; ElMessage.success('示意图上传成功!'); } else { ElMessage.error(response.message || '上传失败'); } };
const handleImageError = () => { ElMessage.error('示意图上传失败'); };
const beforeImageUpload = (rawFile) => { const isJpgOrPng = rawFile.type === 'image/jpeg' || rawFile.type === 'image/png'; if (!isJpgOrPng) { ElMessage.error('只支持 JPG/PNG 格式!'); return false; } const isLt2M = rawFile.size / 1024 / 1024 < 2; if (!isLt2M) { ElMessage.error('图片大小不能超过 2MB!'); return false; } return true; };
const handleBom = (group) => { if (typeof group.id === 'number') { ElMessage.error('请先点击页面底部的“保存”按钮，以永久保存此新分组，然后才能编辑BOM。'); return; } router.push(`/dashboard/styles/${props.id}/variant/${group.id}/bom`); };
const transformToVariants = () => { return variantGroups.value.map(group => { const originalVariant = styleData.variants.find(v => v._id === group.id); return { _id: originalVariant ? originalVariant._id : undefined, subId: group.subId, attributes: group.attributes, bom: originalVariant ? originalVariant.bom : null, }; }); };
const transformToVariantGroups = (variants = []) => { return variants.map(v => ({ id: v._id, subId: v.subId, attributes: v.attributes || {}, isEditing: false, bom: v.bom })); };

const saveStyle = async () => {
  const payload = { name: styleData.name, styleNumber: styleData.styleNumber, brand: styleData.brand, imageUrl: styleData.imageUrl, variantAttributeSchema: styleData.variantAttributeSchema, variants: transformToVariants(), };
  try {
    let savedData;
    if (isEditMode.value) {
      savedData = await styleService.updateStyle(props.id, payload);
      ElMessage.success('款式更新成功！');
    } else {
      if(styleData.variantAttributeSchema.length === 0) { ElMessage.error('请先定义分组属性并保存基础款式。'); openAttributeSchemaDialog(); return; }
      savedData = await styleService.createStyle(payload);
      ElMessage.success('款式创建成功！正在切换到编辑模式...');
    }
    Object.assign(styleData, savedData);
    variantGroups.value = transformToVariantGroups(savedData.variants);
    if (!isEditMode.value) { await router.replace(`/dashboard/styles/edit/${savedData._id}`); }
  } catch (error) {
    console.error("保存款式时出错:", error);
    ElMessage.error(error.response?.data?.message || '操作失败');
  }
};

const cancel = () => router.push('/dashboard/styles');
const loadData = async () => { if (isEditMode.value) { try { const data = await styleService.getStyle(props.id); Object.assign(styleData, data); variantGroups.value = transformToVariantGroups(data.variants); } catch (error) { ElMessage.error('加载款式数据失败'); } } else { openAttributeSchemaDialog(); } };
const sanitizeSheetName = (name) => { return name ? name.replace(/[\\/?*[\]]/g, '').slice(0, 31) : 'Sheet'; };
const downloadBlob = (blob, filename) => { const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = filename; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(link.href); };

// FIXED: Batch export logic is now updated for the new data structure
const handleBatchExport = async () => {
  if (!props.id) return;
  try {
    await ElMessageBox.confirm('这将把此款式下所有已保存的BOM，打包成一个.zip文件进行下载。是否继续？','批量导出确认',{ confirmButtonText: '开始导出', cancelButtonText: '取消', type: 'info' });
  } catch {
    return ElMessage.info('导出操作已取消');
  }

  const loadingInstance = ElLoading.service({ text: '正在获取并处理所有BOM数据...', background: 'rgba(0,0,0,0.7)' });
  try {
    const bomsWithVariantInfo = await bomService.getBomsForStyle(props.id);

    if (!bomsWithVariantInfo || bomsWithVariantInfo.length === 0) {
      loadingInstance.close();
      ElMessage.warning('此款式下没有任何已保存的BOM可供导出。');
      return;
    }
    
    const zip = new JSZip();
    const headerMapping = { bomMaterialName: '款式BOM材料名称', partUsed: '使用部位', materialCategory: '材料类别', materialItemNumber: '材料货号', materialName: '材料名称', colorRule: '颜色规则', specRule: '规格规则', consumptionRule: '用量规则', color: '颜色', spec: '规格', unitConsumption: '单件用量', unit: '单位' };
    
    bomsWithVariantInfo.forEach(item => {
      if (!item || !item.materials || item.materials.length === 0) return;

      // NEW: Generate filename from attributes map
      const attributesString = item.attributes ? Object.entries(item.attributes)
        .map(([key, value]) => `${key}${value}`)
        .join('-') : '';

      const fileName = `${styleData.name}-${item.subId}-${attributesString}-BOM.xlsx`;
      const sheetName = sanitizeSheetName(`${item.subId}`);
      
      const dataToExport = item.materials.map((material, index) => {
        const newRow = { '序号': index + 1 };
        for (const key in headerMapping) {
          newRow[headerMapping[key]] = material[key] || '';
        }
        return newRow;
      });
      
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      zip.file(fileName, excelBuffer);
    });

    if (Object.keys(zip.files).length === 0) {
      loadingInstance.close();
      ElMessage.warning('没有找到包含物料的BOM进行导出。');
      return;
    }
    
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const zipFileName = `${styleData.name}-${styleData.styleNumber}-所有BOM.zip`;
    downloadBlob(zipBlob, zipFileName);
    loadingInstance.close();
    ElMessage.success(`批量导出成功！已开始下载 ${zipFileName}。`);

  } catch (error) {
    loadingInstance.close();
    console.error("批量导出失败:", error);
    ElMessage.error('批量导出操作失败。');
  }
};

onMounted(loadData);
</script>

<style scoped>
.top-layout-grid { display: flex; align-items: flex-start; gap: 24px; margin-bottom: 20px; }
.main-info-form { flex-grow: 1; }
.image-upload-section { flex-shrink: 0; width: 150px; display: flex; flex-direction: column; }
.style-image { width: 150px; height: 150px; border-radius: var(--erp-border-radius); border: 1px solid var(--erp-border-color); margin-bottom: 10px; }
.image-slot { display: flex; justify-content: center; align-items: center; width: 100%; height: 100%; background: #f5f7fa; color: var(--el-text-color-secondary); font-size: 14px; }
.page-controls { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.color-group-card { border: 1px solid var(--erp-border-color); border-radius: 4px; padding: 10px 20px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; }
.variant-form-item { flex-grow: 1; margin-bottom: 0 !important; }
.variant-inputs { display: flex; flex-grow: 1; gap: 15px; align-items: center; flex-wrap: wrap; }
.attribute-input-wrapper { display: flex; align-items: center; gap: 5px; }
.attribute-label { font-size: 14px; color: var(--erp-text-secondary); flex-shrink: 0; }
.attribute-input-wrapper .el-input { width: 120px; }
.color-group-actions { padding-left: 20px; flex-shrink: 0; }
.footer-actions { margin-top: 30px; text-align: right; }
.dialog-dimension-input { display: flex; align-items: center; width: 100%; }
.dialog-dimension-input .el-input { margin-right: 10px; }
</style>