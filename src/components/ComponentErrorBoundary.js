import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, RefreshCw, Terminal } from 'lucide-react';
import { analyticsService } from '../services/analyticsService';

class ComponentErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: null,
      isRetrying: false
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    const errorId = `COMP-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    
    this.setState({
      error,
      errorId
    });

    // Report to analytics
    analyticsService.trackError(error, `ComponentErrorBoundary (${this.props.componentName || 'Unknown'}): ${errorId}`);

    // Log error for debugging
    console.error('Component Error:', {
      errorId,
      error,
      errorInfo,
      component: this.props.componentName || 'Unknown'
    });
  }

  handleRetry = () => {
    this.setState({ isRetrying: true });
    
    // Small delay to show retry animation
    setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorId: null,
        isRetrying: false
      });
    }, 600);
  };

  render() {
    if (this.state.hasError) {
      const { fallback, componentName } = this.props;
      
      if (fallback) {
        return fallback({
          error: this.state.error,
          errorId: this.state.errorId,
          retry: this.handleRetry,
          isRetrying: this.state.isRetrying
        });
      }

      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-5 bg-white dark:bg-gray-900 border border-red-100 dark:border-red-900/30 rounded-2xl shadow-lg overflow-hidden relative group"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
          
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-red-50 dark:bg-red-950/30 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-tight">
                    {componentName ? `${componentName} Error`: 'Component Issue'}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    This part of the app couldn&apos;t load.
                  </p>
                </div>
                <span className="text-[10px] font-mono text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded border border-gray-100 dark:border-gray-700">
                  {this.state.errorId}
                </span>
              </div>

              {process.env.NODE_ENV === 'development' && (
                <details className="mt-3 group/details">
                  <summary className="text-xs font-semibold text-red-600 dark:text-red-400 cursor-pointer flex items-center gap-1 hover:underline">
                    <Terminal className="w-3 h-3" />
                    View Technical Log
                  </summary>
                  <pre className="mt-2 text-[10px] bg-gray-50 dark:bg-gray-950 p-3 rounded-lg border border-gray-200 dark:border-gray-800 overflow-auto font-mono text-gray-600 dark:text-gray-400 leading-tight max-h-32">
                    {this.state.error?.toString()}
                  </pre>
                </details>
              )}
              
              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={this.handleRetry}
                  disabled={this.state.isRetrying}
                  className="inline-flex items-center px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-md shadow-red-100 dark:shadow-none active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                >
                  <RefreshCw className={`w-3 h-3 mr-2 ${this.state.isRetrying ? 'animate-spin' : ''}`} />
                  {this.state.isRetrying ? 'Resetting...' : 'Reload Component'}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      );
    }

    return this.props.children;
  }
}

export default ComponentErrorBoundary;
