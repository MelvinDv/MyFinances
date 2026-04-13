import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAccountsStore = defineStore('accounts', () => {
  const accounts = ref([
    { id: '1', name: 'TDD', label: 'Cuenta Bancaria Principal', type: 'tarjeta_debito',  balance: 13600.00, color: '#2563eb', cut_date: null,  payment_due_date: null, credit_limit: null },
    { id: '2', name: 'TDC', label: 'Tarjeta de Crédito BBVA',  type: 'tarjeta_credito', balance:  4500.00, color: '#22c55e', cut_date: 15,    payment_due_date: 5,    credit_limit: 20000  },
    { id: '3', name: 'Efectivo', label: 'Efectivo',             type: 'efectivo',         balance:  1920.00, color: '#f59e0b', cut_date: null,  payment_due_date: null, credit_limit: null },
  ])

  function addAccount(account) {
    accounts.value.push({ ...account, id: Date.now().toString() })
  }

  function updateAccount(id, data) {
    const index = accounts.value.findIndex(a => a.id === id)
    if (index === -1) return
    accounts.value[index] = { ...accounts.value[index], ...data }
  }

  function updateBalance(accountId, amount, type) {
    const account = accounts.value.find(a => a.id === accountId)
    if (!account) return
    account.balance += type === 'ingreso' ? amount : -amount
  }

  return { accounts, addAccount, updateAccount, updateBalance }
})
