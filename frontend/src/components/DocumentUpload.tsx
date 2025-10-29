import { useState, useRef, useEffect } from 'react'
import { User, invoicesAPI, tripsAPI, Invoice, Trip } from '../utils/api'

interface DocumentUploadProps {
  user: User
}

interface UploadProgress {
  invoiceId?: string
  filename: string
  progress: number
  status: 'uploading' | 'processing' | 'completed' | 'error'
  currentStep: string
  steps: Array<{
    step: string
    status: 'pending' | 'in_progress' | 'completed' | 'error'
    completedAt?: string
  }>
  invoice?: Invoice
  error?: string
}

export default function DocumentUpload({ user }: DocumentUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploads, setUploads] = useState<UploadProgress[]>([])
  const [trips, setTrips] = useState<Trip[]>([])
  const [selectedTripId, setSelectedTripId] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load trips on component mount
  useEffect(() => {
    const loadTrips = async () => {
      try {
        const response = await tripsAPI.getAll()
        setTrips(response.data)
        if (response.data.length > 0) {
          setSelectedTripId(response.data[0]._id)
        }
      } catch (error) {
        console.error('Failed to load trips:', error)
      }
    }
    loadTrips()
  }, [])

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files)
    }
  }

  const handleFiles = async (files: FileList) => {
    if (!selectedTripId) {
      alert('Please select a trip first')
      return
    }

    setUploading(true)
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      // Validate file type
      if (!file.type.includes('pdf') && !file.type.includes('image')) {
        alert('Please upload only PDF or image files')
        continue
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB')
        continue
      }

      const uploadId = `upload_${Date.now()}_${i}`
      
      // Create initial upload progress
      const uploadProgress: UploadProgress = {
        filename: file.name,
        progress: 0,
        status: 'uploading',
        currentStep: 'uploading',
        steps: [
          { step: 'upload', status: 'pending' },
          { step: 'create_invoice', status: 'pending' },
          { step: 'start_processing', status: 'pending' },
          { step: 'extract_data', status: 'pending' },
          { step: 'validate_data', status: 'pending' },
          { step: 'complete_processing', status: 'pending' }
        ]
      }

      setUploads(prev => [...prev, uploadProgress])

      // Process the file through invoice workflow
      await processInvoiceFile(file, uploadProgress, file.name)
    }
    
    setUploading(false)
  }

  const processInvoiceFile = async (file: File, uploadProgress: UploadProgress, filename: string) => {
    try {
      // Step 1: Upload file (simulate file upload to storage)
      updateUploadProgress(filename, 'upload', 'in_progress', 16)
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate upload time
      updateUploadProgress(filename, 'upload', 'completed', 16)

      // Step 2: Create invoice record
      updateUploadProgress(filename, 'create_invoice', 'in_progress', 32)
      
      const invoiceData = {
        invoiceNumber: `INV-${Date.now()}`,
        invoiceDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
        originalFileName: file.name,
        filePath: `/uploads/${file.name}`,
        fileSize: file.size,
        fileType: file.type.split('/')[1],
        mimeType: file.type,
        tripId: selectedTripId,
        category: 'other',
        tags: ['uploaded', 'pdf']
      }

      const invoice = await invoicesAPI.create(invoiceData)
      updateUploadProgress(filename, 'create_invoice', 'completed', 32, invoice)

      // Step 3: Start processing
      updateUploadProgress(filename, 'start_processing', 'in_progress', 48)
      const processingInvoice = await invoicesAPI.startProcessing(invoice._id)
      updateUploadProgress(filename, 'start_processing', 'completed', 48, processingInvoice)

      // Step 4: Extract data (simulate AI processing)
      updateUploadProgress(filename, 'extract_data', 'in_progress', 64)
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate processing time

      // Generate dummy parsed data (replace with actual AI processing later)
      const dummyParsedData = {
        vendor: {
          name: 'Sample Vendor Inc.',
          address: {
            street: '123 Business St',
            city: 'Business City',
            state: 'BC',
            zipCode: '12345',
            country: 'USA'
          },
          contact: {
            email: 'vendor@example.com',
            phone: '+1-555-0123'
          },
          taxId: 'TAX123456789'
        },
        customer: {
          name: user.fullName || `${user.firstName} ${user.lastName}`,
          address: {
            street: '456 Customer Ave',
            city: 'Customer City',
            state: 'CC',
            zipCode: '54321',
            country: 'USA'
          },
          contact: {
            email: user.email,
            phone: '+1-555-0456'
          }
        },
        financial: {
          subtotal: Math.floor(Math.random() * 1000) + 100,
          taxAmount: 0,
          totalAmount: 0,
          currency: 'USD',
          taxRate: 0,
          discountAmount: 0
        },
        lineItems: [
          {
            description: 'Travel Service',
            quantity: 1,
            unitPrice: 0,
            totalPrice: 0,
            taxRate: 0
          }
        ]
      }

      // Calculate totals
      dummyParsedData.financial.totalAmount = dummyParsedData.financial.subtotal + dummyParsedData.financial.taxAmount - dummyParsedData.financial.discountAmount
      dummyParsedData.lineItems[0].unitPrice = dummyParsedData.financial.subtotal
      dummyParsedData.lineItems[0].totalPrice = dummyParsedData.financial.subtotal

      updateUploadProgress(filename, 'extract_data', 'completed', 64)

      // Step 5: Validate data
      updateUploadProgress(filename, 'validate_data', 'in_progress', 80)
      const validationResult = await invoicesAPI.validate(dummyParsedData)
      updateUploadProgress(filename, 'validate_data', 'completed', 80)

      // Step 6: Complete processing
      updateUploadProgress(filename, 'complete_processing', 'in_progress', 96)
      const finalInvoice = await invoicesAPI.completeProcessing(
        invoice._id, 
        dummyParsedData, 
        validationResult.confidenceScore || 85
      )
      updateUploadProgress(filename, 'complete_processing', 'completed', 100, finalInvoice)

      // Mark as completed
      setUploads(prev => prev.map(upload => 
        upload.filename === uploadProgress.filename 
          ? { ...upload, status: 'completed', progress: 100 }
          : upload
      ))

    } catch (error) {
      console.error('Error processing invoice:', error)
      setUploads(prev => prev.map(upload => 
        upload.filename === uploadProgress.filename 
          ? { 
              ...upload, 
              status: 'error', 
              error: (error as Error).message,
              steps: upload.steps.map(step => 
                step.status === 'in_progress' 
                  ? { ...step, status: 'error' }
                  : step
              )
            }
          : upload
      ))
    }
  }

  const updateUploadProgress = (uploadId: string, stepName: string, status: 'in_progress' | 'completed' | 'error', progress: number, invoice?: Invoice) => {
    setUploads(prev => prev.map(upload => {
      if (upload.filename === uploadId) { // Match by filename directly
        const updatedSteps = upload.steps.map(step => 
          step.step === stepName 
            ? { 
                ...step, 
                status, 
                completedAt: status === 'completed' ? new Date().toISOString() : undefined 
              }
            : step
        )
        
        return {
          ...upload,
          progress,
          currentStep: stepName,
          invoice: invoice || upload.invoice,
          steps: updatedSteps
        }
      }
      return upload
    }))
  }

  const removeUpload = (filename: string) => {
    setUploads(prev => prev.filter(upload => upload.filename !== filename))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Documents</h2>
        <p className="text-gray-600">
          Upload your travel documents (PDF invoices, receipts, booking confirmations) for AI processing and optimization.
        </p>
      </div>

      {/* Trip Selection */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Trip</h3>
        <div className="flex items-center space-x-4">
          <label htmlFor="trip-select" className="text-sm font-medium text-gray-700">
            Choose a trip for this invoice:
          </label>
          <select
            id="trip-select"
            value={selectedTripId}
            onChange={(e) => setSelectedTripId(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select a trip...</option>
            {trips.map((trip) => (
              <option key={trip._id} value={trip._id}>
                {trip.title} - {trip.destination.city}, {trip.destination.country}
              </option>
            ))}
          </select>
        </div>
        {!selectedTripId && (
          <p className="mt-2 text-sm text-red-600">
            Please select a trip before uploading documents.
          </p>
        )}
      </div>

      {/* Upload Area */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="mt-4">
            <p className="text-lg font-medium text-gray-900">
              {dragActive ? 'Drop files here' : 'Drag and drop files here'}
            </p>
            <p className="text-gray-600">or</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Choose Files
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileInput}
              className="hidden"
            />
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Supports PDF, JPG, PNG files up to 10MB each
          </p>
        </div>
      </div>

      {/* Upload Progress */}
      {uploads.length > 0 && (
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Progress</h3>
          <div className="space-y-4">
            {uploads.map((upload) => (
              <div key={upload.filename} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      upload.status === 'completed' ? 'bg-green-400' :
                      upload.status === 'error' ? 'bg-red-400' :
                      'bg-blue-400 animate-pulse'
                    }`}></div>
                    <span className="font-medium text-gray-900">{upload.filename}</span>
                    {upload.invoice && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        Invoice #{upload.invoice.invoiceNumber}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">{Math.round(upload.progress)}%</span>
                    <button
                      onClick={() => removeUpload(upload.filename)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Error Display */}
                {upload.error && (
                  <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-800">
                      <strong>Error:</strong> {upload.error}
                    </p>
                  </div>
                )}

                {/* Invoice Details */}
                {upload.invoice && upload.status === 'completed' && (
                  <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-md">
                    <h4 className="text-sm font-medium text-green-800 mb-2">Extracted Invoice Data:</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs text-green-700">
                      <div>
                        <strong>Vendor:</strong> {upload.invoice.parsedData?.vendor?.name || 'N/A'}
                      </div>
                      <div>
                        <strong>Total:</strong> ${upload.invoice.parsedData?.financial?.totalAmount || 0}
                      </div>
                      <div>
                        <strong>Status:</strong> {upload.invoice.documentStatus}
                      </div>
                      <div>
                        <strong>Confidence:</strong> {upload.invoice.processingMetadata?.confidenceScore || 0}%
                      </div>
                    </div>
                  </div>
                )}

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      upload.status === 'completed' ? 'bg-green-500' :
                      upload.status === 'error' ? 'bg-red-500' :
                      'bg-blue-500'
                    }`}
                    style={{ width: `${upload.progress}%` }}
                  ></div>
                </div>

                {/* Steps */}
                <div className="space-y-2">
                  {upload.steps.map((step, index) => (
                    <div key={index} className="flex items-center space-x-3 text-sm">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                        step.status === 'completed' ? 'bg-green-100' :
                        step.status === 'in_progress' ? 'bg-blue-100' :
                        'bg-gray-100'
                      }`}>
                        {step.status === 'completed' ? (
                          <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : step.status === 'in_progress' ? (
                          <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                        ) : (
                          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        )}
                      </div>
                      <span className={`${
                        step.status === 'completed' ? 'text-green-700' :
                        step.status === 'in_progress' ? 'text-blue-700' :
                        'text-gray-500'
                      }`}>
                        {step.step.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                      {step.completedAt && (
                        <span className="text-xs text-gray-400">
                          {new Date(step.completedAt).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Current Status */}
                <div className="mt-3 text-sm text-gray-600">
                  Current: {upload.currentStep.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Tips */}
      <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">💡 Invoice Processing Tips</h3>
        <ul className="space-y-2 text-blue-800">
          <li className="flex items-start space-x-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>Upload PDF invoices for automatic data extraction and processing</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>AI will extract vendor info, amounts, dates, and line items automatically</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>Documents are validated and confidence scores are calculated</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>Processed invoices can be verified, approved, or rejected as needed</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>All invoices are linked to your selected trip for expense tracking</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
