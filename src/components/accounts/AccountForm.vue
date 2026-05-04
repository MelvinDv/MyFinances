<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)">
    <q-card style="width: 480px; max-width: 95vw; border-radius: 16px">

      <!-- Header sticky -->
      <q-card-section class="sticky-header q-pb-sm">
        <div class="row items-start justify-between">
          <div>
            <div class="text-h6 text-weight-bold">
              {{ isEditing ? $t('account_form.title_edit') : $t('account_form.title_new') }}
            </div>
            <div class="text-caption text-grey-6">
              {{ isEditing ? $t('account_form.subtitle_edit') : $t('account_form.subtitle_new') }}
            </div>
          </div>
          <q-btn icon="close" flat round dense v-close-popup class="q-mt-xs" />
        </div>
      </q-card-section>

      <q-card-section class="q-pt-sm q-gutter-md">

        <!-- Nombre de la Cuenta -->
        <div>
          <div class="form-label">{{ $t('account_form.account_name') }} <span class="text-negative">*</span></div>
          <q-input
            v-model="form.label"
            outlined
            dense
            :placeholder="$t('account_form.account_name_placeholder')"
            hide-bottom-space
          />
        </div>

        <!-- Tipo de Cuenta -->
        <div>
          <div class="form-label">{{ $t('account_form.account_type') }} <span class="text-negative">*</span></div>
          <q-select
            v-model="form.type"
            :options="accountTypes"
            option-value="value"
            option-label="label"
            emit-value
            map-options
            outlined
            dense
            hide-bottom-space
          />
        </div>

        <!-- Campos extra para TDC -->
        <template v-if="form.type === 'tarjeta_credito'">
          <div>
            <div class="form-label">{{ $t('account_form.cut_date') }} <span class="text-negative">*</span></div>
            <q-input
              v-model.number="form.cut_date"
              outlined
              dense
              type="number"
              :placeholder="$t('account_form.cut_date_placeholder')"
              :hint="$t('account_form.cut_date_hint')"
              hide-bottom-space
            />
          </div>
          <div>
            <div class="form-label">{{ $t('account_form.payment_due') }} <span class="text-negative">*</span></div>
            <q-input
              v-model.number="form.payment_due_date"
              outlined
              dense
              type="number"
              :placeholder="$t('account_form.payment_due_placeholder')"
              :hint="$t('account_form.payment_due_hint')"
              hide-bottom-space
            />
          </div>
          <div>
            <div class="form-label">{{ $t('account_form.credit_line') }} <span class="text-negative">*</span></div>
            <q-input
              v-model.number="form.credit_limit"
              outlined
              dense
              type="number"
              prefix="$"
              placeholder="0.00"
              hide-bottom-space
            />
          </div>
        </template>

        <!-- Balance Inicial -->
        <div>
          <div class="form-label">
            {{ form.type === 'tarjeta_credito' ? $t('account_form.initial_balance_credit') : $t('account_form.initial_balance') }}
            <span class="text-negative">*</span>
          </div>
          <q-input
            v-model.number="form.balance"
            outlined
            dense
            type="number"
            prefix="$"
            placeholder="0.00"
            :hint="form.type === 'tarjeta_credito' ? $t('account_form.initial_balance_credit_hint') : $t('account_form.initial_balance_hint')"
            hide-bottom-space
          />
        </div>

        <!-- Color -->
        <div>
          <div class="form-label">{{ $t('account_form.color') }}</div>
          <div class="row q-gutter-sm">
            <button
              v-for="color in colorOptions"
              :key="color"
              class="color-circle"
              :class="{ selected: form.color === color }"
              :style="{ background: color }"
              @click="form.color = color"
            />
          </div>
        </div>

      </q-card-section>

      <!-- Footer sticky -->
      <q-card-actions align="right" class="q-pa-md q-pt-sm sticky-footer">
        <q-btn flat :label="$t('common.cancel')" color="dark" v-close-popup />
        <q-btn
          unelevated
          color="dark"
          :label="isEditing ? $t('account_form.submit_edit') : $t('account_form.submit_new')"
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
import { useAccountsStore } from 'stores/accounts.store'

const props = defineProps({
  modelValue: Boolean,
  account: { type: Object, default: null },
})
const emit = defineEmits(['update:modelValue', 'account-created'])

const { t } = useI18n()
const $q = useQuasar()
const accountsStore = useAccountsStore()

const accountTypes = computed(() => [
  { value: 'tarjeta_debito',  label: t('account_types.tarjeta_debito') },
  { value: 'tarjeta_credito', label: t('account_types.tarjeta_credito') },
  { value: 'efectivo',        label: t('account_types.efectivo') },
  { value: 'otro',            label: t('account_types.otro') },
])

const colorOptions = [
  '#2563eb', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4',
]

const isEditing = computed(() => !!props.account)

const defaultForm = () => ({
  label:            '',
  type:             'tarjeta_debito',
  balance:          null,
  color:            '#2563eb',
  cut_date:         null,
  payment_due_date: null,
  credit_limit:     null,
})

const form = ref(defaultForm())

// Cuando se abre en modo edición, pre-llenar el formulario
watch(() => props.account, (account) => {
  if (account) {
    form.value = {
      label:            account.label,
      type:             account.type,
      balance:          account.balance,
      color:            account.color,
      cut_date:         account.cut_date,
      payment_due_date: account.payment_due_date,
      credit_limit:     account.credit_limit,
    }
  } else {
    form.value = defaultForm()
  }
})

function handleSubmit() {
  if (!form.value.label || !form.value.type || form.value.balance === null) return

  if (isEditing.value) {
    accountsStore.updateAccount(props.account.id, {
      label:            form.value.label,
      name:             form.value.label,
      type:             form.value.type,
      balance:          form.value.balance,
      color:            form.value.color,
      cut_date:         form.value.cut_date,
      payment_due_date: form.value.payment_due_date,
      credit_limit:     form.value.credit_limit,
    })
    $q.notify({ message: t('notify.account_updated'), color: 'positive', icon: 'check_circle', position: 'bottom', timeout: 2500 })
  } else {
    accountsStore.addAccount({
      label:            form.value.label,
      name:             form.value.label,
      type:             form.value.type,
      balance:          form.value.balance,
      color:            form.value.color,
      cut_date:         form.value.cut_date,
      payment_due_date: form.value.payment_due_date,
      credit_limit:     form.value.credit_limit,
    })
    $q.notify({ message: t('notify.account_added'), color: 'positive', icon: 'check_circle', position: 'bottom', timeout: 2500 })
    emit('account-created')
  }

  form.value = defaultForm()
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

.color-circle {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 3px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
  padding: 0;
  outline: none;

  &.selected {
    border-color: #111;
    box-shadow: 0 0 0 2px white inset;
  }

  &:hover:not(.selected) {
    transform: scale(1.1);
  }
}
</style>
