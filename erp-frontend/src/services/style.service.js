import api from './api';

class StyleService {
  /**
   * 获取所有有效款式的列表
   */
  getStyles() {
    return api.get('/styles').then(res => res.data);
  }

  /**
   * 获取所有已归档款式的列表
   */
  getArchivedStyles() {
    return api.get('/styles/archived').then(res => res.data);
  }

  /**
   * 获取单个款式的详情
   */
  getStyle(id) {
    return api.get(`/styles/${id}`).then(res => res.data);
  }

  /**
   * 创建新款式
   */
  createStyle(style) {
    return api.post('/styles', style).then(res => res.data);
  }

  /**
   * 更新指定ID的款式
   */
  updateStyle(id, style) {
    return api.put(`/styles/${id}`, style).then(res => res.data);
  }

  /**
   * 删除指定ID的款式 (软删除)
   */
  deleteStyle(id) {
    return api.delete(`/styles/${id}`).then(res => res.data);
  }

  /**
   * 恢复已归档的款式
   */
  restoreStyle(id) {
    return api.put(`/styles/${id}/restore`).then(res => res.data);
  }

  /**
   * 永久删除款式
   */
  permanentlyDeleteStyle(id) {
    return api.delete(`/styles/${id}/permanent`).then(res => res.data);
  }

  /**
   * NEW: 添加的用于订单产品搜索的函数
   * @param {string} query - 搜索关键词
   */
  searchStyles(query) {
    return api.get('/styles/search', { params: { q: query } }).then(res => res.data);
  }
}

export default new StyleService();