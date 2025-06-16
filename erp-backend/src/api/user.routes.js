const express = require('express');
const router = express.Router();
const { getPendingUsers, approveUser, rejectUser } = require('../controllers/user.controller.js');
const { protect, adminOnly } = require('../middlewares/auth.middleware.js');

// 只有管理员才能访问这些路由
router.use(protect, adminOnly);

router.get('/pending', getPendingUsers);
router.put('/:id/approve', approveUser);
router.put('/:id/reject', rejectUser);

module.exports = router;