import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'

const TOUR_KEY = 'myfinance_tour'

export function useTour() {
  function isCompleted() {
    return localStorage.getItem(TOUR_KEY) === 'done'
  }

  function getPhase() {
    return localStorage.getItem(TOUR_KEY) // null | 'transactions' | 'done'
  }

  function setPhase(phase) {
    localStorage.setItem(TOUR_KEY, phase)
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

  // Pasos 3 y 4: Nueva Transacción + tab Análisis
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
        setPhase('done')
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
