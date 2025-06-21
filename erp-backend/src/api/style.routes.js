const express = require('express');
const router = express.Router();
const { 
  createStyle, 
  getStyles, 
  getArchivedStyles,
  getStyleById, 
  updateStyle, 
  deleteStyle,
  restoreStyle,
  permanentlyDeleteStyle,
  searchStyles
} = require('../controllers/style.controller');
const { protect, adminOnly } = require('../middlewares/auth.middleware');

// 所有款式相关的路由都需要用户登录认证
router.use(protect);

// 路由: /api/styles
router.route('/')
  .get(getStyles)
  .post(createStyle);

// --- FIXED: 将具体的路由放在带参数的路由之前 ---

// 获取已归档的款式
router.get('/archived', getArchivedStyles);

// 搜索款式 (为订单编辑器提供)
router.get('/search', searchStyles);

// ---------------------------------------------

// 路由: /api/styles/:id (带参数的路由在后)
router.route('/:id')
  .get(getStyleById)
  .put(updateStyle)
  .delete(deleteStyle); // 注意：这个delete现在是软删除（归档）

// 恢复已归档的款式
router.put('/:id/restore', adminOnly, restoreStyle);

// 永久删除款式
router.delete('/:id/permanent', adminOnly, permanentlyDeleteStyle);


module.exports = router;