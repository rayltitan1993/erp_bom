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
        <el-upload
          :action="uploadUrl" :headers="uploadHeaders" :show-file-list="false"
          :on-success="handleImageSuccess" :on-error="handleImageError" :before-upload="beforeImageUpload"
          name="file"
        >
          <el-button type="primary">添加/更改示意图</el-button>
        </el-upload>
      </div>
    </div>

    <el-divider />
    <h2>颜色与尺码</h2>
    <div class="page-controls">
      <el-button @click="openAddDialog" type="success">添加颜色分组</el-button>
      <el-button @click="handleBatchExport" type="warning" v-if="isEditMode">批量导出BOM</el-button>
    </div>

    <div v-for="(group, groupIndex) in colorGroups" :key="group.id" class="color-group-card">
      <div class="variant-inputs">
        <el-form-item :label="`子ID: ${group.subId || '(保存后生成)'}`" label-width="180px">
          <el-input v-model="group.color" placeholder="颜色" :disabled="!group.isEditing" />
        </el-form-item>
        <el-form-item label="腰围" label-width="80px">
          <el-input v-model="group.waist" placeholder="腰围" :disabled="!group.isEditing" />
        </el-form-item>
        <el-form-item label="内长" label-width="80px">
          <el-input v-model="group.inseam" placeholder="内长" :disabled="!group.isEditing" />
        </el-form-item>
      </div>
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

    <el-dialog v-model="addDialogVisible" title="添加新的颜色分组" width="500px" :close-on-click-modal="false">
      <el-form :model="newGroupForm" label-width="80px" @submit.prevent>
        <el-form-item label="颜色"><el-input v-model="newGroupForm.color" placeholder="请输入新分组的颜色" /></el-form-item>
        <el-form-item label="腰围"><el-input v-model="newGroupForm.waist" placeholder="请输入腰围" /></el-form-item>
        <el-form-item label="内长"><el-input v-model="newGroupForm.inseam" placeholder="请输入内长" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAddColorGroup">确认添加</el-button>
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
import * as XLSX from 'xlsx';
import JSZip from 'jszip';

// --- Props, Refs, and Reactive State ---
const props = defineProps({ id: String });
const router = useRouter();
const authStore = useAuthStore();
const isEditMode = computed(() => !!props.id);
const backendUrl = 'http://localhost:3000';
const uploadUrl = `${backendUrl}/api/upload/image`;
const uploadHeaders = computed(() => ({ Authorization: `Bearer ${authStore.token}` }));
const colorGroups = ref([]);
const styleData = reactive({ name: '', styleNumber: '', brand: '', imageUrl: '', variants: [] });
const addDialogVisible = ref(false);
const newGroupForm = reactive({ color: '', waist: '', inseam: '' });


// --- Dialog and Cloning Logic ---
const openAddDialog = () => {
  if (!isEditMode.value) {
    ElMessage.warning('请先创建并保存一个基础款式，才能添加颜色分组。');
    return;
  }
  newGroupForm.color = '';
  newGroupForm.waist = '';
  newGroupForm.inseam = '';
  addDialogVisible.value = true;
};

const confirmAddColorGroup = async () => {
  if (!newGroupForm.color || !newGroupForm.waist || !newGroupForm.inseam) {
    ElMessage.error('颜色、腰围和内长均为必填项。');
    return;
  }
  addDialogVisible.value = false;
  const loadingInstance = ElLoading.service({ text: '正在创建并克隆BOM...', background: 'rgba(0, 0, 0, 0.7)' });
  
  try {
    const templateVariant = styleData.variants.find(v => v.bom);
    
    // 关键修复：更健壮的子ID生成逻辑
    const existingIndices = styleData.variants
      .map(v => {
        if (v && v.subId && typeof v.subId === 'string') {
          const parts = v.subId.split('-');
          return parts.length > 1 ? parseInt(parts[parts.length - 1], 10) : 0;
        }
        return 0;
      })
      .filter(n => !isNaN(n));
    const maxIndex = Math.max(0, ...existingIndices);
    const newSubId = `${styleData.styleNumber}-${maxIndex + 1}`;

    const newVariantData = { subId: newSubId, color: newGroupForm.color, waist: newGroupForm.waist, inseam: newGroupForm.inseam, };
    const updatedVariants = [...styleData.variants, newVariantData];
    const payload = { ...styleData, variants: updatedVariants };
    const updatedStyle = await styleService.updateStyle(props.id, payload);

    const newlyCreatedVariant = updatedStyle.variants.find(v => v.subId === newSubId);
    if (!newlyCreatedVariant) throw new Error('保存新分组后未能找到其ID。');

    if (templateVariant) {
      const templateBom = await bomService.getBomForVariant(templateVariant._id);
      if (templateBom && templateBom.materials) {
        const newBomPayload = { styleId: props.id, variantId: newlyCreatedVariant._id, materials: templateBom.materials };
        await bomService.saveBomForVariant(newBomPayload);
        ElMessage.success('新分组已添加，并成功复制BOM模板！');
      } else {
        ElMessage.success('新分组已添加！未找到可复制的BOM模板。');
      }
    } else {
      ElMessage.success('新分组已添加！');
    }
    await loadData();
  } catch (error) {
    console.error("添加并克隆BOM时出错:", error);
    ElMessage.error('操作失败，请重试。');
  } finally {
    loadingInstance.close();
  }
};


// --- All Other Component Methods ---
const removeColorGroup = (index) => { colorGroups.value.splice(index, 1); };
const toggleEditGroup = (group) => { group.isEditing = !group.isEditing; };
const handleImageSuccess = (response) => { if (response.success && response.url) { styleData.imageUrl = `${backendUrl}${response.url}`; ElMessage.success('示意图上传成功!'); } else { ElMessage.error(response.message || '上传失败'); } };
const handleImageError = () => { ElMessage.error('示意图上传失败'); };
const beforeImageUpload = (rawFile) => { const isJpgOrPng = rawFile.type === 'image/jpeg' || rawFile.type === 'image/png'; if (!isJpgOrPng) { ElMessage.error('只支持 JPG/PNG 格式!'); return false; } const isLt2M = rawFile.size / 1024 / 1024 < 2; if (!isLt2M) { ElMessage.error('图片大小不能超过 2MB!'); return false; } return true; };
const handleBom = (group) => { if (typeof group.id === 'number') { ElMessage.error('请先点击页面底部的“保存”按钮，以永久保存此新分组，然后才能编辑BOM。'); return; } router.push(`/dashboard/styles/${props.id}/variant/${group.id}/bom`); };
const transformToVariants = () => { return colorGroups.value.map(group => { const originalVariant = styleData.variants.find(v => v._id === group.id); return { _id: originalVariant ? originalVariant._id : undefined, subId: group.subId, color: group.color, waist: group.waist, inseam: group.inseam, bom: originalVariant ? originalVariant.bom : null, }; }); };
const transformToColorGroups = (variants = []) => { return variants.map(v => ({ id: v._id, subId: v.subId, color: v.color, waist: v.waist, inseam: v.inseam, isEditing: false, bom: v.bom })); };
const saveStyle = async () => { const payload = { name: styleData.name, styleNumber: styleData.styleNumber, brand: styleData.brand, imageUrl: styleData.imageUrl, variants: transformToVariants(), }; try { let savedData; if (isEditMode.value) { savedData = await styleService.updateStyle(props.id, payload); ElMessage.success('款式更新成功！'); } else { savedData = await styleService.createStyle(payload); ElMessage.success('款式创建成功！正在切换到编辑模式...'); } Object.assign(styleData, savedData); colorGroups.value = transformToColorGroups(savedData.variants); if (!isEditMode.value) { await router.replace(`/dashboard/styles/edit/${savedData._id}`); } } catch (error) { console.error("保存款式时出错:", error); ElMessage.error(error.response?.data?.message || '操作失败'); } };
const cancel = () => router.push('/dashboard/styles');
const loadData = async () => { if (isEditMode.value) { try { const data = await styleService.getStyle(props.id); Object.assign(styleData, data); colorGroups.value = transformToColorGroups(data.variants); } catch (error) { ElMessage.error('加载款式数据失败'); } } };
const sanitizeSheetName = (name) => { return name.replace(/[\\/?*[\]]/g, '').slice(0, 31); };
const downloadBlob = (blob, filename) => { const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = filename; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(link.href); };
const handleBatchExport = async () => { if (!props.id) return; try { await ElMessageBox.confirm('这将把此款式下所有已保存的BOM，打包成一个.zip文件进行下载。是否继续？', '批量导出确认', { confirmButtonText: '开始导出', cancelButtonText: '取消', type: 'info' }); } catch { return ElMessage.info('导出操作已取消'); } ElMessage.info('正在获取并处理所有BOM数据，请稍候...'); try { const bomsWithVariantInfo = await bomService.getBomsForStyle(props.id); if (!bomsWithVariantInfo || bomsWithVariantInfo.length === 0) { ElMessage.warning('此款式下没有任何已保存的BOM可供导出。'); return; } const zip = new JSZip(); const headerMapping = { bomMaterialName: '款式BOM材料名称', partUsed: '使用部位', materialCategory: '材料类别', materialItemNumber: '材料货号', materialName: '材料名称', colorRule: '颜色规则', specRule: '规格规则', consumptionRule: '用量规则', color: '颜色', spec: '规格', unitConsumption: '单件用量', unit: '单位' }; bomsWithVariantInfo.forEach(item => { if (!item || !item.materials || item.materials.length === 0) return; const fileName = `${styleData.name}-${styleData.styleNumber}-${item.subId}-${item.color}-${item.waist}-${item.inseam}-BOM.xlsx`; const sheetName = sanitizeSheetName(`${item.subId}-${item.color}`); const dataToExport = item.materials.map((material, index) => { const newRow = { '序号': index + 1 }; for (const key in headerMapping) { newRow[headerMapping[key]] = material[key] || ''; } return newRow; }); const worksheet = XLSX.utils.json_to_sheet(dataToExport); const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, worksheet, sheetName); const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' }); zip.file(fileName, excelBuffer); }); if (Object.keys(zip.files).length === 0) { ElMessage.warning('没有找到包含物料的BOM进行导出。'); return; } const zipBlob = await zip.generateAsync({ type: 'blob' }); const zipFileName = `${styleData.name}-${styleData.styleNumber}-所有BOM.zip`; downloadBlob(zipBlob, zipFileName); ElMessage.success(`批量导出成功！已开始下载 ${zipFileName}。`); } catch (error) { console.error("批量导出失败:", error); ElMessage.error('批量导出操作失败。'); } };
onMounted(loadData);
</script>

<style scoped>
/* 样式部分保持不变 */
.top-layout-grid { display: flex; align-items: flex-start; gap: 24px; margin-bottom: 20px; }
.main-info-form { flex-grow: 1; }
.image-upload-section { flex-shrink: 0; width: 150px; display: flex; flex-direction: column; }
.style-image { width: 150px; height: 150px; border-radius: var(--erp-border-radius); border: 1px solid var(--erp-border-color); margin-bottom: 10px; }
.image-slot { display: flex; justify-content: center; align-items: center; width: 100%; height: 100%; background: #f5f7fa; color: var(--el-text-color-secondary); font-size: 14px; }
.page-controls { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.color-group-card { border: 1px solid var(--erp-border-color); border-radius: 4px; padding: 15px 20px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; }
.variant-inputs { display: flex; flex-grow: 1; gap: 15px; align-items: center; }
.color-group-actions { padding-left: 20px; }
.footer-actions { margin-top: 30px; text-align: right; }
</style>