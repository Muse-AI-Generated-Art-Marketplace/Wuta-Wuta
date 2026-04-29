import React from 'react';
import { motion } from 'framer-motion';
import { WifiOff, AlertTriangle, RefreshCw, Loader2, Info } from 'lucide-react';
import { analyticsService } from '../services/analyticsService';

class AsyncErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: null,
      retryCount: 0,
      isAutoRetrying: false
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

    // Report to analytics
    analyticsService.trackError(error, `AsyncErrorBoundary (${this.props.operationName || 'Unknown'}): ${errorId}`);

    // Log async errors specifically
    console.error('Async Operation Error:', {
      errorId,
      error,
      errorInfo,
      retryCount: this.state.retryCount,
      operation: this.props.operationName || 'Unknown Async Operation'
    });

    // Handle auto-retry logic
    const { maxRetries = 3, autoRetry = false } = this.props;
    if (autoRetry && this.state.retryCount < maxRetries) {
      this.triggerAutoRetry();
    }
  }

  triggerAutoRetry = () => {
    this.setState({ isAutoRetrying: true });
    
    // Exponential backoff for auto-retry
    const backoffTime = Math.pow(2, this.state.retryCount) * 1000;
    
    setTimeout(() => {
      this.handleRetry();
    }, backoffTime);
  };

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorId: null,
      retryCount: prevState.retryCount + 1,
      isAutoRetrying: false
    }));
  };

  render() {
    if (this.state.hasError) {
      const { fallback, operationName, maxRetries = 3 } = this.props;
      const canRetry = this.state.retryCount < maxRetries;

      if (fallback) {
        return fallback({
          error: this.state.error,
          errorId: this.state.errorId,
          retry: canRetry ? this.handleRetry : null,
          retryCount: this.state.retryCount,
          canRetry,
          isAutoRetrying: this.state.isAutoRetrying
        });
      }

      return (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-8 bg-white dark:bg-gray-900 border border-amber-100 dark:border-amber-900/30 rounded-3xl shadow-2xl relative overflow-hidden"
        >
          {this.state.isAutoRetrying && (
            <motion.div 
              className="absolute top-0 left-0 h-1 bg-amber-500"
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 2 }}
            />
          )}

          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/30 rounded-2xl flex items-center justify-center relative">
                {this.state.isAutoRetrying ? (
                  <Loader2 className="w-8 h-8 text-amber-600 dark:text-amber-400 animate-spin" />
                ) : (
                  <WifiOff className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                )}
                {this.state.retryCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                    Attempt {this.state.retryCount}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex-1 text-center md:text-left min-w-0">
              <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-2 mb-3">
                <h3 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                  {this.state.isAutoRetrying ? 'Attempting Recovery...' : (operationName ? `${operationName} Interrupted` : 'Operation Interrupted')}
                </h3>
                <span className="text-[10px] font-mono text-gray-400 bg-gray-50 dark:bg-gray-800 px-3 py-1 rounded-full border border-gray-100 dark:border-gray-700">
                  REF: {this.state.errorId}
                </span>
              </div>

              <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                {this.state.isAutoRetrying 
                  ? "We're trying to re-establish the connection. This usually takes just a few seconds." 
                  : (this.state.error?.message || 'A transient error occurred while fetching data. This could be due to a brief network instability.')}
              </p>
              
              {process.env.NODE_ENV === 'development' && (
                <details className="mb-6 group">
                  <summary className="text-xs font-bold text-amber-600 dark:text-amber-400 cursor-pointer flex items-center justify-center md:justify-start gap-1 hover:underline">
                    <Info className="w-3 h-3" />
                    Technical Context
                  </summary>
                  <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-950 rounded-2xl border border-gray-200 dark:border-gray-800 font-mono text-[10px] text-gray-500 leading-relaxed max-h-40 overflow-auto shadow-inner">
                    <p className="mb-2 text-amber-700 dark:text-amber-500 font-bold">Stack Trace:</p>
                    {this.state.error?.toString()}
                  </div>
                </details>
              )}

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                {canRetry && !this.state.isAutoRetrying && (
                  <button
                    onClick={this.handleRetry}
                    className="inline-flex items-center px-6 py-3 text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-2xl transition-all shadow-lg shadow-amber-100 dark:shadow-none active:scale-95"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Manual Retry
                  </button>
                )}
                
                {!canRetry && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 text-xs font-bold rounded-full border border-red-100 dark:border-red-900/30">
                    <AlertTriangle className="w-4 h-4" />
                    Maximum recovery attempts reached
                  </div>
                )}

                {this.state.isAutoRetrying && (
                  <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 font-bold animate-pulse">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Retrying in {Math.pow(2, this.state.retryCount)}s...
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
