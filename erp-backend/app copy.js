// 核心依赖引入
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config(); // 用于加载 .env 文件中的环境变量

// 引入路由文件，这是我们自己创建的模块
const authRoutes = require('./src/api/auth.routes');
const userRoutes = require('./src/api/user.routes');
const styleRoutes = require('./src/api/style.routes');

// 引入数据模型，用于初始化管理员账号
const User = require('./src/models/user.model');

// 创建 Express 应用实例
const app = express();

// --- 中间件配置 (Middleware Configuration) ---
// 这里的顺序至关重要

// 1. 启用 CORS (跨域资源共享)
// 允许所有来源的跨域请求，必须放在所有API路由之前
app.use(cors());

// 2. 启用 JSON 解析
// 让 Express 能够自动解析请求体中 Content-Type 为 application/json 的数据
app.use(express.json());


// --- API 路由挂载 (API Route Mounting) ---
// 将不同的路由模块挂载到指定的路径下
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/styles', styleRoutes);


// --- 服务器启动与数据库连接 ---

// 从 .env 文件读取端口号，如果没有则默认为 3000
const PORT = process.env.PORT || 3000;
// 从 .env 文件读取 MongoDB 连接字符串
const MONGO_URI = process.env.MONGO_URI;

// 校验 MONGO_URI 是否存在
if (!MONGO_URI) {
    console.error('FATAL ERROR: MONGO_URI is not defined in .env file.');
    process.exit(1); // 退出进程
}

// 连接到 MongoDB 数据库
mongoose.connect(MONGO_URI)
  .then(() => {
    // 数据库连接成功后执行
    console.log('✅ MongoDB connected...');
    
    // 启动 Express 服务器，开始监听指定端口
    app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
    
    // 初始化管理员账号
    createAdminAccount();
  })
  .catch(err => {
    // 数据库连接失败后执行
    console.error('❌ Could not connect to MongoDB...', err);
    process.exit(1); // 退出进程
  });

/**
 * 检查并创建初始的管理员账号
 * 这个函数只在服务器首次启动且数据库中没有 admin 用户时执行
 */
async function createAdminAccount() {
  try {
    const adminExists = await User.findOne({ username: 'admin' });
    if (!adminExists) {
      const admin = new User({
        username: 'admin',
        password: 'newasia', // 密码会被 user.model.js 中的 pre-save hook 自动哈希
        applicantName: '系统管理员',
        department: 'IT部',
        role: 'admin',
        status: 'approved'
      });
      await admin.save();
      console.log('🔑 Admin account created successfully.');
    }
  } catch (error) {
    console.error('❌ Error creating admin account:', error);
  }
}