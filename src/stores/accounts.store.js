import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from 'src/lib/supabase'

export const useAccountsStore = defineStore('accounts', () => {
  const accounts = ref([])

  async function fetchAccounts() {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .order('created_at')
    if (!error) accounts.value = data
  }

  async function addAccount(account) {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('accounts')
      .insert({ ...account, user_id: user.id })
      .select()
      .single()
    if (!error) accounts.value.push(data)
  }

  async function updateAccount(id, updates) {
    const { data, error } = await supabase
      .from('accounts')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (!error) {
      const index = accounts.value.findIndex(a => a.id === id)
      if (index !== -1) accounts.value.splice(index, 1, data)
    }
  }

  async function deleteAccount(id) {
    const { error } = await supabase.from('accounts').delete().eq('id', id)
    if (!error) {
      const index = accounts.value.findIndex(a => a.id === id)
      if (index !== -1) accounts.value.splice(index, 1)
    }
  }

  async function updateBalance(accountId, amount, type) {
    const account = accounts.value.find(a => a.id === accountId)
    if (!account) return
    const newBalance = account.balance + (type === 'ingreso' ? amount : -amount)
    await updateAccount(accountId, { balance: newBalance })
  }

  return { accounts, fetchAccounts, addAccount, updateAccount, deleteAccount, updateBalance }
})
