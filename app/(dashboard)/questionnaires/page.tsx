import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  FileQuestion, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  User,
  ArrowRight,
  FileText,
} from 'lucide-react'
import { QuestionnaireItem } from '@/lib/types'

export default async function QuestionnairesPage() {
  // Fetch questionnaire stats
  const [notStartedCount, inProgressCount, completedCount, expiredCount] = await Promise.all([
    prisma.questionnaireResponse.count({ where: { status: 'NOT_STARTED' as never } }),
    prisma.questionnaireResponse.count({ where: { status: 'IN_PROGRESS' as never } }),
    prisma.questionnaireResponse.count({ where: { status: 'COMPLETED' as never } }),
    prisma.questionnaireResponse.count({ where: { status: 'EXPIRED' as never } }),
  ])

  // Fetch questionnaire responses with order and user info
  const questionnaires = await prisma.questionnaireResponse.findMany({
    include: {
      order: {
        select: {
          id: true,
          orderId: true,
          companyName: true,
        },
      },
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: [
      { status: 'asc' },
      { createdAt: 'desc' },
    ],
    take: 100,
  }) as unknown as QuestionnaireItem[]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NOT_STARTED':
        return <Badge variant="outline">Not Started</Badge>
      case 'IN_PROGRESS':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">In Progress</Badge>
      case 'COMPLETED':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Completed</Badge>
      case 'EXPIRED':
        return <Badge variant="destructive">Expired</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (date: Date | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatDateTime = (date: Date | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Questionnaire Responses</h1>
        <p className="text-muted-foreground">
          Track and manage customer questionnaire submissions
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Not Started</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notStartedCount}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting customer action
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressCount}</div>
            <p className="text-xs text-muted-foreground">
              Currently being filled
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}</div>
            <p className="text-xs text-muted-foreground">
              Ready for processing
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{expiredCount}</div>
            <p className="text-xs text-muted-foreground">
              Links have expired
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Questionnaires Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Questionnaires</CardTitle>
          <CardDescription>
            View questionnaire responses linked to orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          {questionnaires.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileQuestion className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No Questionnaires</h3>
              <p className="text-muted-foreground">
                No questionnaire responses have been submitted yet.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Current Section</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Saved</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {questionnaires.map((q) => (
                  <TableRow key={q.id}>
                    <TableCell>
                      <Link 
                        href={`/orders/${q.order.id}`}
                        className="hover:underline flex items-center gap-2"
                      >
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{q.order.orderId}</div>
                          <div className="text-sm text-muted-foreground">
                            {q.order.companyName}
                          </div>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">
                            {q.user.firstName} {q.user.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {q.user.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{q.stateCode}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground">
                        {q.currentSection || '-'}
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(q.status)}</TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatDateTime(q.lastSavedAt)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(q.completedAt)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/orders/${q.order.id}`}>
                          View Order
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
