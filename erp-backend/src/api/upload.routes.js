const express = require('express');
const router = express.Router();
const { uploadImage } = require('../controllers/upload.controller');
const { protect } = require('../middlewares/auth.middleware');

// 图片上传需要登录保护
router.post('/image', protect, uploadImage);

module.exports = router;