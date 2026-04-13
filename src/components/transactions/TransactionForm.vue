<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)">
    <q-card style="width: 480px; max-width: 95vw; border-radius: 16px">

      <!-- Header -->
      <q-card-section class="q-pb-xs sticky-header">
        <div class="row items-start justify-between">
          <div>
            <div class="text-h6 text-weight-bold">Nueva Transacción</div>
            <div class="text-caption text-grey-6">Agrega un nuevo ingreso o gasto a tu registro</div>
          </div>
          <q-btn icon="close" flat round dense v-close-popup class="q-mt-xs" />
        </div>
      </q-card-section>

      <q-card-section class="q-pt-sm q-gutter-md">

        <!-- Tipo -->
        <div>
          <div class="form-label">Tipo</div>
          <div class="type-toggle">
            <button
              class="type-btn"
              :class="{ active: form.type === 'gasto' }"
              @click="form.type = 'gasto'"
            >
              Gasto
            </button>
            <button
              class="type-btn"
              :class="{ active: form.type === 'ingreso' }"
              @click="form.type = 'ingreso'"
            >
              Ingreso
            </button>
          </div>
        </div>

        <!-- Monto -->
        <div>
          <div class="form-label">Monto <span class="text-negative">*</span></div>
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

        <!-- Categoría -->
        <div>
          <div class="form-label">Categoría <span class="text-negative">*</span></div>
          <q-select
            v-model="form.category"
            :options="categories"
            outlined
            dense
            hide-bottom-space
          />
        </div>

        <!-- Método de Pago -->
        <div>
          <div class="form-label">Método de Pago <span class="text-negative">*</span></div>
          <q-select
            v-model="form.account"
            :options="accountOptions"
            option-label="label"
            outlined
            dense
            hide-bottom-space
          />
        </div>

        <!-- Fecha -->
        <div>
          <div class="form-label">Fecha <span class="text-negative">*</span></div>
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
          <div class="form-label">Descripción <span class="text-grey-5">(opcional)</span></div>
          <q-input
            v-model="form.description"
            type="textarea"
            outlined
            dense
            placeholder="Detalles de la transacción..."
            rows="3"
            hide-bottom-space
          />
        </div>

      </q-card-section>

      <!-- Acciones -->
      <q-card-actions align="right" class="q-pa-md q-pt-sm sticky-footer">
        <q-btn flat label="Cancelar" color="dark" v-close-popup />
        <q-btn unelevated color="dark" label="Agregar Transacción" @click="handleSubmit" />
      </q-card-actions>

    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useTransactionsStore } from 'stores/transactions.store'
import { useAccountsStore } from 'stores/accounts.store'
import { useSettingsStore } from 'stores/settings.store'

defineProps({ modelValue: Boolean })
const emit = defineEmits(['update:modelValue'])

const transactionsStore = useTransactionsStore()
const accountsStore = useAccountsStore()
const settingsStore = useSettingsStore()

const typeLabels = {
  tarjeta_debito:  'Tarjeta de Débito',
  tarjeta_credito: 'Tarjeta de Crédito',
  efectivo:        'Efectivo',
  otro:            'Otro',
}

const categories = computed(() => settingsStore.categories.map(c => c.name))

const accountOptions = computed(() =>
  accountsStore.accounts.map(a => ({
    ...a,
    label: `${typeLabels[a.type]} (${a.name})`,
  }))
)

const defaultForm = () => ({
  type: 'gasto',
  amount: null,
  description: '',
  category: 'Otros',
  account: accountOptions.value[0] ?? null,
  date: new Date().toISOString().split('T')[0],
})

const form = ref(defaultForm())

function formatDateDisplay(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-MX', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function handleSubmit() {
  if (!form.value.amount || !form.value.category || !form.value.account) return

  transactionsStore.addTransaction({
    type:         form.value.type,
    amount:       form.value.amount,
    description:  form.value.description,
    category:     form.value.category,
    account_id:   form.value.account.id,
    account_name: form.value.account.name,
    date:         form.value.date,
  })

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
</style>
