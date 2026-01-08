import Link from 'next/link'
import prisma from '@/lib/prisma'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Edit, Trash2, Ticket } from 'lucide-react'
import { revalidatePath } from 'next/cache'

interface CouponItem {
  id: string
  code: string
  description: string | null
  discountType: string
  discountValue: { toNumber: () => number }
  minOrderAmount: { toNumber: () => number } | null
  maxDiscountAmount: { toNumber: () => number } | null
  appliesToService: string | null
  usageLimit: number | null
  usedCount: number
  isActive: boolean
  startsAt: Date | null
  expiresAt: Date | null
  createdAt: Date
}

async function toggleCouponActive(formData: FormData) {
  'use server'
  
  const id = formData.get('id') as string
  const isActive = formData.get('isActive') === 'true'
  
  await prisma.coupon.update({
    where: { id },
    data: { isActive: !isActive },
  })
  
  revalidatePath('/coupons')
}

async function deleteCoupon(formData: FormData) {
  'use server'
  
  const id = formData.get('id') as string
  
  await prisma.coupon.delete({
    where: { id },
  })
  
  revalidatePath('/coupons')
}

export default async function CouponsPage() {
  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: 'desc' },
  })

  const activeCoupons = coupons.filter((c: { isActive: boolean }) => c.isActive)
  const expiredCoupons = coupons.filter((c: { expiresAt: Date | null }) => c.expiresAt && new Date(c.expiresAt) < new Date())
  const totalRedemptions = coupons.reduce((sum: number, c: { usedCount: number }) => sum + c.usedCount, 0)

  const getCouponStatus = (coupon: CouponItem) => {
    if (!coupon.isActive) return { label: 'Inactive', variant: 'secondary' as const }
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return { label: 'Expired', variant: 'destructive' as const }
    }
    if (coupon.startsAt && new Date(coupon.startsAt) > new Date()) {
      return { label: 'Scheduled', variant: 'warning' as const }
    }
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return { label: 'Exhausted', variant: 'secondary' as const }
    }
    return { label: 'Active', variant: 'success' as const }
  }

  const formatDiscount = (coupon: CouponItem) => {
    if (coupon.discountType === 'PERCENTAGE') {
      return `${coupon.discountValue.toNumber()}%`
    }
    return formatCurrency(coupon.discountValue.toNumber())
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Coupons</h1>
          <p className="text-muted-foreground">
            Manage discount codes and promotional offers
          </p>
        </div>
        <Link href="/coupons/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Coupon
          </Button>
        </Link>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Coupons
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{coupons.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeCoupons.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Expired
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{expiredCoupons.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Redemptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRedemptions}</div>
          </CardContent>
        </Card>
      </div>

      {/* Coupons Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Coupons</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Validity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(coupons as CouponItem[]).map((coupon) => {
                const status = getCouponStatus(coupon)
                return (
                  <TableRow key={coupon.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Ticket className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <code className="font-mono font-bold text-sm">{coupon.code}</code>
                          {coupon.description && (
                            <p className="text-xs text-muted-foreground truncate max-w-40">
                              {coupon.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge variant="outline" className="font-mono">
                          {formatDiscount(coupon)} OFF
                        </Badge>
                        {coupon.minOrderAmount && (
                          <p className="text-xs text-muted-foreground">
                            Min: {formatCurrency(coupon.minOrderAmount.toNumber())}
                          </p>
                        )}
                        {coupon.maxDiscountAmount && (
                          <p className="text-xs text-muted-foreground">
                            Max: {formatCurrency(coupon.maxDiscountAmount.toNumber())}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <span className="font-medium">{coupon.usedCount}</span>
                        {coupon.usageLimit ? (
                          <span className="text-muted-foreground"> / {coupon.usageLimit}</span>
                        ) : (
                          <span className="text-muted-foreground"> / ∞</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs space-y-1">
                        {coupon.startsAt && (
                          <div>
                            <span className="text-muted-foreground">From:</span>{' '}
                            {formatDateTime(coupon.startsAt)}
                          </div>
                        )}
                        {coupon.expiresAt ? (
                          <div>
                            <span className="text-muted-foreground">Until:</span>{' '}
                            {formatDateTime(coupon.expiresAt)}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No expiry</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <form action={toggleCouponActive}>
                        <input type="hidden" name="id" value={coupon.id} />
                        <input type="hidden" name="isActive" value={String(coupon.isActive)} />
                        <button type="submit">
                          <Switch checked={coupon.isActive} />
                        </button>
                      </form>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/coupons/${coupon.id}`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <form action={deleteCoupon}>
                          <input type="hidden" name="id" value={coupon.id} />
                          <Button variant="ghost" size="sm" type="submit" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </form>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
              {coupons.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <Ticket className="h-12 w-12 text-muted-foreground/50" />
                      <div>
                        <p className="font-medium">No coupons yet</p>
                        <p className="text-sm text-muted-foreground">
                          Create your first coupon to offer discounts
                        </p>
                      </div>
                      <Link href="/coupons/new">
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Create Coupon
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
