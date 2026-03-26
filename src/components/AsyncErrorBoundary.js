import React from 'react';
import { motion } from 'framer-motion';
import { WifiOff, AlertTriangle, RefreshCw } from 'lucide-react';

class AsyncErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    const errorId = `ASYNC-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    
    this.setState({
      error,
      errorId
    });

    // Log async errors specifically
    console.error('Async Operation Error:', {
      errorId,
      error,
      errorInfo,
      retryCount: this.state.retryCount,
      operation: this.props.operationName || 'Unknown Async Operation'
    });
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorId: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  render() {
    if (this.state.hasError) {
      const { fallback, operationName, maxRetries = 3 } = this.props;
      
      // Disable retry button if max retries reached
      const canRetry = this.state.retryCount < maxRetries;

      if (fallback) {
        return fallback({
          error: this.state.error,
          errorId: this.state.errorId,
          retry: canRetry ? this.handleRetry : null,
          retryCount: this.state.retryCount,
          canRetry
        });
      }

      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg"
        >
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/50 rounded-full flex items-center justify-center">
                <WifiOff className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-medium text-amber-800 dark:text-amber-200">
                {operationName ? `${operationName} Failed` : 'Async Operation Failed'}
              </h3>
              <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                {this.state.error?.message || 'An error occurred while processing your request.'}
              </p>
              
              {process.env.NODE_ENV === 'development' && (
                <details className="mt-3">
                  <summary className="text-sm text-amber-600 dark:text-amber-400 cursor-pointer font-medium">
                    Technical Details
                  </summary>
                  <div className="mt-2 space-y-2">
                    <div className="text-xs bg-amber-100 dark:bg-amber-900/50 p-2 rounded">
                      <strong>Error ID:</strong> {this.state.errorId}
                    </div>
                    <div className="text-xs bg-amber-100 dark:bg-amber-900/50 p-2 rounded">
                      <strong>Retry Count:</strong> {this.state.retryCount}/{maxRetries}
                    </div>
                    <pre className="text-xs bg-amber-100 dark:bg-amber-900/50 p-2 rounded overflow-auto">
                      {this.state.error?.toString()}
                    </pre>
                  </div>
                </details>
              )}

              <div className="mt-4 flex items-center space-x-3">
                {canRetry && (
                  <button
                    onClick={this.handleRetry}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-amber-700 dark:text-amber-200 bg-amber-100 dark:bg-amber-900/50 hover:bg-amber-200 dark:hover:bg-amber-900/70 rounded-md transition-colors"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry {this.state.retryCount > 0 && `(${this.state.retryCount}/${maxRetries})`}
                  </button>
                )}
                
                {!canRetry && (
                  <div className="flex items-center text-sm text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Maximum retries reached
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      );
    }

    return this.props.children;
  }
}

export default AsyncErrorBoundary;
