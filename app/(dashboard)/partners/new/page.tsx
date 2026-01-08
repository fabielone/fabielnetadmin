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

async function createPartner(formData: FormData) {
  'use server'
  
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
  
  // Get max sort order
  const lastPartner = await prisma.partner.findFirst({
    orderBy: { sortOrder: 'desc' },
  })
  
  await prisma.partner.create({
    data: {
      name,
      description,
      url,
      location: location || null,
      imageUrl: imageUrl || null,
      icon: icon || null,
      isActive,
      tags,
      sortOrder: (lastPartner?.sortOrder ?? 0) + 1,
    },
  })
  
  revalidatePath('/partners')
  redirect('/partners')
}

export default function NewPartnerPage() {
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
          <h1 className="text-2xl font-bold">Add New Partner</h1>
          <p className="text-muted-foreground">Create a new partner listing</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Partner Details</CardTitle>
          <CardDescription>
            Fill in the information for the new partner
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createPartner} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Partner Name *</Label>
              <Input
                id="name"
                name="name"
                required
                placeholder="Partner Company Name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                name="description"
                required
                placeholder="A brief description of the partner..."
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
                placeholder="https://partner.com"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  placeholder="e.g., San Francisco, CA"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="icon">Icon (Lucide icon name)</Label>
                <Input
                  id="icon"
                  name="icon"
                  placeholder="e.g., building, briefcase"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input
                id="tags"
                name="tags"
                placeholder="e.g., banking, legal, accounting"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL (Cloudinary)</Label>
              <Input
                id="imageUrl"
                name="imageUrl"
                placeholder="https://res.cloudinary.com/..."
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Active</Label>
                <p className="text-sm text-muted-foreground">
                  Show this partner on the public page
                </p>
              </div>
              <Switch name="isActive" defaultChecked />
            </div>

            <div className="flex gap-4">
              <Button type="submit">Create Partner</Button>
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
