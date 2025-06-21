import api from './api';
import { useAuthStore } from '@/store/auth.store.js';

// 这是一个辅助函数，用于处理fetch请求，并自动附加认证头
const fetchWithAuth = async (url, options = {}) => {
    const authStore = useAuthStore();
    const token = authStore.token;

    const defaultHeaders = {
        'Content-Type': 'application/json',
    };

    if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
    };
    
    // 注意：这里的URL需要拼接后端的完整地址
    const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
    const finalUrl = `${backendUrl}${url}`;

    const response = await fetch(finalUrl, config);

    const responseData = await response.json();

    if (!response.ok) {
        throw new Error(responseData.message || '网络请求失败');
    }

    return responseData;
};


class OrderService {
    getOrders(params) {
        return api.get('/orders', { params }).then(res => res.data);
    }

    getOrderHistory(params) {
        return api.get('/orders/history', { params }).then(res => res.data);
    }

    getOrder(id) {
        return api.get(`/orders/${id}`).then(res => res.data);
    }

    // --- 使用原生 fetch 实现 ---
    createOrder(order) {
        return fetchWithAuth('/orders', {
            method: 'POST',
            body: JSON.stringify(order),
        });
    }

    updateOrder(id, order) {
        return fetchWithAuth(`/orders/${id}`, {
            method: 'PUT',
            body: JSON.stringify(order),
        });
    }
    // --------------------------

    deleteOrder(id) {
        return api.delete(`/orders/${id}`).then(res => res.data);
    }

    restoreOrder(id) {
        return api.put(`/orders/${id}/restore`).then(res => res.data);
    }

    reorder(id) {
        return api.post(`/orders/${id}/reorder`).then(res => res.data);
    }
}

export default new OrderService();