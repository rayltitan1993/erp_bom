const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const { generateProductionBom, getProductionBomForOrder } = require('../controllers/productionBom.controller');

router.use(protect);

// 生成/刷新生产BOM
router.post('/generate/:orderId', generateProductionBom);
// 获取生产BOM（含历史）
router.get('/:orderId', getProductionBomForOrder);

module.exports = router;