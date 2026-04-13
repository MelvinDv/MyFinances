<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" @hide="resetForm">
    <q-card style="width: 480px; max-width: 95vw; border-radius: 16px">

      <!-- Header -->
      <q-card-section class="q-pb-xs">
        <div class="row items-start justify-between">
          <div>
            <div class="text-h6 text-weight-bold">{{ category ? 'Editar Categoría' : 'Nueva Categoría' }}</div>
            <div class="text-caption text-grey-6">{{ category ? 'Modifica los datos de la categoría' : 'Agrega una nueva categoría para clasificar tus transacciones' }}</div>
          </div>
          <q-btn icon="close" flat round dense v-close-popup class="q-mt-xs" />
        </div>
      </q-card-section>

      <q-card-section class="q-pt-sm q-gutter-md">

        <!-- Nombre -->
        <div>
          <div class="form-label">Nombre <span class="text-negative">*</span></div>
          <q-input
            v-model="form.name"
            outlined
            dense
            placeholder="Ej: Viajes, Mascotas, Suscripciones"
            hide-bottom-space
          />
        </div>

        <!-- Ícono -->
        <div>
          <div class="form-label">Ícono <span class="text-negative">*</span></div>
          <q-select
            v-model="form.icon"
            :options="iconOptions"
            option-value="value"
            option-label="label"
            emit-value
            map-options
            outlined
            dense
            hide-bottom-space
          >
            <template #selected-item="{ opt }">
              <div class="row items-center q-gutter-sm">
                <q-icon :name="opt.value" size="18px" />
                <span>{{ opt.label }}</span>
              </div>
            </template>
            <template #option="{ itemProps, opt }">
              <q-item v-bind="itemProps">
                <q-item-section avatar>
                  <q-icon :name="opt.value" size="20px" />
                </q-item-section>
                <q-item-section>{{ opt.label }}</q-item-section>
              </q-item>
            </template>
          </q-select>
        </div>

        <!-- Color -->
        <div>
          <div class="form-label">Color <span class="text-negative">*</span></div>
          <div class="color-grid">
            <button
              v-for="color in colorOptions"
              :key="color"
              class="color-swatch"
              :style="{ backgroundColor: color }"
              @click="form.color = color"
            >
              <q-icon v-if="form.color === color" name="check" color="white" size="16px" />
            </button>
          </div>
        </div>

        <!-- Vista Previa -->
        <q-card flat class="preview-card">
          <q-card-section class="row items-center q-gutter-md q-py-sm q-px-md">
            <div
              class="preview-icon"
              :style="{ backgroundColor: form.color }"
            >
              <q-icon :name="form.icon" color="white" size="20px" />
            </div>
            <div>
              <div class="text-body2 text-weight-bold">Vista Previa</div>
              <div class="text-caption text-grey-6">{{ form.name || 'Nombre de categoría' }}</div>
            </div>
          </q-card-section>
        </q-card>

      </q-card-section>

      <!-- Acciones -->
      <q-card-actions align="right" class="q-pa-md q-pt-sm">
        <q-btn flat label="Cancelar" color="dark" v-close-popup />
        <q-btn unelevated color="dark" :label="category ? 'Guardar Cambios' : 'Agregar Categoría'" @click="handleSubmit" />
      </q-card-actions>

    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useSettingsStore } from 'src/stores/settings.store'

const props = defineProps({
  modelValue: Boolean,
  category: { type: Object, default: null },
})
const emit = defineEmits(['update:modelValue'])

const settingsStore = useSettingsStore()

const colorOptions = [
  '#0d9488', '#16a34a', '#ea580c', '#dc2626', '#7c3aed',
  '#db2777', '#0891b2', '#d97706', '#65a30d', '#475569',
]

const iconOptions = [
  { label: 'MoreHorizontal',  value: 'more_horiz' },
  { label: 'Home',            value: 'home' },
  { label: 'Restaurant',      value: 'restaurant' },
  { label: 'DirectionsCar',   value: 'directions_car' },
  { label: 'AccountBalance',  value: 'account_balance' },
  { label: 'SportsEsports',   value: 'sports_esports' },
  { label: 'Favorite',        value: 'favorite' },
  { label: 'School',          value: 'school' },
  { label: 'Build',           value: 'build' },
  { label: 'ShoppingCart',    value: 'shopping_cart' },
  { label: 'LocalCafe',       value: 'local_cafe' },
  { label: 'Flight',          value: 'flight' },
  { label: 'Hotel',           value: 'hotel' },
  { label: 'MedicalServices', value: 'medical_services' },
  { label: 'FitnessCenter',   value: 'fitness_center' },
  { label: 'Phone',           value: 'phone' },
  { label: 'Wifi',            value: 'wifi' },
  { label: 'LocalGasStation', value: 'local_gas_station' },
  { label: 'MusicNote',       value: 'music_note' },
  { label: 'Pets',            value: 'pets' },
]

const defaultForm = () => ({
  name:  '',
  icon:  'more_horiz',
  color: colorOptions[0],
})

const form = ref(defaultForm())

function resetForm() {
  form.value = props.category
    ? { name: props.category.name, icon: props.category.icon, color: props.category.color }
    : defaultForm()
}

watch(() => props.modelValue, (val) => {
  if (val) resetForm()
})

function handleSubmit() {
  if (!form.value.name.trim()) return

  if (props.category) {
    settingsStore.updateCategory(props.category.id, {
      name:  form.value.name.trim(),
      icon:  form.value.icon,
      color: form.value.color,
    })
  } else {
    settingsStore.addCategory({
      name:  form.value.name.trim(),
      icon:  form.value.icon,
      color: form.value.color,
    })
  }

  emit('update:modelValue', false)
}
</script>

<style scoped lang="scss">
.form-label {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 6px;
  color: #111;
}

.color-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.color-swatch {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s;

  &:hover {
    transform: scale(1.1);
  }
}

.preview-card {
  background: #f5f5f5;
  border-radius: 10px;
}

.preview-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
</style>
