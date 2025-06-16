import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import authService from '../services/auth.service';
import router from '../router';

export const useAuthStore = defineStore('auth', () => {
  // state
  const user = ref(JSON.parse(localStorage.getItem('user')));
  const token = ref(localStorage.getItem('token'));

  // getters
  const isAuthenticated = computed(() => !!token.value);
  const isAdmin = computed(() => user.value?.role === 'admin');

  // actions
  async function login(credentials) {
    const response = await authService.login(credentials);
    user.value = response.user;
    token.value = response.token;
    localStorage.setItem('user', JSON.stringify(response.user));
    localStorage.setItem('token', response.token);
    router.push('/dashboard/styles'); // 登录后跳转到款式管理
  }

  function logout() {
    user.value = null;
    token.value = null;
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/login');
  }
  
  return { user, token, isAuthenticated, isAdmin, login, logout };
});