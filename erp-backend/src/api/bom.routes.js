const express = require('express');
const router = express.Router();
//const { saveBom, getBomByVariantId } = require('../controllers/bom.controller');
const { protect } = require('../middlewares/auth.middleware');
const { saveBom, getBomByVariantId, getBomsByStyleId } = require('../controllers/bom.controller');


router.use(protect);

router.post('/', saveBom);
router.get('/style/:styleId', getBomsByStyleId);
router.get('/variant/:variantId', getBomByVariantId);

module.exports = router;