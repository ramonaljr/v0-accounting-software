/**
 * Feature Flags System
 * Enables gradual rollout and A/B testing of features
 */

export type FeatureFlag =
  | 'ai_copilot_enabled'
  | 'recon_ai_autopost'
  | 'qbo_importer_enabled'
  | 'beta_features'
  | 'bank_feeds_enabled'
  | 'multi_currency_enabled'
  | 'ocr_receipts_enabled'
  | 'reports_v2_enabled'
  | 'dashboard_customization_enabled'
  | 'ai_categorization_enabled'
  | 'ai_insights_enabled'
  | 'advanced_reconciliation_enabled'
  | 'workflow_automation_enabled'

interface FeatureFlagConfig {
  enabled: boolean
  description: string
  rolloutPercentage?: number // 0-100, for gradual rollouts
  allowedOrgs?: string[] // Specific orgs that have access
  allowedUsers?: string[] // Specific users that have access
  minimumTier?: 'free' | 'starter' | 'professional' | 'enterprise' // Tier-based access
}

const featureFlagDefaults: Record<FeatureFlag, FeatureFlagConfig> = {
  ai_copilot_enabled: {
    enabled: true,
    description: 'AI Co-Pilot chat interface',
    rolloutPercentage: 100,
    minimumTier: 'professional',
  },
  recon_ai_autopost: {
    enabled: false,
    description: 'Auto-post high-confidence reconciliation matches',
    rolloutPercentage: 0,
    minimumTier: 'enterprise',
  },
  qbo_importer_enabled: {
    enabled: true,
    description: 'QuickBooks Online data importer',
    rolloutPercentage: 100,
  },
  beta_features: {
    enabled: false,
    description: 'Access to beta features',
    rolloutPercentage: 10,
  },
  bank_feeds_enabled: {
    enabled: true,
    description: 'Bank feed integration with Plaid',
    rolloutPercentage: 100,
    minimumTier: 'starter',
  },
  multi_currency_enabled: {
    enabled: true,
    description: 'Multi-currency support',
    rolloutPercentage: 100,
    minimumTier: 'professional',
  },
  ocr_receipts_enabled: {
    enabled: true,
    description: 'OCR receipt scanning',
    rolloutPercentage: 100,
    minimumTier: 'starter',
  },
  reports_v2_enabled: {
    enabled: false,
    description: 'New reports interface (v2)',
    rolloutPercentage: 25,
  },
  dashboard_customization_enabled: {
    enabled: true,
    description: 'Customizable dashboard layouts',
    rolloutPercentage: 100,
    minimumTier: 'professional',
  },
  ai_categorization_enabled: {
    enabled: true,
    description: 'AI-powered transaction categorization',
    rolloutPercentage: 100,
    minimumTier: 'starter',
  },
  ai_insights_enabled: {
    enabled: true,
    description: 'AI-powered insights and anomaly detection',
    rolloutPercentage: 80,
    minimumTier: 'professional',
  },
  advanced_reconciliation_enabled: {
    enabled: true,
    description: 'Advanced reconciliation features',
    rolloutPercentage: 100,
    minimumTier: 'professional',
  },
  workflow_automation_enabled: {
    enabled: false,
    description: 'Custom workflow automation',
    rolloutPercentage: 50,
    minimumTier: 'enterprise',
  },
}

/**
 * Check if a feature flag is enabled for a given context
 */
export function isFeatureEnabled(
  flag: FeatureFlag,
  context?: {
    orgId?: string
    userId?: string
    tier?: 'free' | 'starter' | 'professional' | 'enterprise'
  }
): boolean {
  const config = featureFlagDefaults[flag]

  // Check if flag is globally disabled
  if (!config.enabled) {
    return false
  }

  // Check tier-based access
  if (config.minimumTier && context?.tier) {
    const tierOrder = ['free', 'starter', 'professional', 'enterprise']
    const userTierIndex = tierOrder.indexOf(context.tier)
    const requiredTierIndex = tierOrder.indexOf(config.minimumTier)

    if (userTierIndex < requiredTierIndex) {
      return false
    }
  }

  // Check specific org allowlist
  if (config.allowedOrgs && context?.orgId) {
    if (!config.allowedOrgs.includes(context.orgId)) {
      return false
    }
  }

  // Check specific user allowlist
  if (config.allowedUsers && context?.userId) {
    if (!config.allowedUsers.includes(context.userId)) {
      return false
    }
  }

  // Check rollout percentage
  if (config.rolloutPercentage !== undefined && config.rolloutPercentage < 100) {
    // Use deterministic hash based on orgId or userId
    const hashInput = context?.orgId || context?.userId || ''
    const hash = simpleHash(hashInput + flag)
    const percentage = hash % 100

    if (percentage >= config.rolloutPercentage) {
      return false
    }
  }

  return true
}

/**
 * Get all enabled features for a given context
 */
export function getEnabledFeatures(context?: {
  orgId?: string
  userId?: string
  tier?: 'free' | 'starter' | 'professional' | 'enterprise'
}): FeatureFlag[] {
  return (Object.keys(featureFlagDefaults) as FeatureFlag[]).filter((flag) =>
    isFeatureEnabled(flag, context)
  )
}

/**
 * Get feature flag configuration
 */
export function getFeatureFlagConfig(flag: FeatureFlag): FeatureFlagConfig {
  return featureFlagDefaults[flag]
}

/**
 * Simple hash function for deterministic rollout
 */
function simpleHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash)
}

/**
 * Feature flag hook for React components
 */
export function useFeatureFlag(
  flag: FeatureFlag,
  context?: {
    orgId?: string
    userId?: string
    tier?: 'free' | 'starter' | 'professional' | 'enterprise'
  }
): boolean {
  return isFeatureEnabled(flag, context)
}

/**
 * Feature flag guard for server actions
 */
export function requireFeature(
  flag: FeatureFlag,
  context?: {
    orgId?: string
    userId?: string
    tier?: 'free' | 'starter' | 'professional' | 'enterprise'
  }
) {
  if (!isFeatureEnabled(flag, context)) {
    throw new Error(`Feature '${flag}' is not enabled for this account`)
  }
}
