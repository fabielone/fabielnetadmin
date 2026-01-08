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
import { Plus, Edit, Eye, Trash2 } from 'lucide-react'
import { revalidatePath } from 'next/cache'
import type { BlogPostItem } from '@/lib/types'

async function deletePost(formData: FormData) {
  'use server'
  
  const postId = formData.get('postId') as string
  
  await prisma.blogPost.delete({
    where: { id: postId },
  })
  
  revalidatePath('/blog')
}

interface BlogPageProps {
  searchParams: Promise<{
    search?: string
    status?: string
    page?: string
  }>
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const params = await searchParams
  const page = parseInt(params.page || '1')
  const perPage = 15
  const skip = (page - 1) * perPage

  const where: Record<string, unknown> = {}
  
  if (params.status) {
    where.status = params.status
  }
  
  if (params.search) {
    where.OR = [
      { title: { contains: params.search, mode: 'insensitive' } },
      { slug: { contains: params.search, mode: 'insensitive' } },
    ]
  }

  const [posts, totalCount, draftCount, publishedCount] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: perPage,
      skip,
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    }),
    prisma.blogPost.count({ where }),
    prisma.blogPost.count({ where: { status: 'DRAFT' as never } }),
    prisma.blogPost.count({ where: { status: 'PUBLISHED' as never } }),
  ])

  const totalPages = Math.ceil(totalCount / perPage)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return <Badge variant="success">Published</Badge>
      case 'DRAFT':
        return <Badge variant="secondary">Draft</Badge>
      case 'ARCHIVED':
        return <Badge variant="outline">Archived</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Blog Posts</h1>
          <p className="text-muted-foreground">
            {publishedCount} published, {draftCount} drafts
          </p>
        </div>
        <Link href="/blog/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Post
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <form className="flex flex-wrap gap-4">
            <Input
              name="search"
              placeholder="Search posts..."
              defaultValue={params.search}
              className="w-full md:w-64"
            />
            <select 
              name="status" 
              defaultValue={params.status || ''}
              className="flex h-9 w-40 rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            >
              <option value="">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
            <Button type="submit">Filter</Button>
          </form>
        </CardContent>
      </Card>

      {/* Posts Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Posts ({totalCount})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Post</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Published</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(posts as BlogPostItem[]).map((post) => (
                <TableRow key={post.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {post.featuredImage ? (
                        <img 
                          src={post.featuredImage} 
                          alt={post.title}
                          className="h-12 w-16 rounded object-cover"
                        />
                      ) : (
                        <div className="h-12 w-16 rounded bg-muted flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">No image</span>
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{post.title}</p>
                        <p className="text-sm text-muted-foreground">/{post.slug}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {post.author.firstName} {post.author.lastName}
                  </TableCell>
                  <TableCell>{getStatusBadge(post.status)}</TableCell>
                  <TableCell>
                    {post.category ? (
                      <Badge variant="outline">{post.category}</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {post.publishedAt 
                      ? formatDateTime(post.publishedAt)
                      : <span className="text-muted-foreground">Not published</span>
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/blog/${post.id}`}>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      {String(post.status).toLowerCase() === 'published' && (
                        <a 
                          href={`https://fabielnet.com/blog/${post.slug}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </a>
                      )}
                      <form action={deletePost}>
                        <input type="hidden" name="postId" value={post.id} />
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
              {posts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No posts found. Create your first blog post to get started.
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
                  <Link href={`/blog?page=${page - 1}&status=${params.status || ''}&search=${params.search || ''}`}>
                    <Button variant="outline" size="sm">Previous</Button>
                  </Link>
                )}
                {page < totalPages && (
                  <Link href={`/blog?page=${page + 1}&status=${params.status || ''}&search=${params.search || ''}`}>
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
