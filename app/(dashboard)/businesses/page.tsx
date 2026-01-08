import Link from 'next/link'
import prisma from '@/lib/prisma'
import { formatDateTime } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Eye, Building2 } from 'lucide-react'
import type { BusinessListItem } from '@/lib/types'

interface BusinessesPageProps {
  searchParams: Promise<{
    search?: string
    status?: string
    entityType?: string
    state?: string
    page?: string
  }>
}

export default async function BusinessesPage({ searchParams }: BusinessesPageProps) {
  const params = await searchParams
  const page = parseInt(params.page || '1')
  const perPage = 20
  const skip = (page - 1) * perPage

  const where: Record<string, unknown> = {}
  
  if (params.status) {
    where.status = params.status
  }
  
  if (params.entityType) {
    where.entityType = params.entityType
  }
  
  if (params.state) {
    where.state = params.state
  }
  
  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: 'insensitive' } },
      { owner: { email: { contains: params.search, mode: 'insensitive' } } },
    ]
  }

  const [businesses, totalCount, states] = await Promise.all([
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
        _count: {
          select: {
            members: true,
            documents: true,
            complianceTasks: true,
          },
        },
      },
    }),
    prisma.business.count({ where }),
    prisma.business.groupBy({
      by: ['state'],
      _count: { state: true },
      orderBy: { _count: { state: 'desc' } },
    }),
  ])

  const totalPages = Math.ceil(totalCount / perPage)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="success">Active</Badge>
      case 'PENDING':
        return <Badge variant="outline">Pending</Badge>
      case 'INACTIVE':
        return <Badge variant="secondary">Inactive</Badge>
      case 'DISSOLVED':
        return <Badge variant="destructive">Dissolved</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Businesses</h1>
          <p className="text-muted-foreground">
            View and manage all registered businesses ({totalCount} total)
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
              name="status" 
              defaultValue={params.status || ''}
              className="flex h-9 w-40 rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING">Pending</option>
              <option value="INACTIVE">Inactive</option>
              <option value="DISSOLVED">Dissolved</option>
            </select>
            <select 
              name="entityType" 
              defaultValue={params.entityType || ''}
              className="flex h-9 w-40 rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            >
              <option value="">All Entity Types</option>
              <option value="LLC">LLC</option>
              <option value="CORPORATION">Corporation</option>
              <option value="SOLE_PROPRIETORSHIP">Sole Proprietorship</option>
              <option value="PARTNERSHIP">Partnership</option>
              <option value="NON_PROFIT">Non-Profit</option>
            </select>
            <select 
              name="state" 
              defaultValue={params.state || ''}
              className="flex h-9 w-40 rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            >
              <option value="">All States</option>
              {states.map(({ state }: { state: string }) => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
            <Button type="submit">Filter</Button>
          </form>
        </CardContent>
      </Card>

      {/* Businesses Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Businesses</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Entity Type</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(businesses as BusinessListItem[]).map((business) => (
                <TableRow key={business.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{business.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {business._count.members} members • {business._count.documents} docs
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{business.owner.firstName} {business.owner.lastName}</p>
                      <p className="text-muted-foreground">{business.owner.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{business.entityType.replace('_', ' ')}</Badge>
                  </TableCell>
                  <TableCell>{business.state}</TableCell>
                  <TableCell>{getStatusBadge(business.status)}</TableCell>
                  <TableCell>{formatDateTime(business.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/businesses/${business.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
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
                  <Link href={`/businesses?page=${page - 1}&status=${params.status || ''}&entityType=${params.entityType || ''}&state=${params.state || ''}&search=${params.search || ''}`}>
                    <Button variant="outline" size="sm">Previous</Button>
                  </Link>
                )}
                {page < totalPages && (
                  <Link href={`/businesses?page=${page + 1}&status=${params.status || ''}&entityType=${params.entityType || ''}&state=${params.state || ''}&search=${params.search || ''}`}>
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
