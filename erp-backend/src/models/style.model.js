const mongoose = require('mongoose');

// 在 Variant (SKU) 的结构中，用一个灵活的 dimensions 数组替换静态字段
const variantSchema = new mongoose.Schema({
  subId: { type: String },
  color: { type: String, required: true },
  dimensions: [{ type: String }], // 新增：存储 "腰围: 110" 这样的尺寸描述字符串
  bom: { type: mongoose.Schema.Types.ObjectId, ref: 'Bom' } 
}, { _id: true });

const styleSchema = new mongoose.Schema({
  styleNumber: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true },
  brand: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
  variants: [variantSchema], 
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isArchived: { type: Boolean, default: false, index: true }
}, { timestamps: true });

const Style = mongoose.model('Style', styleSchema);
module.exports = Style;