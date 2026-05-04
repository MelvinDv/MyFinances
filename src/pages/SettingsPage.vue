<template>
  <q-page class="q-pa-lg">
    <!-- Header -->
    <div class="text-h4 text-weight-bold q-mb-xs">{{ $t('settings.title') }}</div>
    <div class="text-body2 text-grey-6 q-mb-lg">{{ $t('settings.subtitle') }}</div>

    <!-- Categorías (full width) -->
    <q-card flat bordered class="settings-card q-mb-lg">
      <q-card-section>
        <div class="row items-center justify-between q-mb-xs">
          <div>
            <div class="text-subtitle1 text-weight-bold">{{ $t('settings.categories') }}</div>
            <div class="text-caption text-grey-6">{{ $t('settings.categories_subtitle') }}</div>
          </div>
          <q-btn
            icon="add"
            :label="$t('settings.new_category')"
            unelevated
            color="dark"
            size="sm"
            class="q-px-md"
            :disable="!canManageCategories"
            @click="showCategoryForm = true"
          >
            <q-tooltip v-if="!canManageCategories">
              {{ $t('plan.limit_categories') }}<br>{{ $t('plan.upgrade_hint') }}
            </q-tooltip>
          </q-btn>
        </div>

        <div class="q-mt-md categories-grid">
          <q-card
            v-for="cat in settingsStore.categories"
            :key="cat.id"
            flat
            bordered
            class="category-item"
          >
            <q-card-section class="row items-center no-wrap q-py-sm q-px-md">
              <div
                class="cat-icon q-mr-md"
                :style="{ backgroundColor: cat.color }"
              >
                <q-icon :name="cat.icon" color="white" size="18px" />
              </div>
              <div class="col cat-name text-body2 text-weight-medium">{{ cat.name }}</div>
              <q-btn
                :icon="canManageCategories ? 'more_vert' : 'lock'"
                flat round dense size="sm"
                :color="canManageCategories ? 'grey-6' : 'grey-4'"
                :disable="!canManageCategories"
              >
                <q-tooltip v-if="!canManageCategories">
                  {{ $t('plan.limit_categories') }}
                </q-tooltip>
                <q-menu v-if="canManageCategories" anchor="bottom right" self="top right" auto-close>
                  <q-list dense style="min-width: 140px">
                    <q-item clickable @click="editCategory(cat)">
                      <q-item-section avatar>
                        <q-icon name="edit" size="16px" color="grey-7" />
                      </q-item-section>
                      <q-item-section>{{ $t('common.edit') }}</q-item-section>
                    </q-item>
                    <q-separator />
                    <q-item clickable @click="confirmDelete(cat)">
                      <q-item-section avatar>
                        <q-icon name="delete" size="16px" color="negative" />
                      </q-item-section>
                      <q-item-section class="text-negative">{{ $t('common.delete') }}</q-item-section>
                    </q-item>
                  </q-list>
                </q-menu>
              </q-btn>
            </q-card-section>
          </q-card>
        </div>
      </q-card-section>
    </q-card>

    <!-- Gastos Recurrentes -->
    <q-card flat bordered class="settings-card q-mb-lg">
      <q-card-section>
        <div class="text-subtitle1 text-weight-bold q-mb-xs">{{ $t('recurring.settings_title') }}</div>
        <div class="text-caption text-grey-6 q-mb-md">{{ $t('recurring.settings_subtitle') }}</div>

        <div v-if="recurringStore.recurring.length === 0" class="text-body2 text-grey-5 text-center q-py-md">
          {{ $t('recurring.empty') }}
        </div>

        <div class="column q-gutter-sm">
          <q-card
            v-for="r in recurringStore.recurring"
            :key="r.id"
            flat
            bordered
            class="payment-item"
          >
            <q-card-section class="row items-center no-wrap q-py-sm q-px-md">
              <q-icon name="repeat" color="grey-6" size="20px" class="q-mr-md" />
              <div class="col" style="min-width: 0">
                <div class="text-body2 text-weight-bold ellipsis">{{ r.description || r.category }}</div>
                <div class="text-caption text-grey-6">
                  {{ formatCurrency(r.amount) }} · {{ $t('recurring.day_label', { day: r.day_of_month }) }} · {{ r.account_name }}
                </div>
              </div>
              <q-btn icon="more_vert" flat round dense size="sm" color="grey-6">
                <q-menu anchor="bottom right" self="top right" auto-close>
                  <q-list dense style="min-width: 140px">
                    <q-item clickable @click="editRecurring(r)">
                      <q-item-section avatar>
                        <q-icon name="edit" size="16px" color="grey-7" />
                      </q-item-section>
                      <q-item-section>{{ $t('common.edit') }}</q-item-section>
                    </q-item>
                    <q-separator />
                    <q-item clickable @click="confirmDeleteRecurring(r)">
                      <q-item-section avatar>
                        <q-icon name="delete" size="16px" color="negative" />
                      </q-item-section>
                      <q-item-section class="text-negative">{{ $t('common.delete') }}</q-item-section>
                    </q-item>
                  </q-list>
                </q-menu>
              </q-btn>
            </q-card-section>
          </q-card>
        </div>
      </q-card-section>
    </q-card>

    <!-- Métodos de Pago -->
    <q-card flat bordered class="settings-card q-mb-lg">
      <q-card-section>
        <div class="text-subtitle1 text-weight-bold q-mb-xs">{{ $t('settings.payment_methods') }}</div>
        <div class="text-caption text-grey-6 q-mb-md">{{ $t('settings.payment_methods_subtitle') }}</div>
        <div class="column q-gutter-sm">
          <q-card
            v-for="account in accountsStore.accounts"
            :key="account.id"
            flat
            bordered
            class="payment-item"
          >
            <q-card-section class="row items-center no-wrap q-py-sm q-px-md">
              <div class="col">
                <div class="text-body2 text-weight-bold">{{ account.name }}</div>
                <div class="text-caption text-grey-6">{{ $t(`account_types.${account.type}`) }}</div>
              </div>
              <q-chip outline color="grey-7" text-color="grey-7" size="sm" class="q-ma-none">
                {{ account.name }}
              </q-chip>
            </q-card-section>
          </q-card>
        </div>
      </q-card-section>
    </q-card>

    <!-- Acerca de la Aplicación -->
    <q-card flat bordered class="settings-card">
      <q-card-section>
        <div class="text-subtitle1 text-weight-bold q-mb-xs">{{ $t('settings.about') }}</div>
        <div class="text-caption text-grey-6 q-mb-md">{{ $t('settings.about_subtitle') }}</div>
        <p class="text-body2 text-grey-7 q-mb-md">{{ $t('settings.about_description') }}</p>
        <div class="text-body2"><span class="text-weight-bold">{{ $t('common.version') }}:</span> 1.0.0</div>
        <div class="text-body2"><span class="text-weight-bold">{{ $t('common.date') }}:</span> Abril 2026</div>
      </q-card-section>
    </q-card>

    <!-- Dialog: Nueva / Editar Categoría -->
    <CategoryForm v-model="showCategoryForm" :category="selectedCategory" />

    <!-- Dialog: Editar Recurrente -->
    <RecurringForm v-model="showRecurringForm" :recurring="selectedRecurring" />

    <!-- Confirmación eliminar categoría -->
    <q-dialog v-model="showConfirm">
      <q-card style="min-width: 320px">
        <q-card-section>
          <div class="text-h6">{{ $t('settings.delete_category_title') }}</div>
          <div class="text-body2 q-mt-sm text-grey-7">
            {{ $t('settings.delete_confirm') }} <strong>{{ toDelete?.name }}</strong>?
            {{ $t('settings.delete_warning') }}
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat :label="$t('common.cancel')" v-close-popup />
          <q-btn flat :label="$t('common.delete')" color="negative" @click="handleDelete" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Confirmación eliminar recurrente -->
    <q-dialog v-model="showConfirmRecurring">
      <q-card style="min-width: 320px">
        <q-card-section>
          <div class="text-h6">{{ $t('recurring.delete_title') }}</div>
          <div class="text-body2 q-mt-sm text-grey-7">
            {{ $t('recurring.delete_confirm') }}
            <strong>{{ toDeleteRecurring?.description || toDeleteRecurring?.category }}</strong>?
            {{ $t('recurring.delete_warning') }}
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat :label="$t('common.cancel')" v-close-popup />
          <q-btn flat :label="$t('common.delete')" color="negative" @click="handleDeleteRecurring" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { useSettingsStore } from 'src/stores/settings.store'
import { useAccountsStore } from 'src/stores/accounts.store'
import { useRecurringStore } from 'src/stores/recurring_transactions.store'
import { useCurrency } from 'src/composables/useCurrency'
import { usePlan } from 'src/composables/usePlan'
import CategoryForm from 'src/components/categories/CategoryForm.vue'
import RecurringForm from 'src/components/recurring/RecurringForm.vue'

const { t } = useI18n()
const $q = useQuasar()
const settingsStore  = useSettingsStore()
const accountsStore  = useAccountsStore()
const recurringStore = useRecurringStore()
const { formatCurrency } = useCurrency()
const { canManageCategories } = usePlan()

// ── Categorías ────────────────────────────────────────────────────────────────
const showCategoryForm = ref(false)
const selectedCategory = ref(null)
const showConfirm      = ref(false)
const toDelete         = ref(null)

function editCategory(cat) {
  selectedCategory.value = cat
  showCategoryForm.value = true
}

watch(showCategoryForm, (val) => {
  if (!val) selectedCategory.value = null
})

function confirmDelete(cat) {
  toDelete.value = cat
  showConfirm.value = true
}

function handleDelete() {
  settingsStore.deleteCategory(toDelete.value.id)
  showConfirm.value = false
  $q.notify({ message: t('notify.category_deleted'), color: 'negative', icon: 'delete', position: 'bottom', timeout: 2500 })
  toDelete.value = null
}

// ── Recurrentes ───────────────────────────────────────────────────────────────
const showRecurringForm    = ref(false)
const selectedRecurring    = ref(null)
const showConfirmRecurring = ref(false)
const toDeleteRecurring    = ref(null)

function editRecurring(r) {
  selectedRecurring.value = r
  showRecurringForm.value = true
}

watch(showRecurringForm, (val) => {
  if (!val) selectedRecurring.value = null
})

function confirmDeleteRecurring(r) {
  toDeleteRecurring.value = r
  showConfirmRecurring.value = true
}

async function handleDeleteRecurring() {
  await recurringStore.deleteRecurring(toDeleteRecurring.value.id)
  showConfirmRecurring.value = false
  $q.notify({ message: t('notify.recurring_deleted'), color: 'negative', icon: 'delete', position: 'bottom', timeout: 2500 })
  toDeleteRecurring.value = null
}
</script>

<style scoped>
.settings-card {
  border-radius: 12px;
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  overflow: hidden;
}

@media (min-width: 600px) {
  .categories-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.category-item {
  border-radius: 8px;
  min-width: 0;
  overflow: hidden;
}

.cat-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cat-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.payment-item {
  border-radius: 8px;
}
</style>
