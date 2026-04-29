import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from 'src/lib/supabase'
import { useTransactionsStore } from './transactions.store'

export const useRecurringStore = defineStore('recurring', () => {
  const recurring = ref([])

  async function fetchRecurring() {
    const { data, error } = await supabase
      .from('recurring_transactions')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false })
    if (!error) recurring.value = data
  }

  async function addRecurring(template, firstTx) {
    const { data: { user } } = await supabase.auth.getUser()

    const { data: newTemplate, error } = await supabase
      .from('recurring_transactions')
      .insert({ ...template, user_id: user.id })
      .select()
      .single()
    if (error) return

    recurring.value.unshift(newTemplate)

    // Crear la primera transacción enlazada a la plantilla
    const transactionsStore = useTransactionsStore()
    await transactionsStore.addTransaction({
      ...firstTx,
      recurring_transaction_id: newTemplate.id,
    })
  }

  async function updateRecurring(id, updates) {
    const { data, error } = await supabase
      .from('recurring_transactions')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) return

    const index = recurring.value.findIndex(r => r.id === id)
    if (index !== -1) recurring.value.splice(index, 1, data)
  }

  async function deleteRecurring(id) {
    // Marcar como inactiva (los registros existentes se conservan)
    const { error } = await supabase
      .from('recurring_transactions')
      .update({ active: false })
      .eq('id', id)
    if (error) return
    recurring.value = recurring.value.filter(r => r.id !== id)
  }

  async function generateDueTransactions() {
    if (!recurring.value.length) return

    const now       = new Date()
    const today     = now.getDate()
    const yearMonth = now.toISOString().slice(0, 7) // 'YYYY-MM'

    // Verificar cuáles ya se generaron este mes
    const { data: existing } = await supabase
      .from('transactions')
      .select('recurring_transaction_id')
      .not('recurring_transaction_id', 'is', null)
      .gte('date', `${yearMonth}-01`)
      .lte('date', `${yearMonth}-31`)

    const generatedIds = new Set((existing || []).map(t => t.recurring_transaction_id))

    const transactionsStore = useTransactionsStore()

    for (const template of recurring.value) {
      if (!template.active)                 continue
      if (template.day_of_month > today)    continue
      if (generatedIds.has(template.id))    continue

      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
      const day     = Math.min(template.day_of_month, lastDay)
      const date    = `${yearMonth}-${String(day).padStart(2, '0')}`

      await transactionsStore.addTransaction({
        type:                     template.type,
        amount:                   template.amount,
        description:              template.description,
        category:                 template.category,
        account_id:               template.account_id,
        account_name:             template.account_name,
        date,
        recurring_transaction_id: template.id,
      })
    }
  }

  return {
    recurring,
    fetchRecurring,
    addRecurring,
    updateRecurring,
    deleteRecurring,
    generateDueTransactions,
  }
})
