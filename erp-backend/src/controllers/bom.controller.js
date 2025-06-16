const Bom = require('../models/bom.model');
const Style = require('../models/style.model');

// 一个统一的创建/更新BOM的接口
exports.saveBom = async (req, res) => {
  try {
    const { styleId, variantId, materials } = req.body;

    // 查找这个variant是否已经有BOM
    const existingBom = await Bom.findOne({ variantId });

    let savedBom;
    if (existingBom) {
      // 如果已存在，则更新
      existingBom.materials = materials;
      savedBom = await existingBom.save();
    } else {
      // 如果不存在，则创建新的BOM
      const newBom = new Bom({ styleId, variantId, materials });
      savedBom = await newBom.save();
      
      // 关键：将新创建的BOM的ID关联回款式的variant中
      await Style.updateOne(
        { _id: styleId, 'variants._id': variantId },
        { $set: { 'variants.$.bom': savedBom._id } }
      );
    }
    res.status(200).json(savedBom);
  } catch (error) {
    res.status(400).json({ message: 'BOM保存失败', error: error.message });
  }
};

// 根据Variant ID获取BOM
exports.getBomByVariantId = async (req, res) => {
    try {
        const bom = await Bom.findOne({ variantId: req.params.variantId }).lean();
        // 即使找不到BOM也返回成功，只是数据为空，由前端判断如何显示
        res.status(200).json(bom); 
    } catch (error) {
        res.status(500).json({ message: '获取BOM失败', error: error.message });
    }
};