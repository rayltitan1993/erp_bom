const Style = require('../models/style.model');


exports.createStyle = async (req, res) => {
  try {
    const { name, styleNumber, brand, imageUrl, variants } = req.body;
    const style = new Style({ name, styleNumber, brand, imageUrl, variants, createdBy: req.user._id });
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

exports.updateStyle = async (req, res) => {
  try {
    const style = await Style.findById(req.params.id);
    if (!style) { return res.status(404).json({ message: '未找到该款式' }); }
    style.name = req.body.name || style.name;
    style.brand = req.body.brand || style.brand;
    style.imageUrl = req.body.imageUrl; // 允许清空图片
    
    style.variants = req.body.variants.map(v => {
        const existingVariant = v._id ? style.variants.id(v._id) : null;
        if (existingVariant) {
            existingVariant.set(v);
            return existingVariant;
        } else {
            return v; 
        }
    });
    
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

// 新增：恢复款式
exports.restoreStyle = async (req, res) => {
  try {
    const style = await Style.findByIdAndUpdate(req.params.id, { isArchived: false }, { new: true });
    if (!style) { return res.status(404).json({ message: '未找到该款式' }); }
    res.json({ message: '款式已恢复' });
  } catch (error) { res.status(500).json({ message: '操作失败', error }); }
};

// 新增：永久删除款式
exports.permanentlyDeleteStyle = async (req, res) => {
  try {
    const style = await Style.findByIdAndDelete(req.params.id);
    if (!style) { return res.status(404).json({ message: '未找到该款式' }); }
    // 注意：此处也应一并删除关联的BOM等数据，为简化暂未实现
    res.json({ message: '款式已永久删除' });
  } catch (error) { res.status(500).json({ message: '操作失败', error }); }
};