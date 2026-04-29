import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from 'src/lib/supabase'
import { useAccountsStore } from './accounts.store'

export const useTransactionsStore = defineStore('transactions', () => {
  const transactions = ref([])

  const totalIngresos = computed(() =>
    transactions.value
      .filter(t => t.type === 'ingreso')
      .reduce((sum, t) => sum + t.amount, 0)
  )

  const totalGastos = computed(() =>
    transactions.value
      .filter(t => t.type === 'gasto')
      .reduce((sum, t) => sum + t.amount, 0)
  )

  const balance = computed(() => totalIngresos.value - totalGastos.value)

  async function fetchTransactions() {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false })
    if (!error) transactions.value = data
  }

  async function addTransaction(transaction) {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('transactions')
      .insert({ ...transaction, user_id: user.id })
      .select()
      .single()
    if (error) return

    transactions.value.unshift(data)
    const accountsStore = useAccountsStore()
    await accountsStore.updateBalance(transaction.account_id, transaction.amount, transaction.type)
  }

  async function deleteTransaction(id) {
    const index = transactions.value.findIndex(t => t.id === id)
    if (index === -1) return

    const transaction = transactions.value[index]
    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (error) return

    transactions.value.splice(index, 1)
    const accountsStore = useAccountsStore()
    await accountsStore.updateBalance(
      transaction.account_id,
      transaction.amount,
      transaction.type === 'ingreso' ? 'gasto' : 'ingreso',
    )
  }

  return {
    transactions,
    totalIngresos,
    totalGastos,
    balance,
    fetchTransactions,
    addTransaction,
    deleteTransaction,
  }
})
