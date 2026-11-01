import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import Toast from '../components/Toast.jsx'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)
  const timerRef = useRef(null)

  useEffect(() => () => window.clearTimeout(timerRef.current), [])

  const closeToast = useCallback(() => {
    window.clearTimeout(timerRef.current)
    setToast(null)
  }, [])

  const showToast = useCallback((message) => {
    window.clearTimeout(timerRef.current)
    setToast({ id: Date.now(), message })
    timerRef.current = window.setTimeout(() => setToast(null), 3600)
  }, [])

  const value = useMemo(
    () => ({ showToast, closeToast }),
    [showToast, closeToast],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toast
        key={toast?.id ?? 'empty'}
        message={toast?.message}
        onClose={closeToast}
      />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used inside a ToastProvider')
  }
  return context
}
