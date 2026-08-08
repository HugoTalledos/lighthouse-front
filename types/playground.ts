export interface LandingAsset {
  url: string
  title: string
}

export interface CampaignCreative {
  id: string
  title: string
  imageUrl: string
}

export interface CampaignConfig {
  objective: string
  targetAudience: string
  dailyBudget: number
  durationDays: number
  adCopy: string
}

export interface GeneratedPlan {
  landing: LandingAsset | null
  creatives: CampaignCreative[]
  campaign: CampaignConfig | null
}
