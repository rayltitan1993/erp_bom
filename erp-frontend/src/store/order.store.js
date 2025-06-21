import { defineStore } from 'pinia';
import orderService from '@/services/order.service';
import { ElMessage } from 'element-plus';

export const useOrderStore = defineStore('order', {
    state: () => ({
        order: null,
        initialOrderState: '',
        isLoading: false,
    }),
    getters: {
        totalQuantity: (state) => {
            if (!state.order || !state.order.items) return 0;
            return state.order.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
        }
    },
    actions: {
        setNewOrder() {
            this.order = {
                orderName: '',
                customerName: '',
                orderDate: new Date(),
                status: '未开始',
                items: [], // items 现在是扁平的SKU列表
                notes: ''
            };
            this.initialOrderState = JSON.stringify(this.order);
        },

        async fetchOrder(id) {
            this.isLoading = true;
            try {
                this.order = await orderService.getOrder(id);
                this.initialOrderState = JSON.stringify(this.order);
            } catch (error) {
                ElMessage.error('加载订单详情失败');
                this.order = null;
            } finally {
                this.isLoading = false;
            }
        },

        async saveOrder() {
            if (!this.order) return;
            this.isLoading = true;
            // 不需要任何转换，直接发送
            const payload = this.order;
            try {
                let savedOrder;
                if (payload._id) {
                    savedOrder = await orderService.updateOrder(payload._id, payload);
                } else {
                    savedOrder = await orderService.createOrder(payload);
                }
                this.order = savedOrder;
                this.initialOrderState = JSON.stringify(this.order);
                ElMessage.success('订单保存成功！');
                return this.order;
            } catch (error) {
                ElMessage.error(error.response?.data?.message || '订单保存失败');
                throw error;
            } finally {
                this.isLoading = false;
            }
        },
        
        hasUnsavedChanges() {
            if (!this.order) return false;
            return JSON.stringify(this.order) !== this.initialOrderState;
        },
        
        clearOrder() {
            this.order = null;
            this.initialOrderState = '';
        }
    }
});