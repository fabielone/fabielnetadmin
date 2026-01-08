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
