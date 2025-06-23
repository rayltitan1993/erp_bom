const User = require('../models/user.model');

// 【关键修复】补全 getPendingUsers 的实现
exports.getPendingUsers = async (req, res) => {
  try {
    // 查询所有状态为 'pending' 的用户，并且不返回密码字段
    const users = await User.find({ status: 'pending' }).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: '获取待审批用户列表错误', error });
  }
};

// 【关键修复】补全 approveUser 的实现
exports.approveUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { status: 'approved' }, { new: true });
    if (!user) {
      return res.status(404).json({ message: '未找到该用户' });
    }
    res.json({ message: '用户已批准' });
  } catch (error) {
    res.status(500).json({ message: '批准用户操作错误', error });
  }
};

// 【关键修复】补全 rejectUser 的实现
exports.rejectUser = async (req, res) => {
  try {
    // 您可以选择将状态改为 rejected，或者直接删除该条申请记录
    // 这里我们选择直接删除，更为干净
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: '未找到该用户' });
    }
    res.json({ message: '用户申请已拒绝并删除' });
  } catch (error) {
    res.status(500).json({ message: '拒绝用户操作错误', error });
  }
};

/**
 * @desc 获取所有已批准的用户列表
 */
exports.getApprovedUsers = async (req, res) => {
  try {
    const users = await User.find({ status: 'approved' }).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: '获取已授权用户列表错误', error });
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
    
    if (userToDelete.role === 'admin') {
      return res.status(403).json({ message: '权限不足：无法删除管理员账号！' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: '用户权限已成功删除' });
  } catch (error) {
    res.status(500).json({ message: '删除用户操作错误', error });
  }
};