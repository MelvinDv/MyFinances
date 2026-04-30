<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" @hide="resetForm">
    <q-card style="width: 480px; max-width: 95vw; border-radius: 16px">

      <!-- Header -->
      <q-card-section class="q-pb-xs">
        <div class="row items-start justify-between">
          <div>
            <div class="text-h6 text-weight-bold">
              {{ category ? $t('category_form.title_edit') : $t('category_form.title_new') }}
            </div>
            <div class="text-caption text-grey-6">
              {{ category ? $t('category_form.subtitle_edit') : $t('category_form.subtitle_new') }}
            </div>
          </div>
          <q-btn icon="close" flat round dense v-close-popup class="q-mt-xs" />
        </div>
      </q-card-section>

      <q-card-section class="q-pt-sm q-gutter-md">

        <!-- Nombre -->
        <div>
          <div class="form-label">{{ $t('category_form.name') }} <span class="text-negative">*</span></div>
          <q-input
            v-model="form.name"
            outlined
            dense
            :placeholder="$t('category_form.name_placeholder')"
            hide-bottom-space
          />
        </div>

        <!-- Ícono -->
        <div>
          <div class="form-label">{{ $t('category_form.icon') }} <span class="text-negative">*</span></div>
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
          <div class="form-label">{{ $t('category_form.color') }} <span class="text-negative">*</span></div>
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

        <!-- Presupuesto mensual (opcional) -->
        <div>
          <div class="form-label">
            {{ $t('category_form.budget') }}
            <span class="text-grey-5">{{ $t('common.optional') }}</span>
            <q-icon
              name="help_outline"
              size="14px"
              color="grey-5"
              class="q-ml-xs cursor-pointer"
            >
              <q-tooltip max-width="210px" anchor="top middle" self="bottom middle">
                {{ $t('category_form.budget_tooltip') }}
              </q-tooltip>
            </q-icon>
          </div>
          <q-input
            v-model.number="form.budget"
            type="number"
            outlined
            dense
            prefix="$"
            :placeholder="$t('category_form.budget_placeholder')"
            hide-bottom-space
            clearable
          />
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
              <div class="text-body2 text-weight-bold">{{ $t('category_form.preview') }}</div>
              <div class="text-caption text-grey-6">{{ form.name || $t('category_form.name_placeholder_empty') }}</div>
            </div>
          </q-card-section>
        </q-card>

      </q-card-section>

      <!-- Acciones -->
      <q-card-actions align="right" class="q-pa-md q-pt-sm">
        <q-btn flat :label="$t('common.cancel')" color="dark" v-close-popup />
        <q-btn
          unelevated
          color="dark"
          :label="category ? $t('category_form.submit_edit') : $t('category_form.submit_new')"
          @click="handleSubmit"
        />
      </q-card-actions>

    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { useSettingsStore } from 'src/stores/settings.store'

const props = defineProps({
  modelValue: Boolean,
  category: { type: Object, default: null },
})
const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()
const $q = useQuasar()
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
  name:   '',
  icon:   'more_horiz',
  color:  colorOptions[0],
  budget: null,
})

const form = ref(defaultForm())

function resetForm() {
  form.value = props.category
    ? { name: props.category.name, icon: props.category.icon, color: props.category.color, budget: props.category.budget ?? null }
    : defaultForm()
}

watch(() => props.modelValue, (val) => {
  if (val) resetForm()
})

function handleSubmit() {
  if (!form.value.name.trim()) return

  const payload = {
    name:   form.value.name.trim(),
    icon:   form.value.icon,
    color:  form.value.color,
    budget: form.value.budget || null,
  }

  if (props.category) {
    settingsStore.updateCategory(props.category.id, payload)
    $q.notify({ message: t('notify.category_updated'), color: 'positive', icon: 'check_circle', position: 'bottom', timeout: 2500 })
  } else {
    settingsStore.addCategory(payload)
    $q.notify({ message: t('notify.category_added'), color: 'positive', icon: 'check_circle', position: 'bottom', timeout: 2500 })
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
