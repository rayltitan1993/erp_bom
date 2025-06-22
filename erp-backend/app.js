const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// 引入所有路由文件
const authRoutes = require('./src/api/auth.routes');
const userRoutes = require('./src/api/user.routes');
const styleRoutes = require('./src/api/style.routes');
const bomRoutes = require('./src/api/bom.routes');
const orderRoutes = require('./src/api/order.routes');
const uploadRoutes = require('./src/api/upload.routes');
const productionBomRoutes = require('./src/api/productionBom.routes');


const app = express();

// --- 中间件配置 (关键部分) ---

// 1. 允许所有来源的跨域请求
app.use(cors());

// 2. Body Parser 中间件，用于解析请求体。
//    这两行代码必须放在所有API路由注册之前，这是解决问题的关键！
app.use(express.json({ limit: '10mb' })); // 用于解析 application/json
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // 用于解析 application/x-www-form-urlencoded

// 3. 静态文件服务，用于访问上传的图片
app.use('/uploads', express.static('public/uploads'));
app.use('/api/production-boms', productionBomRoutes);



// --- 数据库连接 ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected...'))
  .catch(err => console.error('MongoDB connection error:', err));


// --- 路由注册 ---
// 所有路由都在 Body Parser 之后注册
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/styles', styleRoutes);
app.use('/api/boms', bomRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/upload', uploadRoutes);


// --- 根路由和端口监听 ---
app.get('/', (req, res) => {
    res.send('ERP Backend is running...');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});