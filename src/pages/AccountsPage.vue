<template>
  <q-page class="q-pa-lg">

    <!-- Encabezado -->
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <div class="text-h5 text-weight-bold">{{ $t('accounts.title') }}</div>
        <div class="text-caption text-grey-6">{{ $t('accounts.subtitle') }}</div>
      </div>
      <div class="row q-gutter-sm">
        <q-btn
          flat
          bordered
          :icon="hidden ? 'visibility' : 'visibility_off'"
          :label="hidden ? $t('accounts.show') : $t('accounts.hide')"
          color="dark"
          @click="hidden = !hidden"
        />
        <q-btn
          unelevated
          color="dark"
          icon="add"
          :label="$t('accounts.new')"
          @click="showForm = true"
        />
      </div>
    </div>

    <!-- Card Balance Total -->
    <q-card flat class="balance-card q-mb-lg q-pa-lg">
      <div class="text-caption text-white" style="opacity: 0.8">{{ $t('accounts.total_balance') }}</div>
      <div class="text-h4 text-white text-weight-bold q-my-sm">
        {{ hidden ? '••••••' : formatCurrency(totalBalance) }}
      </div>
      <div class="row q-mt-md" style="gap: 80px">
        <div>
          <div class="text-caption text-white" style="opacity: 0.8">{{ $t('accounts.income') }}</div>
          <div class="text-subtitle1 text-white text-weight-bold">
            {{ hidden ? '••••••' : formatCurrency(transactionsStore.totalIngresos) }}
          </div>
        </div>
        <div>
          <div class="text-caption text-white" style="opacity: 0.8">{{ $t('accounts.expenses') }}</div>
          <div class="text-subtitle1 text-white text-weight-bold">
            {{ hidden ? '••••••' : formatCurrency(transactionsStore.totalGastos) }}
          </div>
        </div>
      </div>
    </q-card>

    <!-- Cards por cuenta -->
    <div class="row q-gutter-md">
      <q-card
        v-for="account in accountsStore.accounts"
        :key="account.id"
        flat
        bordered
        class="account-card col"
      >
        <!-- Borde de color superior -->
        <div class="account-card-top" :style="{ background: account.color }" />

        <q-card-section>
          <!-- Icono + nombre + menú -->
          <div class="row items-center justify-between q-mb-lg">
            <div class="row items-center q-gutter-sm">
              <div class="account-icon" :style="{ background: account.color }">
                <q-icon :name="accountTypeIcon[account.type]" size="18px" color="white" />
              </div>
              <div>
                <div class="text-weight-bold" style="font-size: 14px">{{ account.label }}</div>
                <div class="text-caption text-grey-5">{{ $t(`account_types.${account.type}`) }}</div>
              </div>
            </div>
            <q-btn flat round dense icon="more_vert" color="grey-5" size="sm">
              <q-menu anchor="bottom right" self="top right" auto-close>
                <q-list dense style="min-width: 140px">
                  <q-item clickable @click="editAccount(account)">
                    <q-item-section avatar>
                      <q-icon name="edit" size="16px" color="grey-7" />
                    </q-item-section>
                    <q-item-section>{{ $t('common.edit') }}</q-item-section>
                  </q-item>
                  <q-separator />
                  <q-item clickable @click="confirmDelete(account)">
                    <q-item-section avatar>
                      <q-icon name="delete" size="16px" color="negative" />
                    </q-item-section>
                    <q-item-section class="text-negative">{{ $t('common.delete') }}</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </div>

          <!-- Balance -->
          <div class="text-h5 text-weight-bold q-mb-xs">
            {{ hidden ? '••••••' : formatCurrency(account.balance) }}
          </div>
          <div class="text-caption text-grey-5">{{ $t('accounts.available_balance') }}</div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Modal: Nueva / Editar Cuenta -->
    <AccountForm v-model="showForm" :account="selectedAccount" />

    <!-- Confirmación eliminar -->
    <q-dialog v-model="showConfirm">
      <q-card style="min-width: 320px">
        <q-card-section>
          <div class="text-h6">{{ $t('accounts.delete_title') }}</div>
          <div class="text-body2 q-mt-sm text-grey-7">
            {{ $t('accounts.delete_confirm') }} <strong>{{ toDelete?.label }}</strong>?
            {{ $t('accounts.delete_warning') }}
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat :label="$t('common.cancel')" v-close-popup />
          <q-btn flat :label="$t('common.delete')" color="negative" @click="handleDelete" />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useAccountsStore } from 'stores/accounts.store'
import { useTransactionsStore } from 'stores/transactions.store'
import { useCurrency } from 'src/composables/useCurrency'
import AccountForm from 'components/accounts/AccountForm.vue'

const accountsStore = useAccountsStore()
const transactionsStore = useTransactionsStore()
const { formatCurrency } = useCurrency()

const hidden = ref(false)
const showForm = ref(false)
const selectedAccount = ref(null)
const showConfirm = ref(false)
const toDelete = ref(null)

function editAccount(account) {
  selectedAccount.value = account
  showForm.value = true
}

// Al cerrar el form, limpiar la cuenta seleccionada
watch(showForm, (val) => {
  if (!val) selectedAccount.value = null
})

function confirmDelete(account) {
  toDelete.value = account
  showConfirm.value = true
}

async function handleDelete() {
  await accountsStore.deleteAccount(toDelete.value.id)
  showConfirm.value = false
  toDelete.value = null
}

const accountTypeIcon = {
  tarjeta_debito:  'credit_card',
  tarjeta_credito: 'credit_score',
  efectivo:        'account_balance_wallet',
  otro:            'savings',
}

const totalBalance = computed(() =>
  accountsStore.accounts.reduce((sum, a) => sum + a.balance, 0)
)

</script>

<style scoped lang="scss">
.balance-card {
  background: #2563eb;
  border-radius: 16px;
}

.account-card {
  min-width: 200px;
  border-radius: 12px;
  overflow: hidden;
}

.account-card-top {
  height: 5px;
  width: 100%;
}

.account-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
