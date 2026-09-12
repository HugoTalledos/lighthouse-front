import { describe, expect, it } from 'vitest'
import { toolActivityLabel } from './toolActivityLabel'

describe('toolActivityLabel', () => {
  it('describes known tools while they run', () => {
    expect(toolActivityLabel({ name: 'landing_builder_tool', phase: 'running' })).toBe('Generando landing…')
    expect(toolActivityLabel({ name: 'promote_landing_tool', phase: 'running' })).toBe('Publicando landing…')
    expect(toolActivityLabel({ name: 'image_builder_tool', phase: 'running' })).toBe('Generando imágenes…')
    expect(toolActivityLabel({ name: 'approve_images_tool', phase: 'running' })).toBe('Aprobando imágenes…')
    expect(toolActivityLabel({ name: 'campaign_builder_tool', phase: 'running' })).toBe('Configurando campaña…')
    expect(toolActivityLabel({ name: 'approve_campaign_tool', phase: 'running' })).toBe('Aprobando campaña…')
    expect(toolActivityLabel({ name: 'update_project_metadata_tool', phase: 'running' })).toBe('Actualizando proyecto…')
  })

  it('reports a finished tool', () => {
    expect(toolActivityLabel({ name: 'image_builder_tool', phase: 'done', status: 'success' })).toBe('Listo: imágenes')
    expect(toolActivityLabel({ name: 'image_builder_tool', phase: 'done', status: 'error' })).toBe('Falló: imágenes')
  })

  it('falls back to a humanized tool name', () => {
    expect(toolActivityLabel({ name: 'search_web_tool', phase: 'running' })).toBe('Ejecutando search web…')
    expect(toolActivityLabel({ name: 'search_web_tool', phase: 'done', status: 'success' })).toBe('Listo: search web')
  })
})
