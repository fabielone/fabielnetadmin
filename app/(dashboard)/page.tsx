import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import prisma from '@/lib/prisma'
import { formatCurrency, formatRelativeTime } from '@/lib/utils'
import type { RecentOrder } from '@/lib/types'
import {
  ShoppingCart,
  Users,
  Building2,
  DollarSign,
  TrendingUp,
  Clock,
  AlertCircle,
} from 'lucide-react'
import Link from 'next/link'

async function getDashboardStats() {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    totalOrders,
    pendingOrders,
    processingOrders,
    completedOrders,
    totalUsers,
    totalBusinesses,
    activeSubscriptions,
    pendingQuestionnaires,
    overdueCompliance,
    recentOrders,
    todayRevenue,
    monthRevenue,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: 'PENDING_PROCESSING' as never } }),
    prisma.order.count({ where: { status: 'PROCESSING' as never } }),
    prisma.order.count({ where: { status: 'COMPLETED' as never } }),
    prisma.user.count(),
    prisma.business.count(),
    prisma.subscription.count({ where: { status: 'ACTIVE' as never } }),
    prisma.questionnaireResponse.count({ where: { status: 'IN_PROGRESS' as never } }),
    prisma.complianceTask.count({ where: { status: 'OVERDUE' as never } }),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        orderId: true,
        companyName: true,
        status: true,
        totalAmount: true,
        createdAt: true,
        priority: true,
      },
    }),
    prisma.order.aggregate({
      where: {
        createdAt: { gte: startOfDay },
        paymentStatus: 'COMPLETED' as never,
      },
      _sum: { totalAmount: true },
    }),
    prisma.order.aggregate({
      where: {
        createdAt: { gte: startOfMonth },
        paymentStatus: 'COMPLETED' as never,
      },
      _sum: { totalAmount: true },
    }),
  ])

  return {
    totalOrders,
    pendingOrders,
    processingOrders,
    completedOrders,
    totalUsers,
    totalBusinesses,
    activeSubscriptions,
    pendingQuestionnaires,
    overdueCompliance,
    recentOrders,
    todayRevenue: todayRevenue._sum.totalAmount?.toNumber() ?? 0,
    monthRevenue: monthRevenue._sum.totalAmount?.toNumber() ?? 0,
  }
}

export default async function DashboardPage() {
  const stats = await getDashboardStats()

  const statCards = [
    {
      title: 'Total Revenue (Month)',
      value: formatCurrency(stats.monthRevenue),
      icon: DollarSign,
      description: `${formatCurrency(stats.todayRevenue)} today`,
      color: 'text-green-600',
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders.toString(),
      icon: ShoppingCart,
      description: `${stats.pendingOrders} pending`,
      color: 'text-blue-600',
    },
    {
      title: 'Total Users',
      value: stats.totalUsers.toString(),
      icon: Users,
      description: 'Registered users',
      color: 'text-purple-600',
    },
    {
      title: 'Active Businesses',
      value: stats.totalBusinesses.toString(),
      icon: Building2,
      description: `${stats.activeSubscriptions} subscriptions`,
      color: 'text-orange-600',
    },
  ]

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'success' | 'warning'> = {
      PENDING_PROCESSING: 'warning',
      PROCESSING: 'info' as 'default',
      COMPLETED: 'success',
      CANCELLED: 'destructive',
      REFUNDED: 'secondary',
    }
    return variants[status] ?? 'default'
  }

  const getPriorityBadge = (priority: string) => {
    if (priority === 'URGENT') return 'destructive'
    if (priority === 'HIGH') return 'warning'
    return 'secondary'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here&apos;s what&apos;s happening.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions & Alerts */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Pending Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Clock className="h-4 w-4 text-yellow-600" />
            <CardTitle className="text-base">Pending Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.pendingOrders}</div>
            <p className="text-sm text-muted-foreground">
              {stats.processingOrders} currently processing
            </p>
            <Link 
              href="/orders?status=PENDING_PROCESSING"
              className="text-sm text-primary hover:underline mt-2 inline-block"
            >
              View pending orders →
            </Link>
          </CardContent>
        </Card>

        {/* Pending Questionnaires */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            <CardTitle className="text-base">Pending Questionnaires</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.pendingQuestionnaires}</div>
            <p className="text-sm text-muted-foreground">
              Awaiting customer responses
            </p>
            <Link 
              href="/questionnaires"
              className="text-sm text-primary hover:underline mt-2 inline-block"
            >
              View questionnaires →
            </Link>
          </CardContent>
        </Card>

        {/* Overdue Compliance */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <CardTitle className="text-base">Overdue Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{stats.overdueCompliance}</div>
            <p className="text-sm text-muted-foreground">
              Compliance tasks overdue
            </p>
            <Link 
              href="/compliance?status=OVERDUE"
              className="text-sm text-primary hover:underline mt-2 inline-block"
            >
              View overdue tasks →
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Orders</CardTitle>
            <Link 
              href="/orders"
              className="text-sm text-primary hover:underline"
            >
              View all
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.recentOrders.map((order: RecentOrder) => (
              <div
                key={order.id}
                className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Link 
                      href={`/orders/${order.id}`}
                      className="font-medium hover:underline"
                    >
                      {order.orderId}
                    </Link>
                    {String(order.priority) !== 'NORMAL' && (
                      <Badge variant={getPriorityBadge(String(order.priority))}>
                        {String(order.priority)}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{order.companyName}</p>
                </div>
                <div className="text-right space-y-1">
                  <Badge variant={getStatusBadge(String(order.status))}>
                    {String(order.status).replace('_', ' ')}
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    {formatRelativeTime(order.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
