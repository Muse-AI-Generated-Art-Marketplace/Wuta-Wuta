import React, { useState, useEffect } from 'react';

// ── Connection Status Types ─────────────────────────────────────────────────────

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface StatusInfo {
  status: ConnectionStatus;
  message: string;
  color: string;
  bgColor: string;
}

// ── Status Configuration ───────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ConnectionStatus, StatusInfo> = {
  connecting: {
    status: 'connecting',
    message: 'Connecting...',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
  },
  connected: {
    status: 'connected',
    message: 'Connected',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  disconnected: {
    status: 'disconnected',
    message: 'Disconnected',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
  },
  error: {
    status: 'error',
    message: 'Connection Error',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
};

// ── Main Component ─────────────────────────────────────────────────────────────

interface WebSocketStatusProps {
  /** Optional CSS class for the outer container. */
  className?: string;
  /** Whether to show detailed status text. Defaults to true. */
  showText?: boolean;
  /** Size of the status indicator. Defaults to 'md'. */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * WebSocketStatus
 *
 * Displays the current WebSocket connection status with visual indicators.
 * Shows connection state, reconnection attempts, and error states.
 *
 * @example
 *   <WebSocketStatus showText={true} size="md" />
 */
export function WebSocketStatus({ 
  className = '', 
  showText = true, 
  size = 'md' 
}: WebSocketStatusProps) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  // Size configurations
  const sizeConfig = {
    sm: { dot: 'w-2 h-2', text: 'text-xs' },
    md: { dot: 'w-2.5 h-2.5', text: 'text-sm' },
    lg: { dot: 'w-3 h-3', text: 'text-base' },
  };

  useEffect(() => {
    // Monitor WebSocket connection status
    const checkConnectionStatus = () => {
      try {
        const wsUrl = process.env.REACT_APP_LIVE_FEED_URL || 'ws://localhost:3001/live-feed';
        const ws = new WebSocket(wsUrl);

        setConnectionStatus('connecting');

        ws.onopen = () => {
          setConnectionStatus('connected');
          setReconnectAttempts(0);
          ws.close();
        };

        ws.onerror = () => {
          setConnectionStatus('error');
          ws.close();
        };

        ws.onclose = () => {
          if (connectionStatus === 'connecting') {
            setConnectionStatus('disconnected');
          }
        };

        // Cleanup
        setTimeout(() => {
          if (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN) {
            ws.close();
          }
        }, 1000);
      } catch (error) {
        setConnectionStatus('error');
      }
    };

    // Initial check
    checkConnectionStatus();

    // Set up periodic status checks
    const interval = setInterval(checkConnectionStatus, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [connectionStatus]);

  const currentStatus = STATUS_CONFIG[connectionStatus];
  const { dot, text } = sizeConfig[size];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Status Indicator Dot */}
      <div className="relative">
        {connectionStatus === 'connected' && (
          <span className={`animate-ping absolute inline-flex ${dot} rounded-full ${currentStatus.bgColor} opacity-75`} />
        )}
        <span 
          className={`relative inline-flex rounded-full ${dot} ${
            connectionStatus === 'connected' 
              ? 'bg-green-500' 
              : connectionStatus === 'connecting'
              ? 'bg-yellow-500'
              : connectionStatus === 'error'
              ? 'bg-red-500'
              : 'bg-gray-400'
          }`}
        />
      </div>

      {/* Status Text */}
      {showText && (
        <div className="flex flex-col">
          <span className={`${text} font-medium ${currentStatus.color}`}>
            {currentStatus.message}
          </span>
          {reconnectAttempts > 0 && (
            <span className="text-xs text-gray-500">
              Reconnect attempt {reconnectAttempts}
            </span>
          )}
        </div>
      )}

      {/* Additional Info */}
      {connectionStatus === 'error' && (
        <button
          onClick={() => window.location.reload()}
          className="text-xs text-blue-600 hover:text-blue-800 underline"
        >
          Retry
        </button>
      )}
    </div>
  );
}

// ── Hook for WebSocket Status ───────────────────────────────────────────────────

/**
 * useWebSocketStatus
 *
 * Hook to monitor and manage WebSocket connection status.
 * Returns status information and reconnection functions.
 *
 * @example
 *   const { status, isConnected, reconnect } = useWebSocketStatus();
 */
export function useWebSocketStatus() {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const isConnected = status === 'connected';
  const isConnecting = status === 'connecting';
  const hasError = status === 'error';

  const reconnect = () => {
    setReconnectAttempts(prev => prev + 1);
    setStatus('connecting');
  };

  return {
    status,
    isConnected,
    isConnecting,
    hasError,
    reconnectAttempts,
    reconnect,
  };
}
