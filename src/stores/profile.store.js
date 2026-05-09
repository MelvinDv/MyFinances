import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from 'src/lib/supabase'

export const useProfileStore = defineStore('profile', () => {
  const plan              = ref('free')
  const tourCompleted     = ref(false)
  const fullName          = ref(null)
  const currency          = ref('MXN')
  const language          = ref('es')
  const darkMode          = ref(false)
  const showDecimals      = ref(true)
  const budgetAlerts      = ref(true)
  const monthlySummary    = ref(true)
  const paymentReminders  = ref(true)

  async function fetchProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('profiles')
      .select('plan, tour_completed, full_name, currency, language, dark_mode, show_decimals, budget_alerts, monthly_summary, payment_reminders')
      .eq('user_id', user.id)
      .single()
    if (!error && data) {
      plan.value             = data.plan
      tourCompleted.value    = data.tour_completed
      fullName.value         = data.full_name
      currency.value         = data.currency
      language.value         = data.language
      darkMode.value         = data.dark_mode
      showDecimals.value     = data.show_decimals
      budgetAlerts.value     = data.budget_alerts
      monthlySummary.value   = data.monthly_summary
      paymentReminders.value = data.payment_reminders
    }
  }

  async function updatePreferences(updates) {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', user.id)
      .select()
      .single()
    if (!error && data) {
      if ('full_name'          in updates) fullName.value         = data.full_name
      if ('currency'           in updates) currency.value         = data.currency
      if ('language'           in updates) language.value         = data.language
      if ('dark_mode'          in updates) darkMode.value         = data.dark_mode
      if ('show_decimals'      in updates) showDecimals.value     = data.show_decimals
      if ('budget_alerts'      in updates) budgetAlerts.value     = data.budget_alerts
      if ('monthly_summary'    in updates) monthlySummary.value   = data.monthly_summary
      if ('payment_reminders'  in updates) paymentReminders.value = data.payment_reminders
    }
  }

  async function completeTour() {
    tourCompleted.value = true
    await supabase
      .from('profiles')
      .update({ tour_completed: true })
      .eq('user_id', (await supabase.auth.getUser()).data.user.id)
  }

  return {
    plan,
    tourCompleted,
    fullName,
    currency,
    language,
    darkMode,
    showDecimals,
    budgetAlerts,
    monthlySummary,
    paymentReminders,
    fetchProfile,
    updatePreferences,
    completeTour,
  }
})
