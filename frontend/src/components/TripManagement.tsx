import { useState, useEffect } from 'react'
import { User, tripsAPI, invoicesAPI, Trip, Invoice } from '../utils/api'

interface TripManagementProps {
  user: User
}

interface CreateTripForm {
  title: string
  destination: {
    country: string
    city: string
  }
  dates: {
    startDate: string
    endDate: string
  }
  budget: {
    total: number
    currency: string
  }
  travelers: Array<{
    userId: string | {
      _id: string
      firstName: string
      lastName: string
      email: string
      username: string
    }
    role: 'owner' | 'admin' | 'member'
  }>
  tags: string[]
  isPublic: boolean
}

interface EditTripForm extends CreateTripForm {
  id: string
}

export default function TripManagement({ user }: TripManagementProps) {
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
  const [createForm, setCreateForm] = useState<CreateTripForm>({
    title: '',
    destination: { country: '', city: '' },
    dates: { startDate: '', endDate: '' },
    budget: { total: 0, currency: 'USD' },
    travelers: [{ userId: user._id, role: 'owner' }],
    tags: [],
    isPublic: false
  })
  const [editForm, setEditForm] = useState<EditTripForm>({
    id: '',
    title: '',
    destination: { country: '', city: '' },
    dates: { startDate: '', endDate: '' },
    budget: { total: 0, currency: 'USD' },
    travelers: [{ userId: user._id, role: 'owner' }],
    tags: [],
    isPublic: false
  })
  const [tagInput, setTagInput] = useState('')
  const [editTagInput, setEditTagInput] = useState('')
  const [alert, setAlert] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const [tripInvoices, setTripInvoices] = useState<Invoice[]>([])
  const [loadingInvoices, setLoadingInvoices] = useState(false)

  useEffect(() => {
    loadTrips()
  }, [])

  const loadTrips = async () => {
    try {
      setLoading(true)
      const response = await tripsAPI.getAll()
      setTrips(response.data || [])
    } catch (error) {
      console.error('Error loading trips:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'planning':
        return 'bg-blue-100 text-blue-800'
      case 'booked':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-gray-100 text-gray-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getBudgetProgress = (expenses: number, budget: number) => {
    return Math.min((expenses / budget) * 100, 100)
  }

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Convert travelers to ensure userId is a string
      const formData = {
        ...createForm,
        travelers: createForm.travelers.map(t => ({
          userId: typeof t.userId === 'object' ? t.userId._id : t.userId,
          role: t.role
        }))
      }
      await tripsAPI.create(formData)
      await loadTrips()
      setShowCreateModal(false)
      resetCreateForm()
      setAlert({ type: 'success', message: 'Trip created successfully!' })
      setTimeout(() => setAlert(null), 3000)
    } catch (error) {
      console.error('Error creating trip:', error)
      setAlert({ type: 'error', message: 'Failed to create trip. Please try again.' })
      setTimeout(() => setAlert(null), 3000)
    }
  }

  const handleEditTrip = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Convert travelers to ensure userId is a string
      const formData = {
        ...editForm,
        travelers: editForm.travelers.map(t => ({
          userId: typeof t.userId === 'object' ? t.userId._id : t.userId,
          role: t.role
        }))
      }
      await tripsAPI.update(editForm.id, formData)
      await loadTrips()
      setShowEditModal(false)
      setSelectedTrip(null)
      setAlert({ type: 'success', message: 'Trip updated successfully!' })
      setTimeout(() => setAlert(null), 3000)
    } catch (error) {
      console.error('Error updating trip:', error)
      setAlert({ type: 'error', message: 'Failed to update trip. Please try again.' })
      setTimeout(() => setAlert(null), 3000)
    }
  }

  const handleDeleteTrip = async (tripId: string) => {
    if (window.confirm('Are you sure you want to delete this trip?')) {
      try {
        await tripsAPI.delete(tripId)
        await loadTrips()
        setAlert({ type: 'success', message: 'Trip deleted successfully!' })
        setTimeout(() => setAlert(null), 3000)
      } catch (error) {
        console.error('Error deleting trip:', error)
        setAlert({ type: 'error', message: 'Failed to delete trip. Please try again.' })
        setTimeout(() => setAlert(null), 3000)
      }
    }
  }

  const startEdit = (trip: Trip) => {
    setSelectedTrip(trip)
    setEditForm({
      id: trip._id,
      title: trip.title,
      destination: trip.destination,
      dates: {
        startDate: trip.dates.startDate.split('T')[0], // Convert to YYYY-MM-DD format
        endDate: trip.dates.endDate.split('T')[0] // Convert to YYYY-MM-DD format
      },
      budget: trip.budget,
      travelers: trip.travelers,
      tags: trip.tags,
      isPublic: trip.isPublic
    })
    setShowEditModal(true)
  }

  const loadTripInvoices = async (tripId: string) => {
    try {
      setLoadingInvoices(true)
      const response = await invoicesAPI.getAll({ tripId })
      setTripInvoices(response.data || [])
    } catch (error) {
      console.error('Error loading trip invoices:', error)
      setTripInvoices([])
    } finally {
      setLoadingInvoices(false)
    }
  }

  const viewTrip = async (trip: Trip) => {
    setSelectedTrip(trip)
    setShowViewModal(true)
    await loadTripInvoices(trip._id)
  }

  const resetCreateForm = () => {
    setCreateForm({
      title: '',
      destination: { country: '', city: '' },
      dates: { startDate: '', endDate: '' },
      budget: { total: 0, currency: 'USD' },
      travelers: [{ userId: user._id, role: 'owner' }],
      tags: [],
      isPublic: false
    })
  }

  const addTag = (tag: string, isEdit: boolean = false) => {
    if (tag.trim()) {
      if (isEdit) {
        setEditForm(prev => ({
          ...prev,
          tags: [...prev.tags, tag.trim()]
        }))
        setEditTagInput('')
      } else {
        setCreateForm(prev => ({
          ...prev,
          tags: [...prev.tags, tag.trim()]
        }))
        setTagInput('')
      }
    }
  }

  const removeTag = (index: number, isEdit: boolean = false) => {
    if (isEdit) {
      setEditForm(prev => ({
        ...prev,
        tags: prev.tags.filter((_, i) => i !== index)
      }))
    } else {
      setCreateForm(prev => ({
        ...prev,
        tags: prev.tags.filter((_, i) => i !== index)
      }))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Alert */}
      {alert && (
        <div className={`p-4 rounded-lg ${
          alert.type === 'success' 
            ? 'bg-green-100 border border-green-400 text-green-700' 
            : 'bg-red-100 border border-red-400 text-red-700'
        }`}>
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              {alert.type === 'success' ? (
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              ) : (
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              )}
            </svg>
            {alert.message}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">My Trips</h2>
            <p className="text-gray-600">
              Manage your travel plans, view expenses, and track documents
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            New Trip
          </button>
        </div>
      </div>

      {/* Trips Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trips.map((trip) => (
          <div key={trip._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 truncate">{trip.title}</h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(trip.status)}`}>
                  {trip.status}
                </span>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  {trip.destination.city}, {trip.destination.country}
                </div>
                
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {new Date(trip.dates.startDate).toLocaleDateString()} - {new Date(trip.dates.endDate).toLocaleDateString()}
                </div>
                
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  Budget: {trip.budget.currency} {trip.budget.total.toLocaleString()}
                </div>
                
                {/* Trip Owner Info */}
                {trip.travelers && trip.travelers.length > 0 && (() => {
                  const owner = trip.travelers.find((t: any) => t.role === 'owner')
                  if (owner) {
                    const ownerUser = typeof owner.userId === 'object' ? owner.userId : null
                    if (ownerUser) {
                      return (
                        <div className="flex items-center text-sm text-gray-600">
                          <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Owner: {ownerUser.firstName} {ownerUser.lastName} ({ownerUser.email})
                        </div>
                      )
                    }
                  }
                  return null
                })()}
              </div>
              
              {/* Tags */}
              {trip.tags && trip.tags.length > 0 && (
                <div className="mt-4">
                  <div className="flex flex-wrap gap-1">
                    {trip.tags.map((tag, index) => (
                      <span key={index} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
              <div className="flex space-x-2">
                <button 
                  onClick={() => viewTrip(trip)}
                  className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  View Details
                </button>
                <button 
                  onClick={() => startEdit(trip)}
                  className="flex-1 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Edit Trip
                </button>
                <button 
                  onClick={() => handleDeleteTrip(trip._id)}
                  className="px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {trips.length === 0 && (
        <div className="bg-white rounded-lg p-8 text-center shadow-sm border border-gray-200">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No trips yet</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating your first trip.</p>
          <div className="mt-6">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Your First Trip
            </button>
          </div>
        </div>
      )}

      {/* Create Trip Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Trip</h3>
            <form onSubmit={handleCreateTrip} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trip Title</label>
                <input
                  type="text"
                  value={createForm.title}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <input
                    type="text"
                    value={createForm.destination.country}
                    onChange={(e) => setCreateForm(prev => ({ 
                      ...prev, 
                      destination: { ...prev.destination, country: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={createForm.destination.city}
                    onChange={(e) => setCreateForm(prev => ({ 
                      ...prev, 
                      destination: { ...prev.destination, city: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={createForm.dates.startDate}
                    onChange={(e) => setCreateForm(prev => ({ 
                      ...prev, 
                      dates: { ...prev.dates, startDate: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={createForm.dates.endDate}
                    onChange={(e) => setCreateForm(prev => ({ 
                      ...prev, 
                      dates: { ...prev.dates, endDate: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
                  <input
                    type="number"
                    value={createForm.budget.total}
                    onChange={(e) => setCreateForm(prev => ({ 
                      ...prev, 
                      budget: { ...prev.budget, total: parseFloat(e.target.value) || 0 }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <select
                    value={createForm.budget.currency}
                    onChange={(e) => setCreateForm(prev => ({ 
                      ...prev, 
                      budget: { ...prev.budget, currency: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag(tagInput))}
                    placeholder="Add a tag"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => addTag(tagInput)}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {createForm.tags.map((tag, index) => (
                    <span key={index} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full flex items-center gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(index)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={createForm.isPublic}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, isPublic: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-700">
                  Make this trip public
                </label>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Trip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Trip Modal */}
      {showEditModal && selectedTrip && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Trip</h3>
            <form onSubmit={handleEditTrip} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trip Title</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <input
                    type="text"
                    value={editForm.destination.country}
                    onChange={(e) => setEditForm(prev => ({ 
                      ...prev, 
                      destination: { ...prev.destination, country: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={editForm.destination.city}
                    onChange={(e) => setEditForm(prev => ({ 
                      ...prev, 
                      destination: { ...prev.destination, city: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={editForm.dates.startDate}
                    onChange={(e) => setEditForm(prev => ({ 
                      ...prev, 
                      dates: { ...prev.dates, startDate: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={editForm.dates.endDate}
                    onChange={(e) => setEditForm(prev => ({ 
                      ...prev, 
                      dates: { ...prev.dates, endDate: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
                  <input
                    type="number"
                    value={editForm.budget.total}
                    onChange={(e) => setEditForm(prev => ({ 
                      ...prev, 
                      budget: { ...prev.budget, total: parseFloat(e.target.value) || 0 }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <select
                    value={editForm.budget.currency}
                    onChange={(e) => setEditForm(prev => ({ 
                      ...prev, 
                      budget: { ...prev.budget, currency: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={editTagInput}
                    onChange={(e) => setEditTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag(editTagInput, true))}
                    placeholder="Add a tag"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => addTag(editTagInput, true)}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {editForm.tags.map((tag, index) => (
                    <span key={index} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full flex items-center gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(index, true)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="editIsPublic"
                  checked={editForm.isPublic}
                  onChange={(e) => setEditForm(prev => ({ ...prev, isPublic: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="editIsPublic" className="ml-2 block text-sm text-gray-700">
                  Make this trip public
                </label>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Update Trip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Trip Modal */}
      {showViewModal && selectedTrip && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Trip Details</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900">{selectedTrip.title}</h4>
                <p className="text-sm text-gray-600">{selectedTrip.destination.city}, {selectedTrip.destination.country}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Date</label>
                  <p className="text-sm text-gray-900">{new Date(selectedTrip.dates.startDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">End Date</label>
                  <p className="text-sm text-gray-900">{new Date(selectedTrip.dates.endDate).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Budget</label>
                  <p className="text-sm text-gray-900">{selectedTrip.budget.currency} {selectedTrip.budget.total.toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedTrip.status)}`}>
                    {selectedTrip.status}
                  </span>
                </div>
              </div>
              
              {selectedTrip.tags && selectedTrip.tags.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                  <div className="flex flex-wrap gap-1">
                    {selectedTrip.tags.map((tag, index) => (
                      <span key={index} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-700 mr-2">Public Trip:</span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${selectedTrip.isPublic ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {selectedTrip.isPublic ? 'Yes' : 'No'}
                </span>
              </div>

    {/* Invoices Section */}
    <div className="mt-6">
      <h4 className="text-sm font-medium text-gray-700 mb-3">Associated Invoices</h4>
      {loadingInvoices ? (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="text-center py-4">
          <div className="text-2xl font-bold text-blue-600">{tripInvoices.length}</div>
          <div className="text-sm text-gray-500">Invoices Associated</div>
          <div className="mt-2 text-xs text-gray-400">
            View all invoices in the "All Invoices" section to see details and filter by trip
          </div>
        </div>
      )}
    </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowViewModal(false)
                  startEdit(selectedTrip)
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Edit Trip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
