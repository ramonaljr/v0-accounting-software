'use client'

/**
 * Integrations List Component
 * Display and manage available integrations
 */

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Building2, CreditCard, DollarSign, ShoppingCart, Users } from 'lucide-react'

interface Integration {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  enabled: boolean
  configured: boolean
  category: 'banking' | 'payment' | 'commerce' | 'payroll'
}

export function IntegrationsList({
  isAdmin,
  features,
}: {
  orgId: string
  isAdmin: boolean
  features: Record<string, boolean>
}) {
  const integrations: Integration[] = [
    {
      id: 'plaid',
      name: 'Plaid',
      description: 'Connect US and EU bank accounts for automated transaction feeds',
      icon: <Building2 className="h-5 w-5" />,
      enabled: features.hasPlaid,
      configured: features.hasPlaid,
      category: 'banking',
    },
    {
      id: 'wise',
      name: 'Wise',
      description: 'Global multi-currency accounts and transfers',
      icon: <DollarSign className="h-5 w-5" />,
      enabled: features.hasWise,
      configured: features.hasWise,
      category: 'banking',
    },
    {
      id: 'stripe',
      name: 'Stripe',
      description: 'Payment processing and invoicing',
      icon: <CreditCard className="h-5 w-5" />,
      enabled: features.hasStripe,
      configured: features.hasStripe,
      category: 'payment',
    },
    {
      id: 'paypal',
      name: 'PayPal',
      description: 'Payment gateway integration',
      icon: <CreditCard className="h-5 w-5" />,
      enabled: features.hasPayPal,
      configured: features.hasPayPal,
      category: 'payment',
    },
    {
      id: 'shopify',
      name: 'Shopify',
      description: 'E-commerce order sync to revenue (Coming Soon)',
      icon: <ShoppingCart className="h-5 w-5" />,
      enabled: false,
      configured: false,
      category: 'commerce',
    },
    {
      id: 'gusto',
      name: 'Gusto',
      description: 'Payroll totals integration (Coming Soon)',
      icon: <Users className="h-5 w-5" />,
      enabled: false,
      configured: false,
      category: 'payroll',
    },
  ]

  const categories = {
    banking: 'Banking & Accounts',
    payment: 'Payment Processing',
    commerce: 'E-Commerce',
    payroll: 'Payroll & HR',
  }

  const groupedIntegrations = integrations.reduce((acc, integration) => {
    if (!acc[integration.category]) {
      acc[integration.category] = []
    }
    acc[integration.category].push(integration)
    return acc
  }, {} as Record<string, Integration[]>)

  return (
    <div className="space-y-8">
      {Object.entries(groupedIntegrations).map(([category, items]) => (
        <div key={category}>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">
            {categories[category as keyof typeof categories]}
          </h3>
          <div className="space-y-3">
            {items.map((integration) => (
              <div
                key={integration.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    {integration.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{integration.name}</h4>
                      {integration.configured && (
                        <Badge variant="default" className="bg-green-600">Configured</Badge>
                      )}
                      {!integration.configured && integration.enabled && (
                        <Badge variant="secondary">Ready</Badge>
                      )}
                      {!integration.enabled && (
                        <Badge variant="outline">Coming Soon</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {integration.description}
                    </p>
                  </div>
                </div>
                <div>
                  {integration.configured ? (
                    <Button variant="outline" size="sm" disabled={!isAdmin}>
                      Configure
                    </Button>
                  ) : integration.enabled ? (
                    <Button variant="default" size="sm" disabled={!isAdmin}>
                      Connect
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm" disabled>
                      Coming Soon
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
