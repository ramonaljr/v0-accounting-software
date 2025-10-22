import { Metadata } from 'next'
import Link from 'next/link'
import { ResetPasswordForm } from './reset-password-form'

export const metadata: Metadata = {
  title: 'Reset Password | OpportunityOS',
  description: 'Reset your OpportunityOS account password',
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0D0D0D] px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-[#D4AF37]">OpportunityOS</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Accounting that runs itself
          </p>
        </div>

        {/* Reset Password Form */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-8 shadow-lg">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-white">
              Reset your password
            </h2>
            <p className="mt-2 text-sm text-zinc-400">
              Enter your email address and we'll send you a link to reset your
              password.
            </p>
          </div>

          <ResetPasswordForm />

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-sm font-medium text-[#D4AF37] hover:text-[#D4AF37]/80"
            >
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
