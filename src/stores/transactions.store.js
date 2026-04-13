import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAccountsStore } from './accounts.store'

export const useTransactionsStore = defineStore('transactions', () => {
  const transactions = ref([
    {
      id: '1',
      account_id: '1',
      account_name: 'TDD',
      category: 'Otros',
      type: 'ingreso',
      amount: 5000.00,
      description: 'Salario mensual',
      date: '2026-03-31',
    },
    {
      id: '2',
      account_id: '1',
      account_name: 'TDD',
      category: 'Hogar',
      type: 'gasto',
      amount: 1200.00,
      description: 'Renta',
      date: '2026-04-01',
    },
    {
      id: '3',
      account_id: '2',
      account_name: 'TDC',
      category: 'Alimento',
      type: 'gasto',
      amount: 350.00,
      description: 'Supermercado',
      date: '2026-04-02',
    },
    {
      id: '4',
      account_id: '3',
      account_name: 'Efectivo',
      category: 'Transporte',
      type: 'gasto',
      amount: 80.00,
      description: 'Gasolina',
      date: '2026-04-04',
    },
    {
      id: '5',
      account_id: '1',
      account_name: 'TDD',
      category: 'Deudas',
      type: 'gasto',
      amount: 200.00,
      description: 'Pago tarjeta',
      date: '2026-04-05',
    },
    {
      id: '6',
      account_id: '2',
      account_name: 'TDC',
      category: 'Alimento',
      type: 'gasto',
      amount: 150.00,
      description: 'Restaurante',
      date: '2026-04-06',
    },
  ])

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

  function addTransaction(transaction) {
    const accountsStore = useAccountsStore()
    const newTransaction = {
      ...transaction,
      id: Date.now().toString(),
    }
    transactions.value.unshift(newTransaction)
    accountsStore.updateBalance(transaction.account_id, transaction.amount, transaction.type)
  }

  function deleteTransaction(id) {
    const index = transactions.value.findIndex(t => t.id === id)
    if (index === -1) return
    const transaction = transactions.value[index]
    const accountsStore = useAccountsStore()
    // Revertir el efecto en el saldo
    accountsStore.updateBalance(transaction.account_id, transaction.amount,
      transaction.type === 'ingreso' ? 'gasto' : 'ingreso')
    transactions.value.splice(index, 1)
  }

  return {
    transactions,
    totalIngresos,
    totalGastos,
    balance,
    addTransaction,
    deleteTransaction,
  }
})
