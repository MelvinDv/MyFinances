import { computed } from 'vue'
import { useProfileStore } from 'src/stores/profile.store'
import { useAccountsStore } from 'src/stores/accounts.store'
import { useRecurringStore } from 'src/stores/recurring_transactions.store'

const FREE_DEBIT_LIMIT    = 2
const FREE_CREDIT_LIMIT   = 1
const FREE_RECURRING_LIMIT = 3

export function usePlan() {
  const profileStore  = useProfileStore()
  const accountsStore = useAccountsStore()
  const recurringStore = useRecurringStore()

  const isPremium = computed(() => profileStore.plan === 'premium')

  const debitCount = computed(() =>
    accountsStore.accounts.filter(a => a.type !== 'tarjeta_credito').length
  )
  const creditCount = computed(() =>
    accountsStore.accounts.filter(a => a.type === 'tarjeta_credito').length
  )

  const canAddDebitAccount  = computed(() => isPremium.value || debitCount.value  < FREE_DEBIT_LIMIT)
  const canAddCreditAccount = computed(() => isPremium.value || creditCount.value < FREE_CREDIT_LIMIT)
  const canAddAccount       = computed(() => canAddDebitAccount.value || canAddCreditAccount.value)

  const canManageCategories = computed(() => isPremium.value)

  const canAddRecurring = computed(() =>
    isPremium.value || recurringStore.recurring.length < FREE_RECURRING_LIMIT
  )

  const canUseAdvancedAnalysis = computed(() => isPremium.value)

  return {
    isPremium,
    debitCount,
    creditCount,
    canAddAccount,
    canAddDebitAccount,
    canAddCreditAccount,
    canManageCategories,
    canAddRecurring,
    canUseAdvancedAnalysis,
    FREE_DEBIT_LIMIT,
    FREE_CREDIT_LIMIT,
    FREE_RECURRING_LIMIT,
  }
}
