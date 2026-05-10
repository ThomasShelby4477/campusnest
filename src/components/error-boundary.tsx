'use client'

import { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
  fallbackTitle?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex items-center justify-center p-8 min-h-[50vh]">
          <div className="max-w-md w-full text-center">
            {/* SVG Illustration */}
            <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className="mx-auto mb-6">
              <circle cx="60" cy="60" r="56" fill="#FEE2E2" stroke="#FECACA" strokeWidth="2" />
              <path d="M60 30L85 80H35L60 30Z" fill="#FCA5A5" stroke="#EF4444" strokeWidth="2" strokeLinejoin="round" />
              <rect x="57" y="46" width="6" height="18" rx="3" fill="#EF4444" />
              <circle cx="60" cy="72" r="3" fill="#EF4444" />
            </svg>

            <h2 className="text-2xl font-bold text-text-primary mb-2">
              {this.props.fallbackTitle || 'Something went wrong'}
            </h2>
            <p className="text-text-muted mb-8 leading-relaxed">
              An unexpected error occurred while loading this page. 
              Try refreshing, or contact support if the issue persists.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={this.handleReset} className="bg-navy hover:bg-navy-dark text-white gap-2">
                <RefreshCw className="w-4 h-4" /> Try Again
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/'}>
                Go Home
              </Button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-8 text-left bg-muted-bg border border-border-light rounded-xl p-4 text-xs">
                <summary className="cursor-pointer font-medium text-danger flex items-center gap-2">
                  <AlertTriangle className="w-3 h-3" /> Error Details
                </summary>
                <pre className="mt-2 overflow-auto text-text-muted whitespace-pre-wrap break-words">
                  {this.state.error.message}
                  {'\n\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
