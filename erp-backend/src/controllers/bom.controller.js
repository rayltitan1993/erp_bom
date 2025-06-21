// FIXED: 移除了对旧bom.model的引用，并引入了新的两个模型
const TemplateBom = require('../models/templateBom.model');
const Style = require('../models/style.model'); // 确保引入Style模型
const OrderBom = require('../models/orderBom.model');
const Order = require('../models/order.model');
// Style模型在这里不是必需的，可以移除
// const Style = require('../models/style.model');

// 保存“款式BOM模板”
exports.saveTemplateBom = async (req, res) => {
    try {
        const { styleId, variantId, materials } = req.body;
        // 使用 findOneAndUpdate 和 upsert:true 来实现“有则更新，无则创建”
        const bom = await TemplateBom.findOneAndUpdate(
            { variantId: variantId }, // 查询条件
            { styleId, materials },    // 更新或创建的数据
            { new: true, upsert: true, setDefaultsOnInsert: true } // 选项
        );
        res.status(200).json(bom);
    } catch (error) {
        res.status(400).json({ message: '模板BOM保存失败', error: error.message });
    }
};

exports.getTemplateBomForVariant = async (req, res) => {
    try {
        const { styleId, variantId } = req.params;

        // 1. 尝试精确查找当前variant的BOM模板
        let bom = await TemplateBom.findOne({ variantId: variantId }).lean();
        
        // 2. 如果找到了，直接返回
        if (bom) {
            return res.status(200).json(bom);
        }

        // 3. 如果没找到，查找同款式的其他任意一个模板作为复制来源
        const templateToCopy = await TemplateBom.findOne({ styleId: styleId }).lean();

        // 4. 无论是否找到可复制的模板，都返回一个“待创建”的BOM结构给前端
        //    让前端页面可以正常渲染，并由用户决定是否“保存”这个新模板
        const newBomData = {
            styleId: styleId,
            variantId: variantId,
            materials: templateToCopy ? templateToCopy.materials : [] // 如果找到模板则复制物料，否则为空数组
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