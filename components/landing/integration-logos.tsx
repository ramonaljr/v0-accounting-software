"use client"

import { motion } from "framer-motion"

const integrations = [
  { name: "Plaid", description: "Bank Feeds" },
  { name: "Wise", description: "Multi-currency" },
  { name: "Stripe", description: "Payments" },
  { name: "QuickBooks", description: "Migration" },
  { name: "Xero", description: "Migration" },
  { name: "Shopify", description: "Commerce" },
]

export function IntegrationLogos() {
  return (
    <div className="mt-8">
      <p className="text-sm text-gray-500 text-center mb-4">Trusted integrations</p>
      <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8">
        {integrations.map((integration, index) => (
          <motion.div
            key={integration.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
            className="flex flex-col items-center gap-1 opacity-60 hover:opacity-100 transition-opacity duration-300"
          >
            <div className="text-gray-900 font-medium text-sm">{integration.name}</div>
            <div className="text-gray-500 text-xs">{integration.description}</div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
