import React, { useState } from 'react'
import { useAppState } from '../../context/AppStateContext'

export function SignUpView() {
  const { signUp, navigateTo } = useAppState()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('caregiver')
  const [caregiverType, setCaregiverType] = useState('Family Member')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!fullName.trim()) {
      setError('Please enter your full name')
      return
    }
    if (!email.trim()) {
      setError('Please enter your email address')
      return
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setError('')
    signUp(fullName.trim(), email.trim(), role)
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl border border-outline-variant/40 dark:border-slate-700 shadow-2xl p-8">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-primary dark:bg-primary-fixed text-on-primary dark:text-primary flex items-center justify-center text-2xl font-extrabold mx-auto mb-3 shadow-md">
            <span className="material-symbols-outlined text-[32px]">psychology</span>
          </div>
          <h2 className="text-2xl font-black text-primary dark:text-primary-fixed tracking-tight">Create Your Account</h2>
          <p className="text-xs text-on-surface-variant dark:text-slate-400 mt-1">
            Join the NeuroTwin Memory & Companion Platform
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-on-surface-variant dark:text-slate-300 block mb-1">
              Your Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Eleanor Vance or Sarah Vance"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-surface-container-low dark:bg-slate-900 border border-outline-variant/50 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-on-surface-variant dark:text-slate-300 block mb-1">
              Email Address <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surface-container-low dark:bg-slate-900 border border-outline-variant/50 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-on-surface-variant dark:text-slate-300 block mb-1">
              Create Password <span className="text-rose-500">*</span>
            </label>
            <input
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface-container-low dark:bg-slate-900 border border-outline-variant/50 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              required
            />
          </div>

          {/* Primary Role Selector with Professional Label */}
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

          {/* Progressive Follow-up Question for Caregivers */}
          {role === 'caregiver' && (
            <div className="animate-in fade-in duration-200">
              <label className="text-xs font-bold text-on-surface-variant dark:text-slate-300 block mb-1">
                What best describes you?
              </label>
              <select
                value={caregiverType}
                onChange={(e) => setCaregiverType(e.target.value)}
                className="w-full bg-surface-container-low dark:bg-slate-900 border border-outline-variant/50 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 font-medium"
              >
                <option value="Family Member">Family Member</option>
                <option value="Friend">Friend</option>
                <option value="Professional Caregiver">Professional Caregiver</option>
                <option value="Healthcare Provider">Healthcare Provider</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3.5 bg-primary text-on-primary rounded-xl font-bold text-sm shadow-md hover:opacity-90 transition cursor-pointer mt-2"
          >
            Create Account & Sign In
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-outline-variant/20 dark:border-slate-700 text-center">
          <p className="text-xs text-on-surface-variant dark:text-slate-400">
            Already have an account?{' '}
            <button
              onClick={() => navigateTo('signin')}
              className="text-primary dark:text-primary-fixed font-bold hover:underline"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
