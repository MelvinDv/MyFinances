<template>
  <q-page class="page-settings">

    <div class="st-title">{{ $t('user_settings.title') }}</div>

    <!-- CUENTA -->
    <div class="st-section">
      <div class="st-section-label">cuenta</div>

      <div class="st-row">
        <span class="st-row-text">{{ $t('user_settings.plan') }}</span>
        <span class="st-badge">{{ isPremium ? $t('user_settings.plan_current_premium') : $t('user_settings.plan_current_free') }}</span>
      </div>

      <div class="st-row">
        <span class="st-row-text">{{ $t('user_settings.currency') }}</span>
        <q-select
          v-model="preferences.currency"
          :options="currencyOptions"
          option-value="value"
          option-label="label"
          emit-value map-options
          borderless dense hide-bottom-space
          style="min-width: 110px; font-size: 13px; color: #888780"
          @update:model-value="savePreferences"
        />
      </div>

      <div class="st-row" style="border-bottom: none">
        <span class="st-row-text">{{ $t('user_settings.language') }}</span>
        <q-select
          v-model="currentLocale"
          :options="localeOptions"
          option-value="value"
          option-label="label"
          emit-value map-options
          borderless dense hide-bottom-space
          style="min-width: 110px; font-size: 13px; color: #888780"
          @update:model-value="changeLocale"
        />
      </div>
    </div>

    <!-- APARIENCIA -->
    <div class="st-section">
      <div class="st-section-label">apariencia</div>

      <div class="st-row">
        <span class="st-row-text">{{ $t('user_settings.dark_mode') }}</span>
        <div
          :class="['st-toggle', { 'st-toggle-off': !preferences.darkMode }]"
          @click="preferences.darkMode = !preferences.darkMode; toggleDarkMode(preferences.darkMode)"
        >
          <div class="st-toggle-knob" />
        </div>
      </div>

      <div class="st-row" style="border-bottom: none">
        <span class="st-row-text">{{ $t('user_settings.show_decimals') }}</span>
        <div
          :class="['st-toggle', { 'st-toggle-off': !preferences.showDecimals }]"
          @click="preferences.showDecimals = !preferences.showDecimals; savePreferences()"
        >
          <div class="st-toggle-knob" />
        </div>
      </div>
    </div>

    <!-- NOTIFICACIONES -->
    <div class="st-section">
      <div class="st-section-label">notificaciones</div>

      <div class="st-row">
        <span class="st-row-text">{{ $t('user_settings.notif_budget') }}</span>
        <div
          :class="['st-toggle', { 'st-toggle-off': !notifications.budget }]"
          @click="notifications.budget = !notifications.budget; savePreferences()"
        >
          <div class="st-toggle-knob" />
        </div>
      </div>

      <div class="st-row">
        <span class="st-row-text">{{ $t('user_settings.notif_reminders') }}</span>
        <div
          :class="['st-toggle', { 'st-toggle-off': !notifications.reminders }]"
          @click="notifications.reminders = !notifications.reminders; savePreferences()"
        >
          <div class="st-toggle-knob" />
        </div>
      </div>

      <div class="st-row" style="border-bottom: none">
        <span class="st-row-text">{{ $t('user_settings.notif_summary') }}</span>
        <div
          :class="['st-toggle', { 'st-toggle-off': !notifications.summary }]"
          @click="notifications.summary = !notifications.summary; savePreferences()"
        >
          <div class="st-toggle-knob" />
        </div>
      </div>
    </div>

    <!-- CUENTA / PERFIL -->
    <div class="st-section">
      <div class="st-section-label">perfil</div>

      <div class="st-row">
        <span class="st-row-text">{{ $t('user_settings.full_name') }}</span>
        <span class="st-row-value">{{ form.fullName || '—' }}</span>
      </div>

      <div class="st-row" style="border-bottom: none">
        <span class="st-row-text">{{ form.email }}</span>
        <q-btn
          flat dense no-caps size="sm" color="grey-6"
          :label="$t('user_settings.save')"
          :loading="savingProfile"
          @click="showProfileEdit = true"
        />
      </div>
    </div>

    <!-- OTROS -->
    <div class="st-section">
      <div class="st-section-label">más</div>

      <div class="st-row" style="cursor:pointer" @click="$router.push('/configuracion')">
        <span class="st-row-text">Categorías y recurrentes</span>
        <i class="ti ti-chevron-right" style="font-size:14px;color:#C8C6BE" />
      </div>

      <div class="st-row" style="cursor:pointer" @click="showPasswordDialog = true">
        <span class="st-row-text">{{ $t('user_settings.security') }}</span>
        <i class="ti ti-chevron-right" style="font-size:14px;color:#C8C6BE" />
      </div>

      <div class="st-row" style="border-bottom: none; cursor:pointer" @click="handleSignOut">
        <span class="st-row-text" style="color:#A32D2D">Cerrar sesión</span>
        <i class="ti ti-logout" style="font-size:14px;color:#A32D2D" />
      </div>
    </div>

    <!-- Upgrade banner (free plan only) -->
    <div v-if="!isPremium" class="st-upgrade" @click="onUpgrade">
      <span>Upgrade a Premium</span>
      <i class="ti ti-star" style="font-size:14px" />
    </div>

    <!-- Dialog: editar perfil -->
    <q-dialog v-model="showProfileEdit">
      <q-card style="min-width:300px">
        <q-card-section>
          <div class="text-subtitle1 text-weight-bold q-mb-md">{{ $t('user_settings.profile') }}</div>
          <div class="column q-gutter-md">
            <q-input v-model="form.fullName" :label="$t('user_settings.full_name')" outlined dense hide-bottom-space />
            <q-input v-model="form.email" :label="$t('user_settings.email')" outlined dense readonly bg-color="grey-1" hide-bottom-space />
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat :label="$t('common.cancel')" v-close-popup />
          <q-btn unelevated color="dark" :label="$t('user_settings.save')" :loading="savingProfile" @click="saveProfile" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Dialog: cambiar contraseña -->
    <q-dialog v-model="showPasswordDialog">
      <q-card style="min-width:300px">
        <q-card-section>
          <div class="text-subtitle1 text-weight-bold q-mb-md">{{ $t('user_settings.security') }}</div>
          <div class="column q-gutter-md">
            <q-input
              v-model="passwordForm.newPassword"
              :type="showPassword ? 'text' : 'password'"
              :label="$t('user_settings.new_password')"
              outlined dense hide-bottom-space
            >
              <template #append>
                <q-icon :name="showPassword ? 'visibility_off' : 'visibility'" class="cursor-pointer text-grey-5" @click="showPassword = !showPassword" />
              </template>
            </q-input>
            <q-input
              v-model="passwordForm.confirmPassword"
              :type="showPassword ? 'text' : 'password'"
              :label="$t('user_settings.confirm_new_password')"
              outlined dense
              :error="passwordMismatch"
              :error-message="$t('auth.password_mismatch')"
              hide-bottom-space
            />
          </div>
          <q-banner v-if="passwordSuccess" dense rounded class="bg-green-1 text-positive q-mt-md text-caption">
            {{ $t('user_settings.password_updated') }}
          </q-banner>
          <q-banner v-if="passwordError" dense rounded class="bg-red-1 text-negative q-mt-md text-caption">
            {{ passwordError }}
          </q-banner>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat :label="$t('common.cancel')" v-close-popup />
          <q-btn unelevated color="dark" :label="$t('user_settings.change_password')" :loading="savingPassword" :disable="!canChangePassword" @click="changePassword" />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'src/stores/auth.store'
import { usePlan } from 'src/composables/usePlan'
import { supabase } from 'src/lib/supabase'

const $q     = useQuasar()
const router = useRouter()
const { t, locale } = useI18n()

const authStore = useAuthStore()
const { isPremium } = usePlan()

// ── Sign out ──────────────────────────────────────────────────────────────────

async function handleSignOut() {
  await authStore.signOut()
  router.push('/login')
}

// ── Plan ──────────────────────────────────────────────────────────────────────

function onUpgrade() {
  $q.notify({ message: t('user_settings.plan_coming_soon'), icon: 'workspace_premium', color: 'dark', position: 'bottom', timeout: 3000 })
}

// ── Perfil ────────────────────────────────────────────────────────────────────

const form = ref({
  fullName: authStore.user?.user_metadata?.full_name ?? '',
  email:    authStore.user?.email ?? '',
})

const savingProfile    = ref(false)
const showProfileEdit  = ref(false)
const showPasswordDialog = ref(false)

async function saveProfile() {
  savingProfile.value = true
  await supabase.auth.updateUser({ data: { full_name: form.value.fullName } })
  savingProfile.value = false
  showProfileEdit.value = false
}

// ── Preferences ───────────────────────────────────────────────────────────────

const notifications = ref({
  budget:    authStore.user?.user_metadata?.notif_budget    ?? true,
  summary:   authStore.user?.user_metadata?.notif_summary   ?? true,
  reminders: authStore.user?.user_metadata?.notif_reminders ?? false,
})

const preferences = ref({
  darkMode:     authStore.user?.user_metadata?.dark_mode     ?? false,
  showDecimals: authStore.user?.user_metadata?.show_decimals ?? true,
  currency:     authStore.user?.user_metadata?.currency      ?? 'MXN',
})

const currencyOptions = [
  { value: 'MXN', label: 'MXN $' },
  { value: 'USD', label: 'USD $' },
  { value: 'EUR', label: 'EUR €' },
  { value: 'COP', label: 'COP $' },
  { value: 'ARS', label: 'ARS $' },
  { value: 'CLP', label: 'CLP $' },
  { value: 'BRL', label: 'BRL R$' },
  { value: 'PEN', label: 'PEN S/' },
  { value: 'GBP', label: 'GBP £' },
  { value: 'CAD', label: 'CAD $' },
]

const localeOptions = [
  { value: 'es-MX', label: '🇲🇽 Español' },
  { value: 'en-US', label: '🇺🇸 English' },
]

const currentLocale = ref(locale.value)

function changeLocale(val) {
  locale.value = val
  savePreferences()
}

function toggleDarkMode(val) {
  $q.dark.set(val)
  savePreferences()
}

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

// ── Password ──────────────────────────────────────────────────────────────────

const passwordForm    = ref({ newPassword: '', confirmPassword: '' })
const showPassword    = ref(false)
const savingPassword  = ref(false)
const passwordSuccess = ref(false)
const passwordError   = ref(null)

const passwordMismatch = computed(() =>
  passwordForm.value.confirmPassword.length > 0 &&
  passwordForm.value.newPassword !== passwordForm.value.confirmPassword
)
const canChangePassword = computed(() =>
  passwordForm.value.newPassword.length >= 6 &&
  passwordForm.value.newPassword === passwordForm.value.confirmPassword
)

async function changePassword() {
  savingPassword.value  = true
  passwordSuccess.value = false
  passwordError.value   = null
  const { error } = await supabase.auth.updateUser({ password: passwordForm.value.newPassword })
  if (error) {
    passwordError.value = error.message
  } else {
    passwordSuccess.value = true
    passwordForm.value = { newPassword: '', confirmPassword: '' }
  }
  savingPassword.value = false
}
</script>

<style scoped lang="scss">
.page-settings {
  padding: 20px 20px 24px;
  background: #fff;
}

.st-title {
  font-size: 16px;
  font-weight: 500;
  color: #1a1a18;
  margin-bottom: 16px;
}

.st-section {
  margin-bottom: 16px;
}

.st-section-label {
  font-size: 10px;
  color: #C8C6BE;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 6px;
}

.st-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 0.5px solid #F8F7F4;
}

.st-row-text {
  font-size: 14px;
  color: #1a1a18;
}

.st-row-value {
  font-size: 13px;
  color: #888780;
}

.st-badge {
  background: #1a1a18;
  color: #FAFAF8;
  font-size: 11px;
  padding: 2px 10px;
  border-radius: 12px;
}

.st-toggle {
  width: 32px;
  height: 18px;
  background: #1a1a18;
  border-radius: 9px;
  position: relative;
  cursor: pointer;
  transition: background 0.2s;
  flex-shrink: 0;
}
.st-toggle-off { background: #D3D1C7; }

.st-toggle-knob {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: white;
  transition: right 0.2s;
}
.st-toggle-off .st-toggle-knob {
  right: auto;
  left: 2px;
}

.st-upgrade {
  margin-top: 8px;
  background: #1a1a18;
  color: #FAFAF8;
  border-radius: 12px;
  padding: 14px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  cursor: pointer;
}
</style>
