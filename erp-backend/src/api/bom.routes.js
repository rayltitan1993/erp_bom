const express = require('express');
const router = express.Router();
const { saveBom, getBomByVariantId } = require('../controllers/bom.controller');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect);

// 统一的保存接口
router.post('/', saveBom);

// 根据 variantId 获取 BOM
router.get('/variant/:variantId', getBomByVariantId);

module.exports = router;