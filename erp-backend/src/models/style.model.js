const mongoose = require('mongoose');

// NEW: Variant 结构变更，使用一个 Map 来存储动态的键值对属性
const variantSchema = new mongoose.Schema({
  subId: { type: String },
  // REPLACED: 'color' 和 'dimensions' 被 'attributes' 替代
  attributes: {
    type: Map,
    of: String,
    required: true,
  },
  bom: { type: mongoose.Schema.Types.ObjectId, ref: 'Bom' } 
}, { _id: true });

const styleSchema = new mongoose.Schema({
  styleNumber: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true },
  brand: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
  
  // NEW: 存储此款式所有变体的属性定义（例如 ["颜色", "腰围", "内长"]）
  // 这个定义在创建第一个变体时被确定下来
  variantAttributeSchema: {
    type: [String],
    default: []
  },
  
  variants: [variantSchema], 
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isArchived: { type: Boolean, default: false, index: true }
}, { timestamps: true });

const Style = mongoose.model('Style', styleSchema);
module.exports = Style;