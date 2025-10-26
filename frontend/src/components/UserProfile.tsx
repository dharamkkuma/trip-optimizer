import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { User, Mail, Calendar, Save } from 'lucide-react'
import { authAPI } from '../utils/api'

interface UserProfileProps {
  user: any
  onUserUpdate?: (updatedUser: any) => void
}

interface ProfileData {
  firstName: string
  lastName: string
  email: string
  preferences: {
    airlines: string[]
    maxPrice: number
    notifications: boolean
  }
}

export default function UserProfile({ user, onUserUpdate }: UserProfileProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  
  const { register, handleSubmit, formState: { errors } } = useForm<ProfileData>({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      preferences: {
        airlines: ['American Airlines', 'Delta'],
        maxPrice: 1000,
        notifications: true
      }
    }
  })

  const onSubmit = async (data: ProfileData) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const updatedUser = await authAPI.updateProfile({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email
      })
      
      console.log('Profile updated:', updatedUser)
      
      // Notify parent component of user update
      if (onUserUpdate) {
        onUserUpdate(updatedUser)
      }
      
      setIsEditing(false)
    } catch (error) {
      console.error('Profile update error:', error)
      setError(error instanceof Error ? error.message : 'Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900 flex items-center">
          <User className="h-5 w-5 mr-2" />
          User Profile
        </h3>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Edit Profile
          </button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <input
                {...register('firstName', { required: 'First name is required' })}
                type="text"
                className="input-field"
              />
              {errors.firstName && (
                <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <input
                {...register('lastName', { required: 'Last name is required' })}
                type="text"
                className="input-field"
              />
              {errors.lastName && (
                <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              {...register('email', { 
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
              type="email"
              className="input-field"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Preferred Airlines
            </label>
            <input
              {...register('preferences.airlines')}
              type="text"
              className="input-field"
              placeholder="American Airlines, Delta, United"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Maximum Price ($)
            </label>
            <input
              {...register('preferences.maxPrice', { 
                required: 'Max price is required',
                min: { value: 100, message: 'Minimum price is $100' }
              })}
              type="number"
              className="input-field"
            />
            {errors.preferences?.maxPrice && (
              <p className="text-red-500 text-sm mt-1">{errors.preferences.maxPrice.message}</p>
            )}
          </div>

          <div className="flex items-center">
            <input
              {...register('preferences.notifications')}
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-700">
              Enable notifications
            </label>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary flex items-center disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center text-gray-700">
            <User className="h-5 w-5 mr-3 text-gray-400" />
            <div>
              <p className="font-medium">{user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim()}</p>
              <p className="text-sm text-gray-500">Full Name</p>
            </div>
          </div>

          <div className="flex items-center text-gray-700">
            <Mail className="h-5 w-5 mr-3 text-gray-400" />
            <div>
              <p className="font-medium">{user?.email}</p>
              <p className="text-sm text-gray-500">Email Address</p>
            </div>
          </div>

          <div className="flex items-center text-gray-700">
            <Calendar className="h-5 w-5 mr-3 text-gray-400" />
            <div>
              <p className="font-medium">
                {new Date(user?.createdAt).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-500">Member Since</p>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">Preferences</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <p><span className="font-medium">Airlines:</span> American Airlines, Delta</p>
              <p><span className="font-medium">Max Price:</span> $1,000</p>
              <p><span className="font-medium">Notifications:</span> Enabled</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
