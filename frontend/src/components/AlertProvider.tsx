import React, { createContext, useContext, useState, ReactNode } from 'react'
import Alert from './Alert'

export type AlertType = 'success' | 'error' | 'warning' | 'info'

interface AlertData {
  id: string
  type: AlertType
  message: string
  duration?: number
}

interface AlertContextType {
  showAlert: (type: AlertType, message: string, duration?: number) => void
  success: (message: string, duration?: number) => void
  error: (message: string, duration?: number) => void
  warning: (message: string, duration?: number) => void
  info: (message: string, duration?: number) => void
}

const AlertContext = createContext<AlertContextType | undefined>(undefined)

export const useAlert = () => {
  const context = useContext(AlertContext)
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider')
  }
  return context
}

interface AlertProviderProps {
  children: ReactNode
}

export const AlertProvider: React.FC<AlertProviderProps> = ({ children }) => {
  const [alerts, setAlerts] = useState<AlertData[]>([])

  const showAlert = (type: AlertType, message: string, duration = 5000) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
    setAlerts(prev => [...prev, { id, type, message, duration }])
    
    setTimeout(() => {
      setAlerts(prev => prev.filter(alert => alert.id !== id))
    }, duration)
  }

  const success = (message: string, duration?: number) => showAlert('success', message, duration)
  const error = (message: string, duration?: number) => showAlert('error', message, duration)
  const warning = (message: string, duration?: number) => showAlert('warning', message, duration)
  const info = (message: string, duration?: number) => showAlert('info', message, duration)

  const removeAlert = (id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id))
  }

  return (
    <AlertContext.Provider value={{ showAlert, success, error, warning, info }}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {alerts.map(alert => (
          <Alert
            key={alert.id}
            type={alert.type}
            message={alert.message}
            duration={alert.duration}
            onClose={() => removeAlert(alert.id)}
          />
        ))}
      </div>
    </AlertContext.Provider>
  )
}
