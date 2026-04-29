<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)">
    <q-card style="width: 420px; max-width: 95vw; border-radius: 16px">

      <!-- Header -->
      <q-card-section class="sticky-header q-pb-sm">
        <div class="row items-start justify-between">
          <div>
            <div class="text-h6 text-weight-bold">{{ $t('credit_payment.title') }}</div>
            <div class="text-caption text-grey-6">{{ account?.label }}</div>
          </div>
          <q-btn icon="close" flat round dense v-close-popup class="q-mt-xs" />
        </div>
      </q-card-section>

      <q-card-section class="q-pt-sm q-gutter-md">

        <!-- Monto -->
        <div>
          <div class="form-label">
            {{ $t('credit_payment.amount') }} <span class="text-negative">*</span>
          </div>
          <q-input
            v-model.number="form.amount"
            type="number"
            outlined
            dense
            placeholder="0.00"
            prefix="$"
            hide-bottom-space
          />
          <div v-if="suggestedAmount" class="text-caption text-grey-6 q-mt-xs">
            {{ $t('credit_payment.suggested') }}:
            <span
              class="text-weight-medium cursor-pointer text-primary"
              @click="form.amount = suggestedAmount"
            >
              {{ formatCurrency(suggestedAmount) }}
            </span>
          </div>
        </div>

        <!-- Cuenta origen -->
        <div>
          <div class="form-label">
            {{ $t('credit_payment.from_account') }} <span class="text-negative">*</span>
          </div>
          <q-select
            v-model="form.fromAccount"
            :options="sourceAccountOptions"
            option-label="label"
            outlined
            dense
            hide-bottom-space
          />
        </div>

        <!-- Fecha -->
        <div>
          <div class="form-label">{{ $t('credit_payment.date') }} <span class="text-negative">*</span></div>
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

      </q-card-section>

      <!-- Acciones -->
      <q-card-actions align="right" class="q-pa-md q-pt-sm sticky-footer">
        <q-btn flat :label="$t('common.cancel')" color="dark" v-close-popup />
        <q-btn
          unelevated
          color="dark"
          icon="credit_score"
          :label="$t('credit_payment.submit')"
          :disable="!canSubmit"
          @click="handleSubmit"
        />
      </q-card-actions>

    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTransactionsStore } from 'stores/transactions.store'
import { useAccountsStore } from 'stores/accounts.store'
import { useCurrency } from 'src/composables/useCurrency'

const props = defineProps({
  modelValue:      { type: Boolean, default: false },
  account:         { type: Object,  default: null },
  suggestedAmount: { type: Number,  default: null },
})
const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()
const { formatCurrency } = useCurrency()
const transactionsStore = useTransactionsStore()
const accountsStore = useAccountsStore()

// Cuentas disponibles para pagar desde (excluye la TDC actual y otras TDCs)
const sourceAccountOptions = computed(() =>
  accountsStore.accounts
    .filter(a => a.id !== props.account?.id && a.type !== 'tarjeta_credito')
    .map(a => ({
      ...a,
      label: `${t(`account_types.${a.type}`)} (${a.label ?? a.name})`,
    }))
)

const defaultForm = () => ({
  amount:      props.suggestedAmount ?? null,
  fromAccount: sourceAccountOptions.value[0] ?? null,
  date:        new Date().toISOString().split('T')[0],
})

const form = ref(defaultForm())

// Re-inicializar al abrir el diálogo
watch(() => props.modelValue, (open) => {
  if (open) form.value = defaultForm()
})

const canSubmit = computed(() =>
  form.value.amount > 0 && form.value.fromAccount && form.value.date
)

function formatDateDisplay(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-MX', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

async function handleSubmit() {
  if (!canSubmit.value) return

  await transactionsStore.payCreditCard({
    creditAccount: props.account,
    fromAccount:   form.value.fromAccount,
    amount:        form.value.amount,
    date:          form.value.date,
  })

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
</style>
