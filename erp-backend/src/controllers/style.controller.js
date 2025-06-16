const Style = require('../models/style.model');

exports.createStyle = async (req, res) => {
  try {
    const { name, styleNumber, brand, variants } = req.body;
    const style = new Style({ name, styleNumber, brand, variants, createdBy: req.user._id });
    await style.save();
    res.status(201).json(style);
  } catch (error) {
    res.status(400).json({ message: '创建失败', error: error.message });
  }
};

exports.getStyles = async (req, res) => {
  try {
    const styles = await Style.find().populate('createdBy', 'applicantName').lean();
    res.json(styles);
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

exports.getStyleById = async (req, res) => {
  try {
    // 在查询语句后添加 .populate('variants.bom')，并保留 .lean()
    // 这会查找每个variant关联的bom，并将BOM的ID替换为BOM的完整文档
    const style = await Style.findById(req.params.id).populate('variants.bom').lean(); 
    
    if (!style) {
      return res.status(404).json({ message: '未找到该款式' });
    }
    res.json(style);
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
};


exports.updateStyle = async (req, res) => {
  try {
    const style = await Style.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!style) {
      return res.status(404).json({ message: '未找到该款式' });
    }
    res.json(style);
  } catch (error) {
    res.status(400).json({ message: '更新失败', error: error.message });
  }
};

exports.deleteStyle = async (req, res) => {
  try {
    const style = await Style.findByIdAndDelete(req.params.id);
    if (!style) {
      return res.status(404).json({ message: '未找到该款式' });
    }
    res.json({ message: '款式删除成功' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error });
  }
};