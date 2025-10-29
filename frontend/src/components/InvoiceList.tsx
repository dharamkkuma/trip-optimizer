import { useState, useEffect } from 'react'
import { User, invoicesAPI, tripsAPI, Invoice, Trip } from '../utils/api'

// Helper function to get user headers for database API calls
const getUserHeaders = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  return {
    'Content-Type': 'application/json',
    'x-user-id': user._id || '507f1f77bcf86cd799439011',
    'x-user-email': user.email || 'test@example.com'
  }
}

interface InvoiceListProps {
  user: User
}

export default function InvoiceList({ user }: InvoiceListProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'uploaded' | 'processing' | 'parsed' | 'verified' | 'approved' | 'rejected'>('all')
  const [tripFilter, setTripFilter] = useState<string>('all')
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => {
    loadInvoices()
    loadTrips()
  }, [])

  const loadTrips = async () => {
    try {
      const response = await tripsAPI.getAll()
      setTrips(response.data || [])
    } catch (error) {
      console.error('Error loading trips:', error)
    }
  }

  const loadInvoices = async () => {
    try {
      setLoading(true)
      const response = await invoicesAPI.getAll({ limit: 1000 }) // Get all invoices
      setInvoices(response.data || [])
    } catch (error) {
      console.error('Error loading invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'uploaded':
        return 'bg-blue-100 text-blue-800'
      case 'processing':
        return 'bg-yellow-100 text-yellow-800'
      case 'parsed':
        return 'bg-purple-100 text-purple-800'
      case 'verified':
        return 'bg-green-100 text-green-800'
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'archived':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploaded':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        )
      case 'processing':
        return (
          <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        )
      case 'parsed':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
      case 'verified':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'approved':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )
      case 'rejected':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
    }
  }

  const filteredInvoices = invoices.filter(invoice => {
    const statusMatch = filter === 'all' || invoice.documentStatus === filter
    let tripMatch = true
    
    if (tripFilter !== 'all') {
      // Check if tripId is populated (object) or just an ID (string)
      if (typeof invoice.tripId === 'object' && invoice.tripId !== null) {
        tripMatch = (invoice.tripId as any)._id === tripFilter
      } else if (typeof invoice.tripId === 'string') {
        tripMatch = invoice.tripId === tripFilter
      } else {
        tripMatch = false
      }
    }
    
    return statusMatch && tripMatch
  })

  const handleRetry = async (invoiceId: string) => {
    try {
      // Call the retry processing endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_DATABASE_API_URL || 'http://localhost:8002'}/api/invoices/${invoiceId}/retry`, {
        method: 'POST',
        headers: getUserHeaders(),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to retry invoice processing')
      }

      // Reload invoices to show updated status
      await loadInvoices()
      
      // Show success message
      alert('Invoice processing retry initiated successfully!')
    } catch (error) {
      console.error('Error retrying invoice:', error)
      alert('Failed to retry invoice processing. Please try again.')
    }
  }

  const handleEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice)
    setShowEditModal(true)
  }

  const handleSaveEdit = async (updatedInvoice: Invoice) => {
    try {
      await invoicesAPI.update(updatedInvoice._id, updatedInvoice)
      await loadInvoices()
      setShowEditModal(false)
      setEditingInvoice(null)
    } catch (error) {
      console.error('Error updating invoice:', error)
    }
  }

  const handleDownload = (invoice: Invoice) => {
    // For now, just show a placeholder URL
    // In the future, this would generate a presigned S3 URL
    const downloadUrl = `https://s3.amazonaws.com/trip-optimizer-invoices/${invoice.filePath}`
    window.open(downloadUrl, '_blank')
  }

  const handleView = (invoice: Invoice) => {
    // For now, just show a placeholder URL
    // In the future, this would generate a presigned S3 URL for viewing
    const viewUrl = `https://s3.amazonaws.com/trip-optimizer-invoices/${invoice.filePath}`
    window.open(viewUrl, '_blank')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getTripName = (tripId: any) => {
    // Check if tripId is populated (object) or just an ID (string)
    if (typeof tripId === 'object' && tripId !== null) {
      return tripId.title || 'Unknown Trip'
    } else if (typeof tripId === 'string') {
      const trip = trips.find(t => t._id === tripId)
      return trip ? trip.title : 'Unknown Trip'
    }
    return 'No Trip Assigned'
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
      {/* Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">All Invoices</h2>
            <p className="text-gray-600">
              View and manage all uploaded invoices and their processing status
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Total Invoices</p>
            <p className="text-2xl font-bold text-gray-900">{invoices.length}</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { key: 'all', label: 'All', count: invoices.length },
              { key: 'uploaded', label: 'Uploaded', count: invoices.filter(i => i.documentStatus === 'uploaded').length },
              { key: 'processing', label: 'Processing', count: invoices.filter(i => i.documentStatus === 'processing').length },
              { key: 'parsed', label: 'Parsed', count: invoices.filter(i => i.documentStatus === 'parsed').length },
              { key: 'verified', label: 'Verified', count: invoices.filter(i => i.documentStatus === 'verified').length },
              { key: 'approved', label: 'Approved', count: invoices.filter(i => i.documentStatus === 'approved').length },
              { key: 'rejected', label: 'Rejected', count: invoices.filter(i => i.documentStatus === 'rejected').length }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  filter === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>
        
        {/* Trip Filter */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Filter by Trip:</label>
            <select
              value={tripFilter}
              onChange={(e) => setTripFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Trips</option>
              {trips.map((trip) => (
                <option key={trip._id} value={trip._id}>
                  {trip.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Invoices List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {filteredInvoices.length === 0 ? (
          <div className="p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No invoices found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter === 'all' ? 'No invoices have been uploaded yet.' : `No invoices with status "${filter}".`}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredInvoices.map((invoice) => (
              <div key={invoice._id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {getStatusIcon(invoice.documentStatus)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {invoice.invoiceNumber}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(invoice.documentStatus)}`}>
                          {invoice.documentStatus}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                        <span>{invoice.originalFileName}</span>
                        <span>{formatFileSize(invoice.fileSize || 0)}</span>
                        <span>{(invoice.fileType || 'unknown').toUpperCase()}</span>
                        <span>Uploaded: {formatDate(invoice.createdAt)}</span>
                        {invoice.tripId && (
                          <span className="text-blue-600">Trip: {getTripName(invoice.tripId)}</span>
                        )}
                      </div>
                      {invoice.parsedData && invoice.parsedData.vendor && (
                        <div className="mt-2 text-sm text-gray-600">
                          <span className="font-medium">Vendor:</span> {invoice.parsedData.vendor.name}
                          {invoice.parsedData.financial && invoice.parsedData.financial.totalAmount && (
                            <span className="ml-4">
                              <span className="font-medium">Amount:</span> {invoice.parsedData.financial.currency} {invoice.parsedData.financial.totalAmount.toLocaleString()}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {/* Download Button */}
                    <button
                      onClick={() => handleDownload(invoice)}
                      className="px-3 py-1 text-sm font-medium text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Download Invoice"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </button>
                    
                    {/* View Button */}
                    <button
                      onClick={() => handleView(invoice)}
                      className="px-3 py-1 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View Invoice"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    
                    {/* Edit Button */}
                    {invoice.documentStatus === 'parsed' && (
                      <button
                        onClick={() => handleEdit(invoice)}
                        className="px-3 py-1 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Edit Invoice Data"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    )}
                    
                    {/* Retry Button */}
                    {invoice.documentStatus === 'rejected' && (
                      <button
                        onClick={() => handleRetry(invoice._id)}
                        className="px-3 py-1 text-sm font-medium text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                        title="Retry Processing"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                    )}
                    
                    {invoice.processingMetadata && invoice.processingMetadata.confidenceScore && (
                      <div className="text-sm text-gray-500">
                        <span className="font-medium">Confidence:</span> {invoice.processingMetadata.confidenceScore}%
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Invoice Modal */}
      {showEditModal && editingInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Invoice Data</h3>
            <div className="space-y-4">
              {/* Invoice Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number</label>
                <input
                  type="text"
                  value={editingInvoice.invoiceNumber}
                  onChange={(e) => setEditingInvoice(prev => prev ? { ...prev, invoiceNumber: e.target.value } : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Basic Information */}
              <div className="border-t pt-4">
                <h4 className="text-md font-medium text-gray-900 mb-3">Invoice Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Date</label>
                    <input
                      type="date"
                      value={editingInvoice.invoiceDate}
                      onChange={(e) => setEditingInvoice(prev => prev ? { ...prev, invoiceDate: e.target.value } : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                    <input
                      type="date"
                      value={editingInvoice.dueDate}
                      onChange={(e) => setEditingInvoice(prev => prev ? { ...prev, dueDate: e.target.value } : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Parsed Data Display (Read-only for now) */}
              {editingInvoice.parsedData && (
                <div className="border-t pt-4">
                  <h4 className="text-md font-medium text-gray-900 mb-3">Parsed Data (Read-only)</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Vendor:</span> {editingInvoice.parsedData.vendor?.name || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">Total Amount:</span> {editingInvoice.parsedData.financial?.totalAmount || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">Currency:</span> {editingInvoice.parsedData.financial?.currency || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">Tax Amount:</span> {editingInvoice.parsedData.financial?.taxAmount || 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveEdit(editingInvoice)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
