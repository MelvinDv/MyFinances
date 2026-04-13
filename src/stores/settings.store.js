import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSettingsStore = defineStore('settings', () => {
  const categories = ref([
    { id: '1', name: 'Hogar',           icon: 'home',            color: '#3b82f6' },
    { id: '2', name: 'Alimento',        icon: 'restaurant',      color: '#16a34a' },
    { id: '3', name: 'Deudas',          icon: 'account_balance', color: '#dc2626' },
    { id: '4', name: 'Transporte',      icon: 'directions_car',  color: '#ea580c' },
    { id: '5', name: 'Entretenimiento', icon: 'sports_esports',  color: '#7c3aed' },
    { id: '6', name: 'Salud',           icon: 'favorite',        color: '#db2777' },
    { id: '7', name: 'Educación',       icon: 'school',          color: '#0891b2' },
    { id: '8', name: 'Servicios',       icon: 'build',           color: '#d97706' },
    { id: '9', name: 'Otros',           icon: 'more_horiz',      color: '#475569' },
  ])

  function addCategory(category) {
    categories.value.push({ ...category, id: Date.now().toString() })
  }

  function updateCategory(id, data) {
    const index = categories.value.findIndex(c => c.id === id)
    if (index === -1) return
    categories.value[index] = { ...categories.value[index], ...data }
  }

  function deleteCategory(id) {
    const index = categories.value.findIndex(c => c.id === id)
    if (index !== -1) categories.value.splice(index, 1)
  }

  return { categories, addCategory, updateCategory, deleteCategory }
})
