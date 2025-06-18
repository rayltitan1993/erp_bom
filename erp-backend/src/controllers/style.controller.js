const Style = require('../models/style.model');

// CHANGED: 适配新的 'variantAttributeSchema'
exports.createStyle = async (req, res) => {
  try {
    const { name, styleNumber, brand, imageUrl, variants, variantAttributeSchema } = req.body;
    const style = new Style({ name, styleNumber, brand, imageUrl, variantAttributeSchema, variants, createdBy: req.user._id });
    const savedStyle = await style.save();
    res.status(201).json(savedStyle);
  } catch (error) { res.status(400).json({ message: '创建失败', error: error.message }); }
};

exports.getStyles = async (req, res) => {
  try {
    const styles = await Style.find({ isArchived: false }).sort({ createdAt: -1 }).populate('createdBy', 'applicantName').lean();
    res.json(styles);
  } catch (error) { res.status(500).json({ message: '服务器错误', error }); }
};

exports.getArchivedStyles = async (req, res) => {
  try {
    const styles = await Style.find({ isArchived: true }).sort({ createdAt: -1 }).populate('createdBy', 'applicantName').lean();
    res.json(styles);
  } catch (error) { res.status(500).json({ message: '服务器错误', error }); }
};

exports.getStyleById = async (req, res) => {
  try {
    const style = await Style.findById(req.params.id).lean();
    if (!style) { return res.status(404).json({ message: '未找到该款式' }); }
    res.json(style);
  } catch (error) { res.status(500).json({ message: '服务器错误', error: error.message }); }
};

// CHANGED: 更新逻辑完全适配新的 variantAttributeSchema 和 variants.attributes
exports.updateStyle = async (req, res) => {
  try {
    const style = await Style.findById(req.params.id);
    if (!style) { return res.status(404).json({ message: '未找到该款式' }); }
    
    style.name = req.body.name || style.name;
    style.brand = req.body.brand || style.brand;
    style.imageUrl = req.body.imageUrl;
    
    // 如果款式的属性定义Schema首次被设定，则更新它
    if (req.body.variantAttributeSchema && style.variantAttributeSchema.length === 0) {
      style.variantAttributeSchema = req.body.variantAttributeSchema;
    }
    
    // 更新 variants
    if (req.body.variants) {
        style.variants = req.body.variants.map(v => {
            const existingVariant = v._id ? style.variants.id(v._id) : null;
            if (existingVariant) {
                // 对于已存在的 variant，直接用新的数据覆盖
                existingVariant.set(v);
                return existingVariant;
            } else {
                // 对于新添加的 variant，直接返回新数据
                return v; 
            }
        });
    }
    
    const updatedStyle = await style.save();
    res.json(updatedStyle);
  } catch (error) {
    console.error('Update Style Error:', error);
    res.status(400).json({ message: '更新失败', error: error.message });
  }
};

exports.deleteStyle = async (req, res) => {
  try {
    const style = await Style.findByIdAndUpdate(req.params.id, { isArchived: true }, { new: true });
    if (!style) { return res.status(404).json({ message: '未找到该款式' }); }
    res.json({ message: '款式已移至回收站' });
  } catch (error) { res.status(500).json({ message: '操作失败', error }); }
};

exports.restoreStyle = async (req, res) => {
  try {
    const style = await Style.findByIdAndUpdate(req.params.id, { isArchived: false }, { new: true });
    if (!style) { return res.status(404).json({ message: '未找到该款式' }); }
    res.json({ message: '款式已恢复' });
  } catch (error) { res.status(500).json({ message: '操作失败', error }); }
};

exports.permanentlyDeleteStyle = async (req, res) => {
  try {
    const style = await Style.findByIdAndDelete(req.params.id);
    if (!style) { return res.status(404).json({ message: '未找到该款式' }); }
    res.json({ message: '款式已永久删除' });
  } catch (error) { res.status(500).json({ message: '操作失败', error }); }
};