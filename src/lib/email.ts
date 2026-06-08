import { Resend } from 'resend'

// Lazily initialized — avoids build-time crash when RESEND_API_KEY is missing
let _resend: Resend | null = null
function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY
    if (!key) throw new Error('[email] Missing RESEND_API_KEY environment variable')
    _resend = new Resend(key)
  }
  return _resend
}

const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@campusnest.in'

interface SendEmailParams {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  const { data, error } = await getResend().emails.send({
    from: `CampusNest <${fromEmail}>`,
    to,
    subject,
    html,
  })

  if (error) {
    console.error('Resend email error:', error)
    throw new Error(`Failed to send email: ${error.message}`)
  }

  return data
}

export function verificationApprovedEmail(userName: string) {
  return {
    subject: '✅ Your CampusNest account is verified!',
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #1E3A5F; font-size: 28px; margin: 0;">🏠 CampusNest</h1>
        </div>
        <div style="background: #F8F9FA; border-radius: 12px; padding: 32px;">
          <h2 style="color: #0F172A; margin-top: 0;">Hey ${userName}! 🎉</h2>
          <p style="color: #64748B; line-height: 1.6;">
            Great news — your student ID has been verified successfully.
            You now have full access to CampusNest!
          </p>
          <ul style="color: #64748B; line-height: 1.8;">
            <li>Post and browse listings</li>
            <li>Find compatible roommates</li>
            <li>Chat with matches</li>
            <li>Save your favorite listings</li>
          </ul>
          <div style="text-align: center; margin-top: 24px;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/search"
               style="display: inline-block; background: #E8593C; color: white;
                      padding: 12px 32px; border-radius: 8px; text-decoration: none;
                      font-weight: 600;">
              Start Exploring →
            </a>
          </div>
        </div>
        <p style="color: #94A3B8; font-size: 12px; text-align: center; margin-top: 24px;">
          CampusNest — Student Housing & Roommate Finder for NFSU
        </p>
      </div>
    `,
  }
}

export function verificationRejectedEmail(userName: string, reason: string) {
  return {
    subject: '⚠️ CampusNest verification update',
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #1E3A5F; font-size: 28px; margin: 0;">🏠 CampusNest</h1>
        </div>
        <div style="background: #FEF2F2; border-radius: 12px; padding: 32px;">
          <h2 style="color: #0F172A; margin-top: 0;">Hi ${userName},</h2>
          <p style="color: #64748B; line-height: 1.6;">
            We were unable to verify your student ID. Here's why:
          </p>
          <div style="background: white; border-left: 4px solid #EF4444; padding: 16px; border-radius: 4px; margin: 16px 0;">
            <p style="color: #0F172A; margin: 0;">${reason}</p>
          </div>
          <p style="color: #64748B; line-height: 1.6;">
            Please re-upload a clear, unobstructed photo of your valid NFSU student ID card.
          </p>
          <div style="text-align: center; margin-top: 24px;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/signup"
               style="display: inline-block; background: #E8593C; color: white;
                      padding: 12px 32px; border-radius: 8px; text-decoration: none;
                      font-weight: 600;">
              Re-upload ID Card
            </a>
          </div>
        </div>
        <p style="color: #94A3B8; font-size: 12px; text-align: center; margin-top: 24px;">
          CampusNest — Student Housing & Roommate Finder for NFSU
        </p>
      </div>
    `,
  }
}

export function accountSuspendedEmail(userName: string) {
  return {
    subject: 'Your CampusNest account has been suspended',
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #1E3A5F; font-size: 28px; margin: 0;">CampusNest</h1>
        </div>
        <div style="background: #FEF2F2; border-radius: 12px; padding: 32px; border: 1px solid #FECACA;">
          <h2 style="color: #0F172A; margin-top: 0; text-align: center;">Account Suspended</h2>
          <p style="color: #64748B; line-height: 1.6;">Hi ${userName},</p>
          <p style="color: #64748B; line-height: 1.6;">
            Your CampusNest account has been <strong style="color: #DC2626;">suspended</strong>
            due to a violation of our community guidelines. You are currently unable to access
            the platform, post listings, or contact other users.
          </p>
          <div style="background: white; border-left: 4px solid #EF4444; padding: 16px; border-radius: 4px; margin: 20px 0;">
            <p style="color: #0F172A; margin: 0; font-weight: 600;">Think this is a mistake?</p>
            <p style="color: #64748B; margin: 8px 0 0;">
              If you believe your account was suspended in error, please reach out to our support team.
              We will review your case within 2-3 business days.
            </p>
          </div>
          <div style="text-align: center; margin-top: 24px;">
            <a href="mailto:email@campusnest.com"
               style="display: inline-block; background: #1E3A5F; color: white;
                      padding: 12px 32px; border-radius: 8px; text-decoration: none;
                      font-weight: 600;">
              Contact Support
            </a>
          </div>
          <p style="color: #94A3B8; font-size: 13px; text-align: center; margin-top: 16px;">
            email@campusnest.com
          </p>
        </div>
        <p style="color: #94A3B8; font-size: 12px; text-align: center; margin-top: 24px;">
          CampusNest - Student Housing and Roommate Finder for NFSU
        </p>
      </div>
    `,
  }
}
