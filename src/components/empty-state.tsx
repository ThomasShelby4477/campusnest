import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  icon: 'listings' | 'saved' | 'matches' | 'notifications' | 'chat' | 'search' | 'roommates'
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
}

function EmptyIcon({ type }: { type: EmptyStateProps['icon'] }) {
  switch (type) {
    case 'listings':
      return (
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className="mx-auto">
          <rect x="20" y="30" width="80" height="65" rx="8" fill="#F1F5F9" stroke="#E2E8F0" strokeWidth="2" />
          <rect x="30" y="40" width="60" height="10" rx="4" fill="#E2E8F0" />
          <rect x="30" y="56" width="40" height="8" rx="4" fill="#E2E8F0" />
          <rect x="30" y="70" width="50" height="8" rx="4" fill="#E2E8F0" />
          <circle cx="85" cy="25" r="15" fill="#E8593C" opacity="0.15" />
          <path d="M80 25L85 20L90 25" stroke="#E8593C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="85" y1="20" x2="85" y2="30" stroke="#E8593C" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )
    case 'saved':
      return (
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className="mx-auto">
          <circle cx="60" cy="60" r="50" fill="#FFF1F2" stroke="#FECDD3" strokeWidth="2" />
          <path d="M60 85L38 65C30 57 30 45 38 38C46 31 54 35 60 42C66 35 74 31 82 38C90 45 90 57 82 65L60 85Z" fill="#FECDD3" stroke="#E8593C" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      )
    case 'matches':
      return (
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className="mx-auto">
          <circle cx="42" cy="50" r="20" fill="#DBEAFE" stroke="#93C5FD" strokeWidth="2" />
          <circle cx="78" cy="50" r="20" fill="#DBEAFE" stroke="#93C5FD" strokeWidth="2" />
          <circle cx="42" cy="46" r="6" fill="#93C5FD" />
          <path d="M32 60C32 56 37 54 42 54C47 54 52 56 52 60" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round" />
          <circle cx="78" cy="46" r="6" fill="#93C5FD" />
          <path d="M68 60C68 56 73 54 78 54C83 54 88 56 88 60" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round" />
          <path d="M55 80L60 75L65 80" stroke="#E8593C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M60 90V75" stroke="#E8593C" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )
    case 'notifications':
      return (
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className="mx-auto">
          <circle cx="60" cy="60" r="50" fill="#F0FDF4" stroke="#BBF7D0" strokeWidth="2" />
          <path d="M45 55C45 46.7 51.7 40 60 40C68.3 40 75 46.7 75 55V65L80 72H40L45 65V55Z" fill="#BBF7D0" stroke="#10B981" strokeWidth="2" strokeLinejoin="round" />
          <path d="M55 72V75C55 78 57.2 80 60 80C62.8 80 65 78 65 75V72" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
          <path d="M68 38L72 32" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
          <circle cx="76" cy="28" r="3" fill="#10B981" opacity="0.3" />
        </svg>
      )
    case 'chat':
      return (
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className="mx-auto">
          <rect x="20" y="25" width="65" height="45" rx="10" fill="#E0E7FF" stroke="#A5B4FC" strokeWidth="2" />
          <rect x="35" y="50" width="65" height="45" rx="10" fill="#EDE9FE" stroke="#C4B5FD" strokeWidth="2" />
          <circle cx="48" cy="48" r="3" fill="#A5B4FC" />
          <circle cx="60" cy="48" r="3" fill="#A5B4FC" />
          <circle cx="72" cy="48" r="3" fill="#A5B4FC" />
          <rect x="45" y="62" width="35" height="6" rx="3" fill="#C4B5FD" />
          <rect x="45" y="72" width="25" height="6" rx="3" fill="#C4B5FD" />
        </svg>
      )
    case 'search':
      return (
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className="mx-auto">
          <circle cx="55" cy="55" r="30" fill="#F1F5F9" stroke="#E2E8F0" strokeWidth="2" />
          <circle cx="55" cy="55" r="18" fill="white" stroke="#CBD5E1" strokeWidth="2" />
          <line x1="73" y1="73" x2="90" y2="90" stroke="#CBD5E1" strokeWidth="4" strokeLinecap="round" />
          <path d="M50 52L55 58L65 48" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
        </svg>
      )
    case 'roommates':
      return (
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className="mx-auto">
          <circle cx="60" cy="60" r="50" fill="#FFF7ED" stroke="#FED7AA" strokeWidth="2" />
          <circle cx="45" cy="48" r="10" fill="#FED7AA" stroke="#FB923C" strokeWidth="2" />
          <circle cx="75" cy="48" r="10" fill="#FED7AA" stroke="#FB923C" strokeWidth="2" />
          <path d="M30 78C30 68 37 62 45 62C50 62 54 64 56 67" stroke="#FB923C" strokeWidth="2" strokeLinecap="round" />
          <path d="M90 78C90 68 83 62 75 62C70 62 66 64 64 67" stroke="#FB923C" strokeWidth="2" strokeLinecap="round" />
          <path d="M56 67C58 70 62 70 64 67" stroke="#E8593C" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )
    default:
      return null
  }
}

export function EmptyState({ icon, title, description, actionLabel, actionHref, onAction }: EmptyStateProps) {
  return (
    <div className="bg-white border border-border-light rounded-2xl p-12 text-center shadow-sm max-w-md mx-auto animate-scale-in">
      <div className="mb-6">
        <EmptyIcon type={icon} />
      </div>
      <h2 className="text-2xl font-bold text-text-primary mb-2">{title}</h2>
      <p className="text-text-muted mb-8 leading-relaxed">{description}</p>
      {actionLabel && (actionHref ? (
        <Link href={actionHref}>
          <Button className="h-12 px-8 bg-navy hover:bg-navy-dark text-white text-base transition-all hover:-translate-y-0.5 hover:shadow-lg">{actionLabel}</Button>
        </Link>
      ) : onAction ? (
        <Button className="h-12 px-8 bg-navy hover:bg-navy-dark text-white text-base transition-all hover:-translate-y-0.5 hover:shadow-lg" onClick={onAction}>{actionLabel}</Button>
      ) : null)}
    </div>
  )
}
