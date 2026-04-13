<template>
  <q-layout view="hHh lpR fFf">
    <q-header bordered class="bg-white text-dark">
      <!-- Fila 1: Logo -->
      <div class="q-px-lg q-pt-md q-pb-sm row items-center">
        <q-icon name="account_balance_wallet" size="22px" color="dark" class="q-mr-xs" />
        <span class="text-weight-bold text-dark" style="font-size: 16px">MyFinances</span>
      </div>

      <!-- Fila 2: Tabs -->
      <div class="navbar-tabs-row q-px-lg q-pb-sm">
        <q-tabs
          v-model="activeTab"
          active-color="dark"
          indicator-color="transparent"
          align="left"
          dense
          class="navbar-tabs"
          no-caps
        >
          <q-tab
            v-for="tab in tabs"
            :key="tab.name"
            :name="tab.name"
            :icon="tab.icon"
            :label="tab.label"
            class="navbar-tab q-mr-xs"
            @click="$router.push(tab.route)"
          />
        </q-tabs>
      </div>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const tabs = [
  { name: 'transactions', label: 'Transacciones', icon: 'grid_view', route: '/' },
  { name: 'analysis', label: 'Análisis', icon: 'trending_up', route: '/analisis' },
  { name: 'accounts', label: 'Cuentas', icon: 'credit_card', route: '/cuentas' },
  { name: 'settings', label: 'Configuración', icon: 'settings', route: '/configuracion' },
]

const routeTabMap = {
  '/': 'transactions',
  '/analisis': 'analysis',
  '/cuentas': 'accounts',
  '/configuracion': 'settings',
}

const activeTab = ref(routeTabMap[route.path] ?? 'transactions')

watch(
  () => route.path,
  (path) => {
    activeTab.value = routeTabMap[path] ?? 'transactions'
  },
)
</script>

<style lang="scss">
.navbar-tabs-row {
  background: white;
}

.navbar-tabs {
  .navbar-tab {
    border-radius: 8px;
    min-height: 34px;
    padding: 0 12px;
    font-size: 13px;
    color: #666;
    transition: background 0.2s;

    .q-tab__content {
      flex-direction: row;
      gap: 6px;
    }

    .q-tab__icon {
      font-size: 16px;
      margin-bottom: 0;
    }

    .q-tab__label {
      font-size: 13px;
      line-height: 1;
      text-transform: capitalize;
    }

    &.q-tab--active {
      background: #f0f0f0;
      color: #111;
      font-weight: 600;
    }

    &:hover:not(.q-tab--active) {
      background: #f8f8f8;
    }
  }
}
</style>
