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
}

export default new UserService();