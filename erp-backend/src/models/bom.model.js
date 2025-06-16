const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
  bomMaterialName:    { type: String, default: '' },
  partUsed:           { type: String, default: '' },
  materialCategory:   { type: String, default: '' },
  materialItemNumber: { type: String, default: '' },
  materialName:       { type: String, default: '' },
  colorRule:          { type: String, default: '' },
  specRule:           { type: String, default: '' },
  consumptionRule:    { type: String, default: '' },
  color:              { type: String, default: '' },
  spec:               { type: String, default: '' },
  unitConsumption:    { type: Number, default: 0 },
  unit:               { type: String, default: '' },
}, { _id: false });

const bomSchema = new mongoose.Schema({
  styleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Style', required: true }, 
  variantId: { type: mongoose.Schema.Types.ObjectId, required: true }, 
  materials: [materialSchema]
}, { timestamps: true });

const Bom = mongoose.model('Bom', bomSchema);
module.exports = Bom;