import api from './api';

class BomService {
    // FIXED: 更新函数签名以匹配新路由
    getTemplateBom(styleId, variantId) {
        return api.get(`/boms/template/style/${styleId}/variant/${variantId}`).then(res => res.data);
    }
    saveTemplateBom(payload) {
        return api.post('/boms/template', payload).then(res => res.data);
    }
    getOrCreateOrderBom(orderId, orderItemId) {
        return api.get(`/boms/order/${orderId}/item/${orderItemId}`).then(res => res.data);
    }
    updateOrderBom(bomId, materials) {
        return api.put(`/boms/order-bom/${bomId}`, { materials }).then(res => res.data);
    }
}

export default new BomService();