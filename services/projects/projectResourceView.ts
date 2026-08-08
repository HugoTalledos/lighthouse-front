import type { GeneratedPlan, CampaignConfig } from '~/types/playground'
import type { JsonValue, Project, ResourcePayload } from '~/types/project'

export function toGeneratedPlan(project: Project): GeneratedPlan | null {
  const landing = toLanding(project.resources.landing.payload, project.business_name)
  const creatives = toCreatives(project.resources.images.payload)
  const campaign = toCampaign(project.resources.campaign.payload)

  if (!landing && creatives.length === 0 && !campaign) return null

  return { landing, creatives, campaign }
}

function toLanding(payload: ResourcePayload, businessName: string | null) {
  const previewUrl = stringValue(payload.preview_url)
  if (!previewUrl) return null

  return {
    url: previewUrl,
    title: businessName ?? 'Proyecto sin nombre',
  }
}

function toCreatives(payload: ResourcePayload) {
  const rawCreatives = arrayValue(payload.creatives)
  if (!rawCreatives) return []

  return rawCreatives.flatMap((value, index) => {
    const creative = recordValue(value)
    const imageUrl = creative && stringValue(creative.storage_url)
    if (!creative || !imageUrl) return []

    const variantIndex = numberValue(creative.variant_index)
    const title = stringValue(creative.headline) ?? stringValue(creative.cta_text) ?? `Variante ${index + 1}`
    return [{ id: String(variantIndex ?? index), title, imageUrl }]
  })
}

function toCampaign(payload: ResourcePayload): CampaignConfig | null {
  const config = recordValue(payload.config)
  if (!config) return null

  const adSets = arrayValue(config.ad_sets)?.flatMap(recordValue) ?? []
  const adSet = adSets[0]
  const targeting = adSet && recordValue(adSet.targeting)
  const ads = adSet && arrayValue(adSet.ads)?.flatMap(recordValue)
  const ad = ads?.[0]
  const creative = ad && recordValue(ad.creative)

  return {
    objective: stringValue(config.objective) ?? '',
    targetAudience: formatTargetAudience(targeting),
    dailyBudget: numberValue(adSet?.daily_budget_usd) ?? 0,
    durationDays: numberValue(adSet?.duration_days) ?? 0,
    adCopy: stringValue(creative?.primary_text) ?? '',
  }
}

function formatTargetAudience(targeting: ResourcePayload | undefined): string {
  if (!targeting) return ''
  const countries = stringArrayValue(targeting.countries)
  const interests = stringArrayValue(targeting.interests)
  return [...countries, ...interests].join(', ')
}

function recordValue(value: JsonValue | undefined): ResourcePayload | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value : undefined
}

function arrayValue(value: JsonValue | undefined): JsonValue[] | undefined {
  return Array.isArray(value) ? value : undefined
}

function stringValue(value: JsonValue | undefined): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined
}

function numberValue(value: JsonValue | undefined): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function stringArrayValue(value: JsonValue | undefined): string[] {
  return arrayValue(value)?.flatMap(item => stringValue(item) ? [item] : []) ?? []
}
