import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { uploadDocument } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const orderId = formData.get('orderId') as string
    const documentType = formData.get('documentType') as string

    if (!file || !orderId || !documentType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate document type
    const validDocTypes = [
      'ARTICLES_OF_ORGANIZATION',
      'OPERATING_AGREEMENT',
      'EIN_CONFIRMATION',
      'BANK_RESOLUTION_LETTER',
      'INVOICE',
      'RECEIPT',
    ]

    if (!validDocTypes.includes(documentType)) {
      return NextResponse.json(
        { error: 'Invalid document type' },
        { status: 400 }
      )
    }

    // Check if order exists
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Convert file to buffer and upload to Supabase Storage
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate unique filename with timestamp
    const timestamp = Date.now()
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const storagePath = `orders/${orderId}/${documentType}_${timestamp}_${sanitizedFileName}`

    // Upload to Supabase Storage
    const uploadResult = await uploadDocument(buffer, storagePath, file.type)

    // Mark any existing documents of this type as not latest
    await prisma.document.updateMany({
      where: {
        orderId,
        documentType: documentType as never,
        isLatest: true,
      },
      data: {
        isLatest: false,
      },
    })

    // Create document record - store relative path, not full URL
    // The frontend will generate signed URLs for private bucket access
    const document = await prisma.document.create({
      data: {
        orderId,
        documentType: documentType as never,
        fileName: file.name,
        filePath: uploadResult.path,  // Store relative path, not publicUrl
        fileSize: file.size,
        isLatest: true,
        isFinal: true,
      },
    })

    // Auto-complete progress event based on document type
    const docToEventMap: Record<string, string> = {
      'ARTICLES_OF_ORGANIZATION': 'LLC_APPROVED',
      'EIN_CONFIRMATION': 'EIN_OBTAINED',
      'OPERATING_AGREEMENT': 'OPERATING_AGREEMENT_GENERATED',
      'BANK_RESOLUTION_LETTER': 'BANK_RESOLUTION_LETTER_GENERATED',
    }

    const eventType = docToEventMap[documentType]
    if (eventType) {
      // Check if progress event exists
      const existingEvent = await prisma.orderProgressEvent.findUnique({
        where: {
          orderId_eventType: {
            orderId,
            eventType: eventType as never,
          },
        },
      })

      if (existingEvent) {
        // Update existing event
        await prisma.orderProgressEvent.update({
          where: { id: existingEvent.id },
          data: { completedAt: new Date() },
        })
      } else {
        // Create new event
        await prisma.orderProgressEvent.create({
          data: {
            orderId,
            eventType: eventType as never,
            completedAt: new Date(),
          },
        })
      }

      // Check if all steps are complete and update order status
      const updatedEvents = await prisma.orderProgressEvent.findMany({
        where: { orderId },
      })

      const isCompleted = (type: string) => {
        const event = updatedEvents.find((e: { eventType: string; completedAt: Date | null }) => e.eventType === type)
        return event?.completedAt !== null && event?.completedAt !== undefined
      }

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
        await prisma.orderStatusHistory.create({
          data: {
            orderId,
            previousStatus: order.status as never,
            newStatus: 'COMPLETED' as never,
            changedBy: 'system', // Auto-updated by document upload
            notes: 'All required progress steps completed',
          },
        })

        await prisma.order.update({
          where: { id: orderId },
          data: {
            status: 'COMPLETED' as never,
            completedAt: new Date(),
          },
        })
      }
    }

    return NextResponse.json({ success: true, document })
  } catch (error) {
    console.error('Error uploading document:', error)
    return NextResponse.json(
      { error: 'Failed to upload document' },
      { status: 500 }
    )
  }
}
