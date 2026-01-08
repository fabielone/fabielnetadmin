import { notFound } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/prisma'
import { formatDateTime, formatCurrency, getStatusColor } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getInitials } from '@/lib/utils'
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Shield, Building2 } from 'lucide-react'

interface UserOrder {
  id: string
  orderId: string
  companyName: string
  totalAmount: { toNumber: () => number }
  status: string
  createdAt: Date
}

interface UserBusiness {
  id: string
  name: string
  entityType: string
  state: string
  status: string
  _count: { members: number }
}

interface UserSubscription {
  id: string
  name: string | null
  amount: { toNumber: () => number }
  interval: string | null
  status: string
  createdAt: Date
}

interface UserPayment {
  id: string
  description: string | null
  amount: { toNumber: () => number }
  paymentMethod: string
  status: string
  createdAt: Date
}

interface UserDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const { id } = await params

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      orders: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      businesses: {
        include: {
          _count: {
            select: { members: true },
          },
        },
      },
      subscriptions: {
        orderBy: { createdAt: 'desc' },
      },
      payments: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  })

  if (!user) {
    notFound()
  }

  const getRoleBadge = (role: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      CUSTOMER: 'secondary',
      ADMIN: 'default',
      SUPER_ADMIN: 'destructive',
    }
    return variants[role] ?? 'secondary'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/users">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.avatarUrl ?? undefined} />
            <AvatarFallback className="text-xl">
              {getInitials(user.firstName, user.lastName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{user.firstName} {user.lastName}</h1>
              <Badge variant={getRoleBadge(user.role)}>
                {user.role.replace('_', ' ')}
              </Badge>
              <Badge variant={user.isActive ? 'success' : 'secondary'}>
                {user.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="orders">
            <TabsList>
              <TabsTrigger value="orders">Orders ({user.orders.length})</TabsTrigger>
              <TabsTrigger value="businesses">Businesses ({user.businesses.length})</TabsTrigger>
              <TabsTrigger value="subscriptions">Subscriptions ({user.subscriptions.length})</TabsTrigger>
              <TabsTrigger value="payments">Payments ({user.payments.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="orders">
              <Card>
                <CardContent className="pt-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(user.orders as UserOrder[]).map((order) => (
                        <TableRow key={order.id}>
                          <TableCell>
                            <Link href={`/orders/${order.id}`} className="text-primary hover:underline">
                              {order.orderId}
                            </Link>
                          </TableCell>
                          <TableCell>{order.companyName}</TableCell>
                          <TableCell>{formatCurrency(order.totalAmount.toNumber())}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-md text-xs font-medium ${getStatusColor(order.status)}`}>
                              {order.status.replace('_', ' ')}
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDateTime(order.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                      {user.orders.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            No orders yet
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="businesses">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {(user.businesses as UserBusiness[]).map((business) => (
                      <div key={business.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <Link href={`/businesses/${business.id}`} className="font-medium hover:underline">
                              {business.name}
                            </Link>
                            <p className="text-sm text-muted-foreground">
                              {business.entityType} • {business.state} • {business._count.members} members
                            </p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${getStatusColor(business.status)}`}>
                          {business.status}
                        </span>
                      </div>
                    ))}
                    {user.businesses.length === 0 && (
                      <p className="text-center py-8 text-muted-foreground">
                        No businesses yet
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="subscriptions">
              <Card>
                <CardContent className="pt-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Interval</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(user.subscriptions as UserSubscription[]).map((sub) => (
                        <TableRow key={sub.id}>
                          <TableCell className="font-medium">{sub.name}</TableCell>
                          <TableCell>{formatCurrency(sub.amount.toNumber())}</TableCell>
                          <TableCell className="capitalize">{sub.interval}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-md text-xs font-medium ${getStatusColor(sub.status)}`}>
                              {sub.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDateTime(sub.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                      {user.subscriptions.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            No subscriptions yet
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payments">
              <Card>
                <CardContent className="pt-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(user.payments as UserPayment[]).map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>{payment.description || 'Payment'}</TableCell>
                          <TableCell>{formatCurrency(payment.amount.toNumber())}</TableCell>
                          <TableCell className="capitalize">{payment.paymentMethod}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-md text-xs font-medium ${getStatusColor(payment.status)}`}>
                              {payment.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDateTime(payment.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                      {user.payments.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            No payments yet
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
          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${user.email}`} className="text-primary hover:underline">
                  {user.email}
                </a>
                {user.emailVerified && (
                  <Badge variant="success" className="text-xs">Verified</Badge>
                )}
              </div>
              {user.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${user.phone}`} className="text-primary hover:underline">
                    {user.phone}
                  </a>
                </div>
              )}
              {user.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span className="text-sm">{user.address}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Info */}
          <Card>
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Joined</span>
                <span>{formatDateTime(user.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Login</span>
                <span>{user.lastLoginAt ? formatDateTime(user.lastLoginAt) : 'Never'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Onboarding</span>
                <span>{user.onboardingCompleted ? 'Completed' : 'Pending'}</span>
              </div>
              {user.referralSource && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Referral</span>
                  <span>{user.referralSource}</span>
                </div>
              )}
              {user.stripeCustomerId && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stripe ID</span>
                  <span className="font-mono text-xs">{user.stripeCustomerId}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full">
                <Shield className="h-4 w-4 mr-2" />
                Change Role
              </Button>
              <Button variant="outline" className="w-full">
                {user.isActive ? 'Deactivate' : 'Activate'} Account
              </Button>
              <Button variant="outline" className="w-full">
                Reset Password
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
