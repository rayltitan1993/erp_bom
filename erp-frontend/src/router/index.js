import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../store/auth.store';
import OrderManagement from '../views/dashboard/OrderManagement.vue';
import OrderHistory from '../views/dashboard/OrderHistory.vue';
import OrderEditor from '../views/dashboard/OrderEditor.vue'; 
import TemplateBomEditor from '../views/dashboard/TemplateBomEditor.vue';
import OrderBomEditor from '../views/dashboard/OrderBomEditor.vue';
import ProductionBom from '../views/dashboard/ProductionBom.vue';


const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: () => import('../views/Login.vue') },
  { path: '/register', component: () => import('../views/Register.vue') },
  {
    path: '/dashboard',
    component: () => import('../components/layout/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: 'orders',
        name: 'OrderManagement',
        component: OrderManagement,
      },
      {
        path: 'orders/history',
        name: 'OrderHistory',
        component: OrderHistory,
      },
      {
        path: 'styles/:styleId/variant/:variantId/bom',
        name: 'TemplateBomEditor',
        component: TemplateBomEditor,
        props: true
      },
      {
          path: 'orders/:orderId/item/:orderItemId/bom',
          name: 'OrderBomEditor',
          component: OrderBomEditor,
          props: true
      },
      {
          path: 'orders/:orderId/production-bom',
          name: 'ProductionBom',
          component: ProductionBom,
          props: true
      },
      {
        path: 'orders/new',
        name: 'NewOrder',
        component: OrderEditor,
      },
      {
        path: 'orders/edit/:id',
        name: 'EditOrder',
        component: OrderEditor,
        props: true,
      },
      { path: 'permissions', component: () => import('../views/dashboard/PermissionManagement.vue'), meta: { requiresAdmin: true }},
      {
        path: 'orders', // 定义路径为 /dashboard/orders
        component: () => import('../views/dashboard/OrderManagement.vue')
      },
      { 
        path: 'styles',
        component: () => import('../views/dashboard/StyleManagement.vue') 
      },
      { 
        path: 'styles/new',
        component: () => import('../views/dashboard/StyleEditor.vue') 
      },
      { 
        path: 'styles/edit/:id',
        component: () => import('../views/dashboard/StyleEditor.vue'),
        props: true 
      },
      {
        path: 'styles/:styleId/variant/:variantId/bom',
        component: () => import('../views/dashboard/BomEditor.vue'),
        props: true
      }
    ]
  }
];

const router = createRouter({ history: createWebHistory(), routes });

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login');
  } else if (to.meta.requiresAdmin && !authStore.isAdmin) {
    next('/dashboard/styles');
  } else {
    next();
  }
});

export default router;