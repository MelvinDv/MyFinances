import { computed } from 'vue'
import { useAuthStore } from 'src/stores/auth.store'

export function useCurrency() {
  const authStore = useAuthStore()

  const currency = computed(() => authStore.user?.user_metadata?.currency ?? 'MXN')

  function formatCurrency(amount) {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: currency.value,
    }).format(amount)
  }

  return { currency, formatCurrency }
}
