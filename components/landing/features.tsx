"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { Building2, Receipt, Globe, MessageSquare } from "lucide-react"

const features = [
  {
    icon: Building2,
    title: "Connect your accounts",
    description: "Plaid for US/EU banks and Wise for global multi-currency accounts. Nightly sync with retry logic and health monitoring.",
    points: [
      "Auto-sync every night",
      "Webhook support for real-time updates",
      "De-duplication and retry on failure",
      "Feed health metrics per account",
    ],
  },
  {
    icon: Receipt,
    title: "Scan receipts from your phone",
    description: "Mobile camera capture extracts vendor, date, total, tax, and currency. Auto-categorizes and detects duplicates.",
    points: [
      "Multi-page PDF support",
      "Auto-crop and deskew",
      "Line-item extraction (optional)",
      "Receipt-to-entry audit link",
    ],
  },
  {
    icon: Globe,
    title: "Global-ready from day one",
    description: "Manage FX rates, currency conversion, and revaluation across 4 regions. Expand to 100+ jurisdictions as you scale.",
    points: [
      "Daily FX rate updates",
      "Multi-currency invoicing",
      "Revaluation support",
      "Per-org currency defaults",
    ],
  },
  {
    icon: MessageSquare,
    title: "Ask anything in plain English",
    description: "Natural language queries → actions. 'Reconcile October,' 'Show Q3 P&L,' 'Flag unusual spend.' Dry-run previews before execution.",
    points: [
      "Intent-to-action engine",
      "RBAC-aware permissions",
      "Confirmation for postings",
      "Inline explanations",
    ],
  },
]

export function Features() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })

  return (
    <section id="features" className="relative py-24 px-4 overflow-hidden bg-gray-50">
      {/* Background effects */}
      <div className="absolute inset-0 z-0">
        <div className="bg-[#D4AF37]/10 absolute top-0 left-1/2 -translate-x-1/2 h-64 w-64 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto relative z-10" ref={ref}>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-5xl font-bold text-center mb-16 text-gray-900"
        >
          Everything you need to close faster
        </motion.h2>

        <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white backdrop-blur-sm border border-gray-200 rounded-2xl p-8 hover:border-[#D4AF37]/30 hover:shadow-lg transition-all duration-300 group"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 bg-[#D4AF37]/10 rounded-lg border border-[#D4AF37]/30 group-hover:bg-[#D4AF37]/20 transition-colors">
                    <Icon className="w-6 h-6 text-[#D4AF37]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-2 text-gray-900">{feature.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
                <ul className="space-y-2 mt-6">
                  {feature.points.map((point) => (
                    <li key={point} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-[#D4AF37] mt-0.5">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
