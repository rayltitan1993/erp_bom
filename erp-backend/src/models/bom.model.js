const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
  // --- 以下是您要求的全部字段 ---
  bomMaterialName:    { type: String, default: '' }, // 款式BOM材料名称
  partUsed:           { type: String, default: '' }, // 使用部位
  materialCategory:   { type: String, default: '' }, // 材料类别 (新增)
  materialItemNumber: { type: String, default: '' }, // 材料货号
  materialName:       { type: String, default: '' }, // 材料名称 (新增)
  colorRule:          { type: String, default: '' }, // 颜色规则 (新增)
  specRule:           { type: String, default: '' }, // 规格规则 (新增)
  consumptionRule:    { type: String, default: '' }, // 用量规则 (新增)
  color:              { type: String, default: '' }, // 颜色 (新增)
  spec:               { type: String, default: '' }, // 规格 (新增)
  unitConsumption:    { type: Number, default: 0 },  // 单件用量
  unit:               { type: String, default: '' }, // 单位
}, { _id: false });

const bomSchema = new mongoose.Schema({
  styleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Style', required: true }, 
  variantId: { type: mongoose.Schema.Types.ObjectId, required: true }, 
  materials: [materialSchema]
}, { timestamps: true });

const Bom = mongoose.model('Bom', bomSchema);
module.exports = Bom;