"use client"

import { useState } from "react"
import { Plus, Minus } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export function FAQ() {
  const [openItems, setOpenItems] = useState<number[]>([])

  const toggleItem = (index: number) => {
    setOpenItems((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]))
  }

  const faqs = [
    {
      question: "How does AI categorization work?",
      answer:
        "LedgerBot analyzes transaction descriptions, merchant data, amounts, and historical patterns to suggest GL codes and tax categories. Suggestions with ≥90% confidence auto-post; lower confidence queues for your review. You can correct any suggestion and the AI learns from your feedback.",
    },
    {
      question: "Is my bank data secure?",
      answer:
        "Yes. We use bank-grade AES-256 encryption at rest and TLS 1.3 in transit. Bank access tokens are stored with field-level encryption. We're SOC2 ready and GDPR compliant. You can revoke bank access anytime, and we never share your financial data.",
    },
    {
      question: "What regions and currencies do you support?",
      answer:
        "At launch: US, EU, Philippines, and Japan with automated tax rules for sales tax, VAT, BIR, and consumption tax. We support 40+ currencies with daily FX rate updates. Additional regions and tax jurisdictions are added based on customer demand.",
    },
    {
      question: "Can I migrate from QuickBooks or Xero?",
      answer:
        "Yes. We provide CSV import templates and starter migration tools for QuickBooks Online and Xero. You can import your chart of accounts, historical transactions, vendors, and customers. Our team provides migration support on Pro and Enterprise plans.",
    },
    {
      question: "How accurate is AI reconciliation?",
      answer:
        "ReconAI achieves 98%+ accuracy on sampled reconciliations. It matches bank ↔ ledger ↔ payments using amount, date, reference, and description. For partial matches or differences, it queues items for review with explanations. You approve all matches with one click.",
    },
    {
      question: "Do I still need an accountant?",
      answer:
        "OpportunityOS automates routine bookkeeping, but accountants bring strategic value: tax planning, financial advice, audits, and compliance filings. Our accountant workspace makes it easy for your accountant to review, approve, and advise across all your books.",
    },
    {
      question: "What integrations are available?",
      answer:
        "Phase 1: Plaid (bank feeds), Wise (multi-currency), Stripe (payments), PayPal (payments), Shopify (commerce orders), Gusto (payroll totals). Phase 2: WooCommerce, Square, and custom API integrations. Check our marketplace for the latest.",
    },
    {
      question: "Can I export my data anytime?",
      answer:
        "Absolutely. Export reports as CSV or PDF. Download complete audit logs (with cryptographic signatures) as JSON. Export your full chart of accounts, transactions, and journal entries anytime. You own your data—no lock-in.",
    },
  ]

  return (
    <section id="faq" className="relative overflow-hidden pb-24 pt-24 bg-gray-50">
      {/* Background blur effects */}
      <div className="bg-[#D4AF37]/10 absolute top-1/2 -right-20 z-[-1] h-64 w-64 rounded-full blur-3xl"></div>
      <div className="bg-[#D4AF37]/10 absolute top-1/2 -left-20 z-[-1] h-64 w-64 rounded-full blur-3xl"></div>

      <div className="z-10 container mx-auto px-4">
        <motion.div
          className="flex justify-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="border-[#D4AF37]/40 text-[#D4AF37] inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 uppercase">
            <span>✶</span>
            <span className="text-sm">Faqs</span>
          </div>
        </motion.div>

        <motion.h2
          className="mx-auto mt-6 max-w-xl text-center text-4xl font-medium text-gray-900 md:text-[54px] md:leading-[60px]"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          Questions? We&apos;ve got{" "}
          <span className="bg-gradient-to-b from-gray-900 via-[#D4AF37] to-[#D4AF37] bg-clip-text text-transparent">
            answers
          </span>
        </motion.h2>

        <div className="mx-auto mt-12 flex max-w-xl flex-col gap-6">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg transition-all duration-300 hover:border-[#D4AF37]/30 hover:shadow-xl cursor-pointer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => toggleItem(index)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  toggleItem(index)
                }
              }}
            >
              <div className="flex items-start justify-between">
                <h3 className="m-0 font-medium pr-4 text-gray-900">{faq.question}</h3>
                <motion.div
                  animate={{ rotate: openItems.includes(index) ? 180 : 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className=""
                >
                  {openItems.includes(index) ? (
                    <Minus className="text-[#D4AF37] flex-shrink-0 transition duration-300" size={24} />
                  ) : (
                    <Plus className="text-[#D4AF37] flex-shrink-0 transition duration-300" size={24} />
                  )}
                </motion.div>
              </div>
              <AnimatePresence>
                {openItems.includes(index) && (
                  <motion.div
                    className="mt-4 text-gray-600 leading-relaxed overflow-hidden"
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: "auto", marginTop: 16 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    transition={{
                      duration: 0.4,
                      ease: "easeInOut",
                      opacity: { duration: 0.2 },
                    }}
                  >
                    {faq.answer}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
