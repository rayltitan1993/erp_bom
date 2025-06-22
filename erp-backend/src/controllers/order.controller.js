const Order = require('../models/order.model');
const OrderBom = require('../models/orderBom.model');
const TemplateBom = require('../models/templateBom.model');

/**
 * 辅助函数：为订单项自动创建并关联BOM
 * @param {Document} order - 刚被保存的Mongoose订单文档
 * @returns {Promise<Document>} - 返回更新后的订单文档
 */
async function linkAndCreateBomsForOrderItems(order) {
    let wasModified = false;

    await Promise.all(order.items.map(async (item) => {
        if (item.orderBomId) return;

        const templateBom = await TemplateBom.findOne({ styleId: item.styleId }).lean();
        if (!templateBom) {
            console.log(`未找到款式 ${item.styleId} 的BOM模板，跳过自动创建。`);
            return;
        }

        const newOrderBom = new OrderBom({
            orderId: order._id,
            orderItemId: item._id,
            styleId: item.styleId,
            variantId: item.variantId, // 【关键修复】从订单项中获取并传入 variantId
            materials: templateBom.materials,
        });
        await newOrderBom.save();

        item.orderBomId = newOrderBom._id;
        wasModified = true;
    }));

    if (wasModified) {
        order.markModified('items'); 
        await order.save();
    }
    
    return order;
}

// 统一的错误处理，提供更详细的日志
function handleControllerError(res, error, messagePrefix) {
    console.error(`${messagePrefix} Error:`, error);
    const messages = error.errors ? Object.values(error.errors).map(e => e.message) : [error.message];
    res.status(400).json({ message: `${messagePrefix}失败`, errors: messages });
}


exports.createOrder = async (req, res) => {
    try {
        const { orderNumber, orderName, customerName, orderDate, items, notes, status } = req.body;

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
            orderNumber: finalOrderNumber,
            orderName, customerName, orderDate, items, notes, status,
            createdBy: req.user._id
        });
        
        await order.save();
        const finalOrder = await linkAndCreateBomsForOrderItems(order);
        
        res.status(201).json(finalOrder);
    } catch (error) {
        handleControllerError(res, error, "创建订单");
    }
};

exports.updateOrder = async (req, res) => {
    try {
        const orderId = req.params.id;
        const { orderNumber, customerName, ...updateData } = req.body;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: '订单未找到' });
        }

        Object.assign(order, updateData);
        order.markModified('items'); 

        await order.save();
        const finalOrder = await linkAndCreateBomsForOrderItems(order);

        res.json(finalOrder);
    } catch (error) {
        handleControllerError(res, error, "更新订单");
    }
};

// --- 其他路由控制器保持不变 ---

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
        const finalOrder = await linkAndCreateBomsForOrderItems(newOrder);
        res.status(201).json(finalOrder);
    } catch (error) {
        handleControllerError(res, error, "复制订单");
    }
};