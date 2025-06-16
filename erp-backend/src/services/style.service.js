import api from './src/api';

class StyleService {
  /**
   * 获取所有款式的列表
   * GET /api/styles
   */
  getStyles() {
    return api.get('/styles').then(res => res.data);
  }

  /**
   * 获取单个款式的详情
   * GET /api/styles/:id
   * 这很可能是您之前缺失或错误的部分
   */
  getStyle(id) {
    // 正确的URL应该是 /styles/ 后面拼接上ID
    return api.get(`/styles/${id}`).then(res => res.data);
  }

  /**
   * 创建新款式
   * POST /api/styles
   */
  createStyle(style) {
    return api.post('/styles', style).then(res => res.data);
  }

  /**
   * 更新指定ID的款式
   * PUT /api/styles/:id
   */
  updateStyle(id, style) {
    return api.put(`/styles/${id}`, style).then(res => res.data);
  }

  /**
   * 删除指定ID的款式
   * DELETE /api/styles/:id
   */
  deleteStyle(id) {
    return api.delete(`/styles/${id}`).then(res => res.data);
  }
}

export default new StyleService();