import React, { useEffect, useState } from 'react'
import { useAppState } from '../../context/AppStateContext'

// Simple Toast Container
export function ToastContainer() {
  const { toast } = useAppState()
  if (!toast) return null

  return (
    <div className={`nt-toast nt-toast-${toast.type}`}>
      {toast.message}
    </div>
  )
}

// Basic Button Primitive
export function Button({ variant = 'primary', className = '', children, ...props }) {
  return (
    <button className={`nt-btn nt-btn-${variant} ${className}`} {...props}>
      {children}
    </button>
  )
}
