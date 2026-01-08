'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Pencil } from 'lucide-react'

// Service Pricing Edit Dialog
interface ServicePricingData {
  id: string
  serviceKey: string
  serviceName: string
  description: string | null
  basePrice: number
  isRecurring: boolean
  recurringPrice: number | null
  billingCycle: string | null
  isActive: boolean
  isRequired: boolean
}

interface EditServiceDialogProps {
  service: ServicePricingData
  onSave: (formData: FormData) => Promise<void>
}

export function EditServiceDialog({ service, onSave }: EditServiceDialogProps) {
  const [open, setOpen] = useState(false)
  const [isRecurring, setIsRecurring] = useState(service.isRecurring)
  const [isRequired, setIsRequired] = useState(service.isRequired)
  const [isPending, setIsPending] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)
    const formData = new FormData(e.currentTarget)
    formData.set('isRecurring', String(isRecurring))
    formData.set('isRequired', String(isRequired))
    await onSave(formData)
    setIsPending(false)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Service Pricing</DialogTitle>
            <DialogDescription>
              Update pricing for {service.serviceName}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <input type="hidden" name="id" value={service.id} />
            
            <div className="grid gap-2">
              <Label htmlFor="serviceName">Service Name</Label>
              <Input
                id="serviceName"
                name="serviceName"
                defaultValue={service.serviceName}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="serviceKey">Service Key</Label>
              <Input
                id="serviceKey"
                name="serviceKey"
                defaultValue={service.serviceKey}
                required
                className="font-mono"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={service.description || ''}
                rows={2}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="basePrice">Base Price ($)</Label>
              <Input
                id="basePrice"
                name="basePrice"
                type="number"
                step="0.01"
                min="0"
                defaultValue={service.basePrice}
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="isRequired">Required Service</Label>
              <Switch
                id="isRequired"
                checked={isRequired}
                onCheckedChange={setIsRequired}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="isRecurring">Recurring Billing</Label>
              <Switch
                id="isRecurring"
                checked={isRecurring}
                onCheckedChange={setIsRecurring}
              />
            </div>

            {isRecurring && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="recurringPrice">Recurring Price ($)</Label>
                  <Input
                    id="recurringPrice"
                    name="recurringPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={service.recurringPrice || ''}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="billingCycle">Billing Cycle</Label>
                  <select
                    id="billingCycle"
                    name="billingCycle"
                    defaultValue={service.billingCycle || 'MONTHLY'}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="ANNUALLY">Annually</option>
                  </select>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// State Fee Edit Dialog
interface StateFeeData {
  id: string
  stateCode: string
  stateName: string
  filingFee: number
  rushFee: number | null
  rushAvailable: boolean
  rushDays: number | null
  standardDays: number
  annualReportFee: number | null
  franchiseTaxFee: number | null
  isActive: boolean
}

interface EditStateFeeDialogProps {
  stateFee: StateFeeData
  onSave: (formData: FormData) => Promise<void>
}

export function EditStateFeeDialog({ stateFee, onSave }: EditStateFeeDialogProps) {
  const [open, setOpen] = useState(false)
  const [rushAvailable, setRushAvailable] = useState(stateFee.rushAvailable)
  const [isPending, setIsPending] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)
    const formData = new FormData(e.currentTarget)
    formData.set('rushAvailable', String(rushAvailable))
    await onSave(formData)
    setIsPending(false)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit State Fees</DialogTitle>
            <DialogDescription>
              Update filing fees for {stateFee.stateName}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <input type="hidden" name="id" value={stateFee.id} />
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="stateName">State Name</Label>
                <Input
                  id="stateName"
                  name="stateName"
                  defaultValue={stateFee.stateName}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="stateCode">State Code</Label>
                <Input
                  id="stateCode"
                  name="stateCode"
                  defaultValue={stateFee.stateCode}
                  maxLength={2}
                  required
                  className="uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="filingFee">Filing Fee ($)</Label>
                <Input
                  id="filingFee"
                  name="filingFee"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={stateFee.filingFee}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="standardDays">Standard Processing (days)</Label>
                <Input
                  id="standardDays"
                  name="standardDays"
                  type="number"
                  min="1"
                  defaultValue={stateFee.standardDays}
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="rushAvailable">Rush Processing Available</Label>
              <Switch
                id="rushAvailable"
                checked={rushAvailable}
                onCheckedChange={setRushAvailable}
              />
            </div>

            {rushAvailable && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="rushFee">Rush Fee ($)</Label>
                  <Input
                    id="rushFee"
                    name="rushFee"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={stateFee.rushFee || ''}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="rushDays">Rush Processing (days)</Label>
                  <Input
                    id="rushDays"
                    name="rushDays"
                    type="number"
                    min="1"
                    defaultValue={stateFee.rushDays || ''}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="annualReportFee">Annual Report Fee ($)</Label>
                <Input
                  id="annualReportFee"
                  name="annualReportFee"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={stateFee.annualReportFee || ''}
                  placeholder="Optional"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="franchiseTaxFee">Franchise Tax Fee ($)</Label>
                <Input
                  id="franchiseTaxFee"
                  name="franchiseTaxFee"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={stateFee.franchiseTaxFee || ''}
                  placeholder="Optional"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Registered Agent Pricing Edit Dialog
interface RaPricingData {
  id: string
  stateCode: string
  annualFee: number
  firstYearFee: number | null
  includedWithFormation: boolean
  includedMonths: number | null
  isActive: boolean
}

interface EditRaPricingDialogProps {
  raPricing: RaPricingData
  onSave: (formData: FormData) => Promise<void>
}

export function EditRaPricingDialog({ raPricing, onSave }: EditRaPricingDialogProps) {
  const [open, setOpen] = useState(false)
  const [includedWithFormation, setIncludedWithFormation] = useState(raPricing.includedWithFormation)
  const [isPending, setIsPending] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)
    const formData = new FormData(e.currentTarget)
    formData.set('includedWithFormation', String(includedWithFormation))
    await onSave(formData)
    setIsPending(false)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit RA Pricing</DialogTitle>
            <DialogDescription>
              Update registered agent pricing for {raPricing.stateCode}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <input type="hidden" name="id" value={raPricing.id} />
            
            <div className="grid gap-2">
              <Label htmlFor="stateCode">State Code</Label>
              <Input
                id="stateCode"
                name="stateCode"
                defaultValue={raPricing.stateCode}
                maxLength={2}
                required
                className="uppercase"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="annualFee">Annual Fee ($)</Label>
              <Input
                id="annualFee"
                name="annualFee"
                type="number"
                step="0.01"
                min="0"
                defaultValue={raPricing.annualFee}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="firstYearFee">First Year Fee ($)</Label>
              <Input
                id="firstYearFee"
                name="firstYearFee"
                type="number"
                step="0.01"
                min="0"
                defaultValue={raPricing.firstYearFee || ''}
                placeholder="Leave empty if same as annual"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="includedWithFormation">Included with Formation</Label>
              <Switch
                id="includedWithFormation"
                checked={includedWithFormation}
                onCheckedChange={setIncludedWithFormation}
              />
            </div>

            {includedWithFormation && (
              <div className="grid gap-2">
                <Label htmlFor="includedMonths">Included Months</Label>
                <Input
                  id="includedMonths"
                  name="includedMonths"
                  type="number"
                  min="1"
                  defaultValue={raPricing.includedMonths || 12}
                  placeholder="Number of months included"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Website Pricing Edit Dialog
interface WebsitePricingData {
  id: string
  tier: string
  tierName: string
  description: string | null
  monthlyPrice: number
  yearlyPrice: number | null
  setupFee: number
  features: string | null
  pagesIncluded: number
  blogEnabled: boolean
  ecommerceEnabled: boolean
  customDomain: boolean
  sslIncluded: boolean
  analyticsIncluded: boolean
  supportLevel: string
  isActive: boolean
  isPopular: boolean
  sortOrder: number
}

interface EditWebsitePricingDialogProps {
  websitePricing?: WebsitePricingData
  isNew?: boolean
  onSave: (formData: FormData) => Promise<void>
}

export function EditWebsitePricingDialog({ websitePricing, isNew, onSave }: EditWebsitePricingDialogProps) {
  const [open, setOpen] = useState(false)
  const [blogEnabled, setBlogEnabled] = useState(websitePricing?.blogEnabled ?? false)
  const [ecommerceEnabled, setEcommerceEnabled] = useState(websitePricing?.ecommerceEnabled ?? false)
  const [customDomain, setCustomDomain] = useState(websitePricing?.customDomain ?? true)
  const [sslIncluded, setSslIncluded] = useState(websitePricing?.sslIncluded ?? true)
  const [analyticsIncluded, setAnalyticsIncluded] = useState(websitePricing?.analyticsIncluded ?? true)
  const [isPopular, setIsPopular] = useState(websitePricing?.isPopular ?? false)
  const [isPending, setIsPending] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)
    const formData = new FormData(e.currentTarget)
    formData.set('blogEnabled', String(blogEnabled))
    formData.set('ecommerceEnabled', String(ecommerceEnabled))
    formData.set('customDomain', String(customDomain))
    formData.set('sslIncluded', String(sslIncluded))
    formData.set('analyticsIncluded', String(analyticsIncluded))
    formData.set('isPopular', String(isPopular))
    await onSave(formData)
    setIsPending(false)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isNew ? (
          <Button>Add Tier</Button>
        ) : (
          <Button variant="ghost" size="icon">
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isNew ? 'Add Website Pricing Tier' : 'Edit Website Pricing'}</DialogTitle>
            <DialogDescription>
              {isNew ? 'Create a new website service pricing tier' : `Update pricing for ${websitePricing?.tierName}`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {!isNew && <input type="hidden" name="id" value={websitePricing?.id} />}
            
            {isNew && (
              <div className="grid gap-2">
                <Label htmlFor="tier">Tier Code</Label>
                <select
                  id="tier"
                  name="tier"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  required
                >
                  <option value="BASIC">BASIC</option>
                  <option value="PRO">PRO</option>
                  <option value="GROWTH">GROWTH</option>
                </select>
              </div>
            )}
            
            <div className="grid gap-2">
              <Label htmlFor="tierName">Tier Display Name</Label>
              <Input
                id="tierName"
                name="tierName"
                defaultValue={websitePricing?.tierName || ''}
                placeholder="e.g., Basic, Professional, Growth"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={websitePricing?.description || ''}
                placeholder="Brief description of this tier"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="monthlyPrice">Monthly Price ($)</Label>
                <Input
                  id="monthlyPrice"
                  name="monthlyPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={websitePricing?.monthlyPrice || ''}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="yearlyPrice">Yearly Price ($)</Label>
                <Input
                  id="yearlyPrice"
                  name="yearlyPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={websitePricing?.yearlyPrice || ''}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="setupFee">Setup Fee ($)</Label>
                <Input
                  id="setupFee"
                  name="setupFee"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={websitePricing?.setupFee || 0}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pagesIncluded">Pages Included</Label>
                <Input
                  id="pagesIncluded"
                  name="pagesIncluded"
                  type="number"
                  min="1"
                  defaultValue={websitePricing?.pagesIncluded || 5}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="features">Features (one per line)</Label>
              <Textarea
                id="features"
                name="features"
                defaultValue={websitePricing?.features || ''}
                placeholder="Custom design&#10;Mobile responsive&#10;SEO optimized"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="supportLevel">Support Level</Label>
                <select
                  id="supportLevel"
                  name="supportLevel"
                  defaultValue={websitePricing?.supportLevel || 'email'}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="email">Email Support</option>
                  <option value="chat">Chat Support</option>
                  <option value="phone">Phone Support</option>
                  <option value="priority">Priority Support</option>
                  <option value="dedicated">Dedicated Support</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sortOrder">Sort Order</Label>
                <Input
                  id="sortOrder"
                  name="sortOrder"
                  type="number"
                  min="0"
                  defaultValue={websitePricing?.sortOrder || 0}
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="blogEnabled">Blog Enabled</Label>
                <Switch
                  id="blogEnabled"
                  checked={blogEnabled}
                  onCheckedChange={setBlogEnabled}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="ecommerceEnabled">E-commerce Enabled</Label>
                <Switch
                  id="ecommerceEnabled"
                  checked={ecommerceEnabled}
                  onCheckedChange={setEcommerceEnabled}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="customDomain">Custom Domain</Label>
                <Switch
                  id="customDomain"
                  checked={customDomain}
                  onCheckedChange={setCustomDomain}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="sslIncluded">SSL Included</Label>
                <Switch
                  id="sslIncluded"
                  checked={sslIncluded}
                  onCheckedChange={setSslIncluded}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="analyticsIncluded">Analytics Included</Label>
                <Switch
                  id="analyticsIncluded"
                  checked={analyticsIncluded}
                  onCheckedChange={setAnalyticsIncluded}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="isPopular">Mark as Popular</Label>
                <Switch
                  id="isPopular"
                  checked={isPopular}
                  onCheckedChange={setIsPopular}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : isNew ? 'Create Tier' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
