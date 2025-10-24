import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { User, Lock } from 'lucide-react'
import { authAPI } from '../utils/api'

interface LoginFormData {
  username: string
  password: string
}

interface LoginFormProps {
  onLogin: (userData: any) => void
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>()

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setError('')
    
    try {
      const result = await authAPI.login(data.username, data.password)
      onLogin(result.user)
    } catch (error) {
      setError((error as Error).message || 'Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="card">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Login
        </h2>
        <p className="text-gray-600">
          Please sign in with your credentials
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Username
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              {...register('username', { 
                required: 'Username is required'
              })}
              type="text"
              className="input-field pl-10"
              placeholder="Enter username"
            />
          </div>
          {errors.username && (
            <p className="text-red-500 text-sm mt-1">{errors.username.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              {...register('password', { 
                required: 'Password is required'
              })}
              type="password"
              className="input-field pl-10"
              placeholder="Enter password"
            />
          </div>
          {errors.password && (
            <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Demo Credentials</h4>
        <p className="text-sm text-blue-800">
          Username: <strong>admin</strong><br />
          Password: <strong>admin</strong>
        </p>
      </div>
    </div>
  )
}
