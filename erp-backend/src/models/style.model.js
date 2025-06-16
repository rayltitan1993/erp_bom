const mongoose = require('mongoose');

// 在 Variant (SKU) 的结构中添加新字段
const variantSchema = new mongoose.Schema({
  subId: { type: String }, // 用于存储 Z10001-1 这样的子ID
  color: { type: String, required: true },
  waist: { type: String, default: '' }, // 新增：腰围
  inseam: { type: String, default: '' },// 新增：内长
  bom: { type: mongoose.Schema.Types.ObjectId, ref: 'Bom' } 
}, { _id: true });

// 在款式的顶层结构中添加图片URL字段
const styleSchema = new mongoose.Schema({
  styleNumber: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true },
  brand: { type: String, default: '' },
  imageUrl: { type: String, default: '' }, // 新增：款式示意图URL
  variants: [variantSchema], 
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

const Style = mongoose.model('Style', styleSchema);
module.exports = Style;