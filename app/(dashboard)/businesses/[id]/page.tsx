import { notFound } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/prisma'
import { formatDateTime, formatCurrency } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  ArrowLeft, 
  Building2, 
  Users, 
  FileText, 
  AlertTriangle,
  Calendar,
  MapPin,
  Mail,
  Phone,
  ExternalLink 
} from 'lucide-react'

interface BusinessSubscription {
  id: string
  name: string | null
  status: string
  currentPeriodEnd: Date | null
}

interface BusinessMember {
  id: string
  name: string
  email: string | null
  role: string
  ownershipPercentage: number | null
  user: { firstName: string | null; lastName: string | null; email: string | null } | null
}

interface BusinessDocument {
  id: string
  name: string
  category: string
  filePath: string
  createdAt: Date
}

interface BusinessComplianceTask {
  id: string
  title: string
  description: string | null
  dueDate: Date | null
  status: string
}

interface BusinessDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function BusinessDetailPage({ params }: BusinessDetailPageProps) {
  const { id } = await params

  const business = await prisma.business.findUnique({
    where: { id },
    include: {
      owner: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
      members: {
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
      documents: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
      complianceTasks: {
        orderBy: { dueDate: 'asc' },
      },
      formationOrder: true,
      subscriptions: true,
    },
  })

  if (!business) {
    notFound()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="success">Active</Badge>
      case 'PENDING':
        return <Badge variant="outline">Pending</Badge>
      case 'INACTIVE':
        return <Badge variant="secondary">Inactive</Badge>
      case 'DISSOLVED':
        return <Badge variant="destructive">Dissolved</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getComplianceStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="success">Completed</Badge>
      case 'PENDING':
        return <Badge variant="outline">Pending</Badge>
      case 'OVERDUE':
        return <Badge variant="destructive">Overdue</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/businesses">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{business.name}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{business.entityType.replace('_', ' ')}</span>
                <span>•</span>
                <span>{business.state}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(business.status)}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="members">Members ({business.members.length})</TabsTrigger>
              <TabsTrigger value="documents">Documents ({business.documents.length})</TabsTrigger>
              <TabsTrigger value="compliance">Compliance ({business.complianceTasks.length})</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Business Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Entity Type</p>
                      <p className="font-medium">{business.entityType.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">State of Formation</p>
                      <p className="font-medium">{business.state}</p>
                    </div>
                    {business.formationDate && (
                      <div>
                        <p className="text-sm text-muted-foreground">Formation Date</p>
                        <p className="font-medium">{formatDateTime(business.formationDate)}</p>
                      </div>
                    )}
                    {business.einNumber && (
                      <div>
                        <p className="text-sm text-muted-foreground">EIN Number</p>
                        <p className="font-medium">{business.einNumber}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-muted-foreground">Created</p>
                      <p className="font-medium">{formatDateTime(business.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Last Updated</p>
                      <p className="font-medium">{formatDateTime(business.updatedAt)}</p>
                    </div>
                  </div>

                  {business.businessAddress && (
                    <div>
                      <p className="text-sm text-muted-foreground">Business Address</p>
                      <p className="font-medium">
                        {business.businessAddress}, {business.businessCity} {business.businessZip}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Subscriptions Summary */}
              {business.subscriptions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Active Subscriptions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {(business.subscriptions as BusinessSubscription[]).map((sub) => (
                        <div key={sub.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div>
                            <p className="font-medium">{sub.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Next billing: {sub.currentPeriodEnd ? formatDateTime(sub.currentPeriodEnd) : 'N/A'}
                            </p>
                          </div>
                          <Badge variant={String(sub.status) === 'ACTIVE' ? 'success' : 'secondary'}>
                            {String(sub.status)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Members Tab */}
            <TabsContent value="members">
              <Card>
                <CardHeader>
                  <CardTitle>Business Members</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Ownership %</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(business.members as BusinessMember[]).map((member) => (
                        <TableRow key={member.id}>
                          <TableCell className="font-medium">
                            {member.user?.firstName ?? member.name} {member.user?.lastName ?? ''}
                          </TableCell>
                          <TableCell>{member.user?.email ?? member.email ?? '—'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{String(member.role)}</Badge>
                          </TableCell>
                          <TableCell>{member.ownershipPercentage ?? '—'}%</TableCell>
                        </TableRow>
                      ))}
                      {business.members.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            No members added yet
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents">
              <Card>
                <CardHeader>
                  <CardTitle>Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Document</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Uploaded</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(business.documents as BusinessDocument[]).map((doc) => (
                        <TableRow key={doc.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{doc.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{String(doc.category)}</Badge>
                          </TableCell>
                          <TableCell>{formatDateTime(doc.createdAt)}</TableCell>
                          <TableCell className="text-right">
                            <a href={doc.filePath} target="_blank" rel="noopener noreferrer">
                              <Button variant="ghost" size="sm">
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </a>
                          </TableCell>
                        </TableRow>
                      ))}
                      {business.documents.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            No documents uploaded yet
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Compliance Tab */}
            <TabsContent value="compliance">
              <Card>
                <CardHeader>
                  <CardTitle>Compliance Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Task</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(business.complianceTasks as BusinessComplianceTask[]).map((task) => (
                        <TableRow key={task.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{task.title}</p>
                              {task.description && (
                                <p className="text-sm text-muted-foreground">{task.description}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {task.dueDate ? formatDateTime(task.dueDate) : 'No due date'}
                            </div>
                          </TableCell>
                          <TableCell>{getComplianceStatusBadge(task.status)}</TableCell>
                        </TableRow>
                      ))}
                      {business.complianceTasks.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                            No compliance tasks
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Owner Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Owner
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-medium">
                  {business.owner.firstName} {business.owner.lastName}
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${business.owner.email}`} className="hover:underline">
                  {business.owner.email}
                </a>
              </div>
              {business.owner.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${business.owner.phone}`} className="hover:underline">
                    {business.owner.phone}
                  </a>
                </div>
              )}
              <Link href={`/users/${business.owner.id}`}>
                <Button variant="outline" size="sm" className="w-full">
                  View User Profile
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Members</span>
                <span className="font-medium">{business.members.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Documents</span>
                <span className="font-medium">{business.documents.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Compliance Tasks</span>
                <span className="font-medium">{business.complianceTasks.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Active Subscriptions</span>
                <span className="font-medium">
                  {(business.subscriptions as BusinessSubscription[]).filter((s: BusinessSubscription) => String(s.status) === 'ACTIVE').length}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Public Listing */}
          {business.isPublicListed && (
            <Card>
              <CardHeader>
                <CardTitle>Public Listing</CardTitle>
                <CardDescription>This business appears on the allies page</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href={`/allies/${business.id}`}>
                  <Button variant="outline" size="sm" className="w-full">
                    Edit Listing
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
