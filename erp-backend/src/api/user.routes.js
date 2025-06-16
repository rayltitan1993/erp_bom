const express = require('express');
const router = express.Router();
const { 
  getPendingUsers, 
  approveUser, 
  rejectUser,
  getApprovedUsers, // <-- 新增引入
  deleteUser        // <-- 新增引入
} = require('../controllers/user.controller.js');
const { protect, adminOnly } = require('../middlewares/auth.middleware.js');

// 所有用户管理相关的路由都必须是管理员才能访问
router.use(protect, adminOnly);

// 获取待审批用户
router.get('/pending', getPendingUsers);

// 获取已授权用户 (新增路由)
router.get('/approved', getApprovedUsers);

// 审批操作
router.put('/:id/approve', approveUser);
router.put('/:id/reject', rejectUser);

// 删除用户操作 (新增路由)
router.delete('/:id', deleteUser);

module.exports = router;