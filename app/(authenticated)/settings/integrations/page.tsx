/**
 * Integrations Settings Page
 * Manage ERPNext and other integrations
 */

import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { features } from '@/lib/env'
import { ERPNextHealthDashboard } from '@/components/integrations/erpnext-health'
import { IntegrationsList } from '@/components/integrations/integrations-list'

export default async function IntegrationsPage() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // Get user's organizations
  const { data: memberships } = await supabase
    .from('org_members')
    .select('*, organizations(*)')
    .eq('user_id', user.id)

  const currentOrg = memberships?.[0]?.organizations

  if (!currentOrg) {
    redirect('/onboarding')
  }

  const isAdmin = ['owner', 'admin'].includes(memberships?.[0]?.role)

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Integrations</h1>
        <p className="text-muted-foreground">
          Connect your accounting system with external platforms and services
        </p>
      </div>

      {/* ERPNext Integration */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                ERPNext Integration
                {features.hasERPNext && (
                  <Badge variant="default" className="bg-green-600">Configured</Badge>
                )}
                {!features.hasERPNext && (
                  <Badge variant="secondary">Not Configured</Badge>
                )}
              </CardTitle>
              <CardDescription>
                Sync accounting data with ERPNext for advanced ERP capabilities
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {features.hasERPNext ? (
            <Suspense fallback={<div className="text-sm text-muted-foreground">Loading health status...</div>}>
              <ERPNextHealthDashboard orgId={currentOrg.id} />
            </Suspense>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                ERPNext integration is not configured. Contact your system administrator to set up the following environment variables:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>ERPNEXT_BASE_URL</li>
                <li>ERPNEXT_API_KEY</li>
                <li>ERPNEXT_API_SECRET</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Other Integrations */}
      <Card>
        <CardHeader>
          <CardTitle>Available Integrations</CardTitle>
          <CardDescription>
            Connect with banking, payment, and commerce platforms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <IntegrationsList
            orgId={currentOrg.id}
            isAdmin={isAdmin}
            features={features}
          />
        </CardContent>
      </Card>
    </div>
  )
}
