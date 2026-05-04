<template>
  <q-layout view="hHh lpR fFf">
    <q-header bordered class="bg-white text-dark">
      <!-- Fila 1: Logo + User menu -->
      <div class="q-px-lg q-pt-md q-pb-sm row items-center justify-between">
        <div class="row items-center">
          <q-icon name="account_balance_wallet" size="22px" color="dark" class="q-mr-xs" />
          <span class="text-weight-bold text-dark" style="font-size: 16px">MyFinances</span>
        </div>

        <q-btn flat round dense color="grey-7" size="sm">
          <q-icon name="account_circle" size="26px" />
          <q-menu anchor="bottom right" self="top right" auto-close style="border-radius: 10px; min-width: 200px">
            <q-list dense class="q-py-sm">

              <!-- Nombre del usuario -->
              <q-item class="q-pb-xs">
                <q-item-section>
                  <div class="text-caption text-grey-5">{{ $t('user_menu.signed_in_as') }}</div>
                  <div class="text-body2 text-weight-bold ellipsis">{{ authStore.user?.email }}</div>
                </q-item-section>
              </q-item>

              <q-separator class="q-my-xs" />

              <!-- Configuración -->
              <q-item clickable class="q-px-md" @click="$router.push('/perfil')">
                <q-item-section avatar>
                  <q-icon name="settings" size="18px" color="grey-7" />
                </q-item-section>
                <q-item-section>{{ $t('user_menu.settings') }}</q-item-section>
              </q-item>

              <q-separator class="q-my-xs" />

              <!-- Cerrar sesión -->
              <q-item clickable class="q-px-md" @click="handleSignOut">
                <q-item-section avatar>
                  <q-icon name="logout" size="18px" color="negative" />
                </q-item-section>
                <q-item-section class="text-negative">{{ $t('user_menu.sign_out') }}</q-item-section>
              </q-item>

            </q-list>
          </q-menu>
        </q-btn>
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
            :id="'tab-' + tab.name"
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
import { ref, computed, watch, onMounted } from 'vue'
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

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()
const $q = useQuasar()

const authStore         = useAuthStore()
const accountsStore     = useAccountsStore()
const transactionsStore = useTransactionsStore()
const settingsStore     = useSettingsStore()
const recurringStore    = useRecurringStore()
const profileStore      = useProfileStore()

const { isCompleted: tourCompleted } = useTour()

onMounted(async () => {
  // Aplicar preferencias guardadas
  const meta = authStore.user?.user_metadata ?? {}
  if (meta.dark_mode !== undefined) $q.dark.set(meta.dark_mode)
  if (meta.locale)                  locale.value = meta.locale

  await Promise.all([
    accountsStore.fetchAccounts(),
    transactionsStore.fetchTransactions(),
    settingsStore.fetchCategories(),
    recurringStore.fetchRecurring(),
    profileStore.fetchProfile(),
  ])

  // Auto-generar transacciones recurrentes vencidas este mes
  await recurringStore.generateDueTransactions()

  // Redirigir a Cuentas si es primer ingreso
  if (!tourCompleted() && route.path !== '/cuentas') {
    router.push('/cuentas')
  }
})

async function handleSignOut() {
  await authStore.signOut()
  router.push('/login')
}

const tabs = computed(() => [
  { name: 'transactions', label: t('nav.transactions'), icon: 'grid_view', route: '/' },
  { name: 'analysis', label: t('nav.analysis'), icon: 'trending_up', route: '/analisis' },
  { name: 'accounts', label: t('nav.accounts'), icon: 'credit_card', route: '/cuentas' },
  { name: 'settings', label: t('nav.settings'), icon: 'settings', route: '/configuracion' },
])

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
