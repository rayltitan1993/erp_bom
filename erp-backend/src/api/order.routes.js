const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const {
    createOrder,
    getOrders,
    getOrderHistory,
    getOrderById,
    updateOrder,
    deleteOrder,
    restoreOrder,
    reorder
} = require('../controllers/order.controller');

// 所有订单路由都需要登录保护
router.use(protect);

router.route('/')
    .post(createOrder)
    .get(getOrders);

router.get('/history', getOrderHistory);

router.post('/:id/reorder', reorder);

router.route('/:id')
    .get(getOrderById)
    .put(updateOrder)
    .delete(deleteOrder);

router.put('/:id/restore', restoreOrder);


module.exports = router;