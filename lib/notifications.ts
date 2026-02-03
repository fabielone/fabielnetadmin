import { prisma } from './prisma'
import { AdminNotificationType, Prisma } from '@prisma/client'

export type NotificationType = AdminNotificationType

// Re-export the enum for convenience
export const NotificationTypes = AdminNotificationType

interface CreateNotificationParams {
  type: NotificationType
  title: string
  message: string
  resourceId?: string
  resourceUrl?: string
  metadata?: Prisma.InputJsonValue
}

/**
 * Create an admin notification
 */
export async function createNotification(params: CreateNotificationParams) {
  const { type, title, message, resourceId, resourceUrl, metadata } = params

  return prisma.adminNotification.create({
    data: {
      type,
      title,
      message,
      resourceId,
      resourceUrl,
      metadata,
    },
  })
}

/**
 * Create a notification for a new order
 */
export async function notifyNewOrder(orderId: string, companyName: string, amount: number) {
  return createNotification({
    type: AdminNotificationType.ORDER_CREATED,
    title: 'New Order Received',
    message: `New order for "${companyName}" - $${amount.toFixed(2)}`,
    resourceId: orderId,
    resourceUrl: `/orders/${orderId}`,
    metadata: { companyName, amount },
  })
}

/**
 * Create a notification for a cancelled order
 */
export async function notifyOrderCancelled(orderId: string, companyName: string, reason?: string) {
  return createNotification({
    type: AdminNotificationType.ORDER_CANCELLED,
    title: 'Order Cancelled',
    message: `Order for "${companyName}" has been cancelled${reason ? `: ${reason}` : ''}`,
    resourceId: orderId,
    resourceUrl: `/orders/${orderId}`,
    metadata: { companyName, reason },
  })
}

/**
 * Create a notification for a completed order
 */
export async function notifyOrderCompleted(orderId: string, companyName: string) {
  return createNotification({
    type: AdminNotificationType.ORDER_COMPLETED,
    title: 'Order Completed',
    message: `Order for "${companyName}" has been completed`,
    resourceId: orderId,
    resourceUrl: `/orders/${orderId}`,
    metadata: { companyName },
  })
}

/**
 * Create a notification for payment received
 */
export async function notifyPaymentReceived(orderId: string, companyName: string, amount: number) {
  return createNotification({
    type: AdminNotificationType.PAYMENT_RECEIVED,
    title: 'Payment Received',
    message: `Payment of $${amount.toFixed(2)} received for "${companyName}"`,
    resourceId: orderId,
    resourceUrl: `/orders/${orderId}`,
    metadata: { companyName, amount },
  })
}

/**
 * Create a notification for failed payment
 */
export async function notifyPaymentFailed(orderId: string, companyName: string, reason?: string) {
  return createNotification({
    type: AdminNotificationType.PAYMENT_FAILED,
    title: 'Payment Failed',
    message: `Payment failed for "${companyName}"${reason ? `: ${reason}` : ''}`,
    resourceId: orderId,
    resourceUrl: `/orders/${orderId}`,
    metadata: { companyName, reason },
  })
}

/**
 * Create a notification for new user registration
 */
export async function notifyNewUser(userId: string, email: string, name: string) {
  return createNotification({
    type: AdminNotificationType.USER_REGISTERED,
    title: 'New User Registered',
    message: `${name} (${email}) just registered`,
    resourceId: userId,
    resourceUrl: `/users/${userId}`,
    metadata: { email, name },
  })
}

/**
 * Create a system alert notification
 */
export async function notifySystemAlert(title: string, message: string, metadata?: Prisma.InputJsonValue) {
  return createNotification({
    type: AdminNotificationType.SYSTEM_ALERT,
    title,
    message,
    metadata,
  })
}
