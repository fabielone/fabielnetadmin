import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params
    const { eventType, completed } = await request.json()

    // Validate event type
    const validEventTypes = [
      'ORDER_RECEIVED',
      'LLC_FILED',
      'LLC_APPROVED',
      'EIN_FILED',
      'EIN_OBTAINED',
      'OPERATING_AGREEMENT_GENERATED',
      'BANK_RESOLUTION_LETTER_GENERATED',
    ]

    if (!validEventTypes.includes(eventType)) {
      return NextResponse.json({ error: 'Invalid event type' }, { status: 400 })
    }

    // Get current order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        progressEvents: true,
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Update or create progress event
    const existingEvent = order.progressEvents.find((e: { eventType: string }) => e.eventType === eventType)

    if (existingEvent) {
      await prisma.orderProgressEvent.update({
        where: { id: existingEvent.id },
        data: {
          completedAt: completed ? new Date() : null,
        },
      })
    } else {
      await prisma.orderProgressEvent.create({
        data: {
          orderId,
          eventType: eventType as never, // Type assertion for Prisma enum
          completedAt: completed ? new Date() : null,
        },
      })
    }

    // Determine order status based on progress
    let newStatus = order.status

    // Get updated progress events
    const updatedEvents = await prisma.orderProgressEvent.findMany({
      where: { orderId },
    })

    const isCompleted = (type: string) => {
      const event = updatedEvents.find((e: { eventType: string; completedAt: Date | null }) => e.eventType === type)
      return event?.completedAt !== null && event?.completedAt !== undefined
    }

    // If LLC_FILED or EIN_FILED is marked, set status to PROCESSING
    if (
      (isCompleted('LLC_FILED') || isCompleted('EIN_FILED')) &&
      String(order.status) === 'PENDING_PROCESSING'
    ) {
      newStatus = 'PROCESSING' as never
    }

    // Check if all required steps are complete
    const requiredSteps = ['ORDER_RECEIVED', 'LLC_FILED', 'LLC_APPROVED']
    
    if (order.needEIN) {
      requiredSteps.push('EIN_FILED', 'EIN_OBTAINED')
    }
    if (order.needOperatingAgreement) {
      requiredSteps.push('OPERATING_AGREEMENT_GENERATED')
    }
    if (order.needBankLetter) {
      requiredSteps.push('BANK_RESOLUTION_LETTER_GENERATED')
    }

    const allCompleted = requiredSteps.every(step => isCompleted(step))

    if (allCompleted && String(order.status) !== 'CANCELLED' && String(order.status) !== 'REFUNDED') {
      newStatus = 'COMPLETED' as never
    }

    // Update order status if changed
    if (newStatus !== order.status) {
      // Record status change
      await prisma.orderStatusHistory.create({
        data: {
          orderId,
          previousStatus: order.status as never,
          newStatus: newStatus as never,
          changedBy: 'system', // Auto-updated by progress tracking
          notes: `Status updated based on progress: ${eventType} ${completed ? 'completed' : 'uncompleted'}`,
        },
      })

      // Update order
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: newStatus,
          ...(String(newStatus) === 'COMPLETED' ? { completedAt: new Date() } : {}),
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating progress:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
