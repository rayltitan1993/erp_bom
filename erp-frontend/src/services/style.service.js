import api from './api';

class StyleService {
  getStyles() { return api.get('/styles').then(res => res.data); }
  getStyle(id) { return api.get(`/styles/${id}`).then(res => res.data); }
  createStyle(style) { return api.post('/styles', style).then(res => res.data); }
  updateStyle(id, style) { return api.put(`/styles/${id}`, style).then(res => res.data); }
  deleteStyle(id) { return api.delete(`/styles/${id}`).then(res => res.data); }
}

export default new StyleService();