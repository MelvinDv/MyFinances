const routes = [
  {
    path: '/login',
    component: () => import('pages/LoginPage.vue'),
  },
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '',              component: () => import('pages/TransactionsPage.vue') },
      { path: 'analisis',      component: () => import('pages/AnalysisPage.vue') },
      { path: 'cuentas',       component: () => import('pages/AccountsPage.vue') },
      { path: 'configuracion', component: () => import('pages/SettingsPage.vue') },
      { path: 'perfil',        component: () => import('pages/UserSettingsPage.vue') },
    ],
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
]

export default routes
