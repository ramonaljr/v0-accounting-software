import { test, expect } from '@playwright/test'

test.describe('Landing Page', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/')

    // Check that the page loads
    await expect(page).toHaveTitle(/OpportunityOS|Accounting/)

    // Check for main heading or CTA
    const heading = page.getByRole('heading', { level: 1 })
    await expect(heading).toBeVisible()
  })

  test('should have working navigation', async ({ page }) => {
    await page.goto('/')

    // Test basic navigation exists
    const nav = page.locator('nav')
    await expect(nav).toBeVisible()
  })

  test('should be responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    // Page should still render
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Authentication', () => {
  test('should show login page', async ({ page }) => {
    await page.goto('/auth/login')

    // Should have login form elements
    const emailInput = page.getByRole('textbox', { name: /email/i })
    const passwordInput = page.getByLabel(/password/i)

    await expect(emailInput).toBeVisible()
    await expect(passwordInput).toBeVisible()
  })
})
