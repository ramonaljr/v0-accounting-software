"use client"

import { motion } from "framer-motion"
import { Check, Sparkles } from "lucide-react"
import { useState } from "react"

const pricingPlans = [
  {
    name: "Starter",
    price: "Free",
    period: "14 days",
    description: "For freelancers and micro-businesses testing automation",
    features: [
      "1 bank connection",
      "100 transactions/month",
      "Basic reports (P&L, Balance Sheet)",
      "Email support",
      "Standard AI categorization",
    ],
    popular: false,
    cta: "Start free trial",
  },
  {
    name: "Pro",
    monthlyPrice: 49,
    annualPrice: 39,
    description: "For SMEs ready to automate bookkeeping",
    features: [
      "Unlimited bank connections",
      "Unlimited transactions",
      "AI Co-Pilot with natural language",
      "Multi-currency support",
      "OCR receipt scanning",
      "Accountant access (1 seat)",
      "Integrations marketplace",
      "Priority email support",
    ],
    popular: true,
    cta: "Start free trial",
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For accountants and firms managing multiple clients",
    features: [
      "Everything in Pro",
      "Multi-client workspace",
      "SSO/SAML authentication",
      "Data residency controls (US/EU/APAC)",
      "Advanced RBAC with approval workflows",
      "Audit log exports with signatures",
      "Dedicated support + SLA",
      "Custom integrations",
    ],
    popular: false,
    cta: "Contact sales",
  },
]

export function Pricing() {
  const [isAnnual, setIsAnnual] = useState(true)

  return (
    <section id="pricing" className="relative py-24 px-6 bg-gradient-to-b from-white to-neutral-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200/50 mb-6"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-xs font-medium text-amber-900 uppercase tracking-wider">Simple Pricing</span>
          </motion.div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-neutral-900 mb-4">
            Plans that scale with your business
          </h2>

          <p className="text-lg sm:text-xl text-neutral-600 max-w-2xl mx-auto mb-10">
            Start with a 14-day free trial. No credit card required. Upgrade anytime.
          </p>

          {/* Monthly/Annual Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center p-1 bg-neutral-100 rounded-full w-auto"
          >
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                !isAnnual ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-200 relative ${
                isAnnual ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              Annual
              {isAnnual && (
                <span className="absolute -top-3 -right-3 bg-green-600 text-white text-xs font-semibold px-2 py-1 rounded-full">
                  Save 20%
                </span>
              )}
            </button>
          </motion.div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {pricingPlans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`relative rounded-2xl p-8 transition-all duration-300 ${
                plan.popular
                  ? "bg-white border-2 border-[#D4AF37] shadow-xl scale-105 lg:scale-110"
                  : "bg-white border border-neutral-200 shadow-lg hover:shadow-xl"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                  <div className="bg-gradient-to-r from-[#D4AF37] to-[#C39F2F] text-black text-xs font-bold uppercase tracking-wide px-4 py-2 rounded-full shadow-lg">
                    Most Popular
                  </div>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-neutral-900 mb-3">{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-1 mb-3">
                  {plan.price ? (
                    <>
                      <span className="text-5xl font-bold text-neutral-900">{plan.price}</span>
                      {plan.period && <span className="text-neutral-500 text-base ml-2">/ {plan.period}</span>}
                    </>
                  ) : (
                    <>
                      <span className="text-5xl font-bold text-neutral-900">
                        ${isAnnual ? plan.annualPrice : plan.monthlyPrice}
                      </span>
                      <span className="text-neutral-500 text-base ml-2">/month</span>
                    </>
                  )}
                </div>
                <p className="text-neutral-600 text-sm leading-relaxed">{plan.description}</p>
              </div>

              <div className="border-t border-neutral-100 pt-6 mb-8">
                <ul className="space-y-4">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-full bg-green-100 p-1 flex-shrink-0">
                        <Check className="w-3.5 h-3.5 text-green-600" />
                      </div>
                      <span className="text-neutral-700 text-sm leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <motion.a
                href={plan.cta === "Contact sales" ? "/contact" : "/signup"}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`block w-full py-3.5 px-6 rounded-xl font-semibold text-center transition-all duration-200 ${
                  plan.popular
                    ? "bg-gradient-to-r from-[#D4AF37] to-[#C39F2F] text-black shadow-lg hover:shadow-xl"
                    : plan.cta === "Contact sales"
                    ? "bg-neutral-900 text-white hover:bg-neutral-800"
                    : "bg-white text-neutral-900 border-2 border-neutral-200 hover:border-neutral-300"
                }`}
              >
                {plan.cta}
              </motion.a>
            </motion.div>
          ))}
        </div>

        {/* Bottom Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-16"
        >
          <p className="text-gray-500 mb-2">
            All plans include bank-grade encryption, SOC2 controls, and GDPR compliance.
          </p>
          <motion.a
            href="/contact"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-[#D4AF37] hover:text-[#C39F2F] font-medium transition-colors"
          >
            Need help choosing? Talk to our team →
          </motion.a>
        </motion.div>
      </div>
    </section>
  )
}
