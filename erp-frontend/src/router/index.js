import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../store/auth.store';

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: () => import('../views/Login.vue') },
  { path: '/register', component: () => import('../views/Register.vue') },
  {
    path: '/dashboard',
    component: () => import('../components/layout/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: 'permissions', component: () => import('../views/dashboard/PermissionManagement.vue'), meta: { requiresAdmin: true }},
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