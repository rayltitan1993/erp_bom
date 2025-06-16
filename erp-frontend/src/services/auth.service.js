import api from './api';

class AuthService {
  async login(credentials) {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  }

  async register(userInfo) {
    const response = await api.post('/auth/register', userInfo);
    return response.data;
  }
}

export default new AuthService();