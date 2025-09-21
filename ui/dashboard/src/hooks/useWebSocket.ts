import { useState, useEffect, useCallback, useRef } from 'react';

interface WebSocketMessage {
  type: string;  // e.g., 'progress_update', 'refinement_complete', 'error'
  promptId?: string;
  data?: any;  // Progress data, e.g., { status: 'analyzing' }
  error?: string;
}

interface UseWebSocketOptions {
  url: string;
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  reconnectDelay?: number;
}

export const useWebSocket = (options: UseWebSocketOptions) => {
  const { url, onMessage, onConnect, onDisconnect, onError, reconnectDelay = 3000 } = options;
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState<string>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setStatus('connected');
      onConnect?.();
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        setStatus(message.type);  // e.g., 'analyzing', 'complete'
        onMessage?.(message);
      } catch (e) {
        console.warn('Invalid WebSocket message:', event.data);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      setStatus('disconnected');
      onDisconnect?.();
      // Auto-reconnect
      reconnectTimeoutRef.current = setTimeout(() => connect(), reconnectDelay);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      onError?.(error);
    };
  }, [url, onMessage, onConnect, onDisconnect, onError, reconnectDelay]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setIsConnected(false);
    setStatus('disconnected');
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  const send = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  return {
    isConnected,
    status,
    send,
    disconnect,
  };
};
