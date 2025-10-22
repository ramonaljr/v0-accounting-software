import { describe, it, expect } from 'vitest'
import { isFeatureEnabled, getEnabledFeatures, requireFeature } from '../feature-flags'

describe('Feature Flags', () => {
  describe('isFeatureEnabled', () => {
    it('should return true for globally enabled features', () => {
      expect(isFeatureEnabled('ai_copilot_enabled')).toBe(true)
    })

    it('should return false for globally disabled features', () => {
      expect(isFeatureEnabled('recon_ai_autopost')).toBe(false)
    })

    it('should respect tier-based access - free tier', () => {
      const context = { tier: 'free' as const }

      // Free tier should not have access to professional features
      expect(isFeatureEnabled('ai_copilot_enabled', context)).toBe(false)

      // Free tier should have access to features with no tier requirement
      expect(isFeatureEnabled('qbo_importer_enabled', context)).toBe(true)
    })

    it('should respect tier-based access - starter tier', () => {
      const context = { tier: 'starter' as const }

      // Starter should have access to starter features
      expect(isFeatureEnabled('bank_feeds_enabled', context)).toBe(true)
      expect(isFeatureEnabled('ocr_receipts_enabled', context)).toBe(true)

      // Starter should not have access to professional features
      expect(isFeatureEnabled('ai_copilot_enabled', context)).toBe(false)
    })

    it('should respect tier-based access - professional tier', () => {
      const context = { tier: 'professional' as const }

      // Professional should have access to professional features
      expect(isFeatureEnabled('ai_copilot_enabled', context)).toBe(true)
      expect(isFeatureEnabled('multi_currency_enabled', context)).toBe(true)
      expect(isFeatureEnabled('dashboard_customization_enabled', context)).toBe(true)

      // Professional should not have access to enterprise-only features
      expect(isFeatureEnabled('recon_ai_autopost', context)).toBe(false)
    })

    it('should respect tier-based access - enterprise tier', () => {
      const context = { tier: 'enterprise' as const }

      // Enterprise should have access to all tier-based features
      expect(isFeatureEnabled('ai_copilot_enabled', context)).toBe(true)
      expect(isFeatureEnabled('multi_currency_enabled', context)).toBe(true)
    })

    it('should handle rollout percentage deterministically', () => {
      const orgId1 = 'org-12345'
      const orgId2 = 'org-67890'

      // Same orgId should always get the same result
      const result1a = isFeatureEnabled('beta_features', { orgId: orgId1 })
      const result1b = isFeatureEnabled('beta_features', { orgId: orgId1 })
      expect(result1a).toBe(result1b)

      const result2a = isFeatureEnabled('beta_features', { orgId: orgId2 })
      const result2b = isFeatureEnabled('beta_features', { orgId: orgId2 })
      expect(result2a).toBe(result2b)
    })

    it('should handle features with 100% rollout', () => {
      expect(isFeatureEnabled('qbo_importer_enabled', { orgId: 'any-org' })).toBe(true)
      expect(isFeatureEnabled('qbo_importer_enabled', { orgId: 'another-org' })).toBe(true)
    })
  })

  describe('getEnabledFeatures', () => {
    it('should return all enabled features for enterprise tier', () => {
      const enabledFeatures = getEnabledFeatures({ tier: 'enterprise' })

      // Should include features that are globally enabled and meet tier requirements
      expect(enabledFeatures).toContain('ai_copilot_enabled')
      expect(enabledFeatures).toContain('qbo_importer_enabled')
      expect(enabledFeatures).toContain('bank_feeds_enabled')

      // Should not include globally disabled features
      expect(enabledFeatures).not.toContain('recon_ai_autopost')
    })

    it('should return limited features for free tier', () => {
      const enabledFeatures = getEnabledFeatures({ tier: 'free' })

      // Should only include features with no tier requirement
      expect(enabledFeatures).toContain('qbo_importer_enabled')

      // Should not include tier-restricted features
      expect(enabledFeatures).not.toContain('ai_copilot_enabled')
      expect(enabledFeatures).not.toContain('bank_feeds_enabled')
    })
  })

  describe('requireFeature', () => {
    it('should not throw for enabled features', () => {
      expect(() => {
        requireFeature('qbo_importer_enabled')
      }).not.toThrow()
    })

    it('should throw for disabled features', () => {
      expect(() => {
        requireFeature('recon_ai_autopost')
      }).toThrow('Feature \'recon_ai_autopost\' is not enabled')
    })

    it('should throw for tier-restricted features', () => {
      expect(() => {
        requireFeature('ai_copilot_enabled', { tier: 'free' })
      }).toThrow('Feature \'ai_copilot_enabled\' is not enabled')
    })

    it('should not throw for features meeting tier requirement', () => {
      expect(() => {
        requireFeature('ai_copilot_enabled', { tier: 'professional' })
      }).not.toThrow()
    })
  })
})
