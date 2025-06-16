const Bom = require('../models/bom.model');
const Style = require('../models/style.model');

exports.saveBom = async (req, res) => {
  try {
    const { styleId, variantId, materials } = req.body;
    let bom = await Bom.findOne({ variantId });
    if (bom) {
      bom.materials = materials;
    } else {
      bom = new Bom({ styleId, variantId, materials });
    }
    const savedBom = await bom.save();
    const style = await Style.findById(styleId);
    if (!style) {
      await Bom.findByIdAndDelete(savedBom._id);
      return res.status(404).json({ message: '关联的款式未找到' });
    }
    const variant = style.variants.id(variantId);
    if (!variant) {
      await Bom.findByIdAndDelete(savedBom._id);
      return res.status(404).json({ message: '关联的款式变体未找到' });
    }
    variant.bom = savedBom._id;
    await style.save();
    res.status(200).json(savedBom);
  } catch (error) {
    res.status(400).json({ message: 'BOM保存失败', error: error.message });
  }
};

exports.getBomByVariantId = async (req, res) => {
    try {
        const bom = await Bom.findOne({ variantId: req.params.variantId }).lean();
        res.status(200).json(bom); 
    } catch (error) {
        res.status(500).json({ message: '获取BOM失败', error: error.message });
    }
};

/**
 * @desc 根据 Style ID 获取其下所有的BOM，并附带上每个BOM对应的规格信息 (重写)
 */
exports.getBomsByStyleId = async (req, res) => {
    try {
        // 1. 查找父级款式，并使用 populate 深入加载其下所有 variants 关联的 BOM
        const style = await Style.findById(req.params.styleId)
          .populate({
            path: 'variants.bom', // 填充路径
            model: 'Bom'          // 明确告知要填充的模型
          })
          .lean(); // 使用 lean() 获取纯净的JS对象

        if (!style || !style.variants) {
            return res.status(200).json([]);
        }

        // 2. 筛选出那些确实有关联BOM并且BOM里有物料的规格(variants)
        const variantsWithBom = style.variants.filter(
            variant => variant.bom && variant.bom.materials && variant.bom.materials.length > 0
        );

        // 3. 将数据整理成前端需要的一站式格式
        const responseData = variantsWithBom.map(variant => {
            // 这个映射现在是绝对可靠的，因为我们遍历的是 variant 对象本身，
            // 它天生就包含了 subId, color 等信息，以及被 populate 进来的 bom 对象。
            return {
                variantId: variant._id,
                subId: variant.subId,
                color: variant.color,
                waist: variant.waist,
                inseam: variant.inseam,
                materials: variant.bom.materials,
                updatedAt: variant.bom.updatedAt
            };
        });
        
        res.status(200).json(responseData);
    } catch (error) {
        console.error("Batch get BOMs error:", error);
        res.status(500).json({ message: '批量获取BOM失败', error: error.message });
    }
};