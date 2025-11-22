import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { ToastContainer, type ToastMessage, type ToastType } from '../components/common/Toast'

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
  warning: (message: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `toast-${Date.now()}-${Math.random()}`
    const newToast: ToastMessage = { id, message, type }

    setToasts((prev) => [...prev, newToast])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const success = useCallback((message: string) => {
    showToast(message, 'success')
  }, [showToast])

  const error = useCallback((message: string) => {
    showToast(message, 'error')
  }, [showToast])

  const info = useCallback((message: string) => {
    showToast(message, 'info')
  }, [showToast])

  const warning = useCallback((message: string) => {
    showToast(message, 'warning')
  }, [showToast])

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warning }}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
