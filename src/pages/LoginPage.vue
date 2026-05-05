<template>
  <q-layout view="hHh lpR fFf">
    <q-page-container>
      <q-page class="login-page">
        <div class="login-container">
          <!-- ── PANEL IZQUIERDO (solo desktop) ─────────────────────────── -->
          <div class="left-panel gt-sm">
            <!-- Logo -->
            <div class="row items-center q-gutter-xs left-logo">
              <q-icon name="account_balance_wallet" size="24px" color="white" />
              <span class="text-white text-weight-bold" style="font-size: 18px">MyFinances</span>
            </div>

            <!-- Headline -->
            <div class="left-content">
              <div class="left-headline">Toma el control de tus finanzas personales</div>
              <div class="left-sub">
                Gestiona todas tus cuentas, analiza tus gastos y alcanza tus metas financieras desde
                un solo lugar.
              </div>

              <!-- Features -->
              <div class="q-mt-xl">
                <div v-for="f in features" :key="f.title" class="feature-row q-mb-lg">
                  <div class="feature-icon-wrap">
                    <q-icon :name="f.icon" color="white" size="20px" />
                  </div>
                  <div>
                    <div class="feature-title">{{ f.title }}</div>
                    <div class="feature-desc">{{ f.desc }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ── PANEL DERECHO (formulario) ─────────────────────────────── -->
          <div class="right-panel">
            <!-- Selector de idioma -->
            <div class="lang-selector">
              <button
                class="lang-btn"
                :class="{ active: locale === 'es-MX' }"
                @click="locale = 'es-MX'"
              >
                🇲🇽 ES
              </button>
              <span class="lang-divider">|</span>
              <button
                class="lang-btn"
                :class="{ active: locale === 'en-US' }"
                @click="locale = 'en-US'"
              >
                🇺🇸 EN
              </button>
            </div>

            <div class="form-wrapper">
              <!-- Logo mobile -->
              <div class="lt-md text-center q-mb-xl">
                <div class="row items-center justify-center q-gutter-xs">
                  <q-icon name="account_balance_wallet" size="30px" color="primary" />
                  <span class="text-weight-bold text-primary" style="font-size: 22px"
                    >MyFinances</span
                  >
                </div>
              </div>

              <!-- Título del formulario -->
              <div class="q-mb-lg">
                <div class="form-title">
                  {{ isSignUp ? $t('auth.title_signup') : $t('auth.title_login') }}
                </div>
                <div class="form-subtitle">
                  {{ isSignUp ? $t('auth.subtitle_signup') : $t('auth.subtitle_login') }}
                </div>
              </div>

              <!-- Error -->
              <q-banner
                v-if="authStore.error"
                dense
                rounded
                class="bg-red-1 text-negative text-caption q-mb-md"
              >
                {{ authStore.error }}
              </q-banner>

              <!-- Email -->
              <div class="q-mb-md">
                <div class="field-label">{{ $t('auth.email') }}</div>
                <q-input
                  v-model="email"
                  type="email"
                  outlined
                  dense
                  placeholder="example@email.com"
                  hide-bottom-space
                  autocomplete="email"
                  class="login-input"
                >
                  <template #prepend>
                    <q-icon name="mail_outline" color="grey-5" size="18px" />
                  </template>
                </q-input>
              </div>

              <!-- Contraseña -->
              <div :class="isSignUp ? 'q-mb-md' : 'q-mb-xs'">
                <div class="field-label">{{ $t('auth.password') }}</div>
                <q-input
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  outlined
                  dense
                  placeholder="••••••••"
                  hide-bottom-space
                  autocomplete="current-password"
                  class="login-input"
                  @keyup.enter="handleSubmit"
                >
                  <template #prepend>
                    <q-icon name="lock_outline" color="grey-5" size="18px" />
                  </template>
                  <template #append>
                    <q-icon
                      :name="showPassword ? 'visibility_off' : 'visibility'"
                      color="grey-5"
                      size="18px"
                      class="cursor-pointer"
                      @click="showPassword = !showPassword"
                    />
                  </template>
                </q-input>
              </div>

              <!-- Confirmar contraseña (solo signup) -->
              <div v-if="isSignUp" class="q-mb-xs">
                <div class="field-label">{{ $t('auth.confirm_password') }}</div>
                <q-input
                  v-model="confirmPassword"
                  :type="showPassword ? 'text' : 'password'"
                  outlined
                  dense
                  placeholder="••••••••"
                  :error="passwordMismatch"
                  :error-message="$t('auth.password_mismatch')"
                  hide-bottom-space
                  class="login-input"
                  @keyup.enter="handleSubmit"
                >
                  <template #prepend>
                    <q-icon name="lock_outline" color="grey-5" size="18px" />
                  </template>
                </q-input>
              </div>

              <!-- Olvidé contraseña (solo login) -->
              <div v-if="!isSignUp" class="row justify-end q-mt-sm q-mb-lg">
                <span class="text-primary text-caption forgot-link cursor-pointer">
                  {{ $t('auth.forgot_password') }}
                </span>
              </div>
              <div v-else class="q-mb-lg" />

              <!-- Botón principal -->
              <q-btn
                unelevated
                color="primary"
                icon-right="arrow_forward"
                class="full-width submit-btn"
                :loading="authStore.loading"
                no-caps
                @click="handleSubmit"
              >
                {{ isSignUp ? $t('auth.submit_signup') : $t('auth.submit_login') }}
              </q-btn>


              <!-- Switch modo -->
              <div class="text-center text-caption switch-mode">
                {{ isSignUp ? $t('auth.have_account') : $t('auth.no_account') }}
                <span class="text-primary text-weight-bold cursor-pointer" @click="toggleMode">
                  {{ isSignUp ? $t('auth.signin_link') : $t('auth.register_free') }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from 'src/stores/auth.store'

const router = useRouter()
const { locale } = useI18n()
const authStore = useAuthStore()

const email           = ref('')
const password        = ref('')
const confirmPassword = ref('')
const showPassword    = ref(false)
const isSignUp        = ref(false)

const features = [
  {
    icon: 'bar_chart',
    title: 'Análisis Inteligente',
    desc: 'Visualiza tus patrones de gasto y toma mejores decisiones',
  },
  {
    icon: 'autorenew',
    title: 'Automatización Total',
    desc: 'Olvídate de registrar gastos recurrentes manualmente',
  },
  {
    icon: 'lock',
    title: '100% Seguro',
    desc: 'Tus datos están protegidos con encriptación bancaria',
  },
]

const passwordMismatch = computed(
  () =>
    isSignUp.value && confirmPassword.value.length > 0 && password.value !== confirmPassword.value,
)

function toggleMode() {
  isSignUp.value = !isSignUp.value
  confirmPassword.value = ''
  authStore.error = null
}

async function handleSubmit() {
  if (!email.value || !password.value) return
  if (isSignUp.value && password.value !== confirmPassword.value) return

  const success = isSignUp.value
    ? await authStore.signUp(email.value, password.value)
    : await authStore.signIn(email.value, password.value)

  if (success) router.push('/')
}
</script>

<style scoped lang="scss">
// ── Layout base ───────────────────────────────────────────────────────────────
.login-page {
  min-height: 100vh;
  display: flex;
}

.login-container {
  display: flex;
  width: 100%;
  min-height: 100vh;
}

// ── Panel izquierdo ───────────────────────────────────────────────────────────
.left-panel {
  width: 42%;
  min-height: 100vh;
  background: linear-gradient(160deg, #1e40af 0%, #2563eb 55%, #3b82f6 100%);
  display: flex;
  flex-direction: column;
  padding: 40px 44px;
  position: relative;
  overflow: hidden;

  // Fondo decorativo
  &::after {
    content: '';
    position: absolute;
    bottom: -80px;
    right: -80px;
    width: 360px;
    height: 360px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.05);
    pointer-events: none;
  }
  &::before {
    content: '';
    position: absolute;
    top: -60px;
    left: -60px;
    width: 260px;
    height: 260px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.05);
    pointer-events: none;
  }
}

.left-logo {
  margin-bottom: 0;
}

.left-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 40px 0;
}

.left-headline {
  font-size: 28px;
  font-weight: 800;
  color: #fff;
  line-height: 1.25;
  margin-bottom: 14px;
}

.left-sub {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.75);
  line-height: 1.6;
}

.feature-row {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.feature-icon-wrap {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.feature-title {
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 2px;
}

.feature-desc {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.4;
}

// ── Panel derecho ─────────────────────────────────────────────────────────────
.right-panel {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
  background: #fff;
  position: relative;
}

.form-wrapper {
  width: 100%;
  max-width: 400px;
}

.form-title {
  font-size: 26px;
  font-weight: 800;
  color: #111827;
  margin-bottom: 6px;
}

.form-subtitle {
  font-size: 14px;
  color: #6b7280;
}

// ── Inputs ────────────────────────────────────────────────────────────────────
.field-label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 6px;
}

.login-input {
  border-radius: 8px;
}

// ── Recordarme / Forgot ───────────────────────────────────────────────────────
.forgot-link {
  font-weight: 500;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

// ── Botón submit ──────────────────────────────────────────────────────────────
.submit-btn {
  height: 46px;
  font-size: 15px;
  font-weight: 600;
  border-radius: 10px;
}

// ── Divisor ───────────────────────────────────────────────────────────────────
.divider-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.divider-line {
  flex: 1;
  height: 1px;
  background: #e5e7eb;
}

.divider-text {
  font-size: 12px;
  color: #9ca3af;
  white-space: nowrap;
}

// ── Botones sociales ──────────────────────────────────────────────────────────
.social-btn {
  height: 42px;
  border-color: #e5e7eb !important;
  color: #374151 !important;
  font-size: 14px;
  font-weight: 500;
  border-radius: 10px !important;
}

// ── Switch modo ───────────────────────────────────────────────────────────────
.switch-mode {
  color: #6b7280;
}

// ── Selector de idioma ────────────────────────────────────────────────────────
.lang-selector {
  position: absolute;
  top: 20px;
  right: 24px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.lang-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: #9ca3af;
  padding: 4px 6px;
  border-radius: 6px;
  transition: all 0.15s;

  &:hover {
    color: #374151;
    background: #f3f4f6;
  }

  &.active {
    color: #2563eb;
    font-weight: 700;
  }
}

.lang-divider {
  color: #d1d5db;
  font-size: 12px;
  user-select: none;
}

// ── Mobile ────────────────────────────────────────────────────────────────────
@media (max-width: 767px) {
  .right-panel {
    padding: 36px 20px;
    align-items: flex-start;
    padding-top: 52px;
  }

  .form-wrapper {
    max-width: 100%;
  }

  .form-title {
    font-size: 22px;
  }
}
</style>
