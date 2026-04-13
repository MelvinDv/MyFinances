<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)">
    <q-card style="width: 480px; max-width: 95vw; border-radius: 16px">

      <!-- Header sticky -->
      <q-card-section class="sticky-header q-pb-sm">
        <div class="row items-start justify-between">
          <div>
            <div class="text-h6 text-weight-bold">{{ isEditing ? 'Modificar Cuenta' : 'Nueva Cuenta' }}</div>
            <div class="text-caption text-grey-6">{{ isEditing ? 'Actualiza los datos de tu cuenta' : 'Agrega una nueva cuenta para administrar tu dinero' }}</div>
          </div>
          <q-btn icon="close" flat round dense v-close-popup class="q-mt-xs" />
        </div>
      </q-card-section>

      <q-card-section class="q-pt-sm q-gutter-md">

        <!-- Nombre de la Cuenta -->
        <div>
          <div class="form-label">Nombre de la Cuenta <span class="text-negative">*</span></div>
          <q-input
            v-model="form.label"
            outlined
            dense
            placeholder="Ej: Cuenta Bancaria Principal"
            hide-bottom-space
          />
        </div>

        <!-- Tipo de Cuenta -->
        <div>
          <div class="form-label">Tipo de Cuenta <span class="text-negative">*</span></div>
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
            <div class="form-label">Día de corte <span class="text-negative">*</span></div>
            <q-input
              v-model.number="form.cut_date"
              outlined
              dense
              type="number"
              placeholder="Ej: 15"
              hint="Día del mes en que se genera tu estado de cuenta"
              hide-bottom-space
            />
          </div>
          <div>
            <div class="form-label">Último día de pago <span class="text-negative">*</span></div>
            <q-input
              v-model.number="form.payment_due_date"
              outlined
              dense
              type="number"
              placeholder="Ej: 5"
              hint="Día del mes límite para pagar sin intereses"
              hide-bottom-space
            />
          </div>
          <div>
            <div class="form-label">Crédito máximo <span class="text-negative">*</span></div>
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
          <div class="form-label">Balance Inicial <span class="text-negative">*</span></div>
          <q-input
            v-model.number="form.balance"
            outlined
            dense
            type="number"
            prefix="$"
            placeholder="0.00"
            hint="Este es el saldo que tenías cuando empezaste a usar la aplicación"
            hide-bottom-space
          />
        </div>

        <!-- Color -->
        <div>
          <div class="form-label">Color</div>
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
        <q-btn flat label="Cancelar" color="dark" v-close-popup />
        <q-btn unelevated color="dark" :label="isEditing ? 'Guardar Cambios' : 'Agregar Cuenta'" @click="handleSubmit" />
      </q-card-actions>

    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useAccountsStore } from 'stores/accounts.store'

const props = defineProps({
  modelValue: Boolean,
  account: { type: Object, default: null },
})
const emit = defineEmits(['update:modelValue'])

const accountsStore = useAccountsStore()

const accountTypes = [
  { value: 'tarjeta_debito',  label: 'Tarjeta de Débito' },
  { value: 'tarjeta_credito', label: 'Tarjeta de Crédito' },
  { value: 'efectivo',        label: 'Efectivo' },
  { value: 'otro',            label: 'Otro' },
]

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
