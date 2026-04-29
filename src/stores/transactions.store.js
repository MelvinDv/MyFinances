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

  async function addInstallmentPlan({ plan, paymentDueDay }) {
    const { data: { user } } = await supabase.auth.getUser()

    // 1. Crear el plan
    const { data: newPlan, error: planError } = await supabase
      .from('installment_plans')
      .insert({ ...plan, user_id: user.id })
      .select()
      .single()
    if (planError) return

    // 2. Generar una transacción por cada cuota
    const txInserts = []
    for (let i = 1; i <= plan.months; i++) {
      const d = new Date(plan.start_date + 'T00:00:00')
      d.setMonth(d.getMonth() + i)
      if (paymentDueDay) {
        const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
        d.setDate(Math.min(paymentDueDay, lastDay))
      }
      txInserts.push({
        user_id:                  user.id,
        type:                     'gasto',
        amount:                   plan.monthly_payment,
        description:              plan.description,
        category:                 plan.category,
        account_id:               plan.account_id,
        account_name:             plan.account_name,
        date:                     d.toISOString().split('T')[0],
        installment_plan_id:      newPlan.id,
        installment_month:        i,
        installment_total_months: plan.months,
      })
    }

    const { data: newTxs, error: txError } = await supabase
      .from('transactions')
      .insert(txInserts)
      .select()
    if (txError) return

    // 3. Agregar al estado local ordenado por fecha desc
    transactions.value = [...newTxs, ...transactions.value]
      .sort((a, b) => b.date.localeCompare(a.date))

    // 4. Actualizar balance de la cuenta con la deuda total (una sola vez)
    const accountsStore = useAccountsStore()
    await accountsStore.updateBalance(plan.account_id, plan.total_amount, 'gasto')
  }

  async function deleteTransaction(id) {
    const index = transactions.value.findIndex(t => t.id === id)
    if (index === -1) return

    const transaction = transactions.value[index]

    if (transaction.installment_plan_id) {
      await deleteInstallmentPlan(transaction.installment_plan_id)
      return
    }

    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (error) return

    transactions.value.splice(index, 1)
    const accountsStore = useAccountsStore()

    if (transaction.type === 'transferencia' && transaction.destination_account_id) {
      // Revertir ambos lados: devolver dinero al origen y descontar del destino
      await accountsStore.updateBalance(transaction.account_id,             transaction.amount, 'ingreso')
      await accountsStore.updateBalance(transaction.destination_account_id, transaction.amount, 'gasto')
    } else {
      await accountsStore.updateBalance(
        transaction.account_id,
        transaction.amount,
        transaction.type === 'ingreso' ? 'gasto' : 'ingreso',
      )
    }
  }

  async function deleteInstallmentPlan(planId) {
    const planTxs = transactions.value.filter(t => t.installment_plan_id === planId)
    if (!planTxs.length) return

    const totalAmount = planTxs.reduce((sum, t) => sum + t.amount, 0)
    const accountId = planTxs[0].account_id

    const { error: txError } = await supabase
      .from('transactions')
      .delete()
      .eq('installment_plan_id', planId)
    if (txError) return

    await supabase.from('installment_plans').delete().eq('id', planId)

    transactions.value = transactions.value.filter(t => t.installment_plan_id !== planId)

    const accountsStore = useAccountsStore()
    await accountsStore.updateBalance(accountId, totalAmount, 'ingreso')
  }

  async function addTransfer({ fromAccount, toAccount, amount, date, description, category = 'Transferencia' }) {
    const { data: { user } } = await supabase.auth.getUser()

    const fromName = fromAccount.name ?? fromAccount.label
    const toName   = toAccount.name   ?? toAccount.label

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id:                  user.id,
        type:                     'transferencia',
        amount,
        category,
        account_id:               fromAccount.id,
        account_name:             fromName,
        destination_account_id:   toAccount.id,
        destination_account_name: toName,
        date,
        description:              description || '',
      })
      .select()
      .single()
    if (error) return

    transactions.value = [data, ...transactions.value]
      .sort((a, b) => b.date.localeCompare(a.date))

    const accountsStore = useAccountsStore()
    await accountsStore.updateBalance(fromAccount.id, amount, 'gasto')
    await accountsStore.updateBalance(toAccount.id,   amount, 'ingreso')
  }

  async function payCreditCard({ creditAccount, fromAccount, amount, date }) {
    await addTransfer({
      fromAccount,
      toAccount:   creditAccount,
      amount,
      date,
      category:    'Pago TDC',
      description: `Pago TDC - ${creditAccount.name ?? creditAccount.label}`,
    })
  }

  return {
    transactions,
    totalIngresos,
    totalGastos,
    balance,
    fetchTransactions,
    addTransaction,
    addInstallmentPlan,
    addTransfer,
    deleteTransaction,
    payCreditCard,
  }
})
