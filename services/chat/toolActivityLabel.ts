import type { ToolActivity } from '~/types/chat'

const subjects: Record<string, string> = {
  landing_builder_tool: 'landing',
  promote_landing_tool: 'landing',
  image_builder_tool: 'imágenes',
  approve_images_tool: 'imágenes',
  campaign_builder_tool: 'campaña',
  approve_campaign_tool: 'campaña',
  update_project_metadata_tool: 'proyecto',
}

const runningLabels: Record<string, string> = {
  landing_builder_tool: 'Generando landing…',
  promote_landing_tool: 'Publicando landing…',
  image_builder_tool: 'Generando imágenes…',
  approve_images_tool: 'Aprobando imágenes…',
  campaign_builder_tool: 'Configurando campaña…',
  approve_campaign_tool: 'Aprobando campaña…',
  update_project_metadata_tool: 'Actualizando proyecto…',
}

function humanize(name: string) {
  return name.replace(/_tool$/, '').replace(/_/g, ' ')
}

export function toolActivityLabel(activity: ToolActivity): string {
  const subject = subjects[activity.name] ?? humanize(activity.name)

  if (activity.phase === 'running') {
    return runningLabels[activity.name] ?? `Ejecutando ${subject}…`
  }

  return activity.status === 'error' ? `Falló: ${subject}` : `Listo: ${subject}`
}
