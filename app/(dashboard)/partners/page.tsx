import Link from 'next/link'
import prisma from '@/lib/prisma'
import { formatDateTime } from '@/lib/utils'
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
import { Plus, Edit, Trash2, ExternalLink, GripVertical } from 'lucide-react'
import { revalidatePath } from 'next/cache'
import type { PartnerItem } from '@/lib/types'

async function togglePartnerActive(formData: FormData) {
  'use server'
  
  const partnerId = formData.get('partnerId') as string
  const isActive = formData.get('isActive') === 'true'
  
  await prisma.partner.update({
    where: { id: partnerId },
    data: { isActive: !isActive },
  })
  
  revalidatePath('/partners')
}

async function deletePartner(formData: FormData) {
  'use server'
  
  const partnerId = formData.get('partnerId') as string
  
  await prisma.partner.delete({
    where: { id: partnerId },
  })
  
  revalidatePath('/partners')
}

export default async function PartnersPage() {
  const partners = await prisma.partner.findMany({
    orderBy: { sortOrder: 'asc' },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Partners</h1>
          <p className="text-muted-foreground">
            Manage partner listings for the partners page
          </p>
        </div>
        <Link href="/partners/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Partner
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Partners ({partners.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Partner</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(partners as PartnerItem[]).map((partner) => (
                <TableRow key={partner.id}>
                  <TableCell>
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {partner.imageUrl ? (
                        <img 
                          src={partner.imageUrl} 
                          alt={partner.name}
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                          <span className="text-xs font-medium">
                            {partner.name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{partner.name}</p>
                        <p className="text-sm text-muted-foreground truncate max-w-50">
                          {partner.description}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{partner.location || '—'}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {partner.tags.slice(0, 3).map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {partner.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{partner.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <form action={togglePartnerActive}>
                      <input type="hidden" name="partnerId" value={partner.id} />
                      <input type="hidden" name="isActive" value={String(partner.isActive)} />
                      <button type="submit">
                        <Switch checked={partner.isActive} />
                      </button>
                    </form>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/partners/${partner.id}`}>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <a href={partner.url} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </a>
                      <form action={deletePartner}>
                        <input type="hidden" name="partnerId" value={partner.id} />
                        <Button 
                          type="submit" 
                          variant="ghost" 
                          size="sm"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </form>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {partners.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No partners yet. Add your first partner to get started.
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
