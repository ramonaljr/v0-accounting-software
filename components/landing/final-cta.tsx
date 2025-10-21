"use client"

import { motion } from "framer-motion"

export function FinalCTA() {
  return (
    <section className="relative py-24 px-4 overflow-hidden bg-white">
      {/* Background effects */}
      <div className="absolute inset-0 z-0">
        <div className="bg-[#D4AF37]/10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-gray-900">
            Stop doing bookkeeping.
            <br />
            <span className="text-[#D4AF37]">Start growing your business.</span>
          </h2>

          <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Join accountants and SMBs automating their monthly close with AI that explains every decision.
          </p>

          <motion.a
            href="/signup"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-block rounded-lg font-bold bg-gradient-to-b from-[#D4AF37] to-[#C39F2F] text-black shadow-lg px-10 py-5 text-lg mb-6 hover:shadow-[#D4AF37]/40 transition-all duration-200"
          >
            Start free for 14 days
          </motion.a>

          <p className="text-sm text-gray-500 mb-8">
            No credit card required • Full access to AI agents • Cancel anytime
          </p>

          {/* Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span>🔒</span>
              <span>Bank-grade encryption</span>
            </div>
            <span className="hidden sm:inline text-gray-300">•</span>
            <div className="flex items-center gap-2">
              <span>✓</span>
              <span>SOC2 ready</span>
            </div>
            <span className="hidden sm:inline text-gray-300">•</span>
            <div className="flex items-center gap-2">
              <span>🌍</span>
              <span>GDPR compliant</span>
            </div>
            <span className="hidden sm:inline text-gray-300">•</span>
            <div className="flex items-center gap-2">
              <span>📊</span>
              <span>99.9% uptime SLA</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
