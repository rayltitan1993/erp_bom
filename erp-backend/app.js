// 核心依赖引入
const express = require('express');
const mongoose = require('mongoose');
const path = require('path'); // <-- 新增引入 path 模块
const cors = require('cors');
require('dotenv').config(); // 加载 .env 文件中的环境变量

// --- 1. 引入所有路由文件 ---
const authRoutes = require('./src/api/auth.routes');
const userRoutes = require('./src/api/user.routes');
const styleRoutes = require('./src/api/style.routes');
const bomRoutes = require('./src/api/bom.routes'); // 引入BOM路由
const uploadRoutes = require('./src/api/upload.routes'); // <-- 1. 引入上传路由


// --- 2. 引入所有数据模型 ---
// 引入 User 模型用于创建管理员账号
const User = require('./src/models/user.model'); 
// 引入 Style 和 Bom 模型以确保 Mongoose 能够识别并进行关联查询 (populate)
require('./src/models/style.model');
require('./src/models/bom.model'); 

// 创建 Express 应用实例
const app = express();

// --- 3. 配置中间件 (Middleware) ---
// 这里的顺序很重要

// 启用 CORS (跨域资源共享)，允许前端应用访问后端API
app.use(cors());

// 启用 JSON 解析，让服务器能处理 application/json 格式的请求体
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));



// --- 4. 挂载 API 路由 (API Routes) ---
// 将不同的路由模块挂载到指定的路径下
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/styles', styleRoutes);
app.use('/api/boms', bomRoutes); // 挂载BOM路由
app.use('/api/upload', uploadRoutes); // <-- 挂载上传路由



// --- 5. 数据库连接与服务器启动 ---

// 从 .env 文件读取配置，如果不存在则使用默认值
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

// 检查数据库连接字符串是否存在
if (!MONGO_URI) {
    console.error('FATAL ERROR: MONGO_URI is not defined in .env file.');
    process.exit(1); // 如果不存在则退出程序
}

// 连接到 MongoDB 数据库
mongoose.connect(MONGO_URI)
  .then(() => {
    // 数据库连接成功
    console.log('✅ MongoDB connected...');
    
    // 启动 Express 服务器，开始监听指定端口
    app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
    
    // 初始化系统管理员账号
    createAdminAccount();
  })
  .catch(err => {
    // 数据库连接失败
    console.error('❌ Could not connect to MongoDB...', err);
    process.exit(1); // 退出程序
  });

/**
 * 检查并创建初始的系统管理员账号
 * 此函数只在服务器首次启动且数据库中不存在 admin 用户时执行
 */
async function createAdminAccount() {
  try {
    const adminExists = await User.findOne({ username: 'admin' });
    if (!adminExists) {
      const admin = new User({
        username: 'admin',
        password: 'newasia', // 密码会被模型中的 pre-save hook 自动哈希
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