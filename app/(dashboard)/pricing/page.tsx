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
import { EditServiceDialog, EditStateFeeDialog, EditRaPricingDialog, EditWebsitePricingDialog } from './PricingEditDialogs'

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

interface WebsitePricingItem {
  id: string
  tier: string
  tierName: string
  description: string | null
  monthlyPrice: { toNumber: () => number }
  yearlyPrice: { toNumber: () => number } | null
  setupFee: { toNumber: () => number }
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

async function toggleWebsitePricingActive(formData: FormData) {
  'use server'
  
  const id = formData.get('id') as string
  const isActive = formData.get('isActive') === 'true'
  
  await prisma.websitePricing.update({
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

async function updateWebsitePricing(formData: FormData) {
  'use server'
  
  const id = formData.get('id') as string
  const tierName = formData.get('tierName') as string
  const description = formData.get('description') as string
  const monthlyPrice = parseFloat(formData.get('monthlyPrice') as string)
  const yearlyPrice = formData.get('yearlyPrice') as string
  const setupFee = parseFloat(formData.get('setupFee') as string || '0')
  const features = formData.get('features') as string
  const pagesIncluded = parseInt(formData.get('pagesIncluded') as string || '5')
  const blogEnabled = formData.get('blogEnabled') === 'true'
  const ecommerceEnabled = formData.get('ecommerceEnabled') === 'true'
  const customDomain = formData.get('customDomain') === 'true'
  const sslIncluded = formData.get('sslIncluded') === 'true'
  const analyticsIncluded = formData.get('analyticsIncluded') === 'true'
  const supportLevel = formData.get('supportLevel') as string
  const isPopular = formData.get('isPopular') === 'true'
  const sortOrder = parseInt(formData.get('sortOrder') as string || '0')
  
  await prisma.websitePricing.update({
    where: { id },
    data: {
      tierName,
      description: description || null,
      monthlyPrice,
      yearlyPrice: yearlyPrice ? parseFloat(yearlyPrice) : null,
      setupFee,
      features: features || null,
      pagesIncluded,
      blogEnabled,
      ecommerceEnabled,
      customDomain,
      sslIncluded,
      analyticsIncluded,
      supportLevel,
      isPopular,
      sortOrder,
    },
  })
  
  revalidatePath('/pricing')
}

async function createWebsitePricing(formData: FormData) {
  'use server'
  
  const tier = formData.get('tier') as string
  const tierName = formData.get('tierName') as string
  const description = formData.get('description') as string
  const monthlyPrice = parseFloat(formData.get('monthlyPrice') as string)
  const yearlyPrice = formData.get('yearlyPrice') as string
  const setupFee = parseFloat(formData.get('setupFee') as string || '0')
  const features = formData.get('features') as string
  const pagesIncluded = parseInt(formData.get('pagesIncluded') as string || '5')
  const blogEnabled = formData.get('blogEnabled') === 'true'
  const ecommerceEnabled = formData.get('ecommerceEnabled') === 'true'
  const customDomain = formData.get('customDomain') === 'true'
  const sslIncluded = formData.get('sslIncluded') === 'true'
  const analyticsIncluded = formData.get('analyticsIncluded') === 'true'
  const supportLevel = formData.get('supportLevel') as string || 'email'
  const isPopular = formData.get('isPopular') === 'true'
  const sortOrder = parseInt(formData.get('sortOrder') as string || '0')
  
  await prisma.websitePricing.create({
    data: {
      tier: tier as never,
      tierName,
      description: description || null,
      monthlyPrice,
      yearlyPrice: yearlyPrice ? parseFloat(yearlyPrice) : null,
      setupFee,
      features: features || null,
      pagesIncluded,
      blogEnabled,
      ecommerceEnabled,
      customDomain,
      sslIncluded,
      analyticsIncluded,
      supportLevel,
      isPopular,
      sortOrder,
    },
  })
  
  revalidatePath('/pricing')
}

export default async function PricingPage() {
  const [services, stateFees, raPricing, websitePricing] = await Promise.all([
    prisma.servicePricing.findMany({
      orderBy: { serviceName: 'asc' },
    }),
    prisma.stateFee.findMany({
      orderBy: { stateName: 'asc' },
    }),
    prisma.registeredAgentPricing.findMany({
      orderBy: { stateCode: 'asc' },
    }),
    prisma.websitePricing.findMany({
      orderBy: { sortOrder: 'asc' },
    }),
  ])

  const activeServicesCount = services.filter((s: { isActive: boolean }) => s.isActive).length
  const activeStatesCount = stateFees.filter((s: { isActive: boolean }) => s.isActive).length
  const activeWebsiteTiersCount = websitePricing.filter((w: { isActive: boolean }) => w.isActive).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pricing Management</h1>
        <p className="text-muted-foreground">
          Manage service pricing, state fees, and registered agent rates
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
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
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Website Tiers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{websitePricing.length}</div>
            <p className="text-xs text-muted-foreground">
              {activeWebsiteTiersCount} active tiers
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="services">
        <TabsList>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="state-fees">State Filing Fees</TabsTrigger>
          <TabsTrigger value="ra-pricing">Registered Agent</TabsTrigger>
          <TabsTrigger value="website-pricing">Website Services</TabsTrigger>
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

        {/* Website Services Tab */}
        <TabsContent value="website-pricing" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Website Service Pricing</CardTitle>
                <CardDescription>
                  Configure pricing tiers for website services (Basic, Pro, Growth)
                </CardDescription>
              </div>
              <EditWebsitePricingDialog
                isNew={true}
                onSave={createWebsitePricing}
              />
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tier</TableHead>
                    <TableHead>Monthly Price</TableHead>
                    <TableHead>Yearly Price</TableHead>
                    <TableHead>Setup Fee</TableHead>
                    <TableHead>Features</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(websitePricing as WebsitePricingItem[]).map((wp) => (
                    <TableRow key={wp.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{wp.tierName}</p>
                          {wp.isPopular && (
                            <Badge variant="default">Popular</Badge>
                          )}
                        </div>
                        <code className="text-xs text-muted-foreground">{wp.tier}</code>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(wp.monthlyPrice.toNumber())}/mo
                      </TableCell>
                      <TableCell>
                        {wp.yearlyPrice ? (
                          <span>{formatCurrency(wp.yearlyPrice.toNumber())}/yr</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {wp.setupFee.toNumber() > 0 ? (
                          formatCurrency(wp.setupFee.toNumber())
                        ) : (
                          <span className="text-muted-foreground">Free</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          <Badge variant="secondary">{wp.pagesIncluded} pages</Badge>
                          {wp.blogEnabled && <Badge variant="secondary">Blog</Badge>}
                          {wp.ecommerceEnabled && <Badge variant="secondary">E-commerce</Badge>}
                          {wp.analyticsIncluded && <Badge variant="secondary">Analytics</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <form action={toggleWebsitePricingActive}>
                          <input type="hidden" name="id" value={wp.id} />
                          <input type="hidden" name="isActive" value={String(wp.isActive)} />
                          <button type="submit">
                            <Switch checked={wp.isActive} />
                          </button>
                        </form>
                      </TableCell>
                      <TableCell>
                        <EditWebsitePricingDialog
                          websitePricing={{
                            id: wp.id,
                            tier: wp.tier,
                            tierName: wp.tierName,
                            description: wp.description,
                            monthlyPrice: wp.monthlyPrice.toNumber(),
                            yearlyPrice: wp.yearlyPrice?.toNumber() ?? null,
                            setupFee: wp.setupFee.toNumber(),
                            features: wp.features,
                            pagesIncluded: wp.pagesIncluded,
                            blogEnabled: wp.blogEnabled,
                            ecommerceEnabled: wp.ecommerceEnabled,
                            customDomain: wp.customDomain,
                            sslIncluded: wp.sslIncluded,
                            analyticsIncluded: wp.analyticsIncluded,
                            supportLevel: wp.supportLevel,
                            isActive: wp.isActive,
                            isPopular: wp.isPopular,
                            sortOrder: wp.sortOrder,
                          }}
                          onSave={updateWebsitePricing}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {websitePricing.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No website pricing tiers configured. Click &quot;Add Tier&quot; to create one.
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
