import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, File, CheckCircle, AlertCircle, X } from 'lucide-react'
import { documentsAPI } from '../utils/api'

interface UploadedFile {
  id: string
  file: File
  status: 'uploading' | 'processing' | 'completed' | 'error'
  progress: number
  extractedData?: any
  error?: string
}

export default function FileUpload() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadMessage, setUploadMessage] = useState<string>('')

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsUploading(true)
    
    for (const file of acceptedFiles) {
      const fileId = Math.random().toString(36).substr(2, 9)
      const uploadedFile: UploadedFile = {
        id: fileId,
        file,
        status: 'uploading',
        progress: 0
      }

      setUploadedFiles(prev => [...prev, uploadedFile])

      try {
        // Upload to backend API (now with S3 and Redis integration)
        const uploadResponse = await documentsAPI.upload(file)
        
        // Update with real document ID from backend
        setUploadedFiles(prev => 
          prev.map(f => 
            f.id === fileId 
              ? { ...f, id: uploadResponse.document_id, progress: 100, status: 'processing' }
              : f
          )
        )

        // Message sent to Redis channel automatically by API
        setUploadMessage(`✅ PDF uploaded to S3 and message sent to Redis channel for processing`)
        console.log('PDF uploaded to S3 and message sent to Redis channel for processing')
        
        // Check status periodically
        await checkDocumentStatus(uploadResponse.document_id, fileId)
        
      } catch (error) {
        console.error('Upload error:', error)
        setUploadedFiles(prev => 
          prev.map(f => 
            f.id === fileId 
              ? { ...f, status: 'error', error: 'Upload failed' }
              : f
          )
        )
      }
    }
    
    setIsUploading(false)
  }, [])

  const checkDocumentStatus = async (documentId: string, fileId: string) => {
    let attempts = 0
    const maxAttempts = 10
    
    while (attempts < maxAttempts) {
      try {
        const statusResponse = await documentsAPI.getStatus(documentId)
        
        setUploadedFiles(prev => 
          prev.map(f => 
            f.id === documentId 
              ? { 
                  ...f, 
                  status: statusResponse.status === 'parsed' ? 'completed' : 'processing',
                  progress: statusResponse.progress,
                  extractedData: statusResponse.extracted_data || null
                }
              : f
          )
        )
        
        if (statusResponse.status === 'parsed') {
          break
        }
        
        attempts++
        await new Promise(resolve => setTimeout(resolve, 2000))
        
      } catch (error) {
        console.error('Status check error:', error)
        setUploadedFiles(prev => 
          prev.map(f => 
            f.id === documentId 
              ? { ...f, status: 'error', error: 'Status check failed' }
              : f
          )
        )
        break
      }
    }
  }

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: true,
    disabled: isUploading
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <File className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'uploading':
        return 'Uploading...'
      case 'processing':
        return 'Processing...'
      case 'completed':
        return 'Completed'
      case 'error':
        return 'Error'
      default:
        return 'Unknown'
    }
  }

  return (
    <div className="card">
      <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
        <Upload className="h-5 w-5 mr-2" />
        Upload Documents
      </h3>

      {/* Upload Message */}
      {uploadMessage && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 text-sm">{uploadMessage}</p>
        </div>
      )}

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive 
            ? 'border-primary-500 bg-primary-50' 
            : 'border-gray-300 hover:border-gray-400'
        } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        {isDragActive ? (
          <p className="text-primary-600 font-medium">Drop the files here...</p>
        ) : (
          <div>
            <p className="text-gray-600 font-medium mb-2">
              Drag & drop your travel documents here
            </p>
            <p className="text-gray-500 text-sm">
              or click to select files (PDF only)
            </p>
          </div>
        )}
      </div>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="mt-6">
          <h4 className="font-medium text-gray-900 mb-3">Uploaded Files</h4>
          <div className="space-y-3">
            {uploadedFiles.map((file) => (
              <div key={file.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    {getStatusIcon(file.status)}
                    <span className="ml-2 font-medium text-gray-900">
                      {file.file.name}
                    </span>
                  </div>
                  <button
                    onClick={() => removeFile(file.id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>{getStatusText(file.status)}</span>
                  <span>{(file.file.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>

                {file.status === 'uploading' && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${file.progress}%` }}
                    ></div>
                  </div>
                )}

                {file.status === 'error' && file.error && (
                  <p className="text-red-500 text-sm mt-2">{file.error}</p>
                )}

                {file.status === 'completed' && file.extractedData && (
                  <div className="mt-3 p-3 bg-green-50 rounded-lg">
                    <h5 className="font-medium text-green-800 mb-2">Extracted Data:</h5>
                    <div className="text-sm text-green-700 space-y-1">
                      <p><span className="font-medium">Type:</span> {file.extractedData.type}</p>
                      <p><span className="font-medium">Route:</span> {file.extractedData.origin} → {file.extractedData.destination}</p>
                      <p><span className="font-medium">Airline:</span> {file.extractedData.airline} {file.extractedData.flightNumber}</p>
                      <p><span className="font-medium">Price:</span> ${file.extractedData.price}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Supported Documents</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Flight itineraries and confirmations</li>
          <li>• Hotel booking confirmations</li>
          <li>• Travel invoices and receipts</li>
          <li>• PDF format only</li>
        </ul>
      </div>
    </div>
  )
}
