'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle2, 
  Circle, 
  Upload, 
  FileText,
  Loader2,
  X,
} from 'lucide-react'

interface ProgressEvent {
  id: string
  eventType: string
  completedAt: Date | null
  notes: string | null
}

interface OrderDocument {
  id: string
  documentType: string
  fileName: string
  filePath: string
  generatedAt: Date
}

interface OrderProgressFormProps {
  orderId: string
  orderStatus: string
  progressEvents: ProgressEvent[]
  documents: OrderDocument[]
  services: {
    needEIN: boolean
    needOperatingAgreement: boolean
    needBankLetter: boolean
  }
}

// Define which progress events require document upload
const DOCUMENT_REQUIRED_EVENTS: Record<string, string> = {
  'LLC_APPROVED': 'ARTICLES_OF_ORGANIZATION',
  'EIN_OBTAINED': 'EIN_CONFIRMATION',
  'OPERATING_AGREEMENT_GENERATED': 'OPERATING_AGREEMENT',
  'BANK_RESOLUTION_LETTER_GENERATED': 'BANK_RESOLUTION_LETTER',
}

// Define event labels
const EVENT_LABELS: Record<string, string> = {
  'ORDER_RECEIVED': 'Order Received',
  'LLC_FILED': 'LLC Filed with State',
  'LLC_APPROVED': 'LLC Approved (State)',
  'EIN_FILED': 'EIN Filed with IRS',
  'EIN_OBTAINED': 'EIN Obtained',
  'OPERATING_AGREEMENT_GENERATED': 'Operating Agreement Generated',
  'BANK_RESOLUTION_LETTER_GENERATED': 'Bank Resolution Letter Generated',
}

// Map document types to labels
const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  'ARTICLES_OF_ORGANIZATION': 'Articles of Organization',
  'EIN_CONFIRMATION': 'EIN Confirmation Letter',
  'OPERATING_AGREEMENT': 'Operating Agreement',
  'BANK_RESOLUTION_LETTER': 'Bank Resolution Letter',
}

export function OrderProgressForm({ 
  orderId, 
  orderStatus,
  progressEvents, 
  documents,
  services 
}: OrderProgressFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [uploadingFor, setUploadingFor] = useState<string | null>(null)

  // Define which events are applicable based on services ordered
  const getApplicableEvents = () => {
    const events = [
      { key: 'ORDER_RECEIVED', required: true },
      { key: 'LLC_FILED', required: true },
      { key: 'LLC_APPROVED', required: true },
    ]
    
    if (services.needEIN) {
      events.push({ key: 'EIN_FILED', required: true })
      events.push({ key: 'EIN_OBTAINED', required: true })
    }
    
    if (services.needOperatingAgreement) {
      events.push({ key: 'OPERATING_AGREEMENT_GENERATED', required: true })
    }
    
    if (services.needBankLetter) {
      events.push({ key: 'BANK_RESOLUTION_LETTER_GENERATED', required: true })
    }
    
    return events
  }

  const applicableEvents = getApplicableEvents()

  // Check if an event is completed
  const isEventCompleted = (eventType: string) => {
    const event = progressEvents.find(e => e.eventType === eventType)
    return event?.completedAt !== null && event?.completedAt !== undefined
  }

  // Get event data
  const getEventData = (eventType: string) => {
    return progressEvents.find(e => e.eventType === eventType)
  }

  // Get document for a specific type
  const getDocumentForType = (docType: string) => {
    return documents.find(d => d.documentType === docType)
  }

  // Check if event requires document and has it
  const hasRequiredDocument = (eventType: string) => {
    const requiredDocType = DOCUMENT_REQUIRED_EVENTS[eventType]
    if (!requiredDocType) return true // No document required
    return documents.some(d => d.documentType === requiredDocType)
  }

  // Toggle event completion
  const toggleEvent = async (eventType: string) => {
    // If this event requires a document and doesn't have one, don't allow completion
    if (DOCUMENT_REQUIRED_EVENTS[eventType] && !hasRequiredDocument(eventType)) {
      alert('Please upload the required document first.')
      return
    }

    setLoading(eventType)
    try {
      const isCompleted = isEventCompleted(eventType)
      
      const res = await fetch(`/api/orders/${orderId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType,
          completed: !isCompleted,
        }),
      })

      if (res.ok) {
        router.refresh()
      }
    } finally {
      setLoading(null)
    }
  }

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, documentType: string, eventType: string) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingFor(eventType)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('orderId', orderId)
      formData.append('documentType', documentType)

      const res = await fetch('/api/orders/documents/upload', {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        router.refresh()
      } else {
        alert('Failed to upload document')
      }
    } finally {
      setUploadingFor(null)
    }
  }

  // Calculate overall progress
  const completedCount = applicableEvents.filter(e => isEventCompleted(e.key)).length
  const totalCount = applicableEvents.length
  const progressPercent = Math.round((completedCount / totalCount) * 100)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Order Progress</CardTitle>
            <CardDescription>
              Track completion of each step
            </CardDescription>
          </div>
          <Badge variant={progressPercent === 100 ? 'default' : 'secondary'}>
            {completedCount}/{totalCount} Complete
          </Badge>
        </div>
        {/* Progress bar */}
        <div className="w-full bg-muted rounded-full h-2 mt-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300" 
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {applicableEvents.map((event) => {
          const completed = isEventCompleted(event.key)
          const eventData = getEventData(event.key)
          const requiredDocType = DOCUMENT_REQUIRED_EVENTS[event.key]
          const hasDoc = hasRequiredDocument(event.key)
          const doc = requiredDocType ? getDocumentForType(requiredDocType) : null
          const isLoading = loading === event.key
          const isUploading = uploadingFor === event.key

          return (
            <div 
              key={event.key} 
              className={`p-4 border rounded-lg transition-colors ${
                completed ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900' : 'bg-background'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <button
                  onClick={() => toggleEvent(event.key)}
                  disabled={isLoading || (!!requiredDocType && !hasDoc)}
                  className={`mt-0.5 flex-shrink-0 ${
                    requiredDocType && !hasDoc ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                  }`}
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  ) : completed ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>

                {/* Event details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${completed ? 'text-green-700 dark:text-green-400' : ''}`}>
                      {EVENT_LABELS[event.key]}
                    </span>
                    {event.required && !completed && (
                      <Badge variant="outline" className="text-xs">Required</Badge>
                    )}
                  </div>
                  
                  {eventData?.completedAt && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Completed: {new Date(eventData.completedAt).toLocaleString()}
                    </p>
                  )}

                  {/* Document upload section for events that need it */}
                  {requiredDocType && (
                    <div className="mt-3 p-3 bg-muted/50 rounded-md">
                      <Label className="text-sm text-muted-foreground">
                        Required Document: {DOCUMENT_TYPE_LABELS[requiredDocType]}
                      </Label>
                      
                      {doc ? (
                        <div className="flex items-center gap-2 mt-2">
                          <FileText className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-700 dark:text-green-400">
                            {doc.fileName}
                          </span>
                          <Badge variant="outline" className="text-xs">Uploaded</Badge>
                        </div>
                      ) : (
                        <div className="mt-2">
                          <Label 
                            htmlFor={`upload-${event.key}`}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <div className="flex items-center gap-2 px-3 py-2 border border-dashed rounded-md hover:border-primary hover:bg-primary/5 transition-colors">
                              {isUploading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Upload className="h-4 w-4" />
                              )}
                              <span className="text-sm">
                                {isUploading ? 'Uploading...' : 'Upload Document'}
                              </span>
                            </div>
                          </Label>
                          <Input
                            id={`upload-${event.key}`}
                            type="file"
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            className="hidden"
                            onChange={(e) => handleFileUpload(e, requiredDocType, event.key)}
                            disabled={isUploading}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {/* Status info */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Order Status:</span>
            <Badge>{orderStatus.replace('_', ' ')}</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            • Status changes to Processing when LLC Filed or EIN Filed is marked
            <br />
            • Status changes to Completed when all required steps are done
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
