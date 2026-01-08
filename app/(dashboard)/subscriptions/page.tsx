import Link from 'next/link'
import prisma from '@/lib/prisma'
import { formatDateTime, formatCurrency } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Eye } from 'lucide-react'
import type { SubscriptionListItem, WebsiteSubscriptionItem, SubscriptionIntentItem } from '@/lib/types'

interface RaSubscription {
  id: string
  name: string | null
  amount: { toNumber: () => number }
  interval: string | null
  status: string
  currentPeriodEnd: Date | null
  createdAt: Date
  business: { name: string; state: string } | null
  user: { firstName: string; lastName: string; email: string }
}

interface WsSubscription {
  id: string
  tier: string
  monthlyPrice: { toNumber: () => number }
  status: string
  domainName: string | null
  createdAt: Date
  order: { business: { name: string } | null }
}

interface SiIntent {
  id: string
  companyName: string
  customerName: string
  customerEmail: string
  service: string
  status: string
  amount: { toNumber: () => number }
  frequency: string
  scheduledDate: Date
}

interface SubscriptionsPageProps {
  searchParams: Promise<{
    tab?: string
    search?: string
    status?: string
    page?: string
  }>
}

export default async function SubscriptionsPage({ searchParams }: SubscriptionsPageProps) {
  const params = await searchParams
  const activeTab = params.tab || 'registered-agent'
  const page = parseInt(params.page || '1')
  const perPage = 20
  const skip = (page - 1) * perPage

  // Fetch registered agent subscriptions
  const raWhere: Record<string, unknown> = {}
  if (params.status) {
    raWhere.status = params.status
  }

  const [
    raSubscriptions,
    raCount,
    wsSubscriptions,
    wsCount,
    siIntents,
    siCount,
  ] = await Promise.all([
    prisma.subscription.findMany({
      where: raWhere,
      orderBy: { createdAt: 'desc' },
      take: perPage,
      skip,
      include: {
        business: {
          select: { name: true, state: true },
        },
        user: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    }),
    prisma.subscription.count({ where: raWhere }),
    prisma.websiteSubscription.findMany({
      orderBy: { createdAt: 'desc' },
      take: perPage,
      skip,
      include: {
        order: {
          select: { 
            business: {
              select: { name: true }
            }
          },
        },
      },
    }),
    prisma.websiteSubscription.count(),
    prisma.subscriptionIntent.findMany({
      orderBy: { createdAt: 'desc' },
      take: perPage,
      skip,
    }),
    prisma.subscriptionIntent.count(),
  ])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="success">Active</Badge>
      case 'CANCELED':
      case 'CANCELLED':
        return <Badge variant="destructive">Canceled</Badge>
      case 'EXPIRED':
        return <Badge variant="secondary">Expired</Badge>
      case 'PENDING':
        return <Badge variant="warning">Pending</Badge>
      case 'PAUSED':
        return <Badge variant="outline">Paused</Badge>
      case 'PROCESSING':
        return <Badge variant="info">Processing</Badge>
      case 'FAILED':
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Subscriptions</h1>
        <p className="text-muted-foreground">
          Manage all subscription types across the platform
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Registered Agent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{raCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Website Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{wsCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Intents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{siCount}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue={activeTab}>
        <TabsList>
          <TabsTrigger value="registered-agent">Registered Agent</TabsTrigger>
          <TabsTrigger value="website">Website</TabsTrigger>
          <TabsTrigger value="intents">Intents</TabsTrigger>
        </TabsList>

        {/* Registered Agent Subscriptions */}
        <TabsContent value="registered-agent" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <form className="flex flex-wrap gap-4">
                <input type="hidden" name="tab" value="registered-agent" />
                <Input
                  name="search"
                  placeholder="Search subscriptions..."
                  defaultValue={params.search}
                  className="w-full md:w-64"
                />
                <select 
                  name="status" 
                  defaultValue={params.status || ''}
                  className="flex h-9 w-40 rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                >
                  <option value="">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="CANCELED">Canceled</option>
                  <option value="EXPIRED">Expired</option>
                  <option value="PENDING">Pending</option>
                </select>
                <Button type="submit">Filter</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Registered Agent Subscriptions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Business</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Period End</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(raSubscriptions as RaSubscription[]).map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{sub.business?.name ?? 'N/A'}</p>
                          <p className="text-sm text-muted-foreground">{sub.business?.state ?? ''}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{sub.user.firstName} {sub.user.lastName}</p>
                          <p className="text-muted-foreground">{sub.user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{sub.name}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(String(sub.status))}</TableCell>
                      <TableCell>{formatCurrency(Number(sub.amount))}/{sub.interval}</TableCell>
                      <TableCell>
                        {sub.currentPeriodEnd 
                          ? formatDateTime(sub.currentPeriodEnd)
                          : '—'
                        }
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/subscriptions/${sub.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                  {raSubscriptions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No subscriptions found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Website Subscriptions */}
        <TabsContent value="website" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Website Subscriptions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Business</TableHead>
                    <TableHead>Domain</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(wsSubscriptions as WsSubscription[]).map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell className="font-medium">
                        {sub.order.business?.name ?? 'N/A'}
                      </TableCell>
                      <TableCell>
                        {sub.domainName || <span className="text-muted-foreground">Not set</span>}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{String(sub.tier)}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(String(sub.status))}</TableCell>
                      <TableCell>{formatCurrency(Number(sub.monthlyPrice))}/mo</TableCell>
                      <TableCell>{formatDateTime(sub.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <Link href={`/subscriptions/website/${sub.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                  {wsSubscriptions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No website subscriptions found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscription Intents */}
        <TabsContent value="intents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Intents (Pending Signups)</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Scheduled</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(siIntents as SiIntent[]).map((intent) => (
                    <TableRow key={intent.id}>
                      <TableCell className="font-medium">
                        {intent.companyName}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{intent.customerName}</p>
                          <p className="text-muted-foreground">{intent.customerEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{intent.service}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(String(intent.status))}</TableCell>
                      <TableCell>{formatCurrency(Number(intent.amount))}/{String(intent.frequency).toLowerCase()}</TableCell>
                      <TableCell>{formatDateTime(intent.scheduledDate)}</TableCell>
                      <TableCell className="text-right">
                        <Link href={`/subscriptions/intent/${intent.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                  {siIntents.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No subscription intents found
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
  )
}
