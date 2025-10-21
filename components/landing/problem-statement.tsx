"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"

const problems = [
  {
    icon: "⏱️",
    title: "Hours wasted on data entry",
    description: "Every bank transaction, every receipt, every invoice—manually entered and categorized.",
  },
  {
    icon: "❌",
    title: "Error-prone reconciliation",
    description: "Mismatched entries, duplicate transactions, and missing records delay your monthly close.",
  },
  {
    icon: "🌍",
    title: "Complex multi-currency tax",
    description: "Managing FX conversions and regional tax rules across jurisdictions is overwhelming.",
  },
]

export function ProblemStatement() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.3 })

  return (
    <section className="relative py-24 px-4 overflow-hidden bg-gray-50">
      {/* Background effects */}
      <div className="absolute inset-0 z-0">
        <div className="bg-[#D4AF37]/10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto relative z-10" ref={ref}>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-5xl font-bold text-center mb-16 text-gray-900"
        >
          Manual bookkeeping doesn&apos;t scale
        </motion.h2>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {problems.map((problem, index) => (
            <motion.div
              key={problem.title}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-white backdrop-blur-sm border border-gray-200 rounded-2xl p-8 hover:border-[#D4AF37]/30 hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              <div className="text-5xl mb-4">{problem.icon}</div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">{problem.title}</h3>
              <p className="text-gray-600 leading-relaxed">{problem.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
