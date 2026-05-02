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
            {{ hidden ? '••••••' : formatCurrency(account.type === 'tarjeta_credito' && account.credit_limit
              ? account.credit_limit - creditDebt(account)
              : account.balance) }}
          </div>
          <div class="text-caption text-grey-5">{{ $t('accounts.available_balance') }}</div>

          <!-- Sección TDC: próximo pago de cuotas -->
          <template v-if="account.type === 'tarjeta_credito'">
            <q-separator class="q-my-md" />

            <template v-if="nextInstallmentPayment(account)">
              <div class="row items-center justify-between">
                <div>
                  <div class="text-caption text-grey-5">{{ $t('accounts.next_payment') }}</div>
                  <div
                    class="text-subtitle1 text-weight-bold"
                    :class="isPaymentUrgent(account) ? 'text-negative' : 'text-dark'"
                  >
                    {{ hidden ? '••••••' : formatCurrency(nextInstallmentPayment(account).amount) }}
                  </div>
                  <div
                    v-if="nextInstallmentPayment(account).alreadyPaid > 0"
                    class="text-caption text-positive"
                  >
                    Abonado: {{ formatCurrency(nextInstallmentPayment(account).alreadyPaid) }}
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-caption text-grey-5">{{ $t('accounts.due') }}</div>
                  <div class="text-caption text-weight-medium">
                    {{ formatDueDate(nextInstallmentPayment(account).dueDate) }}
                  </div>
                </div>
              </div>
            </template>

            <div v-else class="text-caption text-grey-5">
              {{ $t('accounts.no_next_payment') }}
            </div>

            <!-- Barra de crédito utilizado: siempre visible si hay límite -->
            <template v-if="account.credit_limit">
              <div class="row items-center justify-between q-mt-md q-mb-xs">
                <div class="text-caption text-grey-5">{{ $t('accounts.credit_used') }}</div>
                <div class="text-caption text-grey-6">
                  {{ Math.round(creditUsedPercent(account)) }}%
                </div>
              </div>
              <q-linear-progress
                :value="creditUsedPercent(account) / 100"
                :color="creditUsedPercent(account) > 80 ? 'negative' : creditUsedPercent(account) > 50 ? 'warning' : 'positive'"
                rounded
                size="6px"
              />
            </template>

            <!-- Aviso de vencimiento -->
            <div
              v-if="paymentDaysLeft(account) !== null"
              class="row items-center q-gutter-x-xs q-mt-sm"
              :class="paymentDaysLeft(account) === 0 ? 'text-negative' : 'text-warning'"
            >
              <q-icon :name="paymentDaysLeft(account) === 0 ? 'error' : 'schedule'" size="xs" />
              <span class="text-caption text-weight-medium">
                {{ paymentDaysLeft(account) === 0
                  ? $t('accounts.payment_due_today')
                  : $t('accounts.payment_due_in', { n: paymentDaysLeft(account) }) }}
              </span>
            </div>

            <!-- Botón de pago -->
            <q-btn
              unelevated
              color="dark"
              icon="credit_score"
              :label="$t('accounts.pay_btn')"
              class="full-width q-mt-md"
              @click="openPaymentDialog(account)"
            />
          </template>

        </q-card-section>
      </q-card>
    </div>

    <!-- Modal: Nueva / Editar Cuenta -->
    <AccountForm v-model="showForm" :account="selectedAccount" />

    <!-- Modal: Pago TDC -->
    <CreditCardPaymentDialog
      v-model="showPaymentDialog"
      :account="paymentAccount"
      :suggested-amount="paymentAccount ? nextInstallmentPayment(paymentAccount)?.amount ?? null : null"
    />

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
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { useAccountsStore } from 'stores/accounts.store'
import { useTransactionsStore } from 'stores/transactions.store'
import { useCurrency } from 'src/composables/useCurrency'
import AccountForm from 'components/accounts/AccountForm.vue'
import CreditCardPaymentDialog from 'components/accounts/CreditCardPaymentDialog.vue'

const { t } = useI18n()
const $q = useQuasar()
const accountsStore = useAccountsStore()
const transactionsStore = useTransactionsStore()
const { formatCurrency } = useCurrency()

const hidden = ref(false)
const showForm = ref(false)
const selectedAccount = ref(null)
const showConfirm = ref(false)
const toDelete = ref(null)
const showPaymentDialog = ref(false)
const paymentAccount = ref(null)

function openPaymentDialog(account) {
  paymentAccount.value = account
  showPaymentDialog.value = true
}

function editAccount(account) {
  selectedAccount.value = account
  showForm.value = true
}

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
  $q.notify({ message: t('notify.account_deleted'), color: 'negative', icon: 'delete', position: 'bottom', timeout: 2500 })
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

// ── Lógica de próximo pago de cuotas ─────────────────────────────────────────

function getNextDueDate(paymentDueDay) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), paymentDueDay)
  return thisMonth >= today
    ? thisMonth
    : new Date(today.getFullYear(), today.getMonth() + 1, paymentDueDay)
}

function getLastCutDate(cutDay) {
  if (!cutDay) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const thisMonthCut = new Date(today.getFullYear(), today.getMonth(), cutDay)
  return thisMonthCut <= today
    ? thisMonthCut
    : new Date(today.getFullYear(), today.getMonth() - 1, cutDay)
}

/**
 * Cuotas del próximo periodo menos pagos ya realizados desde el último corte.
 */
function nextInstallmentPayment(account) {
  if (!account.payment_due_date) return null

  const nextDue    = getNextDueDate(account.payment_due_date)
  const nextDueStr = nextDue.toISOString().split('T')[0]

  const dueTxs = transactionsStore.transactions.filter(t =>
    t.account_id === account.id &&
    t.installment_plan_id &&
    t.date === nextDueStr
  )
  if (!dueTxs.length) return null

  const totalDue = dueTxs.reduce((sum, t) => sum + t.amount, 0)

  // Pagos de TDC realizados desde el último corte
  const lastCut    = getLastCutDate(account.cut_date)
  const lastCutStr = lastCut ? lastCut.toISOString().split('T')[0] : '1900-01-01'

  const alreadyPaid = transactionsStore.transactions
    .filter(t =>
      t.destination_account_id === account.id &&
      t.type                   === 'transferencia' &&
      t.category               === 'Pago TDC' &&
      t.date                   >= lastCutStr
    )
    .reduce((sum, t) => sum + t.amount, 0)

  return {
    amount:      Math.max(0, totalDue - alreadyPaid),
    totalDue,
    alreadyPaid,
    dueDate:     nextDue,
    count:       dueTxs.length,
  }
}

/**
 * Devuelve true si la fecha límite de pago está a 5 días o menos.
 */
function isPaymentUrgent(account) {
  if (!account.payment_due_date) return false
  const nextDue = getNextDueDate(account.payment_due_date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diffDays = (nextDue - today) / (1000 * 60 * 60 * 24)
  return diffDays <= 5
}

/**
 * Devuelve días restantes hasta el próximo pago (0 = hoy, 1–5 = próximo),
 * o null si faltan más de 5 días o no tiene fecha de pago.
 */
function paymentDaysLeft(account) {
  if (!account.payment_due_date) return null
  const nextDue = getNextDueDate(account.payment_due_date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diffDays = (nextDue - today) / (1000 * 60 * 60 * 24)
  return diffDays <= 5 ? diffDays : null
}

/**
 * Deuda real independientemente del modelo de balance:
 * - balance negativo (modelo deuda):     deuda = |balance|
 * - balance positivo (modelo disponible): deuda = credit_limit - balance
 */
function creditDebt(account) {
  return account.balance >= 0
    ? Math.max(0, account.credit_limit - account.balance)
    : Math.abs(account.balance)
}

function creditUsedPercent(account) {
  if (!account.credit_limit || account.credit_limit <= 0) return 0
  return Math.min((creditDebt(account) / account.credit_limit) * 100, 100)
}

function formatDueDate(date) {
  return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })
}
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
