const TemplateBom = require('../models/templateBom.model');
const Style = require('../models/style.model');
const OrderBom = require('../models/orderBom.model');
const Order = require('../models/order.model');


// 保存“款式BOM模板”
exports.saveTemplateBom = async (req, res) => {
    const { styleId, variantId, materials } = req.body;

    if (!styleId || !variantId) {
        return res.status(400).json({ message: 'StyleId 和 VariantId 是必需的。' });
    }

    try {
        const updatedBom = await TemplateBom.findOneAndUpdate(
            { variantId: variantId },
            { styleId, variantId, materials },
            { new: true, upsert: true, runValidators: true }
        );
        res.status(200).json(updatedBom);
    } catch (error) {
        console.error("保存BOM模板失败:", error);
        res.status(500).json({ message: '服务器内部错误' });
    }
};

exports.getTemplateBomForVariant = async (req, res) => {
    try {
        const { styleId, variantId } = req.params;

        let bom = await TemplateBom.findOne({ variantId: variantId }).lean();
        if (bom) {
            return res.status(200).json(bom);
        }

        const templateToCopy = await TemplateBom.findOne({ styleId: styleId }).lean();
        const newBomData = {
            styleId: styleId,
            variantId: variantId,
            materials: templateToCopy ? templateToCopy.materials : []
        };
        res.status(200).json(newBomData);

    } catch (error) {
        res.status(500).json({ message: '获取模板BOM失败', error: error.message });
    }
};

// 获取“款式BOM模板”
exports.getTemplateBomByVariantId = async (req, res) => {
    try {
        const bom = await TemplateBom.findOne({ variantId: req.params.variantId }).lean();
        res.status(200).json(bom);
    } catch (error) {
        res.status(500).json({ message: '获取模板BOM失败', error: error.message });
    }
};

// 获取或创建“订单BOM”
exports.getOrCreateOrderBom = async (req, res) => {
    try {
        const { orderId, orderItemId } = req.params;

        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ message: '订单未找到' });

        const orderItem = order.items.id(orderItemId);
        if (!orderItem) return res.status(404).json({ message: '订单产品行未找到' });
        
        if (orderItem.orderBomId) {
            const existingBom = await OrderBom.findById(orderItem.orderBomId);
            if (existingBom) return res.json(existingBom);
        }

        let templateToCopy = null;
        const specificTemplate = await TemplateBom.findOne({ variantId: orderItem.variantId });
        if (specificTemplate) {
            templateToCopy = specificTemplate;
        } else {
            const anyStyleTemplate = await TemplateBom.findOne({ styleId: orderItem.styleId });
            if (anyStyleTemplate) {
                templateToCopy = anyStyleTemplate;
            }
        }

        const newOrderBom = new OrderBom({
            orderId: orderId,
            orderItemId: orderItemId,
            styleId: orderItem.styleId,
            variantId: orderItem.variantId,
            materials: templateToCopy ? templateToCopy.materials : []
        });
        await newOrderBom.save();

        orderItem.orderBomId = newOrderBom._id;
        await order.save();
        
        res.status(201).json(newOrderBom);
    } catch (error) {
        res.status(500).json({ message: '获取或创建订单BOM失败', error: error.message });
    }
};

// 更新“订单BOM”
exports.updateOrderBom = async (req, res) => {
    try {
        const updatedBom = await OrderBom.findByIdAndUpdate(
            req.params.bomId, 
            { materials: req.body.materials }, 
            { new: true }
        );
        if (!updatedBom) return res.status(404).json({ message: '未找到可更新的订单BOM' });
        res.json(updatedBom);
    } catch (error) {
        res.status(400).json({ message: '更新订单BOM失败', error: error.message });
    }
};

exports.getTemplateBomsByStyleId = async (req, res) => {
    try {
        const { styleId } = req.params;
        const boms = await TemplateBom.find({ styleId }).lean();
        if (!boms.length) return res.json([]);

        const style = await Style.findById(styleId).select('variants').lean();
        if (!style) return res.json(boms); // 如果找不到款式，至少返回BOM

        // 将每个BOM与其对应的variant信息合并
        const enrichedBoms = boms.map(bom => {
            const variant = style.variants.find(v => v._id.toString() === bom.variantId);
            return {
                ...bom,
                variantInfo: variant || {} // 附加variant信息
            };
        });

        res.json(enrichedBoms);
    } catch (error) {
        res.status(500).json({ message: '批量获取BOM模板失败', error: error.message });
    }
};