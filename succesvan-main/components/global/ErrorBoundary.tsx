'use client';

import { Component, ReactNode, ErrorInfo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary Component
 * Catches JavaScript errors anywhere in the child component tree
 * and displays a fallback UI instead of crashing the whole application
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // You can log the error to an error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Optional: Send error to error tracking service like Sentry
    // if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_SENTRY_DSN) {
    //   Sentry.captureException(error, { extra: errorInfo });
    // }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  handleGoHome = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
    window.location.href = '/';
  };

  handleGoBack = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
    window.history.back();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            {/* Error Icon */}
            <div className="mb-6">
              <svg
                className="mx-auto h-16 w-16 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            {/* Error Title */}
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Something went wrong
            </h2>

            {/* Error Message */}
            <p className="text-gray-600 mb-6">
              We encountered an unexpected error. Please try again or contact support if the problem persists.
            </p>

            {/* Error Details (only in development) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-red-50 rounded-lg text-left overflow-auto max-h-40">
                <p className="text-sm text-red-800 font-mono">
                  {this.state.error.message || 'Unknown error'}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
              >
                Try Again
              </button>
              
              <button
                onClick={this.handleGoBack}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Go Back
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Go Home
              </button>
            </div>

            {/* Support Contact */}
            <p className="mt-6 text-sm text-gray-500">
              Need help?{' '}
              <a
                href="/contact-us"
                className="text-orange-500 hover:text-orange-600 underline"
              >
                Contact Support
              </a>
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook to use ErrorBoundary functionality in functional components
 */
export function useErrorHandler() {
  const router = useRouter();
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (error) {
      console.error('Error caught by hook:', error);
      // Optionally redirect to error page
      // router.push('/error');
    }
  }, [error, router]);

  const resetError = () => setError(null);

  return { error, setError, resetError };
}
