import api from './api';

class ProductionBomService {
    // 生成/刷新并获取最新版本
    generate(orderId) {
        return api.post(`/production-boms/generate/${orderId}`).then(res => res.data);
    }

    // 获取一个订单的完整生产BOM（含所有版本）
    get(orderId) {
        return api.get(`/production-boms/${orderId}`).then(res => res.data);
    }
}

export default new ProductionBomService();