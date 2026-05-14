import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createBrowserClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'
import crypto from 'crypto'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Magic byte signatures for common image formats
const MAGIC_BYTES = {
  jpeg: [0xFF, 0xD8, 0xFF],
  png: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
  webp: [0x52, 0x49, 0x46, 0x46] // RIFF ... WEBP
}

function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
    return buffer.length > 3 && buffer[0] === MAGIC_BYTES.jpeg[0] && buffer[1] === MAGIC_BYTES.jpeg[1] && buffer[2] === MAGIC_BYTES.jpeg[2]
  }
  if (mimeType === 'image/png') {
    for (let i = 0; i < MAGIC_BYTES.png.length; i++) {
      if (buffer[i] !== MAGIC_BYTES.png[i]) return false
    }
    return true
  }
  if (mimeType === 'image/webp') {
    for (let i = 0; i < 4; i++) {
      if (buffer[i] !== MAGIC_BYTES.webp[i]) return false
    }
    // Check 'WEBP' at index 8
    return buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  }
  return false
}

export async function POST(req: Request) {
  try {
    const supabaseServer = await createBrowserClient()
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // [SECURITY H-1] Rate limit: 10 avatar uploads per hour per user
    const rl = rateLimit(`upload:avatar:${user.id}`, { limit: 10, windowMs: 60 * 60 * 1000 })
    if (!rl.success) {
      return NextResponse.json({ error: 'Too many uploads. Please try again later.' }, { status: 429 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed' }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds 5MB limit' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    if (!validateMagicBytes(buffer, file.type)) {
      return NextResponse.json({ error: 'File content does not match declared type' }, { status: 422 })
    }

    const timestamp = Date.now()
    const extension = file.type.split('/')[1]
    const storagePath = `avatars/${user.id}-${timestamp}.${extension}`

    // Upload to 'listings' bucket (since it's public) via admin client (bypasses storage RLS)
    const { error: uploadError } = await supabaseAdmin.storage
      .from('listings')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload avatar' }, { status: 500 })
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('listings')
      .getPublicUrl(storagePath)

    // Update profile
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id)

    if (updateError) {
      console.error('Profile update error:', updateError)
      return NextResponse.json({ error: 'Failed to save avatar URL to profile' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Avatar uploaded successfully', avatar_url: publicUrl })
  } catch (err) {
    console.error('Avatar upload error:', err)
    // [SECURITY M-2] Do not leak internal error details
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
