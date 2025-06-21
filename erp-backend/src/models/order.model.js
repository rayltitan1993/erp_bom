const mongoose = require('mongoose');
const orderItemSchema = new mongoose.Schema({
    styleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Style', required: true },
    variantId: { type: String, required: true },
    orderBomId: { type: mongoose.Schema.Types.ObjectId, ref: 'OrderBom' },
    styleNumber: { type: String, required: true },
    styleName: { type: String, required: true },
    variantAttributes: { type: mongoose.Schema.Types.Mixed, default: {} },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, default: 0 }
}, { _id: true });
const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true, required: true },
  orderName: { type: String, required: true },
  customerName: { type: String, default: '' },
  orderDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['未开始', '审批中', '采购中', '生产中', '已完成', '已删除'], default: '未开始' },
  items: [orderItemSchema],
  notes: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });
module.exports = mongoose.model('Order', orderSchema);