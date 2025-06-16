const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  color: { type: String, required: true },
  size: { type: String, required: true },
  bom: { type: mongoose.Schema.Types.ObjectId, ref: 'Bom' } 
}, { _id: true });

const styleSchema = new mongoose.Schema({
  styleNumber: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true },
  brand: { type: String, default: '' },
  variants: [variantSchema], 
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

const Style = mongoose.model('Style', styleSchema);
module.exports = Style;