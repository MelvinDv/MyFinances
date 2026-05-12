<template>
  <q-dialog
    :model-value="modelValue"
    position="bottom"
    full-width
    @update:model-value="close"
  >
    <q-card class="quick-sheet">
      <!-- Handle -->
      <div class="qs-handle" />

      <!-- Type pills -->
      <div class="qs-type-row">
        <div
          v-for="tp in typeOptions"
          :key="tp.value"
          :class="['qs-type-btn', { 'qs-type-on': form.type === tp.value }]"
          @click="!isEditMode && setType(tp.value)"
        >{{ tp.label }}</div>
      </div>

      <!-- ── PASO 1: monto + teclado ──────────────────────────────── -->
      <template v-if="step === 1">
        <div class="qs-amount-wrap">
          <div :class="['qs-amount', { 'qs-amount-empty': !amountStr }]">
            ${{ amountStr || '0' }}
          </div>
        </div>

        <div class="qs-quick-row">
          <span
            v-for="chip in quickAmounts"
            :key="chip"
            class="qs-quick-chip"
            @click="setQuickAmount(chip)"
          >${{ chip }}</span>
        </div>

        <div class="qs-numpad">
          <div
            v-for="k in numpadKeys"
            :key="k.id"
            :class="['qs-key', k.cls]"
            @click="pressKey(k)"
          >
            <i v-if="k.icon" :class="['ti', k.icon]" />
            <span v-else>{{ k.label }}</span>
          </div>
        </div>

        <div class="qs-continue-row">
          <div :class="['qs-continue-btn', { 'qs-continue-disabled': !amountStr }]" @click="amountStr && (step = 2)">Continuar</div>
        </div>
      </template>

      <!-- ── PASO 2: categoría + detalles ────────────────────────── -->
      <template v-else>
        <div class="qs-scroll-body">
          <div class="qs-amount-wrap qs-amount-wrap-sm" @click="step = 1">
            <div class="qs-amount">${{ amountStr }}</div>
          </div>

          <!-- Meta pills -->
          <div class="qs-meta-row">
            <!-- Cuenta (no-transferencia) -->
            <div v-if="!isTransfer" class="qs-meta-pill qs-meta-pill-select">
              <i class="ti ti-credit-card qs-meta-icon" />
              <q-select
                v-model="form.account"
                :options="accountOptions"
                option-label="label"
                borderless dense hide-bottom-space
                class="qs-meta-select"
              />
            </div>
            <!-- Cuentas (transferencia) -->
            <template v-else>
              <div class="qs-meta-pill qs-meta-pill-select">
                <i class="ti ti-arrow-right qs-meta-icon" />
                <q-select
                  v-model="form.fromAccount"
                  :options="accountOptions"
                  option-label="label"
                  borderless dense hide-bottom-space
                  class="qs-meta-select"
                />
              </div>
              <div class="qs-meta-pill qs-meta-pill-select">
                <i class="ti ti-arrow-right qs-meta-icon" />
                <q-select
                  v-model="form.toAccount"
                  :options="toAccountOptions"
                  option-label="label"
                  borderless dense hide-bottom-space
                  class="qs-meta-select"
                />
              </div>
            </template>
            <!-- Fecha -->
            <div class="qs-meta-pill qs-meta-pill-date">
              <i class="ti ti-calendar qs-meta-icon" />
              <span class="qs-meta-text">{{ dateLabel }}</span>
              <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                <q-date v-model="form.date" mask="YYYY-MM-DD" minimal>
                  <div class="row justify-end"><q-btn v-close-popup label="OK" color="dark" flat /></div>
                </q-date>
              </q-popup-proxy>
            </div>
          </div>

          <!-- Category grid (hidden for transfers) -->
          <div v-if="!isTransfer" class="qs-cat-grid">
            <div
              v-for="cat in settingsStore.categories"
              :key="cat.id"
              :class="['qs-cat-item', { 'qs-cat-selected': form.category === cat.name }]"
              @click="form.category = cat.name"
            >
              <div class="qs-cat-icon" :style="{ background: cat.color + '22' }">
                <q-icon :name="cat.icon" size="16px" :style="{ color: cat.color }" />
              </div>
              <span class="qs-cat-name">{{ cat.name }}</span>
            </div>
          </div>

          <!-- Expand detalles -->
          <div class="qs-expand-row" @click="showDetails = !showDetails">
            <span class="qs-expand-label">{{ showDetails ? 'Ocultar detalles' : 'Más detalles' }}</span>
            <i :class="['ti', showDetails ? 'ti-chevron-up' : 'ti-chevron-down']" style="font-size:13px;color:#C8C6BE" />
          </div>

          <!-- Optional details -->
          <div v-if="showDetails" class="qs-details">

            <!-- Descripción -->
            <div class="qs-field-row">
              <i class="ti ti-tag qs-field-icon" />
              <input
                v-model="form.description"
                :placeholder="$t('transaction_form.description_placeholder')"
                class="qs-field-input"
              />
            </div>

            <!-- Recurrente toggle -->
            <div
              v-if="form.type === 'gasto' && !isEditMode"
              class="qs-toggle-row"
            >
              <div class="qs-toggle-label">
                <i class="ti ti-repeat qs-field-icon" />
                <span>{{ $t('recurring.toggle_label') }}</span>
              </div>
              <div
                :class="['qs-tog', { 'qs-tog-off': !form.recurring }]"
                @click="form.recurring = !form.recurring"
              >
                <div class="qs-tog-knob" />
              </div>
            </div>

            <!-- MSI toggle -->
            <div
              v-if="isCredit && form.type === 'gasto' && !form.recurring && !isEditMode"
              class="qs-toggle-row"
            >
              <div class="qs-toggle-label">
                <i class="ti ti-credit-card qs-field-icon" />
                <span>{{ $t('installments.toggle_label') }}</span>
              </div>
              <div
                :class="['qs-tog', { 'qs-tog-off': !form.installment.enabled }]"
                @click="form.installment.enabled = !form.installment.enabled"
              >
                <div class="qs-tog-knob" />
              </div>
            </div>

            <!-- Detalle MSI -->
            <div v-if="form.installment.enabled && isCredit" class="qs-installment">
              <div class="qs-inst-label">{{ $t('installments.months_label') }}</div>
              <div class="qs-months-grid">
                <button
                  v-for="m in monthOptions"
                  :key="m"
                  :class="['qs-month-btn', { 'qs-month-on': form.installment.months === m }]"
                  @click="form.installment.months = m"
                >{{ m }}</button>
              </div>

              <div class="qs-type-row q-mt-xs">
                <div
                  :class="['qs-type-btn', { 'qs-type-on': form.installment.type === 'msi' }]"
                  @click="form.installment.type = 'msi'"
                >{{ $t('installments.type_msi') }}</div>
                <div
                  :class="['qs-type-btn', { 'qs-type-on': form.installment.type === 'interes' }]"
                  @click="form.installment.type = 'interes'"
                >{{ $t('installments.type_interest') }}</div>
              </div>

              <template v-if="form.installment.type === 'interes'">
                <div class="qs-type-row q-mt-xs">
                  <div
                    :class="['qs-type-btn', { 'qs-type-on': form.installment.calcMode === 'mensual' }]"
                    @click="form.installment.calcMode = 'mensual'"
                  >{{ $t('installments.calc_mode_monthly') }}</div>
                  <div
                    :class="['qs-type-btn', { 'qs-type-on': form.installment.calcMode === 'tasa' }]"
                    @click="form.installment.calcMode = 'tasa'"
                  >{{ $t('installments.calc_mode_rate') }}</div>
                </div>
                <q-input
                  v-if="form.installment.calcMode === 'mensual'"
                  v-model.number="form.installment.monthlyPayment"
                  type="number" outlined dense prefix="$"
                  :placeholder="$t('installments.monthly_payment_placeholder')"
                  class="q-mt-xs" hide-bottom-space
                />
                <q-input
                  v-else
                  v-model.number="form.installment.annualRate"
                  type="number" outlined dense suffix="%"
                  :placeholder="$t('installments.annual_rate_placeholder')"
                  class="q-mt-xs" hide-bottom-space
                />
              </template>

              <div v-if="installmentSummary" class="qs-inst-summary">
                <div class="qs-inst-row">
                  <span>{{ $t('installments.summary_monthly') }}</span>
                  <span>{{ formatCurrency(installmentSummary.monthly) }}</span>
                </div>
                <div class="qs-inst-row">
                  <span>{{ $t('installments.summary_total') }}</span>
                  <strong>{{ formatCurrency(installmentSummary.total) }}</strong>
                </div>
                <div class="qs-inst-row">
                  <span>{{ $t('installments.summary_interest') }}</span>
                  <span :class="installmentSummary.interest > 0 ? 'text-negative' : 'text-positive'">
                    {{ installmentSummary.interest > 0
                      ? '+' + formatCurrency(installmentSummary.interest)
                      : $t('installments.summary_no_interest') }}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>

        <!-- Confirm button -->
        <div class="qs-confirm-wrap">
          <div class="qs-confirm-btn" @click="handleSubmit">{{ confirmLabel }}</div>
        </div>
      </template>

    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { useTransactionsStore } from 'stores/transactions.store'
import { useRecurringStore } from 'stores/recurring_transactions.store'
import { useAccountsStore } from 'stores/accounts.store'
import { useSettingsStore } from 'stores/settings.store'
import { useCurrency } from 'src/composables/useCurrency'
import { usePlan } from 'src/composables/usePlan'

const props = defineProps({
  modelValue:  { type: Boolean, default: false },
  transaction: { type: Object,  default: null },
})
const emit = defineEmits(['update:modelValue'])

const isEditMode = computed(() => !!props.transaction)

const { t } = useI18n()
const { formatCurrency } = useCurrency()
const $q = useQuasar()
const transactionsStore = useTransactionsStore()
const recurringStore    = useRecurringStore()
const accountsStore     = useAccountsStore()
const settingsStore     = useSettingsStore()
const { isExcessAccount } = usePlan()

// ── UI state ──────────────────────────────────────────────────────────────────

const step        = ref(1)
const amountStr   = ref('')
const showDetails = ref(false)

const quickAmounts = [50, 100, 200, 500]

const numpadKeys = [
  { id: '1', label: '1' }, { id: '2', label: '2' }, { id: '3', label: '3' },
  { id: '4', label: '4' }, { id: '5', label: '5' }, { id: '6', label: '6' },
  { id: '7', label: '7' }, { id: '8', label: '8' }, { id: '9', label: '9' },
  { id: '.', label: '.', cls: 'qs-key-muted' },
  { id: '0', label: '0' },
  { id: 'bs', icon: 'ti-backspace', cls: 'qs-key-muted' },
]

function pressKey(k) {
  if (k.id === 'bs') {
    amountStr.value = amountStr.value.slice(0, -1)
    return
  }
  if (k.label === '.' && amountStr.value.includes('.')) return
  if (amountStr.value.length >= 10) return
  if (k.label === '.' && !amountStr.value) amountStr.value = '0'
  amountStr.value += k.label
}

function setQuickAmount(chip) {
  amountStr.value = String(chip)
  step.value = 2
}

// ── Form ──────────────────────────────────────────────────────────────────────

const typeOptions = computed(() => [
  { label: t('transaction_form.expense'),  value: 'gasto' },
  { label: t('transaction_form.income'),   value: 'ingreso' },
  { label: t('transaction_form.transfer'), value: 'transferencia' },
])

const accountOptions = computed(() =>
  accountsStore.accounts
    .filter(a => !isExcessAccount(a))
    .map(a => ({ ...a, label: a.label ?? a.name }))
)

const toAccountOptions = computed(() =>
  accountOptions.value.filter(a => a.id !== form.value.fromAccount?.id)
)

const monthOptions = [3, 6, 9, 12, 18, 24]

const defaultInstallment = () => ({
  enabled: false, months: 12, type: 'msi',
  calcMode: 'mensual', annualRate: null, monthlyPayment: null,
})

const defaultForm = () => ({
  type:        'gasto',
  description: '',
  category:    settingsStore.categories[0]?.name ?? 'Otros',
  account:     accountOptions.value[0] ?? null,
  fromAccount: accountOptions.value[0] ?? null,
  toAccount:   accountOptions.value[1] ?? null,
  date:        new Date().toISOString().split('T')[0],
  installment: defaultInstallment(),
  recurring:   false,
})

function formFromTransaction(tx) {
  if (!tx) return defaultForm()
  if (tx.type === 'transferencia') {
    return {
      ...defaultForm(), type: 'transferencia',
      date: tx.date, description: tx.description ?? '',
      fromAccount: accountOptions.value.find(a => a.id === tx.account_id) ?? null,
      toAccount:   accountOptions.value.find(a => a.id === tx.destination_account_id) ?? null,
    }
  }
  return {
    ...defaultForm(), type: tx.type,
    date: tx.date, description: tx.description ?? '',
    category: tx.category,
    account: accountOptions.value.find(a => a.id === tx.account_id) ?? null,
  }
}

const form = ref(defaultForm())

// Reset/populate on open
watch(() => props.modelValue, (open) => {
  if (open) {
    form.value  = formFromTransaction(props.transaction)
    amountStr.value = props.transaction ? String(props.transaction.amount) : ''
    step.value  = isEditMode.value ? 2 : 1
    showDetails.value = isEditMode.value
  }
})

function setType(type) {
  form.value.type = type
  if (type !== 'gasto') form.value.installment = defaultInstallment()
}

const isTransfer = computed(() => form.value.type === 'transferencia')
const isCredit   = computed(() => form.value.account?.type === 'tarjeta_credito')

const selectedCategoryId = computed(() =>
  settingsStore.categories.find(c => c.name === form.value.category)?.id ?? null
)

const dateLabel = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  if (form.value.date === today) return 'Hoy'
  return new Date(form.value.date + 'T00:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
})

const confirmLabel = computed(() => {
  if (isEditMode.value) return t('common.save')
  if (form.value.type === 'ingreso') return t('transaction_form.income') + ' ✓'
  if (form.value.type === 'transferencia') return t('transaction_form.submit_transfer')
  return 'Guardar gasto'
})

// Watchers
watch(() => form.value.fromAccount, (from) => {
  if (form.value.toAccount?.id === from?.id)
    form.value.toAccount = toAccountOptions.value[0] ?? null
})
watch(() => form.value.account, (acc) => {
  if (acc?.type !== 'tarjeta_credito') form.value.installment = defaultInstallment()
})
watch(() => form.value.type, (type) => {
  if (type !== 'gasto') form.value.installment = defaultInstallment()
})

// ── Installment summary ───────────────────────────────────────────────────────

const installmentSummary = computed(() => {
  const amount = parseFloat(amountStr.value) || 0
  const { months, type, calcMode, annualRate, monthlyPayment } = form.value.installment
  if (!amount || amount <= 0 || !months) return null
  if (type === 'msi') return { monthly: amount / months, total: amount, interest: 0 }
  if (calcMode === 'tasa') {
    const r = (annualRate || 0) / 100 / 12
    const monthly = r > 0 ? amount * r / (1 - Math.pow(1 + r, -months)) : amount / months
    return { monthly, total: monthly * months, interest: monthly * months - amount }
  }
  const monthly = monthlyPayment || 0
  if (monthly <= 0) return { monthly: 0, total: 0, interest: 0 }
  return { monthly, total: monthly * months, interest: monthly * months - amount }
})

// ── Actions ───────────────────────────────────────────────────────────────────

function close(val) {
  emit('update:modelValue', val)
}

async function handleSubmit() {
  const amount = parseFloat(amountStr.value) || 0
  if (!amount || amount <= 0) return

  if (isEditMode.value) {
    await handleUpdate(amount)
    return
  }

  if (isTransfer.value) {
    if (!form.value.fromAccount || !form.value.toAccount) return
    if (form.value.fromAccount.id === form.value.toAccount.id) return
    transactionsStore.addTransfer({
      fromAccount: form.value.fromAccount,
      toAccount:   form.value.toAccount,
      amount, date: form.value.date, description: form.value.description,
    })
    $q.notify({ message: t('notify.transfer_added'), color: 'positive', icon: 'check_circle', position: 'bottom', timeout: 2500 })
  } else {
    if (!form.value.category || !form.value.account) return

    if (form.value.recurring) {
      const dayOfMonth = new Date(form.value.date + 'T00:00:00').getDate()
      await recurringStore.addRecurring(
        { type: form.value.type, amount, category: form.value.category, category_id: selectedCategoryId.value, account_id: form.value.account.id, account_name: form.value.account.name, description: form.value.description, day_of_month: dayOfMonth },
        { type: form.value.type, amount, description: form.value.description, category: form.value.category, category_id: selectedCategoryId.value, account_id: form.value.account.id, account_name: form.value.account.name, date: form.value.date },
      )
      $q.notify({ message: t('notify.recurring_added'), color: 'positive', icon: 'check_circle', position: 'bottom', timeout: 2500 })
      emit('update:modelValue', false)
      return
    }

    if (form.value.installment.enabled && isCredit.value) {
      const summary = installmentSummary.value
      if (!summary || summary.monthly <= 0) return
      transactionsStore.addInstallmentPlan({
        plan: {
          account_id: form.value.account.id, account_name: form.value.account.name,
          description: form.value.description, category: form.value.category, category_id: selectedCategoryId.value,
          original_amount: amount, total_amount: summary.total,
          months: form.value.installment.months, monthly_payment: summary.monthly,
          interest_rate: form.value.installment.type === 'msi' ? 0 : (form.value.installment.annualRate || 0),
          start_date: form.value.date,
        },
        paymentDueDay: form.value.account.payment_due_date,
      })
      $q.notify({ message: t('notify.installment_added'), color: 'positive', icon: 'check_circle', position: 'bottom', timeout: 2500 })
    } else {
      transactionsStore.addTransaction({
        type: form.value.type, amount, description: form.value.description,
        category: form.value.category, category_id: selectedCategoryId.value,
        account_id: form.value.account.id, account_name: form.value.account.name,
        date: form.value.date,
      })
      $q.notify({ message: t('notify.transaction_added'), color: 'positive', icon: 'check_circle', position: 'bottom', timeout: 2500 })
    }
  }

  emit('update:modelValue', false)
}

async function handleUpdate(amount) {
  const tx = props.transaction
  let updates
  if (isTransfer.value) {
    if (!form.value.fromAccount || !form.value.toAccount) return
    updates = {
      amount, date: form.value.date, description: form.value.description,
      account_id: form.value.fromAccount.id, account_name: form.value.fromAccount.name ?? form.value.fromAccount.label,
      destination_account_id: form.value.toAccount.id, destination_account_name: form.value.toAccount.name ?? form.value.toAccount.label,
    }
  } else {
    if (!form.value.category || !form.value.account) return
    updates = {
      amount, date: form.value.date, description: form.value.description,
      category: form.value.category, category_id: selectedCategoryId.value,
      account_id: form.value.account.id, account_name: form.value.account.name ?? form.value.account.label,
    }
  }
  await transactionsStore.updateTransaction(tx.id, updates, tx)
  $q.notify({ message: t('notify.transaction_updated'), color: 'positive', icon: 'check_circle', position: 'bottom', timeout: 2500 })
  emit('update:modelValue', false)
}
</script>

<style scoped lang="scss">
.quick-sheet {
  width: 100%;
  max-width: 100%;
  border-radius: 20px 20px 0 0 !important;
  overflow: hidden;
  padding-bottom: env(safe-area-inset-bottom, 8px);
  max-height: 92dvh;
  display: flex;
  flex-direction: column;
}

.qs-scroll-body {
  flex: 1;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

.qs-handle {
  width: 32px;
  height: 3px;
  background: #E8E6E0;
  border-radius: 2px;
  margin: 10px auto 0;
}

// ── Type row ──────────────────────────────────────────────────────────────────
.qs-type-row {
  display: flex;
  margin: 12px 14px 0;
  gap: 5px;
}
.qs-type-btn {
  flex: 1;
  text-align: center;
  font-size: 12px;
  padding: 6px 0;
  border-radius: 9px;
  border: 0.5px solid #E8E6E0;
  color: #888780;
  cursor: pointer;
  user-select: none;
  transition: all 0.15s;
}
.qs-type-on {
  background: #1a1a18;
  color: #ffffff;
  border-color: #1a1a18;
}

// ── Amount ────────────────────────────────────────────────────────────────────
.qs-amount-wrap {
  text-align: center;
  padding: 16px 14px 8px;
}
.qs-amount-wrap-sm { padding: 10px 14px 6px; cursor: pointer; margin-bottom: 12px; }

.qs-amount {
  font-size: 42px;
  font-weight: 500;
  color: #1a1a18;
  letter-spacing: -2px;
  line-height: 1;
}
.qs-amount-empty { color: #D3D1C7; }

// ── Quick chips ───────────────────────────────────────────────────────────────
.qs-quick-row {
  display: flex;
  justify-content: center;
  gap: 8px;
  padding: 0 14px 10px;
}
.qs-quick-chip {
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 12px;
  border: 0.5px solid #E8E6E0;
  color: #888780;
  cursor: pointer;
  user-select: none;
}

// ── Numpad ────────────────────────────────────────────────────────────────────
.qs-numpad {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;
  background: #F1EFE8;
  border-top: 0.5px solid #F1EFE8;
}
.qs-key {
  background: #ffffff;
  padding: 14px 0;
  text-align: center;
  font-size: 18px;
  font-weight: 500;
  color: #1a1a18;
  cursor: pointer;
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: center;

  &:active { background: #F8F7F4; }
}
.qs-key-muted {
  font-size: 14px;
  color: #888780;
  i { font-size: 20px; }
}

// ── Continue ──────────────────────────────────────────────────────────────────
.qs-continue-row {
  padding: 10px 14px 12px;
}
.qs-continue-btn {
  background: #1a1a18;
  color: #fff;
  border-radius: 12px;
  padding: 12px;
  text-align: center;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}
.qs-continue-disabled {
  background: #E8E6E0;
  color: #C8C6BE;
  cursor: default;
}

// ── Meta pills ────────────────────────────────────────────────────────────────
.qs-meta-row {
  display: flex;
  gap: 6px;
  padding: 0 14px 10px;
}
.qs-meta-pill {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 7px 10px;
  border-radius: 10px;
  border: 0.5px solid #E8E6E0;
  min-width: 0;
}
.qs-meta-icon { font-size: 13px; color: #C8C6BE; flex-shrink: 0; }
.qs-meta-text { font-size: 12px; color: #1a1a18; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.qs-meta-pill-select { padding: 2px 10px; cursor: pointer; }
.qs-meta-select {
  flex: 1;
  min-width: 0;
  :deep(.q-field__native), :deep(.q-field__prefix), :deep(.q-field__suffix) {
    font-size: 12px;
    color: #1a1a18;
    padding: 0;
    min-height: unset;
  }
  :deep(.q-field__control) { height: 28px; min-height: unset; padding: 0; }
  :deep(.q-field__append) { height: 28px; padding-left: 2px; }
  :deep(.q-select__dropdown-icon) { font-size: 14px; color: #C8C6BE; }
}

.qs-meta-pill-date { cursor: pointer; position: relative; }

// ── Category grid ─────────────────────────────────────────────────────────────
.qs-cat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  padding: 0 14px 8px;
}
.qs-cat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  user-select: none;
}
.qs-cat-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: outline 0.1s;
}
.qs-cat-selected .qs-cat-icon {
  outline: 1.5px solid #1a1a18;
}
.qs-cat-name {
  font-size: 9px;
  color: #888780;
  text-align: center;
}
.qs-cat-selected .qs-cat-name {
  color: #1a1a18;
  font-weight: 600;
}

// ── Expand ────────────────────────────────────────────────────────────────────
.qs-expand-row {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 5px;
  padding: 4px 14px 6px;
  cursor: pointer;
}
.qs-expand-label { font-size: 11px; color: #C8C6BE; }

// ── Optional details ──────────────────────────────────────────────────────────
.qs-details {
  padding: 0 14px 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.qs-field-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 10px;
  border: 0.5px solid #E8E6E0;
}
.qs-field-icon { font-size: 14px; color: #C8C6BE; flex-shrink: 0; }
.qs-field-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 13px;
  color: #1a1a18;
  background: transparent;
  &::placeholder { color: #C8C6BE; }
}

.qs-two-col {
  display: flex;
  gap: 6px;
}
.qs-select-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 10px;
  border: 0.5px solid #E8E6E0;
  min-width: 0;
}
.qs-inline-select { flex: 1; font-size: 12px; min-width: 0; }

.qs-date-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  border-radius: 10px;
  border: 0.5px solid #E8E6E0;
  cursor: pointer;
  position: relative;
}
.qs-date-text { font-size: 12px; color: #1a1a18; }

.qs-toggle-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 7px 10px;
  border-radius: 10px;
  border: 0.5px solid #E8E6E0;
}
.qs-toggle-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #888780;
}

.qs-tog {
  width: 28px;
  height: 16px;
  background: #1a1a18;
  border-radius: 8px;
  position: relative;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.2s;
}
.qs-tog-off { background: #D3D1C7; }
.qs-tog-knob {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: white;
  transition: right 0.2s;
}
.qs-tog-off .qs-tog-knob { right: auto; left: 2px; }

// ── Installment ───────────────────────────────────────────────────────────────
.qs-installment {
  background: #F8F7F4;
  border-radius: 10px;
  padding: 10px;
}
.qs-inst-label { font-size: 11px; color: #C8C6BE; margin-bottom: 6px; }
.qs-months-grid {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
  margin-bottom: 6px;
}
.qs-month-btn {
  min-width: 40px;
  padding: 5px 8px;
  border: 0.5px solid #E8E6E0;
  border-radius: 8px;
  font-size: 12px;
  cursor: pointer;
  background: white;
  color: #888780;
}
.qs-month-on {
  background: #1a1a18;
  color: white;
  border-color: #1a1a18;
}
.qs-inst-summary {
  margin-top: 8px;
  background: white;
  border-radius: 8px;
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.qs-inst-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #888780;
}

// ── Confirm ───────────────────────────────────────────────────────────────────
.qs-confirm-wrap { padding: 4px 14px 12px; }
.qs-confirm-btn {
  background: #1a1a18;
  color: #ffffff;
  border-radius: 12px;
  padding: 12px;
  text-align: center;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  user-select: none;
}
</style>
