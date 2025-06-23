import api from './api';

class BomService {
    getTemplateBom(styleId, variantId) {
        return api.get(`/boms/template/style/${styleId}/variant/${variantId}`).then(res => res.data);
    }

    // 【新增】批量获取一个款式下的所有BOM模板
    getTemplateBomsForStyle(styleId) {
        // 这个方法会调用后端的 /boms/template/style/:styleId 路由
        return api.get(`/boms/template/style/${styleId}`).then(res => res.data);
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