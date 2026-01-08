import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export { cloudinary }

export async function uploadImage(
  file: Buffer | string,
  options?: {
    folder?: string
    publicId?: string
    transformation?: Record<string, unknown>
  }
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: options?.folder ?? 'fabielnet-blog',
      public_id: options?.publicId,
      transformation: options?.transformation,
    }

    if (typeof file === 'string') {
      // Base64 or URL
      cloudinary.uploader.upload(file, uploadOptions, (error, result) => {
        if (error) reject(error)
        else resolve({ url: result!.secure_url, publicId: result!.public_id })
      })
    } else {
      // Buffer
      cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
        if (error) reject(error)
        else resolve({ url: result!.secure_url, publicId: result!.public_id })
      }).end(file)
    }
  })
}

export async function deleteImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId)
}

export function getOptimizedUrl(
  publicId: string,
  options?: { width?: number; height?: number; quality?: string }
): string {
  return cloudinary.url(publicId, {
    fetch_format: 'auto',
    quality: options?.quality ?? 'auto',
    width: options?.width,
    height: options?.height,
    crop: options?.width || options?.height ? 'fill' : undefined,
  })
}

// Alias for backward compatibility
export async function uploadToCloudinary(
  file: Buffer,
  options?: {
    folder?: string
    resource_type?: string
  }
): Promise<{ secure_url: string; public_id: string; width?: number; height?: number }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options?.folder ?? 'fabielnet',
        resource_type: (options?.resource_type as 'image' | 'video' | 'raw' | 'auto') ?? 'auto',
      },
      (error, result) => {
        if (error) reject(error)
        else resolve({
          secure_url: result!.secure_url,
          public_id: result!.public_id,
          width: result!.width,
          height: result!.height,
        })
      }
    )
    uploadStream.end(file)
  })
}
