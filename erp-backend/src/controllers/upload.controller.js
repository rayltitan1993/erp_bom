const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const fs = require('fs');

// 1. 配置 Multer 存储引擎
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 确保上传目录存在
    const uploadPath = 'public/uploads';
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // 创建一个唯一的文件名，避免重名覆盖
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// 2. 文件类型过滤器
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png/;
  const mimeType = allowedTypes.test(file.mimetype);
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (mimeType && extname) {
    return cb(null, true);
  }
  cb('Error: 只允许上传 JPEG 或 PNG 格式的图片!');
};

// 3. 创建 Multer 实例
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 限制文件大小为 5MB
}).single('file'); // 'file' 是前端上传时表单数据的字段名

// 4. 创建主控制器函数
exports.uploadImage = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message || err });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: '没有选择任何文件' });
    }

    try {
      const processedImagePath = path.join('public/uploads', 'processed-' + req.file.filename);
      
      // 5. 使用 Sharp 进行图片压缩和尺寸调整
      await sharp(req.file.path)
        .resize(800, 800, { // 调整尺寸，最大宽度/高度为800px
          fit: 'inside', // 保持宽高比，在800x800的框内
          withoutEnlargement: true // 不放大比800px小的图片
        })
        .toFormat('jpeg', { quality: 85 }) // 转换为jpeg格式，压缩质量为85%
        .toFile(processedImagePath);
      
      // 删除原始上传的文件
      fs.unlinkSync(req.file.path);

      // 6. 构建可供前端访问的URL
      // 注意：这里的URL路径是相对于服务器根目录的
      const fileUrl = `/uploads/processed-${req.file.filename}`;

      res.status(200).json({
        success: true,
        message: '图片上传并处理成功',
        url: fileUrl // 返回可访问的图片URL
      });

    } catch (sharpError) {
      res.status(500).json({ success: false, message: '图片处理失败', error: sharpError.message });
    }
  });
};