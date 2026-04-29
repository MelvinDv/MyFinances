<template>
  <q-page class="q-pa-lg">

    <!-- Header -->
    <div class="text-h4 text-weight-bold q-mb-xs">{{ $t('user_settings.title') }}</div>
    <div class="text-body2 text-grey-6 q-mb-lg">{{ $t('user_settings.subtitle') }}</div>

    <!-- Perfil -->
    <q-card flat bordered class="settings-card q-mb-md">
      <q-card-section>
        <div class="row items-center q-mb-xs">
          <q-icon name="person_outline" size="20px" class="q-mr-sm" />
          <div class="text-subtitle1 text-weight-bold">{{ $t('user_settings.profile') }}</div>
        </div>
        <div class="text-caption text-grey-6 q-mb-lg">{{ $t('user_settings.profile_subtitle') }}</div>

        <div class="column q-gutter-md" style="max-width: 480px">
          <div>
            <div class="form-label">{{ $t('user_settings.full_name') }}</div>
            <q-input v-model="form.fullName" outlined dense hide-bottom-space />
          </div>
          <div>
            <div class="form-label">{{ $t('user_settings.email') }}</div>
            <q-input v-model="form.email" outlined dense readonly bg-color="grey-1" hide-bottom-space />
          </div>
          <div>
            <q-btn
              unelevated
              color="dark"
              :label="$t('user_settings.save')"
              :loading="savingProfile"
              @click="saveProfile"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Notificaciones -->
    <q-card flat bordered class="settings-card q-mb-md">
      <q-card-section>
        <div class="row items-center q-mb-xs">
          <q-icon name="notifications_none" size="20px" class="q-mr-sm" />
          <div class="text-subtitle1 text-weight-bold">{{ $t('user_settings.notifications') }}</div>
        </div>
        <div class="text-caption text-grey-6 q-mb-lg">{{ $t('user_settings.notifications_subtitle') }}</div>

        <div class="column q-gutter-sm">
          <div class="row items-center justify-between notification-row">
            <div>
              <div class="text-body2 text-weight-medium">{{ $t('user_settings.notif_budget') }}</div>
              <div class="text-caption text-grey-6">{{ $t('user_settings.notif_budget_desc') }}</div>
            </div>
            <q-toggle v-model="notifications.budget" color="dark" />
          </div>
          <q-separator />
          <div class="row items-center justify-between notification-row">
            <div>
              <div class="text-body2 text-weight-medium">{{ $t('user_settings.notif_summary') }}</div>
              <div class="text-caption text-grey-6">{{ $t('user_settings.notif_summary_desc') }}</div>
            </div>
            <q-toggle v-model="notifications.summary" color="dark" />
          </div>
          <q-separator />
          <div class="row items-center justify-between notification-row">
            <div>
              <div class="text-body2 text-weight-medium">{{ $t('user_settings.notif_reminders') }}</div>
              <div class="text-caption text-grey-6">{{ $t('user_settings.notif_reminders_desc') }}</div>
            </div>
            <q-toggle v-model="notifications.reminders" color="dark" />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Preferencias -->
    <q-card flat bordered class="settings-card q-mb-md">
      <q-card-section>
        <div class="row items-center q-mb-xs">
          <q-icon name="language" size="20px" class="q-mr-sm" />
          <div class="text-subtitle1 text-weight-bold">{{ $t('user_settings.preferences') }}</div>
        </div>
        <div class="text-caption text-grey-6 q-mb-lg">{{ $t('user_settings.preferences_subtitle') }}</div>

        <div class="column q-gutter-sm">
          <div class="row items-center justify-between notification-row">
            <div>
              <div class="text-body2 text-weight-medium">{{ $t('user_settings.dark_mode') }}</div>
              <div class="text-caption text-grey-6">{{ $t('user_settings.dark_mode_desc') }}</div>
            </div>
            <q-toggle v-model="preferences.darkMode" color="dark" @update:model-value="toggleDarkMode" />
          </div>
          <q-separator />
          <div class="row items-center justify-between notification-row">
            <div>
              <div class="text-body2 text-weight-medium">{{ $t('user_settings.show_decimals') }}</div>
              <div class="text-caption text-grey-6">{{ $t('user_settings.show_decimals_desc') }}</div>
            </div>
            <q-toggle v-model="preferences.showDecimals" color="dark" />
          </div>
          <q-separator />
          <div class="row items-center justify-between notification-row">
            <div>
              <div class="text-body2 text-weight-medium">{{ $t('user_settings.language') }}</div>
              <div class="text-caption text-grey-6">{{ $t('user_settings.language_desc') }}</div>
            </div>
            <q-select
              v-model="currentLocale"
              :options="localeOptions"
              option-value="value"
              option-label="label"
              emit-value
              map-options
              outlined
              dense
              hide-bottom-space
              style="min-width: 150px"
              @update:model-value="changeLocale"
            />
          </div>
          <q-separator />
          <div class="row items-center justify-between notification-row">
            <div>
              <div class="text-body2 text-weight-medium">{{ $t('user_settings.currency') }}</div>
              <div class="text-caption text-grey-6">{{ $t('user_settings.currency_desc') }}</div>
            </div>
            <q-select
              v-model="preferences.currency"
              :options="currencyOptions"
              option-value="value"
              option-label="label"
              emit-value
              map-options
              outlined
              dense
              hide-bottom-space
              style="min-width: 200px"
              @update:model-value="savePreferences"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Seguridad -->
    <q-card flat bordered class="settings-card">
      <q-card-section>
        <div class="row items-center q-mb-xs">
          <q-icon name="shield_outlined" size="20px" class="q-mr-sm" />
          <div class="text-subtitle1 text-weight-bold">{{ $t('user_settings.security') }}</div>
        </div>
        <div class="text-caption text-grey-6 q-mb-lg">{{ $t('user_settings.security_subtitle') }}</div>

        <div class="column q-gutter-md" style="max-width: 480px">
          <div>
            <div class="form-label">{{ $t('user_settings.new_password') }}</div>
            <q-input
              v-model="passwordForm.newPassword"
              :type="showPassword ? 'text' : 'password'"
              outlined
              dense
              hide-bottom-space
            >
              <template #append>
                <q-icon
                  :name="showPassword ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer text-grey-5"
                  @click="showPassword = !showPassword"
                />
              </template>
            </q-input>
          </div>
          <div>
            <div class="form-label">{{ $t('user_settings.confirm_new_password') }}</div>
            <q-input
              v-model="passwordForm.confirmPassword"
              :type="showPassword ? 'text' : 'password'"
              outlined
              dense
              :error="passwordMismatch"
              :error-message="$t('auth.password_mismatch')"
              hide-bottom-space
            />
          </div>
          <div>
            <q-btn
              unelevated
              color="dark"
              :label="$t('user_settings.change_password')"
              :loading="savingPassword"
              :disable="!canChangePassword"
              @click="changePassword"
            />
          </div>
        </div>

        <!-- Feedback -->
        <q-banner
          v-if="passwordSuccess"
          dense
          rounded
          class="bg-green-1 text-positive text-caption q-mt-md"
          style="max-width: 480px"
        >
          {{ $t('user_settings.password_updated') }}
        </q-banner>
        <q-banner
          v-if="passwordError"
          dense
          rounded
          class="bg-red-1 text-negative text-caption q-mt-md"
          style="max-width: 480px"
        >
          {{ passwordError }}
        </q-banner>
      </q-card-section>
    </q-card>

  </q-page>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from 'src/stores/auth.store'
import { supabase } from 'src/lib/supabase'

const $q = useQuasar()
const { locale } = useI18n()

const authStore = useAuthStore()

// ── Perfil ────────────────────────────────────────────────────────────────────

const form = ref({
  fullName: authStore.user?.user_metadata?.full_name ?? '',
  email: authStore.user?.email ?? '',
})

const savingProfile = ref(false)

async function saveProfile() {
  savingProfile.value = true
  await supabase.auth.updateUser({
    data: { full_name: form.value.fullName },
  })
  savingProfile.value = false
}

// ── Guardar preferencias ──────────────────────────────────────────────────────

async function savePreferences() {
  await supabase.auth.updateUser({
    data: {
      notif_budget:    notifications.value.budget,
      notif_summary:   notifications.value.summary,
      notif_reminders: notifications.value.reminders,
      dark_mode:       preferences.value.darkMode,
      show_decimals:   preferences.value.showDecimals,
      currency:        preferences.value.currency,
      locale:          currentLocale.value,
    },
  })
}

// ── Notificaciones ────────────────────────────────────────────────────────────

const notifications = ref({
  budget:    authStore.user?.user_metadata?.notif_budget    ?? true,
  summary:   authStore.user?.user_metadata?.notif_summary   ?? true,
  reminders: authStore.user?.user_metadata?.notif_reminders ?? false,
})

watch(notifications, savePreferences, { deep: true })

// ── Preferencias ─────────────────────────────────────────────────────────────

const preferences = ref({
  darkMode:     authStore.user?.user_metadata?.dark_mode     ?? false,
  showDecimals: authStore.user?.user_metadata?.show_decimals ?? true,
  currency:     authStore.user?.user_metadata?.currency      ?? 'MXN',
})

const currencyOptions = [
  { value: 'MXN', label: '🇲🇽 MXN — Peso Mexicano' },
  { value: 'USD', label: '🇺🇸 USD — Dólar Americano' },
  { value: 'EUR', label: '🇪🇺 EUR — Euro' },
  { value: 'COP', label: '🇨🇴 COP — Peso Colombiano' },
  { value: 'ARS', label: '🇦🇷 ARS — Peso Argentino' },
  { value: 'CLP', label: '🇨🇱 CLP — Peso Chileno' },
  { value: 'BRL', label: '🇧🇷 BRL — Real Brasileño' },
  { value: 'PEN', label: '🇵🇪 PEN — Sol Peruano' },
  { value: 'GBP', label: '🇬🇧 GBP — Libra Esterlina' },
  { value: 'CAD', label: '🇨🇦 CAD — Dólar Canadiense' },
]

watch(() => preferences.value.showDecimals, savePreferences)

function toggleDarkMode(val) {
  $q.dark.set(val)
  savePreferences()
}

const localeOptions = [
  { value: 'es-MX', label: '🇲🇽 Español' },
  { value: 'en-US', label: '🇺🇸 English' },
]

const currentLocale = ref(locale.value)

function changeLocale(val) {
  locale.value = val
  savePreferences()
}

// ── Seguridad ─────────────────────────────────────────────────────────────────

const passwordForm = ref({ newPassword: '', confirmPassword: '' })
const showPassword = ref(false)
const savingPassword = ref(false)
const passwordSuccess = ref(false)
const passwordError = ref(null)

const passwordMismatch = computed(() =>
  passwordForm.value.confirmPassword.length > 0 &&
  passwordForm.value.newPassword !== passwordForm.value.confirmPassword
)

const canChangePassword = computed(() =>
  passwordForm.value.newPassword.length >= 6 &&
  passwordForm.value.newPassword === passwordForm.value.confirmPassword
)

async function changePassword() {
  savingPassword.value = true
  passwordSuccess.value = false
  passwordError.value = null

  const { error } = await supabase.auth.updateUser({
    password: passwordForm.value.newPassword,
  })

  if (error) {
    passwordError.value = error.message
  } else {
    passwordSuccess.value = true
    passwordForm.value = { newPassword: '', confirmPassword: '' }
  }

  savingPassword.value = false
}
</script>

<style scoped>
.settings-card {
  border-radius: 12px;
}

.form-label {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 6px;
  color: #111;
}

.notification-row {
  padding: 8px 0;
}
</style>
