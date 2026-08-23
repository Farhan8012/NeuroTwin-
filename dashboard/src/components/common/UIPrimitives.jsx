import React from 'react'
import { useAppState } from '../../context/AppStateContext'

// Button Component
export function Button({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'accent' | 'danger' | 'ghost' | 'outline'
  size = 'md', // 'sm' | 'md' | 'lg' | 'xl'
  icon: Icon,
  fullWidth = false,
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  ...props
}) {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-150 ease-in-out cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none"
  
  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs rounded-md gap-1.5",
    md: "px-4 py-2 text-sm rounded-lg gap-2",
    lg: "px-5 py-2.5 text-base rounded-xl gap-2.5",
    xl: "px-6 py-3.5 text-lg rounded-2xl gap-3 font-semibold min-h-[48px]", // High-accessibility patient button size
  }

  const variantStyles = {
    primary: "bg-[#2B6CB0] text-white hover:bg-[#2C5282] active:bg-[#1A365D] shadow-sm",
    secondary: "bg-[#38B2AC] text-white hover:bg-[#319795] active:bg-[#234E52] shadow-sm",
    accent: "bg-[#D69E2E] text-slate-900 hover:bg-[#B7791F] hover:text-white shadow-sm",
    danger: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
    outline: "border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700",
    ghost: "bg-transparent text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800",
  }

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {Icon && <Icon className="w-4 h-4 shrink-0" />}
      {children}
    </button>
  )
}

// Input Component
export function Input({
  label,
  error,
  helperText,
  icon: Icon,
  fullWidth = true,
  className = '',
  id,
  ...props
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

  return (
    <div className={`flex flex-col gap-1.5 ${fullWidth ? 'w-full' : ''}`}>
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3.5 text-slate-400 dark:text-slate-500 pointer-events-none">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          id={inputId}
          className={`w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm transition-all focus:border-[#2B6CB0] focus:ring-2 focus:ring-[#2B6CB0]/20 outline-none ${
            Icon ? 'pl-10' : ''
          } ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && <span className="text-xs font-medium text-red-500">{error}</span>}
      {helperText && !error && <span className="text-xs text-slate-500 dark:text-slate-400">{helperText}</span>}
    </div>
  )
}

// Select Component
export function Select({ label, options = [], value, onChange, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">{label}</label>}
      <select
        value={value}
        onChange={onChange}
        className={`w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#2B6CB0] ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}

// Badge Component
export function Badge({ children, variant = 'primary', className = '' }) {
  const variantStyles = {
    primary: 'bg-[#EBF8FF] text-[#2B6CB0] border border-[#BEE3F8] dark:bg-[#2B6CB0]/20 dark:text-[#63B3ED] dark:border-[#2B6CB0]/40',
    secondary: 'bg-[#E6FFFA] text-[#2C7A7B] border border-[#B2F5EA] dark:bg-[#38B2AC]/20 dark:text-[#4FD1C5] dark:border-[#38B2AC]/40',
    accent: 'bg-[#FEFCBF] text-[#975A16] border border-[#F6E05E] dark:bg-[#D69E2E]/20 dark:text-[#F6E05E] dark:border-[#D69E2E]/40',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    warning: 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    danger: 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
    gray: 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  )
}

// Card Container Component
export function Card({ children, className = '', hoverable = false, onClick, ...props }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-5 shadow-sm transition-all duration-200 ${
        hoverable ? 'hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 cursor-pointer' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

// Modal Component
export function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className={`w-full ${maxWidth} bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700/70">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            ✕
          </button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

// Toast Component
export function ToastContainer() {
  const { toast } = useAppState()
  if (!toast) return null

  const typeStyles = {
    info: 'border-[#2B6CB0] bg-[#EBF8FF] text-[#1A365D]',
    success: 'border-emerald-500 bg-emerald-50 text-emerald-900',
    warning: 'border-amber-500 bg-amber-50 text-amber-900',
    danger: 'border-rose-500 bg-rose-50 text-rose-900',
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-300">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg ${typeStyles[toast.type] || typeStyles.info}`}>
        <span className="font-medium text-sm">{toast.message}</span>
      </div>
    </div>
  )
}

// Empty State Component
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed border-slate-200 dark:border-slate-700/60 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30">
      {Icon && (
        <div className="w-12 h-12 rounded-2xl bg-[#EBF8FF] dark:bg-[#2B6CB0]/20 flex items-center justify-center text-[#2B6CB0] dark:text-[#63B3ED] mb-3">
          <Icon className="w-6 h-6" />
        </div>
      )}
      <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">{title}</h4>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-4">{description}</p>
      {action}
    </div>
  )
}

// Loading Skeleton Component
export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-slate-200 dark:bg-slate-700/60 rounded-lg ${className}`} />
}

// Avatar Component
export function Avatar({ src, name, size = 'md', className = '' }) {
  const sizeMap = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
    xl: 'w-20 h-20 text-2xl',
  }

  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
    : 'NT'

  if (src) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        className={`${sizeMap[size]} rounded-full object-cover border border-slate-200 dark:border-slate-700 ${className}`}
      />
    )
  }

  return (
    <div className={`${sizeMap[size]} rounded-full bg-[#2B6CB0] text-white font-bold flex items-center justify-center border border-slate-200 dark:border-slate-700 ${className}`}>
      {initials}
    </div>
  )
}

// Tabs Component
export function Tabs({ tabs, activeTab, onChange }) {
  return (
    <div className="flex border-b border-slate-200 dark:border-slate-700 gap-6">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`pb-3 text-sm font-medium transition-all relative ${
            activeTab === tab.id
              ? 'text-[#2B6CB0] dark:text-[#63B3ED] font-semibold'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          {tab.label}
          {activeTab === tab.id && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2B6CB0] dark:bg-[#63B3ED] rounded-full" />
          )}
        </button>
      ))}
    </div>
  )
}
