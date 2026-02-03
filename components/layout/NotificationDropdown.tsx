'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Bell, Package, XCircle, Check, CheckCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatDistanceToNow } from 'date-fns'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  resourceId: string | null
  resourceUrl: string | null
  isRead: boolean
  metadata: Record<string, unknown> | null
  createdAt: string
}

const notificationIcons: Record<string, React.ReactNode> = {
  ORDER_CREATED: <Package className="h-4 w-4 text-green-500" />,
  ORDER_CANCELLED: <XCircle className="h-4 w-4 text-red-500" />,
  ORDER_COMPLETED: <Check className="h-4 w-4 text-blue-500" />,
  PAYMENT_RECEIVED: <Package className="h-4 w-4 text-green-500" />,
  PAYMENT_FAILED: <XCircle className="h-4 w-4 text-red-500" />,
  USER_REGISTERED: <Package className="h-4 w-4 text-purple-500" />,
  SYSTEM_ALERT: <Bell className="h-4 w-4 text-yellow-500" />,
}

export function NotificationDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications?limit=10')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    }
  }, [])

  const supabaseRef = useRef<SupabaseClient | null>(null)

  useEffect(() => {
    fetchNotifications()

    // Set up polling for notifications (every 30 seconds)
    const pollInterval = setInterval(fetchNotifications, 30000)

    // Set up Supabase real-time subscription
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (supabaseUrl && supabaseAnonKey) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey)
      supabaseRef.current = supabase

      const channel = supabase
        .channel('admin_notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'admin_notifications',
          },
          (payload: { new: Notification }) => {
            setNotifications((prev) => [payload.new, ...prev.slice(0, 9)])
            setUnreadCount((prev) => prev + 1)
          }
        )
        .subscribe()

      return () => {
        clearInterval(pollInterval)
        supabase.removeChannel(channel)
      }
    }

    return () => {
      clearInterval(pollInterval)
    }
  }, [fetchNotifications])

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: [notificationId] }),
      })
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    setIsLoading(true)
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllAsRead: true }),
      })
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id)
    }
    if (notification.resourceUrl) {
      window.location.href = notification.resourceUrl
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto py-1 px-2 text-xs"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                markAllAsRead()
              }}
              disabled={isLoading}
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No notifications
          </div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex flex-col items-start gap-1 p-3 cursor-pointer ${
                  !notification.isRead ? 'bg-accent/50' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-2 w-full">
                  <div className="mt-0.5">
                    {notificationIcons[notification.type] || <Bell className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        )}
        
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-center justify-center text-sm text-muted-foreground"
              onClick={() => window.location.href = '/notifications'}
            >
              View all notifications
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
