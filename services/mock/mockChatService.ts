import type { ChatSession, ChatStreamHandlers, IChatService } from '../interfaces'
import type { ChatMessage } from '~/types/chat'

function msg(id: string, projectId: string, role: ChatMessage['role'], content: string, minutesAgo: number): ChatMessage {
  return {
    id,
    projectId,
    role,
    content,
    timestamp: new Date(Date.now() - minutesAgo * 60_000),
  }
}

const preloadedConversation: ChatMessage[] = [
  msg('m1', '__any__', 'agent',
    '¡Hola! Soy Lighthouse. Estoy aquí para ayudarte a validar tu idea de negocio: juntos definiremos el problema, el cliente objetivo y los criterios de éxito. Después generaré una landing page, creativos y una campaña de Facebook Ads lista para lanzar.\n\n¿Cuál es la idea que quieres explorar hoy?',
    18),
  msg('m2', '__any__', 'user',
    'Quiero crear una app de recetas personalizadas para personas con restricciones alimentarias: veganos, celíacos, diabéticos. La idea es que la app aprenda tus preferencias y te sugiera recetas que se adapten exactamente a lo que puedes comer.',
    17),
  msg('m3', '__any__', 'agent',
    'Me gusta mucho. Antes de avanzar, necesito entender mejor el dolor concreto:\n\n¿Cuál es el momento más frustrante para alguien con restricciones alimentarias? ¿Es encontrar recetas nuevas, leer etiquetas en el supermercado, comer fuera de casa, o algo distinto?',
    16),
  msg('m4', '__any__', 'user',
    'Principalmente encontrar recetas nuevas que no sean aburridas y que puedan hacer con ingredientes normales que ya tienen en casa. La mayoría de recetas "sin gluten" o "veganas" que encuentran online requieren productos muy específicos que no tienen.',
    15),
  msg('m5', '__any__', 'agent',
    'Perfecto, eso es un dolor muy específico. Ahora dime: ¿quién crees que es tu cliente principal? ¿La persona con la restricción (el usuario que cocina), alguien que cocina para ellos (un familiar), o ambos?',
    14),
  msg('m6', '__any__', 'user',
    'Principalmente la persona con la restricción que cocina para sí misma. Suelen ser adultos de 25 a 40 años, con cierto interés por la salud y la cocina, pero sin ser chefs ni foodies extremos. Personas que quieren comer bien sin complicarse la vida.',
    13),
  msg('m7', '__any__', 'agent',
    'Claro. Última pregunta antes de generar: ¿cómo sabrías que la idea funciona? ¿Qué indicador te haría decir "esto vale la pena seguir construyendo"? Por ejemplo: X usuarios activos en 30 días, una tasa de retorno semanal, o que alguien pague por una suscripción.',
    12),
  msg('m8', '__any__', 'user',
    'Si en las primeras 4 semanas consigo 200 usuarios activos que abran la app al menos 3 veces por semana, lo consideraría una señal real de que el hábito se puede formar. Y si 20 de ellos pagan por una suscripción premium, ya es validación de disposición a pagar.',
    11),
  msg('m9', '__any__', 'system',
    '⚡ Generando landing page, creativos publicitarios y configuración de campaña…',
    10),
  msg('m10', '__any__', 'agent',
    'Listo. He generado los tres recursos para tu idea **NutriRecetas**:\n\n— **Landing page**: muestra la propuesta de valor, los beneficios clave y un CTA para descarga.\n— **Creativos**: tres variaciones de anuncio para Facebook e Instagram.\n— **Campaña**: configuración inicial con objetivo de tráfico, segmentación y presupuesto sugerido.\n\nRevísalos en el panel lateral. Cuando estés conforme, acepta el plan y los recursos quedarán listos para publicar.',
    9),
]

const agentResponses = [
  '¡Buena pregunta! Para eso te recomendaría empezar con una landing simple y medir el interés antes de construir la app completa. ¿Quieres que ajuste la campaña para ese enfoque?',
  'Entiendo. Podemos refinar la segmentación de la campaña para llegar exactamente a ese perfil. ¿Hay algún interés específico (yoga, running, cocina saludable) que quieras incluir como criterio?',
  'Perfecto. Esa información me ayuda a afinar el copy de los anuncios. ¿Revisamos juntos el texto de la campaña para asegurarnos de que resuene con tu audiencia?',
  'De acuerdo. He tomado nota. ¿Hay algo más que quieras ajustar en la landing o en los creativos antes de dar luz verde?',
  'Muy bien. Todo lo que describiste está reflejado en el plan actual. Cuando quieras, acepta los recursos y estarás listo para lanzar.',
]

let responseIndex = 0

const messageStore = new Map<string, ChatMessage[]>()

export const mockChatService: IChatService = {
  async getConversation(projectId): Promise<ChatSession> {
    await delay(150)
    if (!messageStore.has(projectId)) {
      messageStore.set(projectId, preloadedConversation.map(m => ({ ...m, projectId })))
    }
    return { threadId: null, messages: messageStore.get(projectId)! }
  },

  async saveConversation(projectId, session) {
    messageStore.set(projectId, session.messages)
  },

  async sendMessage(projectId, content, options?: ChatStreamHandlers) {
    await delay(100)
    const messages = messageStore.get(projectId) ?? []
    const userMsg: ChatMessage = {
      id: `u${Date.now()}`,
      projectId,
      role: 'user',
      content,
      timestamp: new Date(),
    }
    messages.push(userMsg)

    await delay(1200)
    const agentMsg: ChatMessage = {
      id: `a${Date.now()}`,
      projectId,
      role: 'agent',
      content: agentResponses[responseIndex % agentResponses.length]!,
      timestamp: new Date(),
    }
    responseIndex++
    messages.push(agentMsg)
    messageStore.set(projectId, messages)
    options?.onMessage?.(agentMsg.content)

    return agentMsg
  },
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
