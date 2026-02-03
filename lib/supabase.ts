import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Admin client with service role for server-side operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Storage buckets - matching the user-facing app
export const BUCKETS = {
  DOCUMENTS: 'documents',           // Order documents (PDFs, images)
  AVATARS: 'avatars',               // User profile pictures
  BUSINESS_IMAGES: 'business-images', // Business logos for allies page
}

interface UploadResult {
  path: string
  publicUrl: string
}

/**
 * Upload a document to Supabase Storage
 * @param buffer - File buffer
 * @param path - Path within the bucket (e.g., 'orders/order-id/filename.pdf')
 * @param contentType - MIME type of the file
 * @returns Upload result with path and public URL
 */
export async function uploadDocument(
  buffer: Buffer,
  path: string,
  contentType: string
): Promise<UploadResult> {
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKETS.DOCUMENTS)
    .upload(path, buffer, {
      contentType,
      upsert: true,
    })

  if (error) {
    console.error('Supabase storage upload error:', error)
    throw new Error(`Failed to upload file: ${error.message}`)
  }

  const { data: urlData } = supabaseAdmin.storage
    .from(BUCKETS.DOCUMENTS)
    .getPublicUrl(data.path)

  return {
    path: data.path,
    publicUrl: urlData.publicUrl,
  }
}

/**
 * Get a signed URL for private document access
 * @param path - Path within the documents bucket
 * @param expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns Signed URL
 */
export async function getSignedDocumentUrl(
  path: string,
  expiresIn: number = 3600
): Promise<string> {
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKETS.DOCUMENTS)
    .createSignedUrl(path, expiresIn)

  if (error) {
    console.error('Supabase signed URL error:', error)
    throw new Error(`Failed to generate signed URL: ${error.message}`)
  }

  return data.signedUrl
}

/**
 * List all documents for an order
 * @param orderId - The order ID
 * @returns Array of file objects
 */
export async function listOrderDocuments(orderId: string) {
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKETS.DOCUMENTS)
    .list(`orders/${orderId}`)

  if (error) {
    console.error('Supabase list error:', error)
    throw new Error(`Failed to list documents: ${error.message}`)
  }

  return data
}

/**
 * Delete a document from storage
 * @param path - Path within the documents bucket
 */
export async function deleteDocument(path: string): Promise<void> {
  const { error } = await supabaseAdmin.storage
    .from(BUCKETS.DOCUMENTS)
    .remove([path])

  if (error) {
    console.error('Supabase storage delete error:', error)
    throw new Error(`Failed to delete file: ${error.message}`)
  }
}

/**
 * Upload an avatar image
 * @param buffer - Image buffer
 * @param userId - User ID for the path
 * @param contentType - MIME type
 * @returns Upload result
 */
export async function uploadAvatar(
  buffer: Buffer,
  userId: string,
  contentType: string
): Promise<UploadResult> {
  const timestamp = Date.now()
  const path = `${userId}/avatar_${timestamp}`

  const { data, error } = await supabaseAdmin.storage
    .from(BUCKETS.AVATARS)
    .upload(path, buffer, {
      contentType,
      upsert: true,
    })

  if (error) {
    console.error('Supabase avatar upload error:', error)
    throw new Error(`Failed to upload avatar: ${error.message}`)
  }

  const { data: urlData } = supabaseAdmin.storage
    .from(BUCKETS.AVATARS)
    .getPublicUrl(data.path)

  return {
    path: data.path,
    publicUrl: urlData.publicUrl,
  }
}

/**
 * Upload a business image (logo)
 * @param buffer - Image buffer
 * @param businessId - Business/Ally ID
 * @param contentType - MIME type
 * @returns Upload result
 */
export async function uploadBusinessImage(
  buffer: Buffer,
  businessId: string,
  contentType: string
): Promise<UploadResult> {
  const timestamp = Date.now()
  const path = `${businessId}/logo_${timestamp}`

  const { data, error } = await supabaseAdmin.storage
    .from(BUCKETS.BUSINESS_IMAGES)
    .upload(path, buffer, {
      contentType,
      upsert: true,
    })

  if (error) {
    console.error('Supabase business image upload error:', error)
    throw new Error(`Failed to upload business image: ${error.message}`)
  }

  const { data: urlData } = supabaseAdmin.storage
    .from(BUCKETS.BUSINESS_IMAGES)
    .getPublicUrl(data.path)

  return {
    path: data.path,
    publicUrl: urlData.publicUrl,
  }
}

export default supabaseAdmin
