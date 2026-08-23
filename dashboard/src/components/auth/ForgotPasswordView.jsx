import React, { useState } from 'react'
import { Button, Input } from '../common/UIPrimitives'
import { useAppState } from '../../context/AppStateContext'

export function ForgotPasswordView() {
  const { navigateTo, showToast } = useAppState()
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitted(true)
    showToast('Reset password link sent to your email!', 'info')
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">Reset Password</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Enter your email to receive a secure password reset link
          </p>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button type="submit" fullWidth size="lg">
              Send Reset Link
            </Button>
          </form>
        ) : (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 rounded-xl text-center text-xs space-y-2 border border-emerald-200 dark:border-emerald-800">
            <p className="font-bold text-sm">Check Your Email Inbox</p>
            <p>We've sent password reset instructions to <strong>{email}</strong>.</p>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700 text-center">
          <button
            onClick={() => navigateTo('signin')}
            className="text-xs text-[#2B6CB0] dark:text-[#63B3ED] font-bold hover:underline"
          >
            ← Return to Sign In
          </button>
        </div>
      </div>
    </div>
  )
}
