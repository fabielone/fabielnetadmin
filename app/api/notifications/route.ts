import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'

// GET /api/notifications - Get notifications for admin
export async function GET(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const unreadOnly = searchParams.get('unread') === 'true'
  const limit = parseInt(searchParams.get('limit') || '20', 10)

  const notifications = await prisma.adminNotification.findMany({
    where: unreadOnly ? { isRead: false } : undefined,
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  const unreadCount = await prisma.adminNotification.count({
    where: { isRead: false },
  })

  return NextResponse.json({ 
    notifications, 
    unreadCount 
  })
}

// PATCH /api/notifications - Mark notifications as read
export async function PATCH(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { notificationIds, markAllAsRead } = body

  if (markAllAsRead) {
    await prisma.adminNotification.updateMany({
      where: { isRead: false },
      data: { isRead: true },
    })
  } else if (notificationIds && Array.isArray(notificationIds)) {
    await prisma.adminNotification.updateMany({
      where: { id: { in: notificationIds } },
      data: { isRead: true },
    })
  }

  return NextResponse.json({ success: true })
}

// DELETE /api/notifications - Clear old notifications
export async function DELETE(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const notificationId = searchParams.get('id')

  if (notificationId) {
    await prisma.adminNotification.delete({
      where: { id: notificationId },
    })
  } else {
    // Delete read notifications older than 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    await prisma.adminNotification.deleteMany({
      where: {
        isRead: true,
        createdAt: { lt: thirtyDaysAgo },
      },
    })
  }

  return NextResponse.json({ success: true })
}
