'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Sparkles } from 'lucide-react'
import { TrustBar } from './trust-bar'
import { IntegrationLogos } from './integration-logos'

export default function Hero() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <section className="relative overflow-hidden min-h-screen flex flex-col bg-linear-to-b from-white to-neutral-50/30">
      <div className="container mx-auto px-6 py-20 sm:py-24 lg:py-32 relative z-10 flex-1 flex flex-col">
        <div className="mx-auto max-w-5xl text-center flex-1 flex flex-col justify-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200/50 text-xs font-medium text-amber-900">
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              <span className="uppercase tracking-wider">AI-Powered Accounting Platform</span>
            </div>
          </motion.div>

          {/* Main Heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-6"
          >
            <h1 className="text-5xl font-bold tracking-tight text-neutral-900 sm:text-6xl lg:text-7xl xl:text-8xl leading-[1.1]">
              Accounting that{' '}
              <span className="bg-linear-to-r from-[#D4AF37] via-[#DAB743] to-[#C39F2F] bg-clip-text text-transparent">
                runs itself
              </span>
            </h1>
          </motion.div>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto mb-10 max-w-3xl text-lg sm:text-xl text-neutral-600 leading-relaxed font-normal"
          >
            Autonomous reconciliation, AI categorization, and global compliance for modern
            businesses. Let Accunza handle{' '}
            <span className="font-semibold text-neutral-700">85% of your bookkeeping</span> with{' '}
            <span className="font-semibold text-neutral-700">98% accuracy</span>.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
          >
            <a
              href="/signup"
              className="group relative inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-black bg-linear-to-r from-[#D4AF37] to-[#C39F2F] rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 w-full sm:w-auto"
            >
              Start free trial
              <svg
                className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </a>
            <a
              href="#demo"
              className="group inline-flex items-center justify-center px-8 py-3.5 text-base font-medium border-2 border-neutral-200 bg-white text-neutral-700 rounded-xl hover:bg-neutral-50 hover:border-neutral-300 transform hover:-translate-y-0.5 transition-all duration-200 w-full sm:w-auto"
            >
              <svg
                className="mr-2 w-4 h-4 text-neutral-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                  clipRule="evenodd"
                />
              </svg>
              Watch 2-min demo
            </a>
          </motion.div>

          {/* Trust Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mb-8"
          >
            <TrustBar />
          </motion.div>

          {/* Integration Logos */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <IntegrationLogos />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
