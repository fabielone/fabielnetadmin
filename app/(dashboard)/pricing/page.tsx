import prisma from '@/lib/prisma'
import { formatCurrency } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Switch } from '@/components/ui/switch'
import { revalidatePath } from 'next/cache'
import { EditServiceDialog, EditStateFeeDialog, EditRaPricingDialog } from './PricingEditDialogs'

interface ServicePricingItem {
  id: string
  serviceKey: string
  serviceName: string
  description: string | null
  basePrice: { toNumber: () => number }
  isRecurring: boolean
  recurringPrice: { toNumber: () => number } | null
  billingCycle: string | null
  isActive: boolean
  isRequired: boolean
}

interface StateFeeItem {
  id: string
  stateCode: string
  stateName: string
  filingFee: { toNumber: () => number }
  rushFee: { toNumber: () => number } | null
  rushAvailable: boolean
  rushDays: number | null
  standardDays: number
  annualReportFee: { toNumber: () => number } | null
  franchiseTaxFee: { toNumber: () => number } | null
  isActive: boolean
}

interface RaPricingItem {
  id: string
  stateCode: string
  annualFee: { toNumber: () => number }
  firstYearFee: { toNumber: () => number } | null
  includedWithFormation: boolean
  includedMonths: number | null
  isActive: boolean
}

async function toggleServiceActive(formData: FormData) {
  'use server'
  
  const id = formData.get('id') as string
  const isActive = formData.get('isActive') === 'true'
  
  await prisma.servicePricing.update({
    where: { id },
    data: { isActive: !isActive },
  })
  
  revalidatePath('/pricing')
}

async function toggleStateFeeActive(formData: FormData) {
  'use server'
  
  const id = formData.get('id') as string
  const isActive = formData.get('isActive') === 'true'
  
  await prisma.stateFee.update({
    where: { id },
    data: { isActive: !isActive },
  })
  
  revalidatePath('/pricing')
}

async function toggleRaPricingActive(formData: FormData) {
  'use server'
  
  const id = formData.get('id') as string
  const isActive = formData.get('isActive') === 'true'
  
  await prisma.registeredAgentPricing.update({
    where: { id },
    data: { isActive: !isActive },
  })
  
  revalidatePath('/pricing')
}

async function updateServicePricing(formData: FormData) {
  'use server'
  
  const id = formData.get('id') as string
  const serviceName = formData.get('serviceName') as string
  const serviceKey = formData.get('serviceKey') as string
  const description = formData.get('description') as string
  const basePrice = parseFloat(formData.get('basePrice') as string)
  const isRecurring = formData.get('isRecurring') === 'true'
  const isRequired = formData.get('isRequired') === 'true'
  const recurringPrice = formData.get('recurringPrice') as string
  const billingCycle = formData.get('billingCycle') as string
  
  await prisma.servicePricing.update({
    where: { id },
    data: {
      serviceName,
      serviceKey,
      description: description || null,
      basePrice,
      isRecurring,
      isRequired,
      recurringPrice: isRecurring && recurringPrice ? parseFloat(recurringPrice) : null,
      billingCycle: isRecurring ? billingCycle as never : null,
    },
  })
  
  revalidatePath('/pricing')
}

async function updateStateFee(formData: FormData) {
  'use server'
  
  const id = formData.get('id') as string
  const stateName = formData.get('stateName') as string
  const stateCode = (formData.get('stateCode') as string).toUpperCase()
  const filingFee = parseFloat(formData.get('filingFee') as string)
  const standardDays = parseInt(formData.get('standardDays') as string)
  const rushAvailable = formData.get('rushAvailable') === 'true'
  const rushFee = formData.get('rushFee') as string
  const rushDays = formData.get('rushDays') as string
  const annualReportFee = formData.get('annualReportFee') as string
  const franchiseTaxFee = formData.get('franchiseTaxFee') as string
  
  await prisma.stateFee.update({
    where: { id },
    data: {
      stateName,
      stateCode,
      filingFee,
      standardDays,
      rushAvailable,
      rushFee: rushAvailable && rushFee ? parseFloat(rushFee) : null,
      rushDays: rushAvailable && rushDays ? parseInt(rushDays) : null,
      annualReportFee: annualReportFee ? parseFloat(annualReportFee) : null,
      franchiseTaxFee: franchiseTaxFee ? parseFloat(franchiseTaxFee) : null,
    },
  })
  
  revalidatePath('/pricing')
}

async function updateRaPricing(formData: FormData) {
  'use server'
  
  const id = formData.get('id') as string
  const stateCode = (formData.get('stateCode') as string).toUpperCase()
  const annualFee = parseFloat(formData.get('annualFee') as string)
  const firstYearFee = formData.get('firstYearFee') as string
  const includedWithFormation = formData.get('includedWithFormation') === 'true'
  const includedMonths = formData.get('includedMonths') as string
  
  await prisma.registeredAgentPricing.update({
    where: { id },
    data: {
      stateCode,
      annualFee,
      firstYearFee: firstYearFee ? parseFloat(firstYearFee) : null,
      includedWithFormation,
      includedMonths: includedWithFormation && includedMonths ? parseInt(includedMonths) : null,
    },
  })
  
  revalidatePath('/pricing')
}

export default async function PricingPage() {
  const [services, stateFees, raPricing] = await Promise.all([
    prisma.servicePricing.findMany({
      orderBy: { serviceName: 'asc' },
    }),
    prisma.stateFee.findMany({
      orderBy: { stateName: 'asc' },
    }),
    prisma.registeredAgentPricing.findMany({
      orderBy: { stateCode: 'asc' },
    }),
  ])

  const activeServicesCount = services.filter((s) => s.isActive).length
  const activeStatesCount = stateFees.filter((s) => s.isActive).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pricing Management</h1>
        <p className="text-muted-foreground">
          Manage service pricing, state fees, and registered agent rates
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{services.length}</div>
            <p className="text-xs text-muted-foreground">
              {activeServicesCount} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              State Fees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stateFees.length}</div>
            <p className="text-xs text-muted-foreground">
              {activeStatesCount} active states
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              RA Pricing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{raPricing.length}</div>
            <p className="text-xs text-muted-foreground">
              Registered agent rates
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="services">
        <TabsList>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="state-fees">State Filing Fees</TabsTrigger>
          <TabsTrigger value="ra-pricing">Registered Agent</TabsTrigger>
        </TabsList>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Service Pricing</CardTitle>
              <CardDescription>
                Configure pricing for all available services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Key</TableHead>
                    <TableHead>Base Price</TableHead>
                    <TableHead>Recurring</TableHead>
                    <TableHead>Required</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(services as ServicePricingItem[]).map((service) => (
                    <TableRow key={service.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{service.serviceName}</p>
                          {service.description && (
                            <p className="text-sm text-muted-foreground truncate max-w-60">
                              {service.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-1 py-0.5 rounded">
                          {service.serviceKey}
                        </code>
                      </TableCell>
                      <TableCell>
                        {formatCurrency(service.basePrice.toNumber())}
                      </TableCell>
                      <TableCell>
                        {service.isRecurring ? (
                          <div className="text-sm">
                            <Badge variant="secondary">
                              {formatCurrency(service.recurringPrice?.toNumber() ?? 0)}/{service.billingCycle?.toLowerCase()}
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {service.isRequired ? (
                          <Badge>Required</Badge>
                        ) : (
                          <Badge variant="secondary">Optional</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <form action={toggleServiceActive}>
                          <input type="hidden" name="id" value={service.id} />
                          <input type="hidden" name="isActive" value={String(service.isActive)} />
                          <button type="submit">
                            <Switch checked={service.isActive} />
                          </button>
                        </form>
                      </TableCell>
                      <TableCell>
                        <EditServiceDialog
                          service={{
                            id: service.id,
                            serviceKey: service.serviceKey,
                            serviceName: service.serviceName,
                            description: service.description,
                            basePrice: service.basePrice.toNumber(),
                            isRecurring: service.isRecurring,
                            recurringPrice: service.recurringPrice?.toNumber() ?? null,
                            billingCycle: service.billingCycle,
                            isActive: service.isActive,
                            isRequired: service.isRequired,
                          }}
                          onSave={updateServicePricing}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {services.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No service pricing configured
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* State Fees Tab */}
        <TabsContent value="state-fees" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>State Filing Fees</CardTitle>
              <CardDescription>
                Filing fees by state for LLC formation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>State</TableHead>
                    <TableHead>Filing Fee</TableHead>
                    <TableHead>Processing Time</TableHead>
                    <TableHead>Rush</TableHead>
                    <TableHead>Annual Report</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(stateFees as StateFeeItem[]).map((state) => (
                    <TableRow key={state.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{state.stateName}</p>
                          <code className="text-xs text-muted-foreground">{state.stateCode}</code>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(state.filingFee.toNumber())}
                      </TableCell>
                      <TableCell>
                        {state.standardDays} days
                      </TableCell>
                      <TableCell>
                        {state.rushAvailable ? (
                          <div className="text-sm">
                            <Badge variant="secondary">
                              {formatCurrency(state.rushFee?.toNumber() ?? 0)} / {state.rushDays} days
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Not available</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {state.annualReportFee ? (
                          formatCurrency(state.annualReportFee.toNumber())
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <form action={toggleStateFeeActive}>
                          <input type="hidden" name="id" value={state.id} />
                          <input type="hidden" name="isActive" value={String(state.isActive)} />
                          <button type="submit">
                            <Switch checked={state.isActive} />
                          </button>
                        </form>
                      </TableCell>
                      <TableCell>
                        <EditStateFeeDialog
                          stateFee={{
                            id: state.id,
                            stateCode: state.stateCode,
                            stateName: state.stateName,
                            filingFee: state.filingFee.toNumber(),
                            rushFee: state.rushFee?.toNumber() ?? null,
                            rushAvailable: state.rushAvailable,
                            rushDays: state.rushDays,
                            standardDays: state.standardDays,
                            annualReportFee: state.annualReportFee?.toNumber() ?? null,
                            franchiseTaxFee: state.franchiseTaxFee?.toNumber() ?? null,
                            isActive: state.isActive,
                          }}
                          onSave={updateStateFee}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {stateFees.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No state fees configured
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* RA Pricing Tab */}
        <TabsContent value="ra-pricing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Registered Agent Pricing</CardTitle>
              <CardDescription>
                Annual registered agent service fees by state
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>State</TableHead>
                    <TableHead>Annual Fee</TableHead>
                    <TableHead>First Year</TableHead>
                    <TableHead>Included with Formation</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(raPricing as RaPricingItem[]).map((ra) => (
                    <TableRow key={ra.id}>
                      <TableCell className="font-medium">
                        {ra.stateCode}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(ra.annualFee.toNumber())}
                      </TableCell>
                      <TableCell>
                        {ra.firstYearFee ? (
                          formatCurrency(ra.firstYearFee.toNumber())
                        ) : (
                          <span className="text-muted-foreground">Same as annual</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {ra.includedWithFormation ? (
                          <Badge variant="success">
                            {ra.includedMonths ? `${ra.includedMonths} months` : 'Yes'}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">No</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <form action={toggleRaPricingActive}>
                          <input type="hidden" name="id" value={ra.id} />
                          <input type="hidden" name="isActive" value={String(ra.isActive)} />
                          <button type="submit">
                            <Switch checked={ra.isActive} />
                          </button>
                        </form>
                      </TableCell>
                      <TableCell>
                        <EditRaPricingDialog
                          raPricing={{
                            id: ra.id,
                            stateCode: ra.stateCode,
                            annualFee: ra.annualFee.toNumber(),
                            firstYearFee: ra.firstYearFee?.toNumber() ?? null,
                            includedWithFormation: ra.includedWithFormation,
                            includedMonths: ra.includedMonths,
                            isActive: ra.isActive,
                          }}
                          onSave={updateRaPricing}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {raPricing.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No registered agent pricing configured
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
