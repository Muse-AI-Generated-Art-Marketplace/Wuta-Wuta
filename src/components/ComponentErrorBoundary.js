import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, RefreshCw } from 'lucide-react';

class ComponentErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: null
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

    // Log error for debugging
    console.error('Component Error:', {
      errorId,
      error,
      errorInfo,
      component: this.props.componentName || 'Unknown'
    });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorId: null
    });
  };

  render() {
    if (this.state.hasError) {
      const { fallback, componentName } = this.props;
      
      if (fallback) {
        return fallback({
          error: this.state.error,
          errorId: this.state.errorId,
          retry: this.handleRetry
        });
      }

      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg"
        >
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                {componentName ? `Error in ${componentName}`: 'Component Error'}
              </h3>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                Something went wrong with this component.
              </p>
              {process.env.NODE_ENV === 'development' && (
                <details className="mt-2">
                  <summary className="text-xs text-red-600 dark:text-red-400 cursor-pointer">
                    Error Details
                  </summary>
                  <pre className="mt-1 text-xs bg-red-100 dark:bg-red-900/50 p-2 rounded overflow-auto">
                    {this.state.error?.toString()}
                  </pre>
                </details>
              )}
              <div className="mt-3">
                <button
                  onClick={this.handleRetry}
                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-200 bg-red-100 dark:bg-red-900/50 hover:bg-red-200 dark:hover:bg-red-900/70 rounded-md transition-colors"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Retry
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
