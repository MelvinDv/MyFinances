const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '',              component: () => import('pages/TransactionsPage.vue') },
      { path: 'analisis',      component: () => import('pages/AnalysisPage.vue') },
      { path: 'cuentas',       component: () => import('pages/AccountsPage.vue') },
      { path: 'configuracion', component: () => import('pages/SettingsPage.vue') },
    ]
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes
