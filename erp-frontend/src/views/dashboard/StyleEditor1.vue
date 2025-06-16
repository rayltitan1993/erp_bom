<template>
  <div>
    <h1>{{ isEditMode ? '编辑款式详情' : '添加新款式' }}</h1>
    <el-form :model="styleData" label-width="120px">
      <el-form-item label="款式产品名称"><el-input v-model="styleData.name" /></el-form-item>
      <el-form-item label="款式编号"><el-input v-model="styleData.styleNumber" /></el-form-item>
      <el-form-item label="品牌"><el-input v-model="styleData.brand" /></el-form-item>
    </el-form>

    <el-divider />
    <h2>颜色与尺码</h2>
    <el-button @click="addColorGroup" type="success" style="margin-bottom: 20px;">添加颜色分组</el-button>

    <div v-for="(group, groupIndex) in colorGroups" :key="group.id" class="color-group-card">
      <div class="color-group-header">
        <el-input v-model="group.color" placeholder="输入颜色" class="color-input" />
        <el-button type="danger" link @click="removeColorGroup(groupIndex)">删除此颜色</el-button>
      </div>
      <div class="size-container">
        <el-tag
          v-for="(size, sizeIndex) in group.sizes"
          :key="size"
          closable
          @close="removeSize(group, sizeIndex)"
          style="margin-right: 5px; margin-bottom: 5px;"
        >
          {{ size }}
        </el-tag>
        <el-input
          v-if="group.inputVisible"
          ref="sizeInputRef"
          v-model="group.inputValue"
          class="size-input"
          @keyup.enter="handleSizeInputConfirm(group)"
          @blur="handleSizeInputConfirm(group)"
        />
        <el-button v-else class="button-new-size" size="small" @click="showSizeInput(group)">+ 添加尺码</el-button>
      </div>
    </div>
    
    <div class="footer-actions">
      <el-button @click="cancel">取消保存</el-button>
      <el-button type="primary" @click="saveStyle">保存</el-button>
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

// 用于UI展示的按颜色分组的数据结构
const colorGroups = ref([]); 
const sizeInputRef = ref();

// 提交到后端的基础数据结构
const styleData = reactive({ name: '', styleNumber: '', brand: '' });

// --- UI操作方法 ---
const addColorGroup = () => {
  colorGroups.value.push({
    id: Date.now(), // 临时唯一key
    color: '',
    sizes: [],
    inputVisible: false,
    inputValue: '',
  });
};
const removeColorGroup = (index) => colorGroups.value.splice(index, 1);
const removeSize = (group, index) => group.sizes.splice(index, 1);
const showSizeInput = (group) => {
  group.inputVisible = true;
  nextTick(() => { sizeInputRef.value?.[0]?.focus(); });
};
const handleSizeInputConfirm = (group) => {
  if (group.inputValue) {
    group.sizes.push(group.inputValue);
  }
  group.inputVisible = false;
  group.inputValue = '';
};

// --- 数据转换与API交互 ---

// (核心逻辑) 保存时，将UI的分组结构转换为后端需要的扁平variants数组
const transformToVariants = () => {
  const variants = [];
  colorGroups.value.forEach(group => {
    if (group.color && group.sizes.length > 0) {
      group.sizes.forEach(size => {
        variants.push({ color: group.color, size: size });
      });
    }
  });
  return variants;
};

// (核心逻辑) 加载时，将后端扁平的variants数组转换为UI所需的分组结构
const transformToColorGroups = (variants = []) => {
  const map = new Map();
  variants.forEach(v => {
    if (!map.has(v.color)) {
      map.set(v.color, {
        id: Date.now() + Math.random(),
        color: v.color,
        sizes: [],
        inputVisible: false,
        inputValue: '',
      });
    }
    map.get(v.color).sizes.push(v.size);
  });
  return Array.from(map.values());
};

const saveStyle = async () => {
  const payload = {
    ...styleData,
    variants: transformToVariants(),
  };

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
      const data = await styleService.getStyle(props.id); // 假设service有getStyle方法
      Object.assign(styleData, { name: data.name, styleNumber: data.styleNumber, brand: data.brand });
      colorGroups.value = transformToColorGroups(data.variants);
    } catch (error) {
      ElMessage.error('加载款式数据失败');
    }
  }
};

onMounted(loadStyleData);


<style scoped>
.footer-actions { margin-top: 30px; text-align: right; }
.color-group-card { border: 1px solid #dcdfe6; border-radius: 4px; padding: 20px; margin-bottom: 20px; }
.color-group-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
.color-input { max-width: 200px; }
.size-container { display: flex; flex-wrap: wrap; align-items: center; }
.size-input { width: 90px; }
.button-new-size { height: 32px; line-height: 30px; padding-top: 0; padding-bottom: 0; }
</style>
