import api from './api';

class BomService {
    // 假设后端为BOM创建了独立的API路由 /api/boms
    getBomForVariant(variantId) {
        // 后端需要一个API能根据variantId查找BOM
        return api.get(`/boms/variant/${variantId}`).then(res => res.data);
    }

    saveBomForVariant(payload) {
        // 一个统一的保存接口，后端逻辑判断是新增还是更新
        return api.post('/boms', payload).then(res => res.data);
    }

    // 新增方法
    getBomsForStyle(styleId) {
        return api.get(`/boms/style/${styleId}`).then(res => res.data);
    }
}


export default new BomService();