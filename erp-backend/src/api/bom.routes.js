const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const { saveTemplateBom, getTemplateBomByVariantId, getOrCreateOrderBom, updateOrderBom, getTemplateBomsByStyleId, getTemplateBomForVariant } = require('../controllers/bom.controller');
router.use(protect);
router.post('/template', saveTemplateBom);
router.get('/template/variant/:variantId', getTemplateBomByVariantId);
router.get('/template/style/:styleId/variant/:variantId', getTemplateBomForVariant);
router.get('/order/:orderId/item/:orderItemId', getOrCreateOrderBom);
router.put('/order-bom/:bomId', updateOrderBom);
router.get('/template/style/:styleId', getTemplateBomsByStyleId);

module.exports = router;