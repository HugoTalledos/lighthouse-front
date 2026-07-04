import type { IPlaygroundService } from '../interfaces'
import type { GeneratedPlan } from '~/types/playground'

const defaultPlan: GeneratedPlan = {
  landing: {
    url: 'https://altitud2800.loumitos.com/',
    title: 'NutriRecetas — Come bien sin complicaciones',
  },
  creatives: [
    { id: 'c1', title: 'Variación A — Beneficio principal', imageUrl: '/creatives/creative-sample.png' },
    { id: 'c2', title: 'Variación B — Testimonial', imageUrl: '/creatives/creative-sample.png' },
    { id: 'c3', title: 'Variación C — Problema/Solución', imageUrl: '/creatives/creative-sample.png' },
    { id: 'c4', title: 'Variación D — CTA directo', imageUrl: '/creatives/creative-sample.png' },
  ],
  campaign: {
    objective: 'Tráfico a la landing page',
    targetAudience: 'Adultos 25–40, intereses: alimentación saludable, cocina, bienestar. Excluir: profesionales de nutrición.',
    dailyBudget: 15,
    durationDays: 14,
    adCopy: '¿Cansado de buscar recetas que no puedes comer? NutriRecetas aprende tus restricciones y te sugiere ideas deliciosas con lo que ya tienes en casa. Pruébalo gratis.',
  },
}

export const mockPlaygroundService: IPlaygroundService = {
  async getPlan(_projectId) {
    await delay(200)
    return { ...defaultPlan }
  },

  async approvePlan(_projectId) {
    await delay(500)
  },
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
