import api from './api';

class UserService {
  getPendingUsers() {
    return api.get('/users/pending').then(res => res.data);
  }
  approveUser(id) {
    return api.put(`/users/${id}/approve`).then(res => res.data);
  }
  rejectUser(id) {
    return api.put(`/users/${id}/reject`).then(res => res.data);
  }

  // --- 新增服务函数 ---

  // 获取已授权用户列表
  getApprovedUsers() {
    return api.get('/users/approved').then(res => res.data);
  }

  // 删除用户
  deleteUser(id) {
    return api.delete(`/users/${id}`).then(res => res.data);
  }
}

export default new UserService();