import Link from 'next/link'
import prisma from '@/lib/prisma'
import { formatCurrency, formatDateTime, getStatusColor, getPriorityColor } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Eye } from 'lucide-react'
import type { OrderListItem } from '@/lib/types'

interface OrdersPageProps {
  searchParams: Promise<{
    status?: string
    payment?: string
    priority?: string
    search?: string
    page?: string
  }>
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const params = await searchParams
  const page = parseInt(params.page || '1')
  const perPage = 20
  const skip = (page - 1) * perPage

  const where: Record<string, unknown> = {}
  
  if (params.status) {
    where.status = params.status
  }
  if (params.payment) {
    where.paymentStatus = params.payment
  }
  if (params.priority) {
    where.priority = params.priority
  }
  if (params.search) {
    where.OR = [
      { orderId: { contains: params.search, mode: 'insensitive' } },
      { companyName: { contains: params.search, mode: 'insensitive' } },
      { contactEmail: { contains: params.search, mode: 'insensitive' } },
    ]
  }

  const [orders, totalCount] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: perPage,
      skip,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    }),
    prisma.order.count({ where }),
  ])

  const totalPages = Math.ceil(totalCount / perPage)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Orders</h1>
          <p className="text-muted-foreground">
            Manage and process customer orders
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <form className="flex flex-wrap gap-4">
            <Input
              name="search"
              placeholder="Search orders..."
              defaultValue={params.search}
              className="w-full md:w-64"
            />
            <Select name="status" defaultValue={params.status || ''}>
              <option value="">All Statuses</option>
              <option value="PENDING_PROCESSING">Pending Processing</option>
              <option value="PROCESSING">Processing</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="REFUNDED">Refunded</option>
            </Select>
            <Select name="payment" defaultValue={params.payment || ''}>
              <option value="">All Payments</option>
              <option value="PENDING">Pending</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed</option>
              <option value="REFUNDED">Refunded</option>
            </Select>
            <Select name="priority" defaultValue={params.priority || ''}>
              <option value="">All Priorities</option>
              <option value="NORMAL">Normal</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </Select>
            <Button type="submit">Filter</Button>
          </form>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Orders ({totalCount})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(orders as OrderListItem[]).map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-sm">
                    {order.orderId}
                  </TableCell>
                  <TableCell className="font-medium">
                    {order.companyName}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {order.user 
                        ? `${order.user.firstName} ${order.user.lastName}`
                        : `${order.contactFirstName} ${order.contactLastName}`
                      }
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {order.contactEmail}
                    </div>
                  </TableCell>
                  <TableCell>
                    {formatCurrency(order.totalAmount.toNumber())}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getStatusColor(String(order.status))}`}>
                      {String(order.status).replace('_', ' ')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getStatusColor(String(order.paymentStatus))}`}>
                      {String(order.paymentStatus)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {String(order.priority) !== 'NORMAL' && (
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getPriorityColor(String(order.priority))}`}>
                        {String(order.priority)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDateTime(order.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/orders/${order.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {orders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No orders found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {skip + 1} to {Math.min(skip + perPage, totalCount)} of {totalCount} orders
              </p>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link href={`/orders?page=${page - 1}&status=${params.status || ''}&payment=${params.payment || ''}&priority=${params.priority || ''}&search=${params.search || ''}`}>
                    <Button variant="outline" size="sm">Previous</Button>
                  </Link>
                )}
                {page < totalPages && (
                  <Link href={`/orders?page=${page + 1}&status=${params.status || ''}&payment=${params.payment || ''}&priority=${params.priority || ''}&search=${params.search || ''}`}>
                    <Button variant="outline" size="sm">Next</Button>
                  </Link>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
