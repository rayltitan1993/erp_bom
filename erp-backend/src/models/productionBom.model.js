const mongoose = require('mongoose');

// FIXED: The schema now includes ALL detailed fields to match the data being generated.
const ConsolidatedMaterialSchema = new mongoose.Schema({
    productionBomItemId: { type: String, required: true },
    bomMaterialName: { type: String, default: '' },
    partUsed: { type: String, default: '' },
    materialCategory: { type: String, default: '' },
    materialItemNumber: { type: String, index: true },
    materialName: { type: String, default: '' },
    color: { type: String, default: '' },
    spec: { type: String, default: '' },
    unit: { type: String, default: '' },
    totalConsumption: { type: Number, required: true },
}, { _id: false });

// 变更记录的结构 (也使用完整的 Schema)
const DiffSchema = new mongoose.Schema({
    added: [ConsolidatedMaterialSchema],
    changed: [{
        before: ConsolidatedMaterialSchema,
        after: ConsolidatedMaterialSchema
    }],
    removed: [ConsolidatedMaterialSchema]
}, { _id: false });

// 单个BOM版本的结构
const VersionSchema = new mongoose.Schema({
    version: { type: Number, required: true },
    materials: [ConsolidatedMaterialSchema],
    diff: DiffSchema,
    createdAt: { type: Date, default: Date.now }
}, { _id: false });

// 生产BOM主结构
const ProductionBomSchema = new mongoose.Schema({
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
    orderNumber: { type: String, required: true },
    versions: [VersionSchema]
}, { timestamps: true });

module.exports = mongoose.model('ProductionBom', ProductionBomSchema);