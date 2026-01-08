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

interface AllyEditPageProps {
  params: Promise<{ id: string }>
}

async function updateAllyListing(formData: FormData) {
  'use server'
  
  const id = formData.get('id') as string
  const isPublicListed = formData.get('isPublicListed') === 'on'
  const publicDescription = formData.get('publicDescription') as string
  const publicCategory = formData.get('publicCategory') as string
  const publicLocation = formData.get('publicLocation') as string
  const publicLink = formData.get('publicLink') as string
  const publicImageUrl = formData.get('publicImageUrl') as string
  const publicTags = (formData.get('publicTags') as string)
    .split(',')
    .map(t => t.trim())
    .filter(Boolean)
  
  await prisma.business.update({
    where: { id },
    data: {
      isPublicListed,
      publicDescription: publicDescription || null,
      publicCategory: publicCategory || null,
      publicLocation: publicLocation || null,
      publicLink: publicLink || null,
      publicImageUrl: publicImageUrl || null,
      publicTags,
    },
  })
  
  revalidatePath('/allies')
  redirect('/allies')
}

export default async function AllyEditPage({ params }: AllyEditPageProps) {
  const { id } = await params

  const business = await prisma.business.findUnique({
    where: { id },
    include: {
      owner: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  })

  if (!business) {
    notFound()
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/allies">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit Public Listing</h1>
          <p className="text-muted-foreground">{business.name}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Public Listing Settings</CardTitle>
          <CardDescription>
            Configure how this business appears on the public allies page
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateAllyListing} className="space-y-6">
            <input type="hidden" name="id" value={business.id} />
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Show on Public Page</Label>
                <p className="text-sm text-muted-foreground">
                  Enable to display this business on the allies page
                </p>
              </div>
              <Switch 
                name="isPublicListed" 
                defaultChecked={business.isPublicListed}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="publicDescription">Public Description</Label>
              <Textarea
                id="publicDescription"
                name="publicDescription"
                defaultValue={business.publicDescription || ''}
                placeholder="A brief description of the business for public display..."
                rows={4}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="publicCategory">Category</Label>
                <Input
                  id="publicCategory"
                  name="publicCategory"
                  defaultValue={business.publicCategory || ''}
                  placeholder="e.g., Restaurant, Tech Startup"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="publicLocation">Location</Label>
                <Input
                  id="publicLocation"
                  name="publicLocation"
                  defaultValue={business.publicLocation || ''}
                  placeholder="e.g., Los Angeles, CA"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="publicTags">Tags (comma separated)</Label>
              <Input
                id="publicTags"
                name="publicTags"
                defaultValue={business.publicTags.join(', ')}
                placeholder="e.g., tech, startup, b2b"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="publicLink">Custom Link (optional)</Label>
              <Input
                id="publicLink"
                name="publicLink"
                type="url"
                defaultValue={business.publicLink || ''}
                placeholder="https://example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="publicImageUrl">Image URL (Cloudinary)</Label>
              <Input
                id="publicImageUrl"
                name="publicImageUrl"
                defaultValue={business.publicImageUrl || ''}
                placeholder="https://res.cloudinary.com/..."
              />
              {business.publicImageUrl && (
                <div className="mt-2">
                  <img 
                    src={business.publicImageUrl} 
                    alt="Preview" 
                    className="h-32 w-32 object-cover rounded-lg"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <Button type="submit">Save Changes</Button>
              <Link href="/allies">
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
