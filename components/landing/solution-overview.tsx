'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const agents = [
  {
    icon: '🤖',
    title: 'LedgerBot',
    subtitle: 'Auto-categorization',
    description:
      'Categorizes bank transactions with 98% accuracy. Confidence ≥90% auto-posts; lower confidence queues for review.',
    metric: '85%+ fully automated',
  },
  {
    icon: '✓',
    title: 'ReconAI',
    subtitle: 'One-click reconciliation',
    description:
      'Matches bank ↔ ledger ↔ payments automatically. Handles partial matches and posts differences with explanations.',
    metric: '2 hours to close',
  },
  {
    icon: '🔍',
    title: 'InsightAI',
    subtitle: 'Anomaly detection',
    description:
      'Flags unusual amounts, duplicates, vendor changes, and category drift—before they become problems.',
    metric: 'Real-time alerts',
  },
  {
    icon: '📊',
    title: 'ReportGen',
    subtitle: 'Narrative reports',
    description:
      'P&L, Balance Sheet, Cash Flow with drill-down to source transactions. Scheduled delivery and CSV/PDF exports.',
    metric: '< 4 seconds',
  },
  {
    icon: '🌐',
    title: 'TaxAI',
    subtitle: 'Global tax intelligence',
    description:
      'Applies US sales tax, EU VAT, Philippines BIR, and Japan consumption tax automatically with threshold alerts.',
    metric: '4 regions at launch',
  },
  {
    icon: '💬',
    title: 'ExplainBot',
    subtitle: 'Explainable AI',
    description:
      "Every AI action includes sources, rules applied, and historical references. Inline 'Why?' on all suggestions.",
    metric: 'Full transparency',
  },
]

export function SolutionOverview() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })

  return (
    <section className="relative py-24 px-4 overflow-hidden bg-white">
      {/* Background effects */}
      <div className="absolute inset-0 z-0">
        <div className="bg-[#D4AF37]/10 absolute top-1/4 right-1/4 h-96 w-96 rounded-full blur-3xl"></div>
        <div className="bg-[#D4AF37]/10 absolute bottom-1/4 left-1/4 h-96 w-96 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto relative z-10" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 max-w-3xl mx-auto"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
            AI agents that handle the work
          </h2>
          <p className="text-lg text-gray-600 leading-relaxed">
            Accunza uses autonomous agents with explainable AI to categorize, reconcile, and
            report—while you maintain full oversight.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {agents.map((agent, index) => (
            <motion.div
              key={agent.title}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-white backdrop-blur-sm border border-gray-200 rounded-2xl p-6 hover:border-[#D4AF37]/30 hover:shadow-lg transition-all duration-300 hover:scale-105 group"
            >
              <div className="text-4xl mb-4">{agent.icon}</div>
              <h3 className="text-xl font-bold mb-1">{agent.title}</h3>
              <div className="text-[#D4AF37] text-sm font-medium mb-3">{agent.subtitle}</div>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">{agent.description}</p>
              <div className="inline-block bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-full px-3 py-1 text-xs font-medium text-[#D4AF37]">
                {agent.metric}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
