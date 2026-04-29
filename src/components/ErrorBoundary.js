import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home, ShieldAlert, WifiOff, Lock } from 'lucide-react';
import { analyticsService } from '../services/analyticsService';

import { Button, Card, CardContent } from './ui';

const ERROR_MESSAGES = {
  NETWORK: {
    title: 'Connection Lost',
    message: 'Your internet connection seems unstable. Please check your signal and try again.',
    icon: WifiOff
  },
  AUTH: {
    title: 'Authentication Required',
    message: 'Your session has expired or you do not have permission to view this page.',
    icon: Lock
  },
  DEFAULT: {
    title: 'Oops! Something went wrong',
    message: "We're sorry, but something unexpected happened. Our team has been notified and is working on a fix.",
    icon: AlertTriangle
  }
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(_error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    const errorId = `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    this.setState({
      error,
      errorInfo,
      errorId
    });

    // Report error to analytics service
    analyticsService.trackError(error, `ErrorBoundary catch: ${errorId}`);
    
    // Log for debugging
    console.error('ErrorBoundary caught an error:', {
      errorId,
      error,
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const errorType = 
        this.state.error?.message?.includes('network') || this.state.error?.message?.includes('fetch') ? 'NETWORK' :
        this.state.error?.message?.includes('auth') || this.state.error?.message?.includes('401') ? 'AUTH' : 'DEFAULT';
      
      const { title, message, icon: Icon } = ERROR_MESSAGES[errorType];

      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-red-950 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-2xl"
          >
            <Card className="border-red-200 dark:border-red-800 shadow-2xl backdrop-blur-sm bg-white/90 dark:bg-gray-900/90 overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-red-500 via-orange-500 to-red-500" />
              <CardContent className="p-10 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-8 relative"
                >
                  <Icon className="w-12 h-12 text-red-600 dark:text-red-400 z-10" />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute inset-0 bg-red-200 dark:bg-red-900/20 rounded-full"
                  />
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight"
                >
                  {title}
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed max-w-lg mx-auto"
                >
                  {message}
                  <br />
                  <span className="mt-4 inline-block text-xs font-mono text-gray-400 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-full border border-gray-100 dark:border-gray-700">
                    ID: {this.state.errorId}
                  </span>
                </motion.p>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-10"
                >
                  <Button
                    onClick={this.handleReset}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-6 rounded-2xl shadow-xl shadow-blue-200 dark:shadow-none transition-all hover:scale-105 active:scale-95 font-bold text-lg"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Attempt Recovery
                  </Button>
                  <Button
                    variant="outline"
                    onClick={this.handleGoHome}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 px-8 py-6 rounded-2xl transition-all font-bold text-lg"
                  >
                    <Home className="w-5 h-5" />
                    Return Home
                  </Button>
                </motion.div>

                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <motion.details
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="text-left mt-8 group"
                  >
                    <summary className="cursor-pointer text-sm font-semibold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center justify-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-red-500" />
                      Diagnostic Information
                    </summary>
                    <div className="mt-6 p-6 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-inner overflow-hidden">
                      <div className="mb-6">
                        <h4 className="font-bold text-xs text-gray-400 uppercase tracking-widest mb-3 px-1">Exception</h4>
                        <pre className="text-xs bg-red-50 dark:bg-red-950/30 p-4 rounded-xl border border-red-100 dark:border-red-900/50 overflow-auto text-red-800 dark:text-red-200 font-mono">
                          {this.state.error.toString()}
                        </pre>
                      </div>
                      {this.state.errorInfo && (
                        <div>
                          <h4 className="font-bold text-xs text-gray-400 uppercase tracking-widest mb-3 px-1">Component Stack Trace</h4>
                          <pre className="text-xs bg-gray-100 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700 overflow-auto text-gray-800 dark:text-gray-300 font-mono leading-relaxed">
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </div>
                      )}
                    </div>
                  </motion.details>
                )}

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="mt-10 pt-8 border-t border-gray-100 dark:border-gray-800 text-sm text-gray-400 dark:text-gray-500"
                >
                  <p className="font-medium mb-3">Recommended Actions:</p>
                  <div className="flex flex-wrap justify-center gap-4 text-xs">
                    <span className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                      Refresh page
                    </span>
                    <span className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full">
                      <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse" />
                      Check connection
                    </span>
                    <span className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full">
                      <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
                      Contact support
                    </span>
                  </div>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
