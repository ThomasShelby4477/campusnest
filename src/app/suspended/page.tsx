import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Account Suspended | CampusNest',
}

export default function SuspendedPage() {
  return (
    <div className="min-h-screen bg-muted-bg flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-danger/20 p-10 text-center">

        {/* Icon */}
        <div className="w-20 h-20 rounded-2xl bg-danger/10 flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-black text-navy mb-2">Account Suspended</h1>
        <p className="text-text-muted leading-relaxed mb-6">
          Your CampusNest account has been suspended due to a violation of our community guidelines.
          You are currently unable to access the platform.
        </p>

        {/* Divider */}
        <div className="border-t border-border-light my-6" />

        {/* Contact */}
        <div className="bg-muted-bg rounded-2xl p-5 text-left space-y-2">
          <p className="text-sm font-semibold text-navy">Think this is a mistake?</p>
          <p className="text-sm text-text-muted leading-relaxed">
            If you believe your account was suspended in error, please contact our support team
            and we will review your case within 2–3 business days.
          </p>
          <a
            href="mailto:email@campusnest.com"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-coral hover:underline mt-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
            </svg>
            email@campusnest.com
          </a>
        </div>

      </div>
    </div>
  )
}
