import api from '@/services/api';

class StyleService {
  getStyles() { return api.get('/styles').then(res => res.data); }
  getArchivedStyles() { return api.get('/styles/archived').then(res => res.data); } // 新增
  getStyle(id) { return api.get(`/styles/${id}`).then(res => res.data); }
  createStyle(style) { return api.post('/styles', style).then(res => res.data); }
  updateStyle(id, style) { return api.put(`/styles/${id}`, style).then(res => res.data); }
  deleteStyle(id) { return api.delete(`/styles/${id}`).then(res => res.data); } // 软删除
  restoreStyle(id) { return api.put(`/styles/${id}/restore`).then(res => res.data); } // 新增
  permanentlyDeleteStyle(id) { return api.delete(`/styles/${id}/permanent`).then(res => res.data); } // 新增
}

export default new StyleService();