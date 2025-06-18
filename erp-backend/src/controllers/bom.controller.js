const Bom = require('../models/bom.model');
const Style = require('../models/style.model');

exports.saveBom = async (req, res) => {
  try {
    const { styleId, variantId, materials } = req.body;
    let bom = await Bom.findOne({ variantId });
    if (bom) { bom.materials = materials; } 
    else { bom = new Bom({ styleId, variantId, materials }); }
    const savedBom = await bom.save();
    const style = await Style.findById(styleId);
    if (!style) { await Bom.findByIdAndDelete(savedBom._id); return res.status(404).json({ message: '关联的款式未找到' }); }
    const variant = style.variants.id(variantId);
    if (!variant) { await Bom.findByIdAndDelete(savedBom._id); return res.status(404).json({ message: '关联的款式变体未找到' }); }
    variant.bom = savedBom._id;
    await style.save();
    res.status(200).json(savedBom);
  } catch (error) { res.status(400).json({ message: 'BOM保存失败', error: error.message }); }
};

exports.getBomByVariantId = async (req, res) => {
    try {
        const bom = await Bom.findOne({ variantId: req.params.variantId }).lean();
        res.status(200).json(bom); 
    } catch (error) {
        res.status(500).json({ message: '获取BOM失败', error: error.message });
    }
};

// CHANGED: 适配新的 variants.attributes 结构
exports.getBomsByStyleId = async (req, res) => {
    try {
        const style = await Style.findById(req.params.styleId).populate({ path: 'variants.bom', model: 'Bom' }).lean();
        if (!style || !style.variants) { return res.status(200).json([]); }
        
        const variantsWithBom = style.variants.filter(v => v.bom && v.bom.materials && v.bom.materials.length > 0);
        
        const responseData = variantsWithBom.map(variant => ({
            variantId: variant._id,
            subId: variant.subId,
            // CHANGED: 传递整个 attributes map
            attributes: variant.attributes,
            materials: variant.bom.materials,
            updatedAt: variant.bom.updatedAt
        }));

        res.status(200).json(responseData);
    } catch (error) { res.status(500).json({ message: '批量获取BOM失败', error: error.message }); }
};