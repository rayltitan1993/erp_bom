const User = require('../models/user.model');

// 获取待审批的用户列表
exports.getPendingUsers = async (req, res) => {
  try {
    const users = await User.find({ status: 'pending' }).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error });
  }
};

// 批准用户注册
exports.approveUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { status: 'approved' }, { new: true });
    if (!user) {
      return res.status(404).json({ message: '未找到该用户' });
    }
    res.json({ message: '用户已批准' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error });
  }
};

// 拒绝用户注册
exports.rejectUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { status: 'rejected' }, { new: true });
    if (!user) {
      return res.status(404).json({ message: '未找到该用户' });
    }
    res.json({ message: '用户已拒绝' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error });
  }
};