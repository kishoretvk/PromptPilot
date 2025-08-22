// WebSocket Client for Real-time Features
// Handles WebSocket connections and real-time updates in the frontend

import React from 'react';
import { EventEmitter } from 'events';

export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export interface WebSocketConfig {
  url: string;
  token?: string;
  room?: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  pingInterval?: number;
}

export class WebSocketClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingTimer: NodeJS.Timeout | null = null;
  private isConnected = false;
  private isConnecting = false;
  private shouldReconnect = true;

  constructor(config: WebSocketConfig) {
    super();
    this.config = {
      reconnectInterval: 3000,
      maxReconnectAttempts: 10,
      pingInterval: 30000,
      ...config,
    };
  }

  connect(): Promise<void> {
    if (this.isConnected || this.isConnecting) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      this.isConnecting = true;
      
      // Build WebSocket URL with query parameters
      const url = new URL(this.config.url);
      if (this.config.token) {
        url.searchParams.set('token', this.config.token);
      }
      if (this.config.room) {
        url.searchParams.set('room', this.config.room);
      }

      this.ws = new WebSocket(url.toString());

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.isConnected = true;
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.startPinging();
        this.emit('connected');
        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        this.isConnected = false;
        this.isConnecting = false;
        this.stopPinging();
        this.emit('disconnected', { code: event.code, reason: event.reason });
        
        if (this.shouldReconnect && this.reconnectAttempts < this.config.maxReconnectAttempts!) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
        this.emit('error', error);
        reject(error);
      };
    });
  }

  disconnect(): void {
    this.shouldReconnect = false;
    this.stopPinging();
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    
    this.isConnected = false;
  }

  send(message: WebSocketMessage): void {
    if (!this.isConnected || !this.ws) {
      console.warn('WebSocket not connected, message not sent:', message);
      return;
    }

    try {
      this.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error('Failed to send WebSocket message:', error);
    }
  }

  joinRoom(room: string): void {
    this.send({
      type: 'join_room',
      room,
    });
  }

  leaveRoom(room: string): void {
    this.send({
      type: 'leave_room',
      room,
    });
  }

  subscribeToPipeline(pipelineId: string): void {
    this.send({
      type: 'pipeline_subscribe',
      pipeline_id: pipelineId,
    });
  }

  private handleMessage(message: WebSocketMessage): void {
    const { type, ...data } = message;

    // Emit specific event for message type
    this.emit(type, data);
    
    // Emit general message event
    this.emit('message', message);

    // Handle built-in message types
    switch (type) {
      case 'pong':
        // Pong response received
        break;
      case 'connection_established':
        console.log('WebSocket connection established:', data.connection_id);
        break;
      case 'room_joined':
        console.log('Joined room:', data.room);
        break;
      case 'room_left':
        console.log('Left room:', data.room);
        break;
      case 'error':
        console.error('WebSocket server error:', data.message);
        this.emit('serverError', data);
        break;
      default:
        // Custom message types are handled by the specific event emission above
        break;
    }
  }

  private startPinging(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
    }

    this.pingTimer = setInterval(() => {
      if (this.isConnected) {
        this.send({ type: 'ping' });
      }
    }, this.config.pingInterval!);
  }

  private stopPinging(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      this.config.reconnectInterval! * Math.pow(2, this.reconnectAttempts - 1),
      30000 // Max 30 seconds
    );

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect().catch(console.error);
    }, delay);
  }

  get connected(): boolean {
    return this.isConnected;
  }

  get connecting(): boolean {
    return this.isConnecting;
  }
}

// Pipeline execution WebSocket client
export class PipelineWebSocketClient extends WebSocketClient {
  private pipelineId: string;

  constructor(pipelineId: string, token?: string) {
    const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:8000/ws';
    const url = `${wsUrl}/pipeline/${pipelineId}`;
    
    super({
      url,
      token,
    });
    
    this.pipelineId = pipelineId;
    this.setupPipelineEventHandlers();
  }

  private setupPipelineEventHandlers(): void {
    this.on('pipeline_started', (data) => {
      console.log('Pipeline started:', data);
    });

    this.on('step_started', (data) => {
      console.log('Step started:', data);
    });

    this.on('step_completed', (data) => {
      console.log('Step completed:', data);
    });

    this.on('step_failed', (data) => {
      console.error('Step failed:', data);
    });

    this.on('pipeline_completed', (data) => {
      console.log('Pipeline completed:', data);
    });

    this.on('progress_update', (data) => {
      console.log('Progress update:', data);
    });
  }

  cancelExecution(executionId: string): void {
    this.send({
      type: 'cancel_execution',
      execution_id: executionId,
    });
  }

  getStatus(): void {
    this.send({
      type: 'get_status',
    });
  }
}

// Global WebSocket client manager
class WebSocketManager {
  private clients: Map<string, WebSocketClient> = new Map();
  private token?: string;

  setToken(token: string): void {
    this.token = token;
  }

  getClient(key: string, config: Omit<WebSocketConfig, 'token'>): WebSocketClient {
    if (!this.clients.has(key)) {
      const client = new WebSocketClient({
        ...config,
        token: this.token,
      });
      this.clients.set(key, client);
    }
    return this.clients.get(key)!;
  }

  getPipelineClient(pipelineId: string): PipelineWebSocketClient {
    const key = `pipeline_${pipelineId}`;
    if (!this.clients.has(key)) {
      const client = new PipelineWebSocketClient(pipelineId, this.token);
      this.clients.set(key, client);
    }
    return this.clients.get(key) as PipelineWebSocketClient;
  }

  disconnectAll(): void {
    this.clients.forEach(client => client.disconnect());
    this.clients.clear();
  }

  getConnectedClients(): string[] {
    return Array.from(this.clients.entries())
      .filter(([, client]) => client.connected)
      .map(([key]) => key);
  }
}

export const wsManager = new WebSocketManager();

// React hook for WebSocket connection
export function useWebSocket(config: Omit<WebSocketConfig, 'token'>, key?: string) {
  const [connected, setConnected] = React.useState(false);
  const [connecting, setConnecting] = React.useState(false);
  const [error, setError] = React.useState<any>(null);
  const clientRef = React.useRef<WebSocketClient | null>(null);

  const clientKey = key || 'default';

  React.useEffect(() => {
    const client = wsManager.getClient(clientKey, config);
    clientRef.current = client;

    const handleConnected = () => {
      setConnected(true);
      setConnecting(false);
      setError(null);
    };

    const handleDisconnected = () => {
      setConnected(false);
      setConnecting(false);
    };

    const handleError = (err: any) => {
      setError(err);
      setConnecting(false);
    };

    client.on('connected', handleConnected);
    client.on('disconnected', handleDisconnected);
    client.on('error', handleError);

    // Connect if not already connected
    if (!client.connected && !client.connecting) {
      setConnecting(true);
      client.connect().catch(handleError);
    } else {
      setConnected(client.connected);
      setConnecting(client.connecting);
    }

    return () => {
      client.off('connected', handleConnected);
      client.off('disconnected', handleDisconnected);
      client.off('error', handleError);
    };
  }, [clientKey, config.url]);

  const send = React.useCallback((message: WebSocketMessage) => {
    clientRef.current?.send(message);
  }, []);

  const subscribe = React.useCallback((event: string, handler: (...args: any[]) => void) => {
    clientRef.current?.on(event, handler);
    return () => clientRef.current?.off(event, handler);
  }, []);

  return {
    connected,
    connecting,
    error,
    send,
    subscribe,
    client: clientRef.current,
  };
}

// React hook for pipeline WebSocket
export function usePipelineWebSocket(pipelineId: string) {
  const [connected, setConnected] = React.useState(false);
  const [connecting, setConnecting] = React.useState(false);
  const [error, setError] = React.useState<any>(null);
  const [executionStatus, setExecutionStatus] = React.useState<any>(null);
  const [progress, setProgress] = React.useState<any>(null);
  const clientRef = React.useRef<PipelineWebSocketClient | null>(null);

  React.useEffect(() => {
    const client = wsManager.getPipelineClient(pipelineId);
    clientRef.current = client;

    const handleConnected = () => {
      setConnected(true);
      setConnecting(false);
      setError(null);
    };

    const handleDisconnected = () => {
      setConnected(false);
      setConnecting(false);
    };

    const handleError = (err: any) => {
      setError(err);
      setConnecting(false);
    };

    const handlePipelineStarted = (data: any) => {
      setExecutionStatus({ status: 'running', ...data });
    };

    const handlePipelineCompleted = (data: any) => {
      setExecutionStatus({ status: 'completed', ...data });
    };

    const handleProgressUpdate = (data: any) => {
      setProgress(data);
    };

    client.on('connected', handleConnected);
    client.on('disconnected', handleDisconnected);
    client.on('error', handleError);
    client.on('pipeline_started', handlePipelineStarted);
    client.on('pipeline_completed', handlePipelineCompleted);
    client.on('progress_update', handleProgressUpdate);

    // Connect if not already connected
    if (!client.connected && !client.connecting) {
      setConnecting(true);
      client.connect().catch(handleError);
    } else {
      setConnected(client.connected);
      setConnecting(client.connecting);
    }

    return () => {
      client.off('connected', handleConnected);
      client.off('disconnected', handleDisconnected);
      client.off('error', handleError);
      client.off('pipeline_started', handlePipelineStarted);
      client.off('pipeline_completed', handlePipelineCompleted);
      client.off('progress_update', handleProgressUpdate);
    };
  }, [pipelineId]);

  const cancelExecution = React.useCallback((executionId: string) => {
    clientRef.current?.cancelExecution(executionId);
  }, []);

  const getStatus = React.useCallback(() => {
    clientRef.current?.getStatus();
  }, []);

  return {
    connected,
    connecting,
    error,
    executionStatus,
    progress,
    cancelExecution,
    getStatus,
    client: clientRef.current,
  };
}

export default WebSocketClient;