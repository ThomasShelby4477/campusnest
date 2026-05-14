import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { rateLimit } from '@/lib/rate-limit'
import sharp from 'sharp'

// Supported MIME types and their magic bytes
const MAGIC_BYTES: Record<string, number[]> = {
  'image/jpeg': [0xff, 0xd8],
  'image/png': [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  'application/pdf': [0x25, 0x50, 0x44, 0x46],
}

function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
  const expected = MAGIC_BYTES[mimeType]
  if (!expected) return false
  for (let i = 0; i < expected.length; i++) {
    if (buffer[i] !== expected[i]) return false
  }
  return true
}

async function watermarkImage(
  buffer: Buffer,
  userId: string
): Promise<Buffer> {
  const image = sharp(buffer)
  const metadata = await image.metadata()
  const width = metadata.width || 800
  const height = metadata.height || 600

  // Create SVG watermark with repeated diagonal text
  const watermarkTexts: string[] = []
  const fontSize = 18
  const spacing = 120

  for (let y = -height; y < height * 2; y += spacing) {
    for (let x = -width; x < width * 2; x += spacing) {
      watermarkTexts.push(
        `<text x="${x}" y="${y}" font-size="${fontSize}" fill="rgba(255,255,255,0.3)" font-family="monospace" transform="rotate(-45, ${x}, ${y})">${userId.substring(0, 8)}</text>`
      )
    }
  }

  const watermarkSvg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      ${watermarkTexts.join('\n')}
    </svg>
  `

  const watermarked = await image
    .composite([
      {
        input: Buffer.from(watermarkSvg),
        top: 0,
        left: 0,
      },
    ])
    .jpeg({ quality: 85 })
    .toBuffer()

  return watermarked
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // [SECURITY H-1] Rate limit: 5 ID card uploads per hour per user
    const rl = rateLimit(`upload:idcard:${user.id}`, { limit: 5, windowMs: 60 * 60 * 1000 })
    if (!rl.success) {
      return NextResponse.json({ error: 'Too many uploads. Please try again later.' }, { status: 429 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const fileType = formData.get('type') as string | null // 'id-card' or 'selfie'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Enforce max 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be under 5MB' },
        { status: 422 }
      )
    }

    // Validate MIME type
    const allowedMimes = ['image/jpeg', 'image/png', 'application/pdf']
    if (!allowedMimes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Only JPEG, PNG, and PDF files are allowed' },
        { status: 422 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Validate magic bytes
    if (!validateMagicBytes(buffer, file.type)) {
      return NextResponse.json(
        { error: 'File content does not match declared type' },
        { status: 422 }
      )
    }

    const timestamp = Date.now()
    const isSelfie = fileType === 'selfie'

    let uploadBuffer: Buffer
    let storagePath: string

    if (isSelfie) {
      // Selfies: no watermark, just upload
      uploadBuffer = buffer
      storagePath = `selfies/${user.id}/selfie-${timestamp}.jpg`
    } else {
      // ID cards: apply watermark (only for images, not PDFs)
      if (file.type === 'application/pdf') {
        uploadBuffer = buffer
      } else {
        uploadBuffer = await watermarkImage(buffer, user.id)
      }
      storagePath = `id-cards/${user.id}/id-${timestamp}.jpg`
    }

    // Upload to bucket via admin client (bypasses storage RLS)
    const { error: uploadError } = await supabaseAdmin.storage
      .from('id-cards')
      .upload(storagePath, uploadBuffer, {
        contentType: file.type === 'application/pdf' ? 'application/pdf' : 'image/jpeg',
        upsert: true,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      )
    }

    // Update profile with storage path and set status to PENDING
    const updateData: Record<string, unknown> = {}
    if (isSelfie) {
      updateData.selfie_path = storagePath
    } else {
      updateData.student_id_path = storagePath
      updateData.verified_status = 'PENDING'
      updateData.rejection_reason = null // clear any previous rejection
    }

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)

    if (profileError) {
      console.error('Profile update error:', profileError)
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: isSelfie ? 'Selfie uploaded successfully' : 'ID card uploaded — verification pending',
      path: storagePath,
    })
  } catch (err) {
    console.error('id-card upload error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
