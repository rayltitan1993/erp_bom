const mongoose = require('mongoose');
const variantSchema = new mongoose.Schema({
  subId: { type: String },
  attributes: { type: Map, of: String, required: true },
  bom: { type: mongoose.Schema.Types.ObjectId, ref: 'TemplateBom' } 
}, { _id: true });
const styleSchema = new mongoose.Schema({
  styleNumber: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true },
  brand: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
  variantAttributeSchema: { type: [String], default: [] },
  variants: [variantSchema], 
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isArchived: { type: Boolean, default: false, index: true }
}, { timestamps: true });
module.exports = mongoose.model('Style', styleSchema);