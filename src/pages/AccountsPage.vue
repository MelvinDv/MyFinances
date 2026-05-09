<template>
  <q-page class="page-accounts">

    <!-- Header -->
    <div class="ac-header">
      <span class="ac-title">{{ $t('accounts.title') }}</span>
      <div class="row items-center" style="gap: 4px">
        <q-btn
          flat dense round
          :icon="hidden ? 'visibility' : 'visibility_off'"
          size="11px" color="grey-5"
          @click="hidden = !hidden"
        />
        <q-btn
          id="btn-nueva-cuenta"
          flat dense round
          icon="add"
          size="11px" color="grey-7"
          :disable="!canAddAccount"
          @click="showForm = true"
        >
          <q-tooltip v-if="!canAddAccount">
            {{ $t('plan.limit_accounts', { debit: FREE_DEBIT_LIMIT, credit: FREE_CREDIT_LIMIT }) }}
          </q-tooltip>
        </q-btn>
      </div>
    </div>

    <!-- Account cards -->
    <div class="ac-list">
      <div
        v-for="account in accountsStore.accounts"
        :key="account.id"
        class="ac-card"
        :style="isExcessAccount(account) ? 'opacity:0.5' : ''"
      >
        <!-- Top row: name/type + balance + menu -->
        <div class="ac-card-top">
          <div>
            <div class="ac-card-name">{{ account.label }}</div>
            <div class="ac-card-type">
              {{ $t(`account_types.${account.type}`) }}
              <template v-if="account.type === 'tarjeta_credito' && account.cut_date">
                · corte {{ account.cut_date }}
              </template>
            </div>
          </div>
          <div class="row items-center" style="gap: 4px">
            <div class="ac-card-balance">
              {{ hidden ? '••••' : formatCurrency(
                account.type === 'tarjeta_credito' && account.credit_limit
                  ? account.credit_limit - creditDebt(account)
                  : account.balance
              ) }}
            </div>
            <q-btn flat round dense icon="more_vert" size="9px" color="grey-4">
              <q-menu anchor="bottom right" self="top right" auto-close>
                <q-list dense style="min-width: 130px">
                  <q-item clickable :disable="isExcessAccount(account)" @click="editAccount(account)">
                    <q-item-section avatar>
                      <q-icon name="edit" size="15px" color="grey-7" />
                    </q-item-section>
                    <q-item-section>{{ $t('common.edit') }}</q-item-section>
                  </q-item>
                  <q-separator />
                  <q-item clickable @click="confirmDelete(account)">
                    <q-item-section avatar>
                      <q-icon name="delete" size="15px" color="negative" />
                    </q-item-section>
                    <q-item-section class="text-negative">{{ $t('common.delete') }}</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </div>
        </div>

        <!-- Credit card extras -->
        <template v-if="account.type === 'tarjeta_credito' && account.credit_limit">
          <div class="ac-bar">
            <div
              class="ac-bar-fill"
              :style="{
                width: Math.min(creditUsedPercent(account), 100) + '%',
                background: account.color,
                opacity: 0.5,
              }"
            />
          </div>
          <div class="ac-bar-footer">
            <span>{{ hidden ? '••••' : formatCurrency(creditDebt(account)) }} usado</span>
            <span>{{ formatCurrency(account.credit_limit) }}</span>
          </div>

          <template v-if="nextInstallmentPayment(account)">
            <div class="ac-payment-row">
              <span class="ac-payment-label">{{ $t('accounts.next_payment') }}</span>
              <span class="ac-payment-amount" :class="isPaymentUrgent(account) ? 'text-negative' : ''">
                {{ hidden ? '••••' : formatCurrency(nextInstallmentPayment(account).amount) }}
              </span>
            </div>
            <div v-if="nextInstallmentPayment(account).alreadyPaid > 0" class="ac-paid-label">
              Abonado: {{ formatCurrency(nextInstallmentPayment(account).alreadyPaid) }}
            </div>
          </template>
          <div v-else class="ac-payment-row">
            <span class="ac-payment-label">{{ $t('accounts.balance_owed') }}</span>
            <span class="ac-payment-amount text-negative">
              {{ hidden ? '••••' : formatCurrency(creditDebt(account)) }}
            </span>
          </div>

          <div
            v-if="paymentDaysLeft(account) !== null"
            class="ac-urgent"
            :class="paymentDaysLeft(account) === 0 ? 'text-negative' : 'text-warning'"
          >
            <q-icon :name="paymentDaysLeft(account) === 0 ? 'error' : 'schedule'" size="12px" />
            {{ paymentDaysLeft(account) === 0
              ? $t('accounts.payment_due_today')
              : $t('accounts.payment_due_in', { n: paymentDaysLeft(account) }) }}
          </div>

          <q-btn
            unelevated color="dark" size="sm"
            :label="$t('accounts.pay_btn')"
            class="full-width q-mt-sm"
            @click="openPaymentDialog(account)"
          />
        </template>
      </div>
    </div>

    <!-- Total patrimony -->
    <div class="ac-total">
      <span class="ac-total-label">Patrimonio total</span>
      <strong class="ac-total-value">{{ hidden ? '••••••' : formatCurrency(totalBalance) }}</strong>
    </div>

    <!-- Modals -->
    <AccountForm v-model="showForm" :account="selectedAccount" @account-created="onAccountCreated" />
    <CreditCardPaymentDialog
      v-model="showPaymentDialog"
      :account="paymentAccount"
      :suggested-amount="paymentAccount ? nextInstallmentPayment(paymentAccount)?.amount ?? null : null"
    />

    <q-dialog v-model="showConfirm">
      <q-card style="min-width: 300px">
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
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { useAccountsStore } from 'stores/accounts.store'
import { useTransactionsStore } from 'stores/transactions.store'
import { useCurrency } from 'src/composables/useCurrency'
import { useTour } from 'src/composables/useTour'
import { usePlan } from 'src/composables/usePlan'
import AccountForm from 'components/accounts/AccountForm.vue'
import CreditCardPaymentDialog from 'components/accounts/CreditCardPaymentDialog.vue'

const { t } = useI18n()
const $q = useQuasar()
const accountsStore = useAccountsStore()
const transactionsStore = useTransactionsStore()
const { formatCurrency } = useCurrency()
const { isCompleted, getPhase, runStep1, runStep2 } = useTour()
const { canAddAccount, isExcessAccount, FREE_DEBIT_LIMIT, FREE_CREDIT_LIMIT } = usePlan()

const hidden = ref(false)
const showForm = ref(false)

onMounted(async () => {
  if (isCompleted()) return
  await nextTick()
  runStep1(t)
})

const accountJustCreated = ref(false)

function onAccountCreated() {
  if (isCompleted() || getPhase() === 'transactions') return
  accountJustCreated.value = true
  runStep2(t)
}

watch(showForm, (val) => {
  if (val) return
  if (isCompleted() || getPhase() === 'transactions') return
  if (accountJustCreated.value) { accountJustCreated.value = false; return }
  runStep2(t)
})

const selectedAccount    = ref(null)
const showConfirm        = ref(false)
const toDelete           = ref(null)
const showPaymentDialog  = ref(false)
const paymentAccount     = ref(null)

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

const totalBalance = computed(() =>
  accountsStore.accounts.reduce((sum, a) => sum + a.balance, 0)
)


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

function nextInstallmentPayment(account) {
  if (!account.payment_due_date) return null
  const nextDue    = getNextDueDate(account.payment_due_date)
  const nextDueStr = nextDue.toISOString().split('T')[0]
  const dueTxs = transactionsStore.transactions.filter(t =>
    t.account_id === account.id && t.installment_plan_id && t.date === nextDueStr
  )
  if (!dueTxs.length) return null
  const totalDue = dueTxs.reduce((sum, t) => sum + t.amount, 0)
  const lastCut    = getLastCutDate(account.cut_date)
  const lastCutStr = lastCut ? lastCut.toISOString().split('T')[0] : '1900-01-01'
  const alreadyPaid = transactionsStore.transactions
    .filter(t =>
      t.destination_account_id === account.id &&
      t.type === 'transferencia' &&
      t.category === 'Pago TDC' &&
      t.date >= lastCutStr
    )
    .reduce((sum, t) => sum + t.amount, 0)
  return { amount: Math.max(0, totalDue - alreadyPaid), totalDue, alreadyPaid, dueDate: nextDue, count: dueTxs.length }
}

function isPaymentUrgent(account) {
  if (!account.payment_due_date) return false
  const nextDue = getNextDueDate(account.payment_due_date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return (nextDue - today) / (1000 * 60 * 60 * 24) <= 5
}

function paymentDaysLeft(account) {
  if (!account.payment_due_date) return null
  const nextDue = getNextDueDate(account.payment_due_date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diffDays = (nextDue - today) / (1000 * 60 * 60 * 24)
  return diffDays <= 5 ? diffDays : null
}

function creditDebt(account) {
  return account.balance >= 0
    ? Math.max(0, account.credit_limit - account.balance)
    : Math.abs(account.balance)
}

function creditUsedPercent(account) {
  if (!account.credit_limit || account.credit_limit <= 0) return 0
  return Math.min((creditDebt(account) / account.credit_limit) * 100, 100)
}
</script>

<style scoped lang="scss">
.page-accounts {
  padding: 20px 20px 24px;
  background: #fff;
}

.ac-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.ac-title { font-size: 16px; font-weight: 500; color: #1a1a18; }

.ac-list { display: flex; flex-direction: column; gap: 8px; }

.ac-card {
  border: 0.5px solid #E8E6E0;
  border-radius: 12px;
  padding: 12px;
}
.ac-card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}
.ac-card-name { font-size: 13px; font-weight: 500; color: #1a1a18; }
.ac-card-type { font-size: 11px; color: #C8C6BE; }
.ac-card-balance { font-size: 16px; font-weight: 500; color: #1a1a18; letter-spacing: -0.5px; }

.ac-bar {
  height: 2px;
  background: #F1EFE8;
  border-radius: 2px;
  margin-bottom: 4px;
}
.ac-bar-fill { height: 2px; border-radius: 2px; }
.ac-bar-footer {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}
.ac-bar-footer span { font-size: 11px; color: #C8C6BE; }

.ac-payment-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 4px;
}
.ac-payment-label { font-size: 11px; color: #C8C6BE; }
.ac-payment-amount { font-size: 13px; font-weight: 500; color: #1a1a18; }
.ac-paid-label { font-size: 11px; color: #3B6D11; margin-top: 2px; }

.ac-urgent {
  font-size: 11px;
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 3px;
}

.ac-total {
  border-top: 0.5px solid #F1EFE8;
  padding-top: 12px;
  margin-top: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.ac-total-label { font-size: 11px; color: #888780; }
.ac-total-value { font-size: 15px; font-weight: 500; color: #1a1a18; }
</style>
