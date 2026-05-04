import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from 'src/lib/supabase'

export const useProfileStore = defineStore('profile', () => {
  const plan           = ref('free')
  const tourCompleted  = ref(false)

  async function fetchProfile() {
    const { data, error } = await supabase
      .from('profiles')
      .select('plan, tour_completed')
      .single()
    if (!error && data) {
      plan.value          = data.plan
      tourCompleted.value = data.tour_completed
    }
  }

  async function completeTour() {
    tourCompleted.value = true
    await supabase
      .from('profiles')
      .update({ tour_completed: true })
      .eq('user_id', (await supabase.auth.getUser()).data.user.id)
  }

  return { plan, tourCompleted, fetchProfile, completeTour }
})
