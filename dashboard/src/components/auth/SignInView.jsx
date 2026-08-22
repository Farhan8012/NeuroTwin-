import React, { useState } from 'react'
import { useAppState } from '../../context/AppStateContext'

export function SignInView() {
  const { login, navigateTo } = useAppState()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('caregiver')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!email || !password) return
    login(role, email.split('@')[0] || email)
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl border border-outline-variant/40 dark:border-slate-700 shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary dark:bg-primary-fixed text-on-primary dark:text-primary flex items-center justify-center text-2xl font-extrabold mx-auto mb-3 shadow-md">
            <span className="material-symbols-outlined text-[32px]">psychology</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-primary dark:text-primary-fixed">Sign in to NeuroTwin</h2>
          <p className="text-xs text-on-surface-variant dark:text-slate-400 mt-1">
            Production Healthcare & Cognitive Memory Platform
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-on-surface-variant dark:text-slate-300 block mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surface-container-low dark:bg-slate-900 border border-outline-variant/50 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-on-surface-variant dark:text-slate-300 block mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface-container-low dark:bg-slate-900 border border-outline-variant/50 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-on-surface-variant dark:text-slate-300 block mb-1">
              Select your role <span className="text-rose-500">*</span>
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-surface-container-low dark:bg-slate-900 border border-outline-variant/50 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 font-medium"
            >
              <option value="caregiver">Caregiver</option>
              <option value="patient">Patient</option>
            </select>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 text-on-surface-variant dark:text-slate-400 cursor-pointer">
              <input type="checkbox" className="rounded text-primary" defaultChecked />
              <span>Remember this device</span>
            </label>
            <button
              type="button"
              onClick={() => navigateTo('forgot-password')}
              className="text-primary dark:text-primary-fixed font-bold hover:underline"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-primary text-on-primary rounded-xl font-bold text-sm shadow-md hover:opacity-90 transition cursor-pointer"
          >
            Sign In
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-outline-variant/20 dark:border-slate-700 text-center">
          <p className="text-xs text-on-surface-variant dark:text-slate-400">
            Don't have an account?{' '}
            <button
              onClick={() => navigateTo('signup')}
              className="text-primary dark:text-primary-fixed font-bold hover:underline"
            >
              Create Account
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
