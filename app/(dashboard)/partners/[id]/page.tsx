import { notFound, redirect } from 'next/navigation'
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

interface PartnerEditPageProps {
  params: Promise<{ id: string }>
}

async function updatePartner(formData: FormData) {
  'use server'
  
  const id = formData.get('id') as string
  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const url = formData.get('url') as string
  const location = formData.get('location') as string
  const imageUrl = formData.get('imageUrl') as string
  const icon = formData.get('icon') as string
  const isActive = formData.get('isActive') === 'on'
  const tags = (formData.get('tags') as string)
    .split(',')
    .map(t => t.trim())
    .filter(Boolean)
  
  await prisma.partner.update({
    where: { id },
    data: {
      name,
      description,
      url,
      location: location || null,
      imageUrl: imageUrl || null,
      icon: icon || null,
      isActive,
      tags,
    },
  })
  
  revalidatePath('/partners')
  redirect('/partners')
}

export default async function PartnerEditPage({ params }: PartnerEditPageProps) {
  const { id } = await params

  const partner = await prisma.partner.findUnique({
    where: { id },
  })

  if (!partner) {
    notFound()
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/partners">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit Partner</h1>
          <p className="text-muted-foreground">{partner.name}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Partner Details</CardTitle>
          <CardDescription>
            Update the partner information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updatePartner} className="space-y-6">
            <input type="hidden" name="id" value={partner.id} />
            
            <div className="space-y-2">
              <Label htmlFor="name">Partner Name *</Label>
              <Input
                id="name"
                name="name"
                required
                defaultValue={partner.name}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                name="description"
                required
                defaultValue={partner.description}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">Website URL *</Label>
              <Input
                id="url"
                name="url"
                type="url"
                required
                defaultValue={partner.url}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  defaultValue={partner.location || ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="icon">Icon (Lucide icon name)</Label>
                <Input
                  id="icon"
                  name="icon"
                  defaultValue={partner.icon || ''}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input
                id="tags"
                name="tags"
                defaultValue={partner.tags.join(', ')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL (Cloudinary)</Label>
              <Input
                id="imageUrl"
                name="imageUrl"
                defaultValue={partner.imageUrl || ''}
              />
              {partner.imageUrl && (
                <div className="mt-2">
                  <img 
                    src={partner.imageUrl} 
                    alt="Preview" 
                    className="h-32 w-32 object-cover rounded-lg"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Active</Label>
                <p className="text-sm text-muted-foreground">
                  Show this partner on the public page
                </p>
              </div>
              <Switch name="isActive" defaultChecked={partner.isActive} />
            </div>

            <div className="flex gap-4">
              <Button type="submit">Save Changes</Button>
              <Link href="/partners">
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
