const User = require('../models/user.model');
const jwt = require('jsonwebtoken');

// 用户注册申请
exports.register = async (req, res) => {
  try {
    const { username, password, applicantName, department } = req.body;
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: '账号已存在' });
    }
    const user = new User({ username, password, applicantName, department });
    await user.save();
    res.status(201).json({ message: '注册申请已提交，请等待管理员审批' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error });
  }
};

// 用户登录
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ message: '账号或密码错误' });
    }

    if (user.status !== 'approved') {
        return res.status(403).json({ message: `账号状态异常: ${user.status}` });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: '账号或密码错误' });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        applicantName: user.applicantName,
        role: user.role,
        avatarUrl: user.avatarUrl
      }
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error });
  }
};