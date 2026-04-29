<template>
  <q-layout view="hHh lpR fFf">
  <q-page-container>
  <q-page class="flex flex-center login-bg">
    <q-card style="width: 400px; border-radius: 20px" flat bordered>

      <!-- Logo / Header -->
      <q-card-section class="text-center q-pt-xl q-pb-sm">
        <q-icon name="account_balance_wallet" size="44px" color="dark" />
        <div class="text-h5 text-weight-bold q-mt-sm">MyFinances</div>
        <div class="text-caption text-grey-6 q-mt-xs">
          {{ isSignUp ? $t('auth.subtitle_signup') : $t('auth.subtitle_login') }}
        </div>
      </q-card-section>

      <q-card-section class="q-px-xl q-py-md q-gutter-md">

        <!-- Error banner -->
        <q-banner
          v-if="authStore.error"
          dense
          rounded
          class="bg-red-1 text-negative text-caption"
        >
          {{ authStore.error }}
        </q-banner>

        <q-input
          v-model="email"
          :label="$t('auth.email')"
          type="email"
          outlined
          dense
          autocomplete="email"
        />

        <q-input
          v-model="password"
          :label="$t('auth.password')"
          :type="showPassword ? 'text' : 'password'"
          outlined
          dense
          autocomplete="current-password"
          @keyup.enter="handleSubmit"
        >
          <template #append>
            <q-icon
              :name="showPassword ? 'visibility_off' : 'visibility'"
              class="cursor-pointer text-grey-5"
              @click="showPassword = !showPassword"
            />
          </template>
        </q-input>

        <q-input
          v-if="isSignUp"
          v-model="confirmPassword"
          :label="$t('auth.confirm_password')"
          :type="showPassword ? 'text' : 'password'"
          outlined
          dense
          :error="passwordMismatch"
          :error-message="$t('auth.password_mismatch')"
          hide-bottom-space
          @keyup.enter="handleSubmit"
        />

      </q-card-section>

      <q-card-section class="q-px-xl q-pb-xl q-pt-xs q-gutter-sm">
        <q-btn
          unelevated
          color="dark"
          :label="isSignUp ? $t('auth.submit_signup') : $t('auth.submit_login')"
          class="full-width"
          :loading="authStore.loading"
          @click="handleSubmit"
        />
        <q-btn
          flat
          color="grey-7"
          :label="isSignUp ? $t('auth.switch_login') : $t('auth.switch_signup')"
          class="full-width"
          @click="toggleMode"
        />
      </q-card-section>

    </q-card>
  </q-page>
  </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'src/stores/auth.store'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const isSignUp = ref(false)

const passwordMismatch = computed(() =>
  isSignUp.value && confirmPassword.value.length > 0 && password.value !== confirmPassword.value
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

<style scoped>
.login-bg {
  background: #f5f5f5;
}
</style>
