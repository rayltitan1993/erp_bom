<template>
  <div class="page-container" v-if="orderStore.order">
    <div ref="exportableContent">
      <div class="page-header">
        <el-button :icon="ArrowLeft" @click="goBack">返回订单管理</el-button>
      </div>

      <div class="order-details-card">
        <div class="top-section">
          <el-tag size="large">{{ orderStore.order.status }}</el-tag>
          <div class="top-actions">
            <el-button :disabled="isEditing">审批管理</el-button>
            <el-button 
              @click="handleExportAll" 
              :loading="isExporting" 
              :disabled="isEditing || isNewOrder">
              导出
            </el-button>
          </div>
        </div>

        <div class="info-grid">
          <div>
            <label>订单名称</label>
            <el-input v-model="orderStore.order.orderName" :disabled="!isEditing" />
          </div>
          <div>
            <label>客户名称</label>
            <el-input v-model="orderStore.order.customerName" :disabled="!isEditing || !isNewOrder" />
          </div>
          <div>
            <label>订货日期</label>
            <el-date-picker v-model="orderStore.order.orderDate" type="date" style="width: 100%;" :disabled="!isEditing" />
          </div>
          <div>
            <label>总订货数量</label>
            <div class="info-text">{{ totalQuantity }}</div>
          </div>
          <div>
            <label>订单编号</label>
            <div class="info-text">{{ orderStore.order.orderNumber || '保存后自动生成' }}</div>
          </div>
          <div>
            <el-button
              type="warning"
              size="large"
              style="width: 100%; margin-top: 24px;"
              :disabled="isEditing || isNewOrder"
              @click="goToProductionBom"
            >
              订单生产BOM
            </el-button>
          </div>
        </div>
      </div>

      <div class="products-card">
        <h2>订单产品信息</h2>
        <el-button type="success" @click="openSkuSelector" :icon="Plus" :disabled="!isEditing">添加产品SKU</el-button>
        
        <el-table :data="orderStore.order.items" style="width: 100%; margin-top: 20px;">
          <el-table-column type="index" label="序号" width="60" />
          <el-table-column prop="styleNumber" label="款号" width="150" />
          <el-table-column prop="styleName" label="款式名称" />
          <el-table-column label="颜色/尺码等属性" >
              <template #default="scope">
                  <el-tag v-for="([key, value]) in Object.entries(scope.row.variantAttributes || {})" :key="key" type="info" size="small" style="margin-right: 5px;">
                      {{key}}: {{value}}
                  </el-tag>
              </template>
          </el-table-column>
          <el-table-column label="订货数量" width="180" align="center">
              <template #default="scope">
                  <el-input-number v-model="scope.row.quantity" :min="1" controls-position="right" :disabled="!isEditing" style="width: 120px;" />
              </template>
          </el-table-column>
          <el-table-column label="操作" width="180" align="center" class-name="action-column">
            <template #default="scope">
              <el-button
                type="primary" 
                link 
                @click="editOrderBom(scope.row)"
                :disabled="isEditing || !orderStore.order._id"
              >
                编辑BOM
              </el-button>
              <el-button type="danger" link @click="removeItem(scope.$index)" :disabled="!isEditing">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div> <div class="page-footer">
      <el-button :disabled="!isEditing">提交审批</el-button>
      <el-button type="primary" @click="handleSave" :disabled="!isEditing">保存</el-button>
      <el-button @click="handleEdit" :disabled="isEditing">编辑</el-button>
      <el-button @click="goBack">取消</el-button>
    </div>

    <el-dialog v-model="skuSelectorVisible" title="选择产品SKU" width="70%" top="5vh">
      <el-autocomplete
        v-model="searchStyleQuery"
        :fetch-suggestions="searchStyles"
        placeholder="第一步：通过款号或名称搜索款式"
        @select="handleStyleSelect"
        style="width: 100%; margin-bottom: 20px;"
        size="large"
      />
      
      <div v-if="selectedStyle.variants" class="sku-table-container">
          <p>第二步：勾选需要添加的SKU</p>
          <el-table :data="selectedStyle.variants" height="400" style="width: 100%;" @selection-change="handleSkuSelectionChange">
              <el-table-column type="selection" width="55" />
              <el-table-column v-for="attr in selectedStyle.variantAttributeSchema" :key="attr" :label="attr" :prop="`attributes.${attr}`" />
          </el-table>
      </div>

      <template #footer>
          <span class="dialog-footer">
              <el-button @click="skuSelectorVisible = false">取消</el-button>
              <el-button type="primary" @click="addSelectedSkusToOrder" :disabled="selectedSkus.length === 0">确认添加</el-button>
          </span>
      </template>
    </el-dialog>

  </div>
  <div v-else class="loading-full-page">正在加载订单...</div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router';
import { useOrderStore } from '@/store/order.store.js';
import styleService from '@/services/style.service';
import productionBomService from '@/services/productionBom.service';
import { ArrowLeft, Plus } from '@element-plus/icons-vue';
import { ElMessageBox, ElMessage } from 'element-plus';

import JSZip from 'jszip';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

const route = useRoute();
const router = useRouter();
const orderStore = useOrderStore();
const isNewOrder = computed(() => !route.params.id);

const isEditing = ref(false);
const isExporting = ref(false);
const exportableContent = ref(null);

const skuSelectorVisible = ref(false);
const searchStyleQuery = ref('');
const selectedStyle = ref({});
const selectedSkus = ref([]);

const totalQuantity = computed(() => {
    if (!orderStore.order || !orderStore.order.items) return 0;
    return orderStore.order.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
});

/**
 * @description: 生成订单详情截图的函数 (V3 - 修复 el-tag 内容缺失)
 * @returns {Promise<Blob|null>}
 */
const generateOrderDetailsImage = () => {
    return new Promise(async (resolve, reject) => {
        const elementToCapture = exportableContent.value;
        if (!elementToCapture) {
            return reject(new Error("无法找到可导出的内容区域。"));
        }

        // --- 准备阶段 1：隐藏不需要的元素 ---
        const ignoredElements = [
            ...elementToCapture.querySelectorAll('.page-header'),
            ...elementToCapture.querySelectorAll('.top-actions'),
            ...elementToCapture.querySelectorAll('.info-grid .el-button'),
            ...elementToCapture.querySelectorAll('.products-card > .el-button[type="success"]'),
            ...elementToCapture.querySelectorAll('.action-column'),
        ];
        ignoredElements.forEach(el => el.setAttribute('data-html2canvas-ignore', 'true'));
        const originalBackgroundColor = elementToCapture.style.backgroundColor;
        elementToCapture.style.backgroundColor = '#ffffff';

        // --- 准备阶段 2：用带样式的 span 临时替换 el-tag ---
        const tempSpans = [];
        const tagsToReplace = elementToCapture.querySelectorAll('.el-table .el-tag');

        tagsToReplace.forEach(tag => {
            const contentSpan = tag.querySelector('.el-tag__content');
            const text = contentSpan ? contentSpan.innerText : tag.innerText;
            
            const span = document.createElement('span');
            span.textContent = text;
            span.style.cssText = 'border: 1px solid #e9e9eb; background-color: #f4f4f5; color: #909399; font-size: 12px; padding: 0 9px; border-radius: 4px; margin: 0 5px 5px 0; display: inline-flex; align-items: center; height: 24px; line-height: 1;';
            
            tag.style.display = 'none'; // 隐藏原始 tag
            tag.parentNode.insertBefore(span, tag);
            
            tempSpans.push({ originalTag: tag, tempSpan: span });
        });

        try {
            // 延迟一小段时间，确保DOM更新被渲染
            await new Promise(r => setTimeout(r, 100));

            const canvas = await html2canvas(elementToCapture, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
            });

            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error("Canvas to Blob conversion failed."));
                }
            }, 'image/png');

        } catch (error) {
            console.error("截图生成失败:", error);
            reject(error);
        } finally {
            // --- 清理阶段：恢复页面原状 ---
            ignoredElements.forEach(el => el.removeAttribute('data-html2canvas-ignore'));
            elementToCapture.style.backgroundColor = originalBackgroundColor;
            tempSpans.forEach(item => {
                item.originalTag.style.display = ''; // 恢复显示
                item.tempSpan.remove(); // 移除临时 span
            });
        }
    });
};


/**
 * @description: 生成生产BOM Excel文件的函数
 */
const generateProductionBomExcel = async () => {
    try {
        const bomData = await productionBomService.get(orderStore.order._id);
        if (!bomData || !bomData.versions || bomData.versions.length === 0) {
            ElMessage.warning('此订单尚无生产BOM数据，已跳过BOM导出。');
            return null;
        }

        bomData.versions.sort((a, b) => b.version - a.version);
        const latestVersion = bomData.versions[0];
        const currentVersionLabel = `BOM_V${latestVersion.version}`;
        
        const headerMapping = {
            productionBomItemId: "编号",
            bomMaterialName: "款式BOM材料名称",
            partUsed: "使用部位",
            materialCategory: "材料类别",
            materialItemNumber: "材料货号",
            materialName: "材料名称",
            color: "颜色",
            spec: "规格",
            totalConsumption: "总用量",
            unit: "单位",
        };

        const dataToExport = latestVersion.materials.map(item => {
            let row = {};
            for (const key in headerMapping) {
                row[headerMapping[key]] = item[key] || '';
            }
             row['总用量'] = (item.totalConsumption || 0).toFixed(3);
            return row;
        });

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, `BOM_V${latestVersion.version}`);

        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const excelBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const fileName = `${orderStore.order.orderName}-${orderStore.order.orderNumber}-${currentVersionLabel}.xlsx`;
        
        return { data: excelBlob, name: fileName };

    } catch (error) {
        console.error("生成BOM Excel失败:", error);
        ElMessage.error("获取生产BOM数据失败，无法导出Excel。");
        return null;
    }
};

/**
 * @description: 总的导出处理函数
 */
const handleExportAll = async () => {
    if (!orderStore.order || !orderStore.order._id) {
        ElMessage.error('无法导出，订单数据不完整。');
        return;
    }
    isExporting.value = true;
    try {
        ElMessage.info('正在生成导出文件，请稍候...');
        const zip = new JSZip();

        const imageBlob = await generateOrderDetailsImage();
        if (imageBlob) {
            zip.file(`订单详情-${orderStore.order.orderNumber}.png`, imageBlob);
        } else {
             ElMessage.error('生成订单详情截图失败！');
        }

        const excelFile = await generateProductionBomExcel();
        if (excelFile) {
            zip.file(excelFile.name, excelFile.data);
        }

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const zipFileName = `${orderStore.order.orderName}-${orderStore.order.orderNumber}.zip`;
        saveAs(zipBlob, zipFileName);
        
        ElMessage.success('文件已开始下载！');

    } catch (error) {
        console.error("导出失败:", error);
        ElMessage.error('导出过程中发生错误，请查看控制台信息。');
    } finally {
        isExporting.value = false;
    }
};

onMounted(() => {
  const orderId = route.params.id;
  if (orderId) {
    isEditing.value = false;
    orderStore.fetchOrder(orderId);
  } else {
    isEditing.value = true;
    orderStore.setNewOrder();
  }
});

onBeforeUnmount(() => {
  orderStore.clearOrder();
});

onBeforeRouteLeave((to, from, next) => {
  if (isEditing.value && orderStore.hasUnsavedChanges()) {
    ElMessageBox.confirm('您正在编辑，有未保存的更改，确定要离开吗？', '提示', { type: 'warning' })
      .then(() => next())
      .catch(() => next(false));
  } else {
    next();
  }
});

const openSkuSelector = () => {
    searchStyleQuery.value = '';
    selectedStyle.value = {};
    selectedSkus.value = [];
    skuSelectorVisible.value = true;
};

const searchStyles = async (queryString, cb) => {
    if (!queryString) return cb([]);
    try {
        const styles = await styleService.searchStyles(queryString);
        cb(styles.map(s => ({ ...s, value: `${s.styleNumber} / ${s.name}` })));
    } catch (error) {
        ElMessage.error("搜索款式失败");
        cb([]);
    }
};

const handleStyleSelect = async (style) => {
    try {
        selectedStyle.value = await styleService.getStyle(style._id);
    } catch (e) {
        ElMessage.error("获取款式详情失败");
        selectedStyle.value = {};
    }
};

const handleSkuSelectionChange = (val) => {
    selectedSkus.value = val;
};

const addSelectedSkusToOrder = () => {
    const newItems = selectedSkus.value.map(variant => ({
        styleId: selectedStyle.value._id,
        styleName: selectedStyle.value.name,
        styleNumber: selectedStyle.value.styleNumber,
        variantId: variant._id,
        variantAttributes: variant.attributes,
        quantity: 1,
    }));

    orderStore.order.items = [...orderStore.order.items, ...newItems];
    skuSelectorVisible.value = false;
};

const removeItem = (index) => {
    const newItems = [...orderStore.order.items];
    newItems.splice(index, 1);
    orderStore.order.items = newItems;
};

const handleEdit = () => {
    isEditing.value = true;
};

const handleSave = async () => {
    try {
        const savedOrder = await orderStore.saveOrder();
        isEditing.value = false;
        if (isNewOrder.value && savedOrder) {
            router.replace(`/dashboard/orders/edit/${savedOrder._id}`);
        }
    } catch (e) {
        // error handled in store
    }
};

const editOrderBom = (item) => { router.push(`/dashboard/orders/${orderStore.order._id}/item/${item._id}/bom`); };
/**
 * @description: 跳转到订单生产BOM页面，增加新订单未保存的判断
 */
const goToProductionBom = () => {
  // 使用 isNewOrder 计算属性来判断是否是新订单
  if (isNewOrder.value) {
    ElMessage.warning('请先保存当前订单，再进行此操作。');
    return; // 中断函数，不执行跳转
  }

  // 如果是已存在的订单，则正常跳转
  if (orderStore.order?._id) {
    router.push(`/dashboard/orders/${orderStore.order._id}/production-bom`);
  } else {
    // 这是一个保险措施，正常情况下已保存的订单总会有ID
    ElMessage.error('无法跳转，缺少订单ID。');
  }
};
const goBack = () => { router.push('/dashboard/orders'); };
</script>

<style scoped>
.page-container { background-color: #f0f2f5; padding: 20px; }
.page-header { margin-bottom: 20px; }
.order-details-card, .products-card { background-color: #fff; padding: 24px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
.top-section { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px 40px; align-items: flex-start; }
.info-grid label { display: block; color: #606266; margin-bottom: 8px; font-size: 14px; }
.info-text { font-size: 16px; font-weight: 500; height: 32px; line-height: 32px; color: #303133; }
.products-card h2 { margin-top: 0; font-size: 18px; color: #303133; }
.page-footer { display: flex; justify-content: center; gap: 15px; margin-top: 30px; }
.loading-full-page { text-align: center; padding: 100px; font-size: 18px; color: #909399;}
.sku-table-container { border-top: 1px solid #e4e7ed; margin-top: 20px; padding-top: 20px; }
.sku-table-container p { font-size: 14px; color: #303133; margin-bottom: 10px; }
.dialog-footer { display: flex; justify-content: flex-end; }
</style>