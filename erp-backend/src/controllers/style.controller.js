const Style = require('../models/style.model');

// CHANGED: 适配新的 'variantAttributeSchema'
exports.createStyle = async (req, res) => {
  try {
    const { name, styleNumber, brand, imageUrl, variants, variantAttributeSchema } = req.body;
    const style = new Style({ 
        name, 
        styleNumber, 
        brand, 
        imageUrl, 
        variantAttributeSchema, 
        variants, 
        createdBy: req.user._id 
    });
    const savedStyle = await style.save();
    res.status(201).json(savedStyle);
  } catch (error) {
    // FIXED: Check for duplicate key error (code 11000)
    if (error.code === 11000) {
      // Return a specific, user-friendly message
      return res.status(409).json({ message: `创建失败：款式编号 "${error.keyValue.styleNumber}" 已存在。` });
    }
    // For all other errors, return a generic message
    console.error("CREATE STYLE FAILED:", error);
    res.status(400).json({ message: '创建失败，请检查填写的内容。', error: error.message });
  }
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
    
    // 只更新传入的字段
    if(req.body.name) style.name = req.body.name;
    if(req.body.brand) style.brand = req.body.brand;
    if(req.body.imageUrl !== undefined) style.imageUrl = req.body.imageUrl;
    
    if (req.body.variantAttributeSchema && style.variantAttributeSchema.length === 0) {
      style.variantAttributeSchema = req.body.variantAttributeSchema;
    }
    
    if (req.body.variants) {
        style.variants = req.body.variants;
    }
    
    const updatedStyle = await style.save();
    res.json(updatedStyle);
  } catch (error) {
    // FIXED: Also check for duplicate key error on update
    if (error.code === 11000) {
      return res.status(409).json({ message: `更新失败：款式编号 "${error.keyValue.styleNumber}" 与其他款式冲突。` });
    }
    console.error("UPDATE STYLE FAILED:", error);
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

exports.searchStyles = async (req, res) => {
    try {
        const query = req.query.q || '';
        const searchRegex = new RegExp(query, 'i');
        
        const styles = await Style.find({
            isArchived: false, // 只搜索有效款式
            $or: [
                { name: searchRegex },
                { styleNumber: searchRegex }
            ]
        }).select('name styleNumber').limit(20); // 限制返回数量

        res.json(styles);
    } catch (error) {
        res.status(500).json({ message: '搜索款式失败', error: error.message });
    }
};