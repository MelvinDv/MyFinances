<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)">
    <q-card style="width: 420px; max-width: 95vw; border-radius: 16px">

      <q-card-section class="sticky-header q-pb-sm">
        <div class="row items-start justify-between">
          <div class="text-h6 text-weight-bold">{{ $t('recurring.edit_title') }}</div>
          <q-btn icon="close" flat round dense v-close-popup class="q-mt-xs" />
        </div>
      </q-card-section>

      <q-card-section class="q-pt-sm q-gutter-md">

        <!-- Monto -->
        <div>
          <div class="form-label">{{ $t('recurring.amount') }} <span class="text-negative">*</span></div>
          <q-input
            v-model.number="form.amount"
            type="number"
            outlined
            dense
            prefix="$"
            hide-bottom-space
          />
        </div>

        <!-- Categoría -->
        <div>
          <div class="form-label">{{ $t('recurring.category') }} <span class="text-negative">*</span></div>
          <q-select
            v-model="form.category"
            :options="categories"
            outlined
            dense
            hide-bottom-space
          />
        </div>

        <!-- Cuenta -->
        <div>
          <div class="form-label">{{ $t('recurring.account') }} <span class="text-negative">*</span></div>
          <q-select
            v-model="form.account"
            :options="accountOptions"
            option-label="label"
            outlined
            dense
            hide-bottom-space
          />
        </div>

        <!-- Descripción -->
        <div>
          <div class="form-label">{{ $t('recurring.description') }}</div>
          <q-input
            v-model="form.description"
            outlined
            dense
            hide-bottom-space
          />
        </div>

        <!-- Día del mes -->
        <div>
          <div class="form-label">{{ $t('recurring.day_of_month') }} <span class="text-negative">*</span></div>
          <q-input
            v-model.number="form.day_of_month"
            type="number"
            outlined
            dense
            hide-bottom-space
          />
          <div class="text-caption text-grey-6 q-mt-xs">{{ $t('recurring.day_hint') }}</div>
        </div>

      </q-card-section>

      <q-card-actions align="right" class="q-pa-md q-pt-sm">
        <q-btn flat :label="$t('common.cancel')" color="dark" v-close-popup />
        <q-btn unelevated color="dark" :label="$t('common.save')" :disable="!canSubmit" @click="handleSave" />
      </q-card-actions>

    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRecurringStore } from 'stores/recurring_transactions.store'
import { useSettingsStore } from 'stores/settings.store'
import { useAccountsStore } from 'stores/accounts.store'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  recurring:  { type: Object,  default: null },
})
const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()
const recurringStore  = useRecurringStore()
const settingsStore   = useSettingsStore()
const accountsStore   = useAccountsStore()

const categories = computed(() => settingsStore.categories.map(c => c.name))

const accountOptions = computed(() =>
  accountsStore.accounts.map(a => ({
    ...a,
    label: `${t(`account_types.${a.type}`)} (${a.label ?? a.name})`,
  }))
)

const defaultForm = () => ({
  amount:       null,
  category:     null,
  account:      null,
  description:  '',
  day_of_month: null,
})

const form = ref(defaultForm())

watch(() => props.modelValue, (open) => {
  if (!open || !props.recurring) return
  const r = props.recurring
  form.value = {
    amount:       r.amount,
    category:     r.category,
    account:      accountOptions.value.find(a => a.id === r.account_id) ?? null,
    description:  r.description ?? '',
    day_of_month: r.day_of_month,
  }
})

const canSubmit = computed(() =>
  form.value.amount > 0 &&
  form.value.category &&
  form.value.account &&
  form.value.day_of_month >= 1 &&
  form.value.day_of_month <= 28
)

async function handleSave() {
  if (!canSubmit.value) return
  await recurringStore.updateRecurring(props.recurring.id, {
    amount:       form.value.amount,
    category:     form.value.category,
    account_id:   form.value.account.id,
    account_name: form.value.account.name ?? form.value.account.label,
    description:  form.value.description,
    day_of_month: form.value.day_of_month,
  })
  emit('update:modelValue', false)
}
</script>

<style scoped>
.sticky-header {
  position: sticky;
  top: 0;
  z-index: 1;
  background: white;
  border-bottom: 1px solid #f0f0f0;
}

.form-label {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 6px;
  color: #111;
}
</style>
