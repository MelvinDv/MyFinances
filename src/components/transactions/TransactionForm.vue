<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)">
    <q-card style="width: 480px; max-width: 95vw; border-radius: 16px">

      <!-- Header -->
      <q-card-section class="q-pb-xs sticky-header">
        <div class="row items-start justify-between">
          <div>
            <div class="text-h6 text-weight-bold">
              {{ isEditMode ? $t('transaction_form.title_edit') : $t('transaction_form.title_new') }}
            </div>
            <div class="text-caption text-grey-6">{{ $t('transaction_form.subtitle') }}</div>
          </div>
          <q-btn icon="close" flat round dense v-close-popup class="q-mt-xs" />
        </div>
      </q-card-section>

      <q-card-section class="q-pt-sm q-gutter-md">

        <!-- Tipo -->
        <div>
          <div class="form-label">{{ $t('transaction_form.type') }}</div>
          <div class="type-toggle">
            <button
              class="type-btn"
              :class="{ active: form.type === 'gasto' }"
              :disabled="isEditMode"
              @click="!isEditMode && (form.type = 'gasto')"
            >
              {{ $t('transaction_form.expense') }}
            </button>
            <button
              class="type-btn"
              :class="{ active: form.type === 'ingreso' }"
              :disabled="isEditMode"
              @click="!isEditMode && (form.type = 'ingreso')"
            >
              {{ $t('transaction_form.income') }}
            </button>
            <button
              class="type-btn"
              :class="{ active: form.type === 'transferencia' }"
              :disabled="isEditMode"
              @click="!isEditMode && (form.type = 'transferencia')"
            >
              {{ $t('transaction_form.transfer') }}
            </button>
          </div>
        </div>

        <!-- Monto -->
        <div>
          <div class="form-label">{{ $t('transaction_form.amount') }} <span class="text-negative">*</span></div>
          <q-input
            v-model.number="form.amount"
            type="number"
            outlined
            dense
            placeholder="0.00"
            prefix="$"
            hide-bottom-space
          />
        </div>

        <!-- Categoría (oculta en transferencias) -->
        <div v-if="!isTransfer">
          <div class="form-label">{{ $t('transaction_form.category') }} <span class="text-negative">*</span></div>
          <q-select
            v-model="form.category"
            :options="categories"
            outlined
            dense
            hide-bottom-space
          />
        </div>

        <!-- Cuenta (gasto / ingreso) -->
        <div v-if="!isTransfer">
          <div class="form-label">{{ $t('transaction_form.payment_method') }} <span class="text-negative">*</span></div>
          <q-select
            v-model="form.account"
            :options="accountOptions"
            option-label="label"
            outlined
            dense
            hide-bottom-space
          />
        </div>

        <!-- Cuentas (transferencia) -->
        <template v-if="isTransfer">
          <div>
            <div class="form-label">{{ $t('transaction_form.from_account') }} <span class="text-negative">*</span></div>
            <q-select
              v-model="form.fromAccount"
              :options="accountOptions"
              option-label="label"
              outlined
              dense
              hide-bottom-space
            />
          </div>
          <div>
            <div class="form-label">{{ $t('transaction_form.to_account') }} <span class="text-negative">*</span></div>
            <q-select
              v-model="form.toAccount"
              :options="toAccountOptions"
              option-label="label"
              outlined
              dense
              hide-bottom-space
            />
          </div>
        </template>

        <!-- Gasto recurrente (solo gasto, no cuotas, no edición) -->
        <div v-if="form.type === 'gasto' && !isEditMode" class="installment-wrapper">
          <div class="row items-center no-wrap">
            <q-toggle
              v-model="form.recurring"
              :label="$t('recurring.toggle_label')"
              color="dark"
              dense
            />
            <q-icon
              name="help_outline"
              size="16px"
              color="grey-5"
              class="q-ml-xs cursor-pointer"
            >
              <q-tooltip max-width="220px" anchor="top middle" self="bottom middle">
                {{ $t('recurring.tooltip') }}
              </q-tooltip>
            </q-icon>
          </div>
        </div>

        <!-- Sección de meses (solo TDC + gasto + no recurrente) -->
        <div v-if="isCredit && form.type === 'gasto' && !form.recurring && !isEditMode" class="installment-wrapper">
          <q-toggle
            v-model="form.installment.enabled"
            :label="$t('installments.toggle_label')"
            color="dark"
            dense
          />

          <div v-if="form.installment.enabled" class="installment-body q-mt-sm q-gutter-md">

            <!-- Número de meses -->
            <div>
              <div class="form-label">{{ $t('installments.months_label') }}</div>
              <div class="months-grid">
                <button
                  v-for="m in monthOptions"
                  :key="m"
                  class="month-btn"
                  :class="{ active: form.installment.months === m }"
                  @click="form.installment.months = m"
                >
                  {{ m }}
                </button>
              </div>
            </div>

            <!-- MSI vs Con intereses -->
            <div>
              <div class="form-label">{{ $t('installments.type_label') }}</div>
              <div class="type-toggle">
                <button
                  class="type-btn"
                  :class="{ active: form.installment.type === 'msi' }"
                  @click="form.installment.type = 'msi'"
                >
                  {{ $t('installments.type_msi') }}
                </button>
                <button
                  class="type-btn"
                  :class="{ active: form.installment.type === 'interes' }"
                  @click="form.installment.type = 'interes'"
                >
                  {{ $t('installments.type_interest') }}
                </button>
              </div>
            </div>

            <!-- Opciones de interés -->
            <template v-if="form.installment.type === 'interes'">
              <div>
                <div class="form-label">{{ $t('installments.calc_mode_label') }}</div>
                <div class="type-toggle">
                  <button
                    class="type-btn"
                    :class="{ active: form.installment.calcMode === 'mensual' }"
                    @click="form.installment.calcMode = 'mensual'"
                  >
                    {{ $t('installments.calc_mode_monthly') }}
                  </button>
                  <button
                    class="type-btn"
                    :class="{ active: form.installment.calcMode === 'tasa' }"
                    @click="form.installment.calcMode = 'tasa'"
                  >
                    {{ $t('installments.calc_mode_rate') }}
                  </button>
                </div>
              </div>

              <div v-if="form.installment.calcMode === 'mensual'">
                <div class="form-label">
                  {{ $t('installments.monthly_payment_label') }} <span class="text-negative">*</span>
                </div>
                <q-input
                  v-model.number="form.installment.monthlyPayment"
                  type="number"
                  outlined
                  dense
                  prefix="$"
                  :placeholder="$t('installments.monthly_payment_placeholder')"
                  hide-bottom-space
                />
              </div>

              <div v-else>
                <div class="form-label">
                  {{ $t('installments.annual_rate_label') }} <span class="text-negative">*</span>
                </div>
                <q-input
                  v-model.number="form.installment.annualRate"
                  type="number"
                  outlined
                  dense
                  suffix="%"
                  :placeholder="$t('installments.annual_rate_placeholder')"
                  hide-bottom-space
                />
              </div>
            </template>

            <!-- Resumen calculado -->
            <div v-if="installmentSummary" class="installment-summary">
              <div class="summary-row">
                <span>{{ $t('installments.summary_monthly') }}</span>
                <span class="summary-value">{{ formatCurrency(installmentSummary.monthly) }}</span>
              </div>
              <div class="summary-row">
                <span>{{ $t('installments.summary_total') }}</span>
                <span class="summary-value text-weight-bold">{{ formatCurrency(installmentSummary.total) }}</span>
              </div>
              <div class="summary-row">
                <span>{{ $t('installments.summary_interest') }}</span>
                <span
                  class="summary-value"
                  :class="installmentSummary.interest > 0 ? 'text-negative' : 'text-positive'"
                >
                  {{ installmentSummary.interest > 0
                    ? '+' + formatCurrency(installmentSummary.interest)
                    : $t('installments.summary_no_interest') }}
                </span>
              </div>
            </div>

          </div>
        </div>

        <!-- Fecha -->
        <div>
          <div class="form-label">{{ $t('transaction_form.date') }} <span class="text-negative">*</span></div>
          <q-input
            v-model="form.date"
            outlined
            dense
            hide-bottom-space
            readonly
          >
            <template #prepend>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                  <q-date v-model="form.date" mask="YYYY-MM-DD" minimal>
                    <div class="row items-center justify-end">
                      <q-btn v-close-popup label="OK" color="dark" flat />
                    </div>
                  </q-date>
                </q-popup-proxy>
              </q-icon>
            </template>
            <template #default>
              {{ formatDateDisplay(form.date) }}
            </template>
          </q-input>
        </div>

        <!-- Descripción -->
        <div>
          <div class="form-label">
            {{ $t('transaction_form.description') }}
            <span class="text-grey-5">{{ $t('transaction_form.description_optional') }}</span>
          </div>
          <q-input
            v-model="form.description"
            type="textarea"
            outlined
            dense
            :placeholder="$t('transaction_form.description_placeholder')"
            rows="3"
            hide-bottom-space
          />
        </div>

      </q-card-section>

      <!-- Acciones -->
      <q-card-actions align="right" class="q-pa-md q-pt-sm sticky-footer">
        <q-btn flat :label="$t('common.cancel')" color="dark" v-close-popup />
        <q-btn
          unelevated
          color="dark"
          :label="isEditMode ? $t('common.save') : isTransfer ? $t('transaction_form.submit_transfer') : $t('transaction_form.submit')"
          @click="handleSubmit"
        />
      </q-card-actions>

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

const categories = computed(() => settingsStore.categories.map(c => c.name))

const accountOptions = computed(() =>
  accountsStore.accounts.map(a => ({
    ...a,
    label: `${t(`account_types.${a.type}`)} (${a.label ?? a.name})`,
  }))
)

// Opciones de destino: excluye la cuenta origen seleccionada
const toAccountOptions = computed(() =>
  accountOptions.value.filter(a => a.id !== form.value.fromAccount?.id)
)

const monthOptions = [3, 6, 9, 12, 18, 24]

const defaultInstallment = () => ({
  enabled:        false,
  months:         12,
  type:           'msi',
  calcMode:       'mensual',
  annualRate:     null,
  monthlyPayment: null,
})

const defaultForm = () => ({
  type:        'gasto',
  amount:      null,
  description: '',
  category:    'Otros',
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
      ...defaultForm(),
      type:        'transferencia',
      amount:      tx.amount,
      date:        tx.date,
      description: tx.description ?? '',
      fromAccount: accountOptions.value.find(a => a.id === tx.account_id) ?? null,
      toAccount:   accountOptions.value.find(a => a.id === tx.destination_account_id) ?? null,
    }
  }

  return {
    ...defaultForm(),
    type:        tx.type,
    amount:      tx.amount,
    date:        tx.date,
    description: tx.description ?? '',
    category:    tx.category,
    account:     accountOptions.value.find(a => a.id === tx.account_id) ?? null,
  }
}

const form = ref(defaultForm())

// Pre-llenar al abrir en modo edición
watch(() => props.modelValue, (open) => {
  if (open) form.value = formFromTransaction(props.transaction)
})

const isTransfer = computed(() => form.value.type === 'transferencia')
const isCredit   = computed(() => form.value.account?.type === 'tarjeta_credito')

// Si cambia la cuenta origen y coincide con destino, limpiar destino
watch(() => form.value.fromAccount, (from) => {
  if (form.value.toAccount?.id === from?.id) {
    form.value.toAccount = toAccountOptions.value[0] ?? null
  }
})

// Resetear installment si cambia cuenta a no-crédito o tipo cambia
watch(() => form.value.account, (account) => {
  if (account?.type !== 'tarjeta_credito') {
    form.value.installment = defaultInstallment()
  }
})
watch(() => form.value.type, (type) => {
  if (type !== 'gasto') {
    form.value.installment = defaultInstallment()
  }
})

const installmentSummary = computed(() => {
  const amount = form.value.amount
  const { months, type, calcMode, annualRate, monthlyPayment } = form.value.installment

  if (!amount || amount <= 0 || !months) return null

  if (type === 'msi') {
    return { monthly: amount / months, total: amount, interest: 0 }
  }

  if (calcMode === 'tasa') {
    const r = (annualRate || 0) / 100 / 12
    const monthly = r > 0
      ? amount * r / (1 - Math.pow(1 + r, -months))
      : amount / months
    const total = monthly * months
    return { monthly, total, interest: total - amount }
  }

  const monthly = monthlyPayment || 0
  if (monthly <= 0) return { monthly: 0, total: 0, interest: 0 }
  return { monthly, total: monthly * months, interest: monthly * months - amount }
})

function formatDateDisplay(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-MX', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

async function handleSubmit() {
  if (!form.value.amount || form.value.amount <= 0) return

  if (isEditMode.value) {
    await handleUpdate()
    return
  }

  if (isTransfer.value) {
    if (!form.value.fromAccount || !form.value.toAccount) return
    if (form.value.fromAccount.id === form.value.toAccount.id) return

    transactionsStore.addTransfer({
      fromAccount: form.value.fromAccount,
      toAccount:   form.value.toAccount,
      amount:      form.value.amount,
      date:        form.value.date,
      description: form.value.description,
    })
    $q.notify({ message: t('notify.transfer_added'), color: 'positive', icon: 'check_circle', position: 'bottom', timeout: 2500 })
  } else {
    if (!form.value.category || !form.value.account) return

    if (form.value.recurring) {
      const dayOfMonth = new Date(form.value.date + 'T00:00:00').getDate()
      await recurringStore.addRecurring(
        {
          type:         form.value.type,
          amount:       form.value.amount,
          category:     form.value.category,
          account_id:   form.value.account.id,
          account_name: form.value.account.name,
          description:  form.value.description,
          day_of_month: dayOfMonth,
        },
        {
          type:         form.value.type,
          amount:       form.value.amount,
          description:  form.value.description,
          category:     form.value.category,
          account_id:   form.value.account.id,
          account_name: form.value.account.name,
          date:         form.value.date,
        },
      )
      $q.notify({ message: t('notify.recurring_added'), color: 'positive', icon: 'check_circle', position: 'bottom', timeout: 2500 })
      form.value = defaultForm()
      emit('update:modelValue', false)
      return
    }

    const isInstallment = form.value.installment.enabled && isCredit.value

    if (isInstallment) {
      const summary = installmentSummary.value
      if (!summary || summary.monthly <= 0) return
      if (form.value.installment.type === 'interes') {
        if (form.value.installment.calcMode === 'mensual' && !form.value.installment.monthlyPayment) return
        if (form.value.installment.calcMode === 'tasa'    && !form.value.installment.annualRate) return
      }

      transactionsStore.addInstallmentPlan({
        plan: {
          account_id:      form.value.account.id,
          account_name:    form.value.account.name,
          description:     form.value.description,
          category:        form.value.category,
          original_amount: form.value.amount,
          total_amount:    summary.total,
          months:          form.value.installment.months,
          monthly_payment: summary.monthly,
          interest_rate:   form.value.installment.type === 'msi' ? 0 : (form.value.installment.annualRate || 0),
          start_date:      form.value.date,
        },
        paymentDueDay: form.value.account.payment_due_date,
      })
      $q.notify({ message: t('notify.installment_added'), color: 'positive', icon: 'check_circle', position: 'bottom', timeout: 2500 })
    } else {
      transactionsStore.addTransaction({
        type:         form.value.type,
        amount:       form.value.amount,
        description:  form.value.description,
        category:     form.value.category,
        account_id:   form.value.account.id,
        account_name: form.value.account.name,
        date:         form.value.date,
      })
      $q.notify({ message: t('notify.transaction_added'), color: 'positive', icon: 'check_circle', position: 'bottom', timeout: 2500 })
    }
  }

  form.value = defaultForm()
  emit('update:modelValue', false)
}

async function handleUpdate() {
  const tx = props.transaction
  let updates

  if (isTransfer.value) {
    if (!form.value.fromAccount || !form.value.toAccount) return
    updates = {
      amount:                   form.value.amount,
      date:                     form.value.date,
      description:              form.value.description,
      account_id:               form.value.fromAccount.id,
      account_name:             form.value.fromAccount.name ?? form.value.fromAccount.label,
      destination_account_id:   form.value.toAccount.id,
      destination_account_name: form.value.toAccount.name ?? form.value.toAccount.label,
    }
  } else {
    if (!form.value.category || !form.value.account) return
    updates = {
      amount:       form.value.amount,
      date:         form.value.date,
      description:  form.value.description,
      category:     form.value.category,
      account_id:   form.value.account.id,
      account_name: form.value.account.name ?? form.value.account.label,
    }
  }

  await transactionsStore.updateTransaction(tx.id, updates, tx)
  $q.notify({ message: t('notify.transaction_updated'), color: 'positive', icon: 'check_circle', position: 'bottom', timeout: 2500 })
  emit('update:modelValue', false)
}
</script>

<style scoped lang="scss">
.sticky-header {
  position: sticky;
  top: 0;
  z-index: 1;
  background: white;
  border-bottom: 1px solid #f0f0f0;
}

.sticky-footer {
  position: sticky;
  bottom: 0;
  z-index: 1;
  background: white;
  border-top: 1px solid #f0f0f0;
}

.form-label {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 6px;
  color: #111;
}

.type-toggle {
  display: flex;
  background: #f0f0f0;
  border-radius: 8px;
  padding: 4px;
  gap: 4px;
}

.type-btn {
  flex: 1;
  padding: 8px 0;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  background: transparent;
  color: #666;
  transition: all 0.2s;

  &.active {
    background: white;
    color: #111;
    font-weight: 600;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
  }
}

.installment-wrapper {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 12px 14px;
}

.months-grid {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.month-btn {
  min-width: 48px;
  padding: 7px 10px;
  border: 1.5px solid #e0e0e0;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  background: white;
  color: #555;
  transition: all 0.15s;

  &.active {
    background: #111;
    color: white;
    border-color: #111;
  }

  &:hover:not(.active) {
    border-color: #999;
    color: #111;
  }
}

.installment-summary {
  background: white;
  border-radius: 10px;
  border: 1px solid #e8e8e8;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: #444;
}

.summary-value {
  font-weight: 600;
  color: #111;
}
</style>
