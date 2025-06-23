const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware'); // 假设所有BOM操作都需要登录
const {
    saveTemplateBom,
    getTemplateBomForVariant,
    getOrCreateOrderBom,
    updateOrderBom,
    getTemplateBomsByStyleId // 引入控制器函数
} = require('../controllers/bom.controller');

// 所有BOM路由都需要登录保护
router.use(protect);

// 保存/更新款式BOM模板
router.post('/template', saveTemplateBom);

// 获取单个款式BOM模板 (用于编辑页)
router.get('/template/style/:styleId/variant/:variantId', getTemplateBomForVariant);

// 【新增路由】批量获取一个款式下的所有BOM模板 (用于批量导出)
router.get('/template/style/:styleId', getTemplateBomsByStyleId);

// 获取或创建订单产品BOM
router.get('/order/:orderId/item/:orderItemId', getOrCreateOrderBom);

// 更新订单产品BOM
router.put('/order-bom/:bomId', updateOrderBom);

module.exports = router;