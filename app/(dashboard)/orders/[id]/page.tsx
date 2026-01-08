import { notFound } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/prisma'
import { formatCurrency, formatDateTime, getStatusColor, getPriorityColor } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft, 
  Building2, 
  User, 
  Mail, 
  Phone, 
  MapPin,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { OrderStatusForm } from './OrderStatusForm'
import { OrderProgressForm } from './OrderProgressForm'

interface ProgressEvent {
  id: string
  eventType: string
  completedAt: Date | null
  notes: string | null
}

interface Document {
  id: string
  fileName: string
  documentType: string
  filePath: string
  generatedAt: Date
}

interface StatusHistory {
  id: string
  previousStatus: string | null
  newStatus: string
  notes: string | null
  createdAt: Date
}

interface Communication {
  id: string
  type: string
  subject: string | null
  content: string | null
  sentAt: Date
}

interface OrderDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: true,
      questionnaire: true,
      documents: {
        orderBy: { generatedAt: 'desc' },
      },
      statusHistory: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      progressEvents: {
        orderBy: { createdAt: 'asc' },
      },
      communications: {
        orderBy: { sentAt: 'desc' },
        take: 10,
      },
      payments: {
        orderBy: { createdAt: 'desc' },
      },
      business: true,
    },
  })

  if (!order) {
    notFound()
  }

  // Prepare progress events data for the form
  const progressEventsData = (order.progressEvents as ProgressEvent[]).map(e => ({
    id: e.id,
    eventType: String(e.eventType),
    completedAt: e.completedAt,
    notes: e.notes,
  }))

  // Prepare documents data for the form
  const documentsData = (order.documents as Document[]).map(d => ({
    id: d.id,
    documentType: String(d.documentType),
    fileName: d.fileName,
    filePath: d.filePath,
    generatedAt: d.generatedAt,
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/orders">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{order.orderId}</h1>
              <span className={`px-2 py-1 rounded-md text-xs font-medium ${getStatusColor(String(order.status))}`}>
                {String(order.status).replace('_', ' ')}
              </span>
              {String(order.priority) !== 'NORMAL' && (
                <span className={`px-2 py-1 rounded-md text-xs font-medium ${getPriorityColor(String(order.priority))}`}>
                  {String(order.priority)}
                </span>
              )}
            </div>
            <p className="text-muted-foreground">{order.companyName}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">{formatCurrency(order.totalAmount.toNumber())}</div>
          <span className={`px-2 py-1 rounded-md text-xs font-medium ${getStatusColor(String(order.paymentStatus))}`}>
            {String(order.paymentStatus)}
          </span>
        </div>
      </div>

      {/* Order Progress Form */}
      <OrderProgressForm
        orderId={order.id}
        orderStatus={String(order.status)}
        progressEvents={progressEventsData}
        documents={documentsData}
        services={{
          needEIN: order.needEIN,
          needOperatingAgreement: order.needOperatingAgreement,
          needBankLetter: order.needBankLetter,
        }}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="details">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="communications">Communications</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              {/* Company Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Company Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm text-muted-foreground">Company Name</label>
                    <p className="font-medium">{order.companyName}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Formation State</label>
                    <p className="font-medium">{order.formationState}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm text-muted-foreground">Business Purpose</label>
                    <p className="font-medium">{order.businessPurpose}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm text-muted-foreground">Business Address</label>
                    <p className="font-medium">
                      {order.businessAddress}, {order.businessCity}, {order.businessState} {order.businessZip}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Services */}
              <Card>
                <CardHeader>
                  <CardTitle>Services Ordered</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>LLC Formation</span>
                      <span>{formatCurrency(order.basePrice.toNumber())}</span>
                    </div>
                    {order.needEIN && (
                      <div className="flex justify-between">
                        <span>EIN Application</span>
                        <span>Included</span>
                      </div>
                    )}
                    {order.needOperatingAgreement && (
                      <div className="flex justify-between">
                        <span>Operating Agreement</span>
                        <span>Included</span>
                      </div>
                    )}
                    {order.needBankLetter && (
                      <div className="flex justify-between">
                        <span>Bank Resolution Letter</span>
                        <span>Included</span>
                      </div>
                    )}
                    {order.registeredAgent && (
                      <div className="flex justify-between">
                        <span>Registered Agent (1 year)</span>
                        <span>{formatCurrency(order.registeredAgentPrice.toNumber())}</span>
                      </div>
                    )}
                    {order.compliance && (
                      <div className="flex justify-between">
                        <span>Compliance Package</span>
                        <span>{formatCurrency(order.compliancePrice.toNumber())}</span>
                      </div>
                    )}
                    {order.rushProcessing && (
                      <div className="flex justify-between">
                        <span>Rush Processing</span>
                        <span>{formatCurrency(order.rushFee.toNumber())}</span>
                      </div>
                    )}
                    {order.stateFilingFee.toNumber() > 0 && (
                      <div className="flex justify-between">
                        <span>State Filing Fee</span>
                        <span>{formatCurrency(order.stateFilingFee.toNumber())}</span>
                      </div>
                    )}
                    <div className="border-t pt-2 flex justify-between font-bold">
                      <span>Total</span>
                      <span>{formatCurrency(order.totalAmount.toNumber())}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Internal Notes</label>
                    <p className="text-sm mt-1">{order.internalNotes || 'No internal notes'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Customer Notes</label>
                    <p className="text-sm mt-1">{order.customerNotes || 'No customer notes'}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents">
              <Card>
                <CardHeader>
                  <CardTitle>Generated Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  {order.documents.length > 0 ? (
                    <div className="space-y-2">
                      {(order.documents as Document[]).map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{doc.fileName}</p>
                              <p className="text-sm text-muted-foreground">
                                {doc.documentType.replace('_', ' ')} • {formatDateTime(doc.generatedAt)}
                              </p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm">Download</Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      No documents generated yet
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Status History</CardTitle>
                </CardHeader>
                <CardContent>
                  {order.statusHistory.length > 0 ? (
                    <div className="space-y-4">
                      {(order.statusHistory as StatusHistory[]).map((history) => (
                        <div key={history.id} className="flex gap-4 pb-4 border-b last:border-0">
                          <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              {history.previousStatus && (
                                <>
                                  <span className="text-sm">{history.previousStatus.replace('_', ' ')}</span>
                                  <span className="text-muted-foreground">→</span>
                                </>
                              )}
                              <span className="font-medium">{history.newStatus.replace('_', ' ')}</span>
                            </div>
                            {history.notes && (
                              <p className="text-sm text-muted-foreground mt-1">{history.notes}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDateTime(history.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      No status changes yet
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="communications">
              <Card>
                <CardHeader>
                  <CardTitle>Communications</CardTitle>
                </CardHeader>
                <CardContent>
                  {order.communications.length > 0 ? (
                    <div className="space-y-4">
                      {(order.communications as Communication[]).map((comm) => (
                        <div key={comm.id} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between">
                            <Badge variant="secondary">{comm.type.replace('_', ' ')}</Badge>
                            <span className="text-sm text-muted-foreground">
                              {formatDateTime(comm.sentAt)}
                            </span>
                          </div>
                          {comm.subject && (
                            <p className="font-medium mt-2">{comm.subject}</p>
                          )}
                          {comm.content && (
                            <p className="text-sm text-muted-foreground mt-1">{comm.content}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      No communications yet
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Update Status */}
          <OrderStatusForm 
            orderId={order.id} 
            currentStatus={order.status}
            currentPriority={order.priority}
          />

          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{order.contactFirstName} {order.contactLastName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${order.contactEmail}`} className="text-primary hover:underline">
                  {order.contactEmail}
                </a>
              </div>
              {order.contactPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${order.contactPhone}`} className="text-primary hover:underline">
                    {order.contactPhone}
                  </a>
                </div>
              )}
              {order.user && (
                <div className="pt-2 border-t">
                  <Link href={`/users/${order.user.id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      View User Profile
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Questionnaire */}
          {order.questionnaire && (
            <Card>
              <CardHeader>
                <CardTitle>Questionnaire</CardTitle>
                <CardDescription>
                  Status: {order.questionnaire.status}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href={`/questionnaires/${order.questionnaire.id}`}>
                  <Button variant="outline" className="w-full">
                    View Response
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Linked Business */}
          {order.business && (
            <Card>
              <CardHeader>
                <CardTitle>Linked Business</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{order.business.name}</p>
                <p className="text-sm text-muted-foreground">
                  {order.business.status} • {order.business.state}
                </p>
                <Link href={`/businesses/${order.business.id}`} className="mt-2 block">
                  <Button variant="outline" size="sm" className="w-full">
                    View Business
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Order Meta */}
          <Card>
            <CardHeader>
              <CardTitle>Order Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{formatDateTime(order.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Updated</span>
                <span>{formatDateTime(order.updatedAt)}</span>
              </div>
              {order.completedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Completed</span>
                  <span>{formatDateTime(order.completedAt)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Method</span>
                <span>{order.paymentMethod}</span>
              </div>
              {order.paymentCardBrand && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Card</span>
                  <span>{order.paymentCardBrand} •••• {order.paymentCardLast4}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
