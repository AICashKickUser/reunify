'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <Card className="border-orange-200 dark:border-orange-800">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="flex size-14 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-950/30">
                <AlertTriangle className="size-7 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">Something went wrong</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  This section encountered an error. You can try again or navigate to a different section.
                </p>
                {this.state.error && (
                  <p className="text-xs text-muted-foreground/70 mt-2 font-mono">
                    {this.state.error.message}
                  </p>
                )}
              </div>
              <Button
                onClick={this.handleRetry}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <RefreshCw className="size-4" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )
    }

    return this.props.children
  }
}
