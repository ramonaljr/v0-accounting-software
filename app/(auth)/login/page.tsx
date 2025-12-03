import { Metadata } from 'next'
import Link from 'next/link'
import { LoginForm } from './login-form'

export const metadata: Metadata = {
  title: 'Login | Accunza',
  description: 'Sign in to your Accunza account',
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0D0D0D] px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-[#D4AF37]">Accunza</h1>
          <p className="mt-2 text-sm text-zinc-400">Accounting that runs itself</p>
        </div>

        {/* Login Form */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-8 shadow-lg">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-white">Sign in to your account</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="font-medium text-[#D4AF37] hover:text-[#D4AF37]/80">
                Sign up
              </Link>
            </p>
          </div>

          <LoginForm />
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-zinc-500">
          By continuing, you agree to our{' '}
          <Link href="/terms" className="underline hover:text-zinc-400">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="underline hover:text-zinc-400">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  )
}
