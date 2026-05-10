<template>
  <q-layout view="lHh lpr lFf">
    <q-page-container>
      <router-view />
    </q-page-container>

    <!-- FAB -->
    <div class="fab-add" @click="showForm = true">
      <i class="ti ti-plus" />
    </div>

    <TransactionForm v-model="showForm" :transaction="null" />

    <q-footer class="app-footer">
      <div class="bottom-nav">
        <div
          v-for="tab in tabs"
          :key="tab.name"
          class="nav-item"
          @click="$router.push(tab.route)"
        >
          <i :class="['ti', tab.icon, activeTab === tab.name ? 'nav-icon-on' : 'nav-icon-off']" />
          <div v-if="activeTab === tab.name" class="nav-dot" />
        </div>
      </div>
    </q-footer>
  </q-layout>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'src/stores/auth.store'
import { useAccountsStore } from 'src/stores/accounts.store'
import { useTransactionsStore } from 'src/stores/transactions.store'
import { useSettingsStore } from 'src/stores/settings.store'
import { useRecurringStore } from 'src/stores/recurring_transactions.store'
import { useProfileStore } from 'src/stores/profile.store'
import { useTour } from 'src/composables/useTour'
import TransactionForm from 'components/transactions/TransactionForm.vue'

const route  = useRoute()
const router = useRouter()
const { locale } = useI18n()
const $q = useQuasar()

const authStore         = useAuthStore()
const accountsStore     = useAccountsStore()
const transactionsStore = useTransactionsStore()
const settingsStore     = useSettingsStore()
const recurringStore    = useRecurringStore()
const profileStore      = useProfileStore()

const { isCompleted: tourCompleted } = useTour()

onMounted(async () => {
  const meta = authStore.user?.user_metadata ?? {}
  if (meta.dark_mode !== undefined) $q.dark.set(meta.dark_mode)
  if (meta.locale) locale.value = meta.locale

  await Promise.all([
    accountsStore.fetchAccounts(),
    transactionsStore.fetchTransactions(),
    settingsStore.fetchCategories(),
    recurringStore.fetchRecurring(),
    profileStore.fetchProfile(),
  ])

  await recurringStore.generateDueTransactions()

  if (!tourCompleted() && route.path !== '/cuentas') {
    router.push('/cuentas')
  }
})

const tabs = [
  { name: 'home',     icon: 'ti-home',       route: '/'         },
  { name: 'accounts', icon: 'ti-wallet',      route: '/cuentas'  },
  { name: 'analysis', icon: 'ti-chart-pie',   route: '/analisis' },
  { name: 'settings', icon: 'ti-settings',    route: '/perfil'   },
]

const routeTabMap = {
  '/':              'home',
  '/cuentas':       'accounts',
  '/analisis':      'analysis',
  '/perfil':        'settings',
  '/configuracion': 'settings',
}

const activeTab = ref(routeTabMap[route.path] ?? 'home')
const showForm  = ref(false)

watch(
  () => route.path,
  (path) => { activeTab.value = routeTabMap[path] ?? 'transactions' },
)
</script>

<style lang="scss">
.app-footer {
  background: #ffffff;
  border-top: 0.5px solid #F1EFE8;
  padding: 0;
}

.bottom-nav {
  display: flex;
  justify-content: space-around;
  padding: 8px 0 env(safe-area-inset-bottom, 10px);
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  padding: 4px 16px;
  user-select: none;
}

.nav-icon-off {
  font-size: 22px;
  color: #D3D1C7;
}

.nav-icon-on {
  font-size: 22px;
  color: #1a1a18;
}

.nav-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #1a1a18;
  margin-top: 3px;
}

.fab-add {
  position: fixed;
  bottom: calc(env(safe-area-inset-bottom, 10px) + 72px);
  right: 20px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #1a1a18;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;
  z-index: 1000;
  box-shadow: 0 2px 12px rgba(0,0,0,0.15);

  i { font-size: 18px; color: #ffffff; }
}

body.body--dark {
  .app-footer { background: #1d1d1d; border-top-color: #2e2e2e; }
  .nav-icon-on { color: #f0f0f0; }
  .nav-dot { background: #f0f0f0; }
  .fab-add { background: #f0f0f0; i { color: #1a1a18; } }
}
</style>
