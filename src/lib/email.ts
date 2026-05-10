import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)
const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@campusnest.in'

interface SendEmailParams {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  const { data, error } = await resend.emails.send({
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
