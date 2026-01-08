import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft } from 'lucide-react'
import { revalidatePath } from 'next/cache'

async function createCoupon(formData: FormData) {
  'use server'
  
  const code = (formData.get('code') as string).toUpperCase().replace(/\s/g, '')
  const description = formData.get('description') as string
  const discountType = formData.get('discountType') as string
  const discountValue = parseFloat(formData.get('discountValue') as string)
  const minOrderAmount = formData.get('minOrderAmount') as string
  const maxDiscountAmount = formData.get('maxDiscountAmount') as string
  const appliesToService = formData.get('appliesToService') as string
  const usageLimit = formData.get('usageLimit') as string
  const startsAt = formData.get('startsAt') as string
  const expiresAt = formData.get('expiresAt') as string
  const isActive = formData.get('isActive') === 'on'
  
  await prisma.coupon.create({
    data: {
      code,
      description: description || null,
      discountType: discountType as never,
      discountValue,
      minOrderAmount: minOrderAmount ? parseFloat(minOrderAmount) : null,
      maxDiscountAmount: maxDiscountAmount ? parseFloat(maxDiscountAmount) : null,
      appliesToService: appliesToService || null,
      usageLimit: usageLimit ? parseInt(usageLimit) : null,
      startsAt: startsAt ? new Date(startsAt) : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      isActive,
    },
  })
  
  revalidatePath('/coupons')
  redirect('/coupons')
}

export default function NewCouponPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/coupons">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Create Coupon</h1>
          <p className="text-muted-foreground">Add a new discount code</p>
        </div>
      </div>

      <form action={createCoupon} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Coupon Details</CardTitle>
            <CardDescription>
              Configure the discount code and its settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="code">Coupon Code *</Label>
                <Input
                  id="code"
                  name="code"
                  required
                  placeholder="e.g., SAVE20"
                  className="uppercase"
                />
                <p className="text-xs text-muted-foreground">
                  Automatically converted to uppercase
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="discountType">Discount Type *</Label>
                <select
                  id="discountType"
                  name="discountType"
                  required
                  defaultValue="PERCENTAGE"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                >
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED">Fixed Amount ($)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Internal description for this coupon..."
                rows={2}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="discountValue">Discount Value *</Label>
                <Input
                  id="discountValue"
                  name="discountValue"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="e.g., 20 for 20% or $20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="usageLimit">Usage Limit</Label>
                <Input
                  id="usageLimit"
                  name="usageLimit"
                  type="number"
                  min="1"
                  placeholder="Leave empty for unlimited"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="minOrderAmount">Minimum Order Amount ($)</Label>
                <Input
                  id="minOrderAmount"
                  name="minOrderAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Optional"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxDiscountAmount">Maximum Discount ($)</Label>
                <Input
                  id="maxDiscountAmount"
                  name="maxDiscountAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Optional (for % discounts)"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="appliesToService">Applies To Service (optional)</Label>
              <Input
                id="appliesToService"
                name="appliesToService"
                placeholder="Leave empty for all services"
              />
              <p className="text-xs text-muted-foreground">
                Enter a service key to restrict this coupon to a specific service
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Validity Period</CardTitle>
            <CardDescription>
              Set when this coupon can be used
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startsAt">Start Date</Label>
                <Input
                  id="startsAt"
                  name="startsAt"
                  type="datetime-local"
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to start immediately
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiresAt">Expiry Date</Label>
                <Input
                  id="expiresAt"
                  name="expiresAt"
                  type="datetime-local"
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty for no expiration
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div>
                <Label>Active</Label>
                <p className="text-sm text-muted-foreground">
                  Enable this coupon for immediate use
                </p>
              </div>
              <Switch name="isActive" defaultChecked />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit">Create Coupon</Button>
          <Link href="/coupons">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
