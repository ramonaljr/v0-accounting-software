export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="relative bg-gradient-to-b from-white to-neutral-50 border-t border-neutral-200">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">

          {/* Brand Column - Wider on desktop */}
          <div className="md:col-span-4 lg:col-span-5">
            <div className="mb-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-[#D4AF37] to-[#C39F2F] bg-clip-text text-transparent">
                OpportunityOS
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-neutral-600 max-w-xs">
                The autonomous accounting platform that handles 85% of your bookkeeping with 98% accuracy.
                Trusted by accountants and SMBs globally.
              </p>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap gap-4 mt-6">
              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>SOC2 Type II</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>GDPR Compliant</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>ISO 27001</span>
              </div>
            </div>
          </div>

          {/* Products & Features */}
          <div className="md:col-span-2 lg:col-span-2">
            <h3 className="font-semibold text-sm text-neutral-900 tracking-wide uppercase mb-4">Product</h3>
            <ul className="space-y-3">
              <li>
                <a href="/features/ai-agents" className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors duration-200">
                  AI Agents
                </a>
              </li>
              <li>
                <a href="/features/reconciliation" className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors duration-200">
                  Reconciliation
                </a>
              </li>
              <li>
                <a href="/features/reporting" className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors duration-200">
                  Reporting
                </a>
              </li>
              <li>
                <a href="/features/integrations" className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors duration-200">
                  Integrations
                </a>
              </li>
              <li>
                <a href="#pricing" className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors duration-200">
                  Pricing
                </a>
              </li>
            </ul>
          </div>

          {/* Solutions */}
          <div className="md:col-span-2 lg:col-span-2">
            <h3 className="font-semibold text-sm text-neutral-900 tracking-wide uppercase mb-4">Solutions</h3>
            <ul className="space-y-3">
              <li>
                <a href="/solutions/small-business" className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors duration-200">
                  Small Business
                </a>
              </li>
              <li>
                <a href="/solutions/accountants" className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors duration-200">
                  Accountants
                </a>
              </li>
              <li>
                <a href="/solutions/enterprises" className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors duration-200">
                  Enterprises
                </a>
              </li>
              <li>
                <a href="/solutions/global" className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors duration-200">
                  Global Teams
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="md:col-span-2 lg:col-span-2">
            <h3 className="font-semibold text-sm text-neutral-900 tracking-wide uppercase mb-4">Resources</h3>
            <ul className="space-y-3">
              <li>
                <a href="/docs" className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors duration-200">
                  Documentation
                </a>
              </li>
              <li>
                <a href="/api" className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors duration-200">
                  API Reference
                </a>
              </li>
              <li>
                <a href="/blog" className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors duration-200">
                  Blog
                </a>
              </li>
              <li>
                <a href="/webinars" className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors duration-200">
                  Webinars
                </a>
              </li>
              <li>
                <a href="/support" className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors duration-200">
                  Support Center
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div className="md:col-span-2 lg:col-span-1">
            <h3 className="font-semibold text-sm text-neutral-900 tracking-wide uppercase mb-4">Company</h3>
            <ul className="space-y-3">
              <li>
                <a href="/about" className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors duration-200">
                  About
                </a>
              </li>
              <li>
                <a href="/careers" className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors duration-200">
                  Careers
                  <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Hiring
                  </span>
                </a>
              </li>
              <li>
                <a href="/press" className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors duration-200">
                  Press
                </a>
              </li>
              <li>
                <a href="/partners" className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors duration-200">
                  Partners
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Newsletter Signup */}
        <div className="mt-12 pt-8 border-t border-neutral-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 mb-2">Stay updated with product news</h3>
              <p className="text-sm text-neutral-600">Get accounting insights and product updates once a month.</p>
            </div>
            <form className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="px-4 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent flex-1 lg:w-64"
              />
              <button
                type="submit"
                className="px-6 py-2 text-sm font-semibold text-black bg-gradient-to-r from-[#D4AF37] to-[#C39F2F] rounded-lg hover:shadow-lg transition-all duration-200 whitespace-nowrap"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-neutral-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <p className="text-sm text-neutral-600">
                © {currentYear} OpportunityOS, Inc. All rights reserved.
              </p>
              <div className="flex items-center gap-4 text-sm">
                <a href="/privacy" className="text-neutral-600 hover:text-neutral-900 transition-colors duration-200">
                  Privacy
                </a>
                <span className="text-neutral-300">·</span>
                <a href="/terms" className="text-neutral-600 hover:text-neutral-900 transition-colors duration-200">
                  Terms
                </a>
                <span className="text-neutral-300">·</span>
                <a href="/security" className="text-neutral-600 hover:text-neutral-900 transition-colors duration-200">
                  Security
                </a>
                <span className="text-neutral-300">·</span>
                <a href="/sitemap" className="text-neutral-600 hover:text-neutral-900 transition-colors duration-200">
                  Sitemap
                </a>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-4">
              <a
                href="https://twitter.com/opportunityos"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-all duration-200"
                aria-label="Twitter"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a
                href="https://linkedin.com/company/opportunityos"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-all duration-200"
                aria-label="LinkedIn"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
              <a
                href="https://github.com/opportunityos"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-all duration-200"
                aria-label="GitHub"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
              <a
                href="https://youtube.com/@opportunityos"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-all duration-200"
                aria-label="YouTube"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
