<template>
  <q-layout view="hHh lpR fFf">
    <q-page-container>
      <q-page class="flex flex-center login-bg">
        <q-card style="width: 400px; border-radius: 20px" flat bordered>

          <q-card-section class="text-center q-pt-xl q-pb-sm">
            <q-icon name="account_balance_wallet" size="44px" color="dark" />
            <div class="text-h5 text-weight-bold q-mt-sm">MyFinances</div>
          </q-card-section>

          <q-card-section class="text-center q-px-xl q-py-lg">

            <!-- Verificando -->
            <template v-if="status === 'loading'">
              <q-spinner-dots size="48px" color="dark" />
              <div class="text-body2 text-grey-6 q-mt-md">Verificando cuenta...</div>
            </template>

            <!-- Éxito -->
            <template v-else-if="status === 'success'">
              <q-icon name="check_circle" size="56px" color="positive" />
              <div class="text-h6 text-weight-bold q-mt-md">¡Cuenta confirmada!</div>
              <div class="text-body2 text-grey-6 q-mt-sm">Tu correo fue verificado correctamente.</div>
            </template>

            <!-- Error -->
            <template v-else>
              <q-icon name="error_outline" size="56px" color="negative" />
              <div class="text-h6 text-weight-bold q-mt-md">Algo salió mal</div>
              <div class="text-body2 text-grey-6 q-mt-sm">El enlace puede haber expirado o ya fue usado.</div>
            </template>

          </q-card-section>

          <q-card-section class="q-px-xl q-pb-xl q-pt-xs">
            <q-btn
              v-if="status !== 'loading'"
              unelevated
              color="dark"
              label="Ir al inicio de sesión"
              class="full-width"
              @click="router.replace('/login')"
            />
          </q-card-section>

        </q-card>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from 'src/lib/supabase'

const router = useRouter()
const status = ref('loading')

onMounted(async () => {
  const { data: { session } } = await supabase.auth.getSession()
  status.value = session ? 'success' : 'error'
})
</script>

<style scoped>
.login-bg {
  background: #f5f5f5;
}
</style>
