import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

import { Button, Card, CardContent } from './ui';

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

    if (process.env.NODE_ENV === 'production') {
      // Example: sendToErrorReporting(error, errorInfo, errorId);
    }
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
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-red-950 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-2xl"
          >
            <Card className="border-red-200 dark:border-red-800 shadow-xl">
              <CardContent className="p-8 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                  <AlertTriangle className="w-10 h-10 text-red-600" />
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl font-bold text-gray-900 dark:text-white mb-4"
                >
                  Oops! Something went wrong
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed"
                >
                  We&apos;re sorry, but something unexpected happened. Our team has been notified and is working on a fix.
                  <br />
                  <span className="text-sm text-gray-500">
                    Error ID: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs">{this.state.errorId}</code>
                  </span>
                </motion.p>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
                >
                  <Button
                    onClick={this.handleReset}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                  </Button>
                  <Button
                    variant="outline"
                    onClick={this.handleGoHome}
                    className="flex items-center gap-2 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <Home className="w-4 h-4" />
                    Go Home
                  </Button>
                </motion.div>

                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <motion.details
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="text-left mt-8"
                  >
                    <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 hover:text-gray-900 dark:hover:text-white">
                      Show Error Details (Development)
                    </summary>
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="mb-4">
                        <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">Error Message:</h4>
                        <pre className="text-xs bg-red-50 dark:bg-red-950 p-3 rounded border border-red-200 dark:border-red-800 overflow-auto text-red-800 dark:text-red-200">
                          {this.state.error.toString()}
                        </pre>
                      </div>
                      {this.state.errorInfo && (
                        <div>
                          <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">Component Stack:</h4>
                          <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-3 rounded border border-gray-300 dark:border-gray-600 overflow-auto text-gray-800 dark:text-gray-200">
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
                  className="mt-8 text-sm text-gray-500 dark:text-gray-400"
                >
                  <p>If this problem persists, please:</p>
                  <ul className="mt-2 space-y-1">
                    <li>Clear your browser cache and try again</li>
                    <li>Check your internet connection</li>
                    <li>Contact our support team with the Error ID above</li>
                  </ul>
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
