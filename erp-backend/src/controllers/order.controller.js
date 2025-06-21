const Order = require('../models/order.model');


exports.createOrder = async (req, res) => {
    try {
        // 从请求体中获取所有数据，包括前端生成的orderNumber
        const { orderNumber, orderName, customerName, orderDate, items, notes, status } = req.body;

        // 作为双重保险，如果前端没传订单号，后端仍然会生成一个
        let finalOrderNumber = orderNumber;
        if (!finalOrderNumber) {
            let isUnique = false;
            while (!isUnique) {
                const randomPart = Math.floor(100000 + Math.random() * 900000);
                const customerPrefix = (customerName || 'CUST').slice(0, 5).toUpperCase();
                finalOrderNumber = `${customerPrefix}${randomPart}`;
                const existingOrder = await Order.findOne({ orderNumber: finalOrderNumber });
                if (!existingOrder) isUnique = true;
            }
        }

        const order = new Order({
            orderNumber: finalOrderNumber, // 使用最终确定的订单号
            orderName, customerName, orderDate, items, notes, status,
            createdBy: req.user._id
        });
        
        await order.save();
        res.status(201).json(order);
    } catch (error) {
        console.error("Create Order Error:", error);
        res.status(400).json({ message: '创建订单失败', error: error.message });
    }
};

exports.updateOrder = async (req, res) => {
    try {
        const orderId = req.params.id;
        // 在更新时，明确排除 orderNumber 和 customerName，防止它们被意外修改
        const { orderNumber, customerName, ...updateData } = req.body;
        const updatedOrder = await Order.findByIdAndUpdate(orderId, updateData, { new: true });
        if (!updatedOrder) return res.status(404).json({ message: '订单未找到' });
        res.json(updatedOrder);
    } catch (error) {
        console.error("Update Order Error:", error);
        res.status(400).json({ message: '更新订单失败', error: error.message });
    }
};


exports.getOrders = async (req, res) => {
    try {
        const { search = '', status = '', sortBy = 'updatedAt', order = 'desc' } = req.query;
        let query = { status: { $nin: ['已完成', '已删除'] } };
        if (status && status !== 'all') query.status = status;
        if(status === 'all') delete query.status;

        if (search) {
            const searchRegex = new RegExp(search, 'i');
            query.$or = [{ orderNumber: searchRegex }, { orderName: searchRegex }, { customerName: searchRegex }];
        }
        const sortOrder = order === 'asc' ? 1 : -1;
        const orders = await Order.find(query).sort({ [sortBy]: sortOrder }).lean();
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: '获取订单列表失败', error: error.message });
    }
};

exports.getOrderHistory = async (req, res) => {
    try {
        const { search = '', sortBy = 'updatedAt', order = 'desc' } = req.query;
        let query = { status: { $in: ['已完成', '已删除'] } };
        if (search) {
            const searchRegex = new RegExp(search, 'i');
            query.$or = [{ orderNumber: searchRegex }, { orderName: searchRegex }, { customerName: searchRegex }];
        }
        const sortOrder = order === 'asc' ? 1 : -1;
        const orders = await Order.find(query).sort({ [sortBy]: sortOrder }).lean();
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: '获取历史订单失败', error: error.message });
    }
};

exports.getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).lean();
        if (!order) return res.status(404).json({ message: '订单未找到' });
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: '获取订单详情失败', error: error.message });
    }
};

exports.deleteOrder = async (req, res) => {
    try {
        const order = await Order.findByIdAndUpdate(req.params.id, { status: '已删除' }, { new: true });
        if (!order) return res.status(404).json({ message: '订单未找到' });
        res.json({ message: '订单已移至回收站' });
    } catch (error) {
        res.status(500).json({ message: '删除订单失败', error: error.message });
    }
};

exports.restoreOrder = async (req, res) => {
    try {
        const order = await Order.findByIdAndUpdate(req.params.id, { status: '未开始' }, { new: true });
        if (!order) return res.status(404).json({ message: '订单未找到' });
        res.json({ message: '订单已恢复' });
    } catch (error) {
        res.status(500).json({ message: '恢复订单失败', error: error.message });
    }
};

exports.reorder = async (req, res) => {
    try {
        const originalOrder = await Order.findById(req.params.id).lean();
        if (!originalOrder) return res.status(404).json({ message: '原订单未找到' });

        const newOrder = new Order({
            orderName: `${originalOrder.orderName} - 副本`,
            customerName: originalOrder.customerName,
            items: originalOrder.items,
            notes: originalOrder.notes,
            status: '未开始',
            createdBy: req.user._id,
        });
        await newOrder.save();
        res.status(201).json(newOrder);
    } catch (error) {
        res.status(400).json({ message: '复制订单失败', error: error.message });
    }
};