import "jsr:@supabase/functions-js/edge-runtime.d.ts"

interface RequestBody {
  fcm_token: string
  title: string
  body: string
  data?: Record<string, string>
}

async function getAccessToken(): Promise<string> {
  const privateKey = Deno.env.get('FIREBASE_ADMIN_PRIVATE_KEY')!.replace(/\\n/g, '\n')
  const clientEmail = Deno.env.get('FIREBASE_ADMIN_CLIENT_EMAIL')!

  const now = Math.floor(Date.now() / 1000)
  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claim = btoa(JSON.stringify({
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  }))

  const encoder = new TextEncoder()
  const data = encoder.encode(`${header}.${claim}`)

  // Import private key
  const pemBody = privateKey
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '')
  const binaryKey = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0))

  const key = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, data)
  const sig = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

  const jwt = `${header}.${claim}.${sig}`

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  })

  const tokenData = await tokenRes.json()

  if (!tokenData.access_token) {
    throw new Error(`Failed to get access token: ${JSON.stringify(tokenData)}`)
  }

  return tokenData.access_token
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  try {
    const { fcm_token, title, body, data } = (await req.json()) as RequestBody

    if (!fcm_token || !title || !body) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 })
    }

    const projectId = Deno.env.get('FIREBASE_PROJECT_ID')!
    const accessToken = await getAccessToken()

    const fcmRes = await fetch(
      `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: {
            token: fcm_token,
            notification: { title, body },
            data: data || {},
            webpush: {
              fcm_options: {
                link: data?.link || '/',
              },
            },
          },
        }),
      }
    )

    if (!fcmRes.ok) {
      const errBody = await fcmRes.text()
      console.error('FCM send error:', errBody)
      return new Response(JSON.stringify({ error: 'FCM send failed', details: errBody }), { status: 502 })
    }

    const result = await fcmRes.json()
    return new Response(JSON.stringify({ success: true, result }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('send-push error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 })
  }
})
