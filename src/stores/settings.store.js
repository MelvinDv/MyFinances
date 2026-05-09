import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from 'src/lib/supabase'

const DEFAULT_CATEGORIES = [
  { name: 'Hogar',           icon: 'home',            color: '#3b82f6' },
  { name: 'Alimento',        icon: 'restaurant',      color: '#16a34a' },
  { name: 'Deudas',          icon: 'account_balance', color: '#dc2626' },
  { name: 'Transporte',      icon: 'directions_car',  color: '#ea580c' },
  { name: 'Entretenimiento', icon: 'sports_esports',  color: '#7c3aed' },
  { name: 'Salud',           icon: 'favorite',        color: '#db2777' },
  { name: 'Educación',       icon: 'school',          color: '#0891b2' },
  { name: 'Servicios',       icon: 'build',           color: '#d97706' },
  { name: 'Otros',           icon: 'more_horiz',      color: '#475569' },
]

export const useSettingsStore = defineStore('settings', () => {
  const categories = ref([])

  async function fetchCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
    if (error) return

    if (data.length === 0) {
      await seedDefaultCategories()
    } else {
      categories.value = data
    }
  }

  async function seedDefaultCategories() {
    const { data: { user } } = await supabase.auth.getUser()
    const rows = DEFAULT_CATEGORIES.map((c, i) => ({
      ...c,
      user_id:    user.id,
      is_default: true,
      sort_order: i,
    }))
    const { data, error } = await supabase.from('categories').insert(rows).select()
    if (!error) categories.value = data
  }

  async function addCategory(category) {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('categories')
      .insert({ ...category, user_id: user.id })
      .select()
      .single()
    if (!error) categories.value.push(data)
  }

  async function updateCategory(id, updates) {
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (!error) {
      const index = categories.value.findIndex(c => c.id === id)
      if (index !== -1) categories.value[index] = data
    }
  }

  async function deleteCategory(id) {
    const { error } = await supabase
      .from('categories')
      .update({ is_active: false })
      .eq('id', id)
    if (!error) {
      const index = categories.value.findIndex(c => c.id === id)
      if (index !== -1) categories.value.splice(index, 1)
    }
  }

  return { categories, fetchCategories, addCategory, updateCategory, deleteCategory }
})
