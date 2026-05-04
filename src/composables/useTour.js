import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import { useProfileStore } from 'src/stores/profile.store'

const PHASE_KEY = 'myfinance_tour_phase'

export function useTour() {
  const profileStore = useProfileStore()

  function isCompleted() {
    return profileStore.tourCompleted
  }

  function getPhase() {
    return localStorage.getItem(PHASE_KEY) // null | 'transactions'
  }

  function setPhase(phase) {
    localStorage.setItem(PHASE_KEY, phase)
  }

  function markDone() {
    localStorage.removeItem(PHASE_KEY)
    profileStore.completeTour()
  }

  // Paso 1: Resalta el botón "Nueva Cuenta"
  function runStep1(t) {
    const d = driver({
      overlayOpacity: 0.5,
      allowClose: false,
      steps: [
        {
          element: '#btn-nueva-cuenta',
          popover: {
            title:       t('tour.step1_title'),
            description: t('tour.step1_desc'),
            side:        'bottom',
            align:       'end',
            nextBtnText: t('tour.btn_ok'),
            showButtons: ['next'],
          },
        },
      ],
    })
    d.drive()
    return d
  }

  // Paso 2: Resalta el tab de Transacciones (tras crear la primera cuenta)
  function runStep2(t) {
    const d = driver({
      overlayOpacity: 0.5,
      allowClose: false,
      steps: [
        {
          element: '#tab-transactions',
          popover: {
            title:       t('tour.step2_title'),
            description: t('tour.step2_desc'),
            side:        'bottom',
            align:       'start',
            nextBtnText: t('tour.btn_go'),
            showButtons: ['next'],
          },
        },
      ],
      onDestroyStarted: () => {
        setPhase('transactions')
        d.destroy()
      },
    })
    d.drive()
    return d
  }

  // Pasos 3, 4 y 5: Nueva Transacción + tab Análisis + tab Configuración
  function runSteps3and4(t) {
    const d = driver({
      overlayOpacity: 0.5,
      allowClose: false,
      steps: [
        {
          element: '#btn-nueva-transaccion',
          popover: {
            title:       t('tour.step3_title'),
            description: t('tour.step3_desc'),
            side:        'bottom',
            align:       'end',
            nextBtnText: t('tour.btn_next'),
            showButtons: ['next'],
          },
        },
        {
          element: '#tab-analysis',
          popover: {
            title:       t('tour.step4_title'),
            description: t('tour.step4_desc'),
            side:        'bottom',
            align:       'start',
            nextBtnText: t('tour.btn_next'),
            prevBtnText: t('tour.btn_prev'),
            showButtons: ['next', 'previous'],
          },
        },
        {
          element: '#tab-settings',
          popover: {
            title:       t('tour.step5_title'),
            description: t('tour.step5_desc'),
            side:        'bottom',
            align:       'start',
            nextBtnText: t('tour.btn_finish'),
            prevBtnText: t('tour.btn_prev'),
            showButtons: ['next', 'previous'],
          },
        },
      ],
      onDestroyStarted: () => {
        markDone()
        d.destroy()
      },
    })
    d.drive()
    return d
  }

  return {
    isCompleted,
    getPhase,
    setPhase,
    runStep1,
    runStep2,
    runSteps3and4,
  }
}
