<template>
  <div>
    <h1>{{ isEditMode ? '编辑款式详情' : '添加新款式' }}</h1>
    
    <el-alert v-if="!isEditMode && !styleData.variantAttributeSchema.length" title="第一步：请先在下方定义分组属性。" type="info" show-icon :closable="false" style="margin-bottom: 20px;" />
    <el-alert v-if="!isEditMode && styleData.variantAttributeSchema.length" title="第二步：属性已定义，请填写基础信息并点击“保存”，之后即可添加分组。" type="success" show-icon :closable="false" style="margin-bottom: 20px;" />
    
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
      <el-button @click="openAddDialog" type="success" :disabled="!isEditMode">添加新的分组</el-button>
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
        <el-button type="primary" link @click="editTemplateBom(group)">编辑BOM</el-button>
        <el-button type="warning" @click="toggleEditGroup(group)">{{ group.isEditing ? '完成' : '编辑' }}</el-button>
        <el-button type="danger" link @click="removeColorGroup(groupIndex)">删除</el-button>
      </div>
    </div>

    <div class="footer-actions">
      <el-button @click="cancel">取消</el-button>
      <el-button type="primary" @click="handleSave" :disabled="!isEditMode && !styleData.variantAttributeSchema.length">保存</el-button>
    </div>

    <el-dialog v-model="attributeSchemaDialogVisible" title="定义分组属性" width="600px" :close-on-click-modal="false" :show-close="false" :close-on-press-escape="false">
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
import { useRoute, useRouter } from 'vue-router';
import { Delete } from '@element-plus/icons-vue';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';

const props = defineProps({ id: String });
const router = useRouter();
const authStore = useAuthStore();
const isEditMode = computed(() => !!props.id);
const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const uploadUrl = `${backendUrl}/api/upload/image`;
const uploadHeaders = computed(() => ({ Authorization: `Bearer ${authStore.token}` }));

const styleData = reactive({ name: '', styleNumber: '', brand: '', imageUrl: '', variants: [], variantAttributeSchema: [] });
const variantGroups = ref([]);
const addVariantDialogVisible = ref(false);
const newVariantForm = reactive({ attributes: {} });
const attributeSchemaDialogVisible = ref(false);
const attributeSchemaForm = reactive({ attributes: [{ name: '颜色' }, { name: '尺码' }] });

onMounted(() => {
  if (isEditMode.value) {
    loadData();
  } else {
    attributeSchemaDialogVisible.value = true;
  }
});

const loadData = async () => {
  if (isEditMode.value) {
    try {
      const data = await styleService.getStyle(props.id);
      Object.assign(styleData, data);
      variantGroups.value = transformToVariantGroups(data.variants);
    } catch (error) {
      ElMessage.error('加载款式数据失败');
    }
  }
};

const addAttributeSchemaField = () => { if (attributeSchemaForm.attributes.length < 6) { attributeSchemaForm.attributes.push({ name: '' }); } };
const removeAttributeSchemaField = (index) => { attributeSchemaForm.attributes.splice(index, 1); };

const confirmAttributeSchema = () => {
    const definedAttributes = attributeSchemaForm.attributes.map(a => a.name.trim()).filter(a => a);
    if (new Set(definedAttributes).size !== definedAttributes.length) { ElMessage.error('属性名称不能重复。'); return; }
    if (definedAttributes.length === 0) { ElMessage.error('请至少定义一个有效的属性。'); return; }
    styleData.variantAttributeSchema = definedAttributes;
    attributeSchemaDialogVisible.value = false;
};

const cancelCreation = () => router.push('/dashboard/styles');

const handleSave = async () => {
    try {
        let savedData;
        if (isEditMode.value) {
            const payload = { ...styleData, variants: transformToVariants() };
            savedData = await styleService.updateStyle(props.id, payload);
            ElMessage.success('款式更新成功！');
        } else {
            if (!styleData.name || !styleData.styleNumber) {
                ElMessage.warning('请填写款式产品名称和款式编号。');
                return;
            }
            const payload = { ...styleData, variants: [] };
            savedData = await styleService.createStyle(payload);
            ElMessage.success('基础款式创建成功！正在切换到编辑模式...');
            router.replace(`/dashboard/styles/edit/${savedData._id}`);
        }
    } catch (error) {
        console.error("保存款式时出错:", error);
        ElMessage.error(error.response?.data?.message || '操作失败');
    }
};

const openAddDialog = () => {
  if (!isEditMode.value) return;
  newVariantForm.attributes = {};
  styleData.variantAttributeSchema.forEach(attr => { newVariantForm.attributes[attr] = ''; });
  addVariantDialogVisible.value = true;
};

const confirmAddVariantGroup = async () => {
    const firstAttributeName = styleData.variantAttributeSchema[0];
    if (firstAttributeName && !newVariantForm.attributes[firstAttributeName]) { 
        ElMessage.error(`属性“${firstAttributeName}”为必填项。`); 
        return;
    }

    addVariantDialogVisible.value = false;
    const loadingInstance = ElLoading.service({ text: '正在添加分组...', background: 'rgba(0, 0, 0, 0.7)' });
    
    try {
        const maxIndex = Math.max(0, ...variantGroups.value.map(g => {
            if (g && g.subId && typeof g.subId === 'string') {
                const parts = g.subId.split('-');
                return parts.length > 1 ? parseInt(parts[parts.length - 1], 10) : 0;
            }
            return 0;
        }));
        const newSubId = `${styleData.styleNumber}-${maxIndex + 1}`;

        const newVariant = {
            subId: newSubId,
            attributes: { ...newVariantForm.attributes }
        };

        const payload = {
            variants: [...transformToVariants(), newVariant]
        };

        const updatedStyle = await styleService.updateStyle(props.id, payload);
        
        styleData.variants = updatedStyle.variants;
        variantGroups.value = transformToVariantGroups(updatedStyle.variants);
        
        ElMessage.success('新分组已添加！');
    } catch (error) {
        console.error("添加分组时出错:", error);
        ElMessage.error(error.response?.data?.message || '添加分组失败，请重试。');
    } finally {
        loadingInstance.close();
    }
};

const removeColorGroup = (groupIndex) => { 
    variantGroups.value.splice(groupIndex, 1);
    // Note: This only removes from UI. A full save is needed to persist deletion.
};
const toggleEditGroup = (group) => { group.isEditing = !group.isEditing; };

const transformToVariants = () => variantGroups.value.map(group => ({
    _id: group.id,
    subId: group.subId,
    attributes: group.attributes,
    bom: group.bom,
}));

const transformToVariantGroups = (variants = []) => variants.map(v => ({
    id: v._id,
    subId: v.subId,
    attributes: v.attributes || {},
    isEditing: false,
    bom: v.bom
}));

const editTemplateBom = (group) => {
    if (!group.id) { ElMessage.error('请先保存此分组，然后才能编辑BOM。'); return; }
    router.push(`/dashboard/styles/${props.id}/variant/${group.id}/bom`);
};

const cancel = () => router.push('/dashboard/styles');
const handleImageSuccess = (response) => { if (response.success && response.url) { styleData.imageUrl = `${backendUrl}${response.url}`; ElMessage.success('示意图上传成功!'); } else { ElMessage.error(response.message || '上传失败'); } };
const handleImageError = () => { ElMessage.error('示意图上传失败'); };
const beforeImageUpload = (rawFile) => { const isJpgOrPng = rawFile.type === 'image/jpeg' || rawFile.type === 'image/png'; if (!isJpgOrPng) { ElMessage.error('只支持 JPG/PNG 格式!'); return false; } const isLt2M = rawFile.size / 1024 / 1024 < 2; if (!isLt2M) { ElMessage.error('图片大小不能超过 2MB!'); return false; } return true; };
const handleBatchExport = async () => {
  if (!props.id) return;

  try {
    await ElMessageBox.confirm('这将把此款式下所有已创建的BOM模板，打包成一个.zip文件下载。是否继续？', '批量导出确认', {
      confirmButtonText: '开始导出',
      cancelButtonText: '取消',
      type: 'info'
    });
  } catch {
    return ElMessage.info('导出操作已取消');
  }

  const loadingInstance = ElLoading.service({ text: '正在获取并处理所有BOM数据...', background: 'rgba(0,0,0,0.7)' });

  try {
    const bomsWithVariantInfo = await bomService.getTemplateBomsForStyle(props.id);

    if (!bomsWithVariantInfo || bomsWithVariantInfo.length === 0) {
      loadingInstance.close();
      ElMessage.warning('此款式下没有任何已保存的BOM可供导出。');
      return;
    }

    const zip = new JSZip();
    const headerMapping = { bomMaterialName: '款式BOM材料名称', partUsed: '使用部位', materialCategory: '材料类别', materialItemNumber: '材料货号', materialName: '材料名称', colorRule: '颜色规则', specRule: '规格规则', consumptionRule: '用量规则', color: '颜色', spec: '规格', unitConsumption: '单件用量', unit: '单位' };

    bomsWithVariantInfo.forEach(item => {
      if (!item.materials || item.materials.length === 0) return;

      const attributesString = item.variantInfo.attributes ? Object.values(item.variantInfo.attributes).join('-').replace(/[\\/?*[\]]/g, '') : '';
      const fileName = `${styleData.name}-${item.variantInfo.subId}-${attributesString}-BOM模板.xlsx`;
      const sheetName = `${item.variantInfo.subId}`.slice(0,31);

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
    const zipFileName = `${styleData.name}-${styleData.styleNumber}-所有BOM模板.zip`;
    
    // Helper function to trigger download
    const link = document.createElement('a');
    link.href = URL.createObjectURL(zipBlob);
    link.download = zipFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);

    loadingInstance.close();
    ElMessage.success(`批量导出成功！已开始下载 ${zipFileName}。`);

  } catch (error) {
    loadingInstance.close();
    console.error("批量导出失败:", error);
    ElMessage.error('批量导出操作失败。');
  }
};
</script>

<style scoped>
.page-container { background-color: #f0f2f5; padding: 20px; }
.top-layout-grid { display: flex; align-items: flex-start; gap: 24px; margin-bottom: 20px; }
.main-info-form { flex-grow: 1; }
.image-upload-section { flex-shrink: 0; width: 150px; display: flex; flex-direction: column; }
.style-image { width: 150px; height: 150px; border-radius: 8px; border: 1px solid #e4e7ed; margin-bottom: 10px; }
.image-slot { display: flex; justify-content: center; align-items: center; width: 100%; height: 100%; background: #f5f7fa; color: #c0c4cc; font-size: 14px; }
.page-controls { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.color-group-card { border: 1px solid #e4e7ed; border-radius: 4px; padding: 10px 20px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; }
.variant-form-item { flex-grow: 1; margin-bottom: 0 !important; }
.variant-inputs { display: flex; flex-grow: 1; gap: 15px; align-items: center; flex-wrap: wrap; }
.attribute-input-wrapper { display: flex; align-items: center; gap: 5px; }
.attribute-label { font-size: 14px; color: #606266; flex-shrink: 0; }
.attribute-input-wrapper .el-input { width: 120px; }
.color-group-actions { padding-left: 20px; flex-shrink: 0; display: flex; gap: 10px; }
.footer-actions { margin-top: 30px; text-align: right; }
.dialog-dimension-input { display: flex; align-items: center; width: 100%; }
.dialog-dimension-input .el-input { margin-right: 10px; }
</style>