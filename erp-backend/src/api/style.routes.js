const express = require('express');
const router = express.Router();
// 核心修复：在这里引入所有需要用到的函数
const { 
  createStyle, 
  getStyles, 
  getArchivedStyles, // <-- 引入
  getStyleById, 
  updateStyle, 
  deleteStyle,
  restoreStyle,       // <-- 引入
  permanentlyDeleteStyle // <-- 引入
} = require('../controllers/style.controller');
const { protect, adminOnly } = require('../middlewares/auth.middleware');

// 所有款式相关的路由都需要用户登录认证
router.use(protect);

// 路由: /api/styles
router.route('/')
  .get(getStyles)
  .post(createStyle);

// 新增：获取已归档的款式
router.get('/archived', getArchivedStyles);

// 路由: /api/styles/:id
router.route('/:id')
  .get(getStyleById)
  .put(updateStyle)
  .delete(deleteStyle); // 注意：这个delete现在是软删除（归档）

// 新增：恢复已归档的款式
router.put('/:id/restore', adminOnly, restoreStyle);

// 新增：永久删除款式
router.delete('/:id/permanent', adminOnly, permanentlyDeleteStyle);


module.exports = router;