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
  ClipboardCheck, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Building2,
  Calendar,
  ArrowRight,
} from 'lucide-react'
import { ComplianceTaskItem } from '@/lib/types'

export default async function CompliancePage() {
  // Fetch compliance task stats
  const [pendingCount, overdueCount, completedCount, inProgressCount] = await Promise.all([
    prisma.complianceTask.count({ where: { status: 'PENDING' as never } }),
    prisma.complianceTask.count({ where: { status: 'OVERDUE' as never } }),
    prisma.complianceTask.count({ where: { status: 'COMPLETED' as never } }),
    prisma.complianceTask.count({ where: { status: 'IN_PROGRESS' as never } }),
  ])

  // Fetch compliance tasks with business info
  const tasks = await prisma.complianceTask.findMany({
    include: {
      business: {
        select: {
          id: true,
          name: true,
          state: true,
          owner: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: [
      { status: 'asc' },
      { dueDate: 'asc' },
    ],
    take: 100,
  }) as unknown as ComplianceTaskItem[]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary">Pending</Badge>
      case 'IN_PROGRESS':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">In Progress</Badge>
      case 'COMPLETED':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Completed</Badge>
      case 'OVERDUE':
        return <Badge variant="destructive">Overdue</Badge>
      case 'NOT_APPLICABLE':
        return <Badge variant="outline">N/A</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return <Badge variant="destructive">High</Badge>
      case 'MEDIUM':
        return <Badge variant="secondary">Medium</Badge>
      case 'LOW':
        return <Badge variant="outline">Low</Badge>
      default:
        return <Badge variant="outline">{priority}</Badge>
    }
  }

  const getTaskTypeLabel = (taskType: string) => {
    switch (taskType) {
      case 'ANNUAL_REPORT':
        return 'Annual Report'
      case 'FRANCHISE_TAX':
        return 'Franchise Tax'
      case 'BUSINESS_LICENSE':
        return 'Business License'
      case 'REGISTERED_AGENT':
        return 'Registered Agent'
      case 'STATEMENT_INFO':
        return 'Statement of Info'
      case 'TAX_FILING':
        return 'Tax Filing'
      case 'OTHER':
        return 'Other'
      default:
        return taskType
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const isOverdue = (dueDate: Date, status: string) => {
    return status !== 'COMPLETED' && new Date(dueDate) < new Date()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Compliance Tasks</h1>
        <p className="text-muted-foreground">
          Monitor and manage business compliance deadlines
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{overdueCount}</div>
            <p className="text-xs text-muted-foreground">
              Require immediate attention
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting action
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressCount}</div>
            <p className="text-xs text-muted-foreground">
              Currently being worked on
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
              Successfully finished
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tasks Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Compliance Tasks</CardTitle>
          <CardDescription>
            View and manage compliance tasks for all businesses
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ClipboardCheck className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No Compliance Tasks</h3>
              <p className="text-muted-foreground">
                No compliance tasks have been created yet.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Business</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>
                      <div className="font-medium">{task.title}</div>
                      {task.description && (
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {task.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Link 
                        href={`/businesses/${task.business.id}`}
                        className="hover:underline flex items-center gap-2"
                      >
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{task.business.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {task.business.state}
                          </div>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getTaskTypeLabel(task.taskType)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className={`flex items-center gap-2 ${
                        isOverdue(task.dueDate, task.status) ? 'text-destructive' : ''
                      }`}>
                        <Calendar className="h-4 w-4" />
                        {formatDate(task.dueDate)}
                      </div>
                    </TableCell>
                    <TableCell>{getPriorityBadge(task.priority)}</TableCell>
                    <TableCell>{getStatusBadge(task.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/businesses/${task.business.id}`}>
                          View
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
