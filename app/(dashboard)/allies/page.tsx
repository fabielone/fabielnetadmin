import Link from 'next/link'
import prisma from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Eye, ExternalLink, Edit } from 'lucide-react'
import { revalidatePath } from 'next/cache'

interface AllyBusiness {
  id: string
  name: string
  state: string
  status: string
  isPublicListed: boolean
  publicDescription: string | null
  publicCategory: string | null
  publicLocation: string | null
  publicLink: string | null
  owner: {
    firstName: string
    lastName: string
    email: string
  }
}

async function togglePublicListing(formData: FormData) {
  'use server'
  
  const businessId = formData.get('businessId') as string
  const isPublic = formData.get('isPublic') === 'true'
  
  await prisma.business.update({
    where: { id: businessId },
    data: { isPublicListed: !isPublic },
  })
  
  revalidatePath('/allies')
}

interface AlliesPageProps {
  searchParams: Promise<{
    search?: string
    filter?: string
    page?: string
  }>
}

export default async function AlliesPage({ searchParams }: AlliesPageProps) {
  const params = await searchParams
  const page = parseInt(params.page || '1')
  const perPage = 20
  const skip = (page - 1) * perPage

  const where: Record<string, unknown> = {}
  
  if (params.filter === 'listed') {
    where.isPublicListed = true
  } else if (params.filter === 'unlisted') {
    where.isPublicListed = false
  }
  
  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: 'insensitive' } },
      { publicCategory: { contains: params.search, mode: 'insensitive' } },
    ]
  }

  const [businesses, totalCount, listedCount] = await Promise.all([
    prisma.business.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: perPage,
      skip,
      include: {
        owner: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    }),
    prisma.business.count({ where }),
    prisma.business.count({ where: { isPublicListed: true } }),
  ])

  const totalPages = Math.ceil(totalCount / perPage)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Allies (Public Listings)</h1>
          <p className="text-muted-foreground">
            Manage which businesses appear on the public allies page ({listedCount} currently listed)
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <form className="flex flex-wrap gap-4">
            <Input
              name="search"
              placeholder="Search businesses..."
              defaultValue={params.search}
              className="w-full md:w-64"
            />
            <select 
              name="filter" 
              defaultValue={params.filter || ''}
              className="flex h-9 w-40 rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            >
              <option value="">All Businesses</option>
              <option value="listed">Listed Only</option>
              <option value="unlisted">Unlisted Only</option>
            </select>
            <Button type="submit">Filter</Button>
          </form>
        </CardContent>
      </Card>

      {/* Businesses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Businesses ({totalCount})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Public Listed</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(businesses as AllyBusiness[]).map((business) => (
                <TableRow key={business.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{business.name}</p>
                      {business.publicDescription && (
                        <p className="text-sm text-muted-foreground truncate max-w-50">
                          {business.publicDescription}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{business.owner.firstName} {business.owner.lastName}</p>
                      <p className="text-muted-foreground">{business.owner.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {business.publicCategory ? (
                      <Badge variant="secondary">{business.publicCategory}</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {business.publicLocation || business.state || '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={String(business.status) === 'ACTIVE' ? 'success' : 'secondary'}>
                      {String(business.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <form action={togglePublicListing}>
                      <input type="hidden" name="businessId" value={business.id} />
                      <input type="hidden" name="isPublic" value={String(business.isPublicListed)} />
                      <button type="submit">
                        <Switch checked={business.isPublicListed} />
                      </button>
                    </form>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/allies/${business.id}`}>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/businesses/${business.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      {business.publicLink && (
                        <a href={business.publicLink} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </a>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {businesses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No businesses found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {skip + 1} to {Math.min(skip + perPage, totalCount)} of {totalCount}
              </p>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link href={`/allies?page=${page - 1}&filter=${params.filter || ''}&search=${params.search || ''}`}>
                    <Button variant="outline" size="sm">Previous</Button>
                  </Link>
                )}
                {page < totalPages && (
                  <Link href={`/allies?page=${page + 1}&filter=${params.filter || ''}&search=${params.search || ''}`}>
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
