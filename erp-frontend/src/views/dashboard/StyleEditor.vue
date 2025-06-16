<template>
  <div>
    <h1>{{ isEditMode ? '编辑款式详情' : '添加新款式' }}</h1>
    <el-form :model="styleData" label-width="120px" :disabled="!isPageEditable">
      <el-form-item label="款式产品名称"><el-input v-model="styleData.name" /></el-form-item>
      <el-form-item label="款式编号"><el-input v-model="styleData.styleNumber" /></el-form-item>
      <el-form-item label="品牌"><el-input v-model="styleData.brand" /></el-form-item>
    </el-form>

    <el-divider />
    <h2>颜色与尺码</h2>
    <el-button @click="addColorGroup" type="success" style="margin-bottom: 20px;">添加颜色分组</el-button>

    <div v-for="(group, groupIndex) in colorGroups" :key="group.id" class="color-group-card">
      <div class="color-group-header">
        <el-input v-model="group.color" placeholder="输入颜色" class="color-input" :disabled="!group.isEditing" />
        <div class="color-group-actions">
          <el-button type="success" @click="handleBom(group)">款式BOM</el-button>
          <el-button type="warning" @click="toggleEditGroup(group)">{{ group.isEditing ? '完成' : '编辑' }}</el-button>
          <el-button type="danger" @click="removeColorGroup(groupIndex)">删除</el-button>
        </div>
      </div>
      <div class="size-container">
        <el-tag
          v-for="(size, sizeIndex) in group.sizes"
          :key="size"
          :closable="group.isEditing"
          @close="removeSize(group, sizeIndex)"
          style="margin-right: 5px; margin-bottom: 5px;"
        >
          {{ size }}
        </el-tag>
        <el-input
          v-if="group.inputVisible && group.isEditing"
          ref="sizeInputRef"
          v-model="group.inputValue"
          class="size-input"
          @keyup.enter="handleSizeInputConfirm(group)"
          @blur="handleSizeInputConfirm(group)"
        />
        <el-button v-if="group.isEditing && !group.inputVisible" class="button-new-size" size="small" @click="showSizeInput(group)">+ 添加尺码</el-button>
      </div>
    </div>
    
    <div class="footer-actions">
      <el-button @click="cancel">取消</el-button>
      <el-button type="primary" @click="saveStyle">保存全部更改</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import styleService from '../../services/style.service';
import { ElMessage } from 'element-plus';

const props = defineProps({ id: String });
const router = useRouter();
const isEditMode = computed(() => !!props.id);
const isPageEditable = ref(!isEditMode.value);

const colorGroups = ref([]); 
const sizeInputRef = ref();
const styleData = reactive({ name: '', styleNumber: '', brand: '', variants: [] });

const toggleEditGroup = (group) => {
  group.isEditing = !group.isEditing;
  // 当点击“编辑”时，也让整个页面的主信息可编辑
  if (group.isEditing) {
    isPageEditable.value = true;
  }
};

const handleBom = (group) => {
  if (!isEditMode.value) {
    ElMessage.warning('请先保存当前款式，然后才能为其管理BOM。');
    return;
  }
  // 我们需要找到这个颜色/尺码组合在原始variants数组中的对应项
  const firstVariant = styleData.variants.find(v => v.color === group.color);
  if (!firstVariant) {
    ElMessage.error('找不到对应的款式变体，请先保存。');
    return;
  }
  router.push(`/dashboard/styles/${props.id}/variant/${firstVariant._id}/bom`);
};

const addColorGroup = () => {
  isPageEditable.value = true;
  colorGroups.value.push({
    id: Date.now(),
    color: '',
    sizes: [],
    inputVisible: false,
    inputValue: '',
    isEditing: true, // 新增的颜色组默认为编辑状态
  });
};

const removeColorGroup = (index) => colorGroups.value.splice(index, 1);
const removeSize = (group, index) => group.sizes.splice(index, 1);
const showSizeInput = (group) => { group.inputVisible = true; nextTick(() => { sizeInputRef.value?.[0]?.focus(); }); };
const handleSizeInputConfirm = (group) => {
  if (group.inputValue && !group.sizes.includes(group.inputValue)) {
    group.sizes.push(group.inputValue);
  }
  group.inputVisible = false;
  group.inputValue = '';
};

const transformToVariants = () => {
  const variants = [];
  colorGroups.value.forEach(group => {
    if (group.color && group.sizes.length > 0) {
      group.sizes.forEach(size => {
        // 查找原始variant，以保留BOM信息
        const originalVariant = styleData.variants.find(v => v.color === group.color && v.size === size);
        variants.push({ 
          color: group.color, 
          size: size,
          bom: originalVariant ? originalVariant.bom : null,
          _id: originalVariant ? originalVariant._id : undefined
        });
      });
    }
  });
  return variants;
};

const transformToColorGroups = (variants = []) => {
  const map = new Map();
  variants.forEach(v => {
    if (!map.has(v.color)) {
      map.set(v.color, {
        id: v.color, // 使用颜色作为key
        color: v.color,
        sizes: [],
        inputVisible: false,
        inputValue: '',
        isEditing: false, // 默认不可编辑
      });
    }
    map.get(v.color).sizes.push(v.size);
  });
  return Array.from(map.values());
};

const saveStyle = async () => {
  const finalVariants = transformToVariants();
  const payload = { ...styleData, variants: finalVariants };
  delete payload.isPageEditable; 

  if (payload.variants.length === 0) {
    ElMessage.warning('请至少添加一个有效的颜色和尺码组合。');
    return;
  }
  
  try {
    if (isEditMode.value) {
      await styleService.updateStyle(props.id, payload);
      ElMessage.success('款式更新成功');
    } else {
      await styleService.createStyle(payload);
      ElMessage.success('款式创建成功');
    }
    router.push('/dashboard/styles');
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '保存失败');
  }
};

const cancel = () => router.push('/dashboard/styles');

const loadStyleData = async () => {
  if (isEditMode.value) {
    try {
      const data = await styleService.getStyle(props.id);
      Object.assign(styleData, data);
      colorGroups.value = transformToColorGroups(data.variants);
    } catch (error) {
      ElMessage.error('加载款式数据失败');
    }
  }
};

onMounted(loadStyleData);
</script>

<style scoped>
.footer-actions { margin-top: 30px; text-align: right; }
.color-group-card { border: 1px solid #dcdfe6; border-radius: 4px; padding: 15px; margin-bottom: 15px; }
.color-group-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
.color-input { font-weight: bold; max-width: 200px; }
.color-input .el-input__inner { font-size: 16px; }
.size-container { display: flex; flex-wrap: wrap; align-items: center; min-height: 32px; }
.size-input { width: 90px; }
.button-new-size { height: 32px; line-height: 30px; padding-top: 0; padding-bottom: 0; }
</style>