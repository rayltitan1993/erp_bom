const mongoose = require('mongoose'); // <-- 确保这一行存在
const Order = require('../models/order.model');
const OrderBom = require('../models/orderBom.model');
const ProductionBom = require('../models/productionBom.model');

const getMaterialKey = (material) => {
    return material.materialItemNumber || material.materialName || material.bomMaterialName || 'UNKNOWN_MATERIAL';
};

// generateProductionBom 函数保持我们上一版的最终逻辑，它是正确的
exports.generateProductionBom = async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await Order.findById(orderId).lean();
        if (!order) return res.status(404).json({ message: "订单未找到" });

        const orderBoms = await OrderBom.find({ orderId: order._id }).lean();
        
        const consolidatedMap = new Map();
        order.items.forEach(item => {
            const bom = orderBoms.find(b => b.orderItemId.toString() === item._id.toString());
            if (!bom || !bom.materials) return;
            
            bom.materials.forEach(material => {
                const key = getMaterialKey(material);
                const totalConsumption = (material.unitConsumption || 0) * item.quantity;
                if (consolidatedMap.has(key)) {
                    consolidatedMap.get(key).totalConsumption += totalConsumption;
                } else {
                    consolidatedMap.set(key, { ...material, totalConsumption });
                }
            });
        });

        let currentVersionMaterials = [];
        let index = 1;
        for (const material of consolidatedMap.values()) {
            currentVersionMaterials.push({
                productionBomItemId: `${order.orderNumber}-${index++}`,
                ...material
            });
        }

        let prodBom = await ProductionBom.findOne({ orderId });
        const diff = { added: [], changed: [], removed: [] };
        const newVersionNumber = prodBom ? prodBom.versions.length + 1 : 1;

        if (!prodBom) {
            prodBom = new ProductionBom({ orderId, orderNumber: order.orderNumber, versions: [] });
            diff.added = currentVersionMaterials;
        } else {
            const latestVersion = prodBom.versions.sort((a, b) => b.version - a.version)[0];
            if (latestVersion && latestVersion.materials) {
                const oldMap = new Map(latestVersion.materials.map(m => [getMaterialKey(m), m]));
                const newMap = new Map(currentVersionMaterials.map(m => [getMaterialKey(m), m]));
                for (const [key, newMaterial] of newMap.entries()) {
                    const oldMaterial = oldMap.get(key);
                    if (oldMaterial) {
                        if (Math.abs(oldMaterial.totalConsumption - newMaterial.totalConsumption) > 0.0001) {
                            diff.changed.push({ before: oldMaterial, after: newMaterial });
                        }
                        oldMap.delete(key);
                    } else {
                        diff.added.push(newMaterial);
                    }
                }
                diff.removed = Array.from(oldMap.values());
            } else {
                 diff.added = currentVersionMaterials;
            }
        }
        
        prodBom.versions.push({ version: newVersionNumber, materials: currentVersionMaterials, diff: diff, createdAt: new Date() });
        await prodBom.save();
        
        const finalProdBom = await ProductionBom.findOne({ orderId }).lean();
        res.status(201).json(finalProdBom);
    } catch (error) {
        console.error("Generate Production BOM Error:", error);
        res.status(500).json({ message: "生成生产BOM失败", error: error.message });
    }
};

// FIXED: 使用聚合管道来确保返回完整的数据
exports.getProductionBomForOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const productionBoms = await ProductionBom.aggregate([
            { $match: { orderId: new mongoose.Types.ObjectId(orderId) } },
            // 如果需要，可以在这里添加更多操作，但通常直接返回就足够了
        ]);

        if (!productionBoms || productionBoms.length === 0) {
            return res.status(200).json(null);
        }

        // 聚合查询返回的是一个数组，我们只需要第一个元素
        res.json(productionBoms[0]);
    } catch (error) {
        console.error("Get Production BOM Error:", error);
        res.status(500).json({ message: "获取生产BOM失败", error: error.message });
    }
};