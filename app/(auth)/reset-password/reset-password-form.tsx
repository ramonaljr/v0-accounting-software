'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function ResetPasswordForm() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      })

      if (error) {
        setError(error.message)
        return
      }

      setSuccess(true)
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="rounded-md bg-green-900/20 border border-green-900/50 p-4 text-sm text-green-400">
        <p className="font-medium">Check your email</p>
        <p className="mt-2 text-green-400/80">
          We&apos;ve sent you a password reset link. Please check your email and
          click the link to reset your password.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-900/20 border border-red-900/50 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-zinc-300"
          >
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-white placeholder-zinc-500 focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
            placeholder="you@example.com"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-md bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-[#0D0D0D] hover:bg-[#D4AF37]/90 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2 focus:ring-offset-zinc-900 disabled:opacity-50"
        >
          {isLoading ? 'Sending...' : 'Send reset link'}
        </button>
      </form>
    </div>
  )
}
