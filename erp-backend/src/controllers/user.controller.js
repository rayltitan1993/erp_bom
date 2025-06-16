const User = require('../models/user.model');

// 获取待审批的用户列表 (已有)
exports.getPendingUsers = async (req, res) => {
  // ... 此函数代码保持不变 ...
};

// 批准用户注册 (已有)
exports.approveUser = async (req, res) => {
  // ... 此函数代码保持不变 ...
};

// 拒绝用户注册 (已有)
exports.rejectUser = async (req, res) => {
  // ... 此函数代码保持不变 ...
};

// --- 新增函数 ---

/**
 * @desc 获取所有已批准的用户列表
 */
exports.getApprovedUsers = async (req, res) => {
  try {
    // 查询条件为 status: 'approved'
    const users = await User.find({ status: 'approved' }).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error });
  }
};

/**
 * @desc 删除指定用户 (销权)
 */
exports.deleteUser = async (req, res) => {
  try {
    const userToDelete = await User.findById(req.params.id);

    if (!userToDelete) {
      return res.status(404).json({ message: '未找到该用户' });
    }

    // --- 关键安全检查：禁止删除管理员账号 ---
    if (userToDelete.role === 'admin') {
      return res.status(403).json({ message: '权限不足：无法删除管理员账号！' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: '用户权限已成功删除' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error });
  }
};