import { useState, useEffect } from 'react'

export type AlertType = 'success' | 'error' | 'warning' | 'info'

interface AlertProps {
  type: AlertType
  message: string
  duration?: number
  onClose?: () => void
  show?: boolean
}

const Alert: React.FC<AlertProps> = ({ 
  type, 
  message, 
  duration = 5000, 
  onClose, 
  show = true 
}) => {
  const [isVisible, setIsVisible] = useState(show)

  useEffect(() => {
    setIsVisible(show)
  }, [show])

  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        onClose?.()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [isVisible, duration, onClose])

  if (!isVisible) return null

  const getAlertStyles = () => {
    switch (type) {
      case 'success':
        return {
          container: 'bg-green-50 border-green-200 text-green-800',
          icon: 'text-green-400',
          iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
        }
      case 'error':
        return {
          container: 'bg-red-50 border-red-200 text-red-800',
          icon: 'text-red-400',
          iconPath: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z'
        }
      case 'warning':
        return {
          container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
          icon: 'text-yellow-400',
          iconPath: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
        }
      case 'info':
        return {
          container: 'bg-blue-50 border-blue-200 text-blue-800',
          icon: 'text-blue-400',
          iconPath: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
        }
      default:
        return {
          container: 'bg-gray-50 border-gray-200 text-gray-800',
          icon: 'text-gray-400',
          iconPath: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
        }
    }
  }

  const styles = getAlertStyles()

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-sm w-full mx-auto`}>
      <div className={`border rounded-lg p-4 shadow-lg ${styles.container} animate-slide-in`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className={`h-5 w-5 ${styles.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={styles.iconPath} />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium">{message}</p>
          </div>
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={() => {
                setIsVisible(false)
                onClose?.()
              }}
              className={`inline-flex rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                type === 'success' ? 'focus:ring-green-500' :
                type === 'error' ? 'focus:ring-red-500' :
                type === 'warning' ? 'focus:ring-yellow-500' :
                'focus:ring-blue-500'
              }`}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Alert Hook for easy usage
export const useAlert = () => {
  const [alerts, setAlerts] = useState<Array<{ id: string; type: AlertType; message: string }>>([])

  const showAlert = (type: AlertType, message: string, duration?: number) => {
    const id = Date.now().toString()
    setAlerts(prev => [...prev, { id, type, message }])
    
    setTimeout(() => {
      setAlerts(prev => prev.filter(alert => alert.id !== id))
    }, duration || 5000)
  }

  const success = (message: string, duration?: number) => showAlert('success', message, duration)
  const error = (message: string, duration?: number) => showAlert('error', message, duration)
  const warning = (message: string, duration?: number) => showAlert('warning', message, duration)
  const info = (message: string, duration?: number) => showAlert('info', message, duration)

  const AlertContainer = () => (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {alerts.map(alert => (
        <Alert
          key={alert.id}
          type={alert.type}
          message={alert.message}
          onClose={() => setAlerts(prev => prev.filter(a => a.id !== alert.id))}
        />
      ))}
    </div>
  )

  return {
    success,
    error,
    warning,
    info,
    AlertContainer
  }
}

export default Alert
