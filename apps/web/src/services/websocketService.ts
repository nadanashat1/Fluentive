// WebSocket Service - Real-time communication between frontend and backend
import { useState, useEffect } from 'react';

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
  userId?: string;
  traceId?: string;
}

export interface WebSocketConfig {
  url: string;
  protocols?: string[];
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  onOpen?: () => void;
  onMessage?: (message: WebSocketMessage) => void;
  onError?: (error: Event) => void;
  onClose?: (event: CloseEvent) => void;
}

export interface Subscription {
  id: string;
  type: string;
  callback: (data: any) => void;
  unsubscribe: () => void;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private subscriptions: Map<string, Subscription> = new Map();
  private messageQueue: WebSocketMessage[] = [];
  private isConnected = false;

  constructor(config: WebSocketConfig) {
    this.config = {
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000,
      ...config,
    };
  }

  // Connect to WebSocket server
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.config.url, this.config.protocols);
        
        this.ws.onopen = (event) => {
          console.log('WebSocket connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.processMessageQueue();
          this.config.onOpen?.();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
            this.config.onMessage?.(message);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.config.onError?.(error);
          reject(error);
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          this.isConnected = false;
          this.stopHeartbeat();
          this.config.onClose?.(event);
          
          // Attempt to reconnect if not a normal closure
          if (event.code !== 1000) {
            this.attemptReconnect();
          }
        };

      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        reject(error);
      }
    });
  }

  // Disconnect from WebSocket server
  disconnect(): void {
    this.stopHeartbeat();
    this.stopReconnectTimer();
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    
    this.isConnected = false;
    this.subscriptions.clear();
    this.messageQueue = [];
  }

  // Send message to WebSocket server
  send(message: WebSocketMessage): boolean {
    if (!this.isConnected || !this.ws) {
      // Queue message for later delivery
      this.messageQueue.push(message);
      return false;
    }

    try {
      this.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Failed to send WebSocket message:', error);
      return false;
    }
  }

  // Subscribe to specific message types
  subscribe(type: string, callback: (data: any) => void): Subscription {
    const id = Math.random().toString(36).substr(2, 9);
    
    const subscription: Subscription = {
      id,
      type,
      callback,
      unsubscribe: () => {
        this.subscriptions.delete(id);
      }
    };

    this.subscriptions.set(id, subscription);
    
    // Send subscription message to server
    this.send({
      type: 'subscribe',
      data: { type },
      timestamp: new Date().toISOString(),
    });

    return subscription;
  }

  // Unsubscribe from message type
  unsubscribe(type: string): void {
    const subscriptionsToRemove = Array.from(this.subscriptions.values())
      .filter(sub => sub.type === type);
    
    subscriptionsToRemove.forEach(sub => sub.unsubscribe());
    
    // Send unsubscribe message to server
    this.send({
      type: 'unsubscribe',
      data: { type },
      timestamp: new Date().toISOString(),
    });
  }

  // Get connection status
  isConnectionOpen(): boolean {
    return this.isConnected && this.ws?.readyState === WebSocket.OPEN;
  }

  // Get connection state
  getReadyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }

  // Handle incoming messages
  private handleMessage(message: WebSocketMessage): void {
    // Handle system messages
    if (message.type === 'pong') {
      return; // Heartbeat response
    }

    if (message.type === 'ping') {
      this.send({
        type: 'pong',
        data: {},
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Route to subscribers
    this.subscriptions.forEach(subscription => {
      if (subscription.type === message.type) {
        subscription.callback(message.data);
      }
    });
  }

  // Process queued messages
  private processMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.isConnected) {
      const message = this.messageQueue.shift();
      if (message) {
        this.send(message);
      }
    }
  }

  // Start heartbeat
  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected && this.ws) {
        this.send({
          type: 'ping',
          data: {},
          timestamp: new Date().toISOString(),
        });
      }
    }, this.config.heartbeatInterval);
  }

  // Stop heartbeat
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  // Attempt to reconnect
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts!) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.stopReconnectTimer();
    
    this.reconnectTimer = setTimeout(() => {
      console.log(`Attempting to reconnect (${this.reconnectAttempts + 1}/${this.config.maxReconnectAttempts})`);
      this.reconnectAttempts++;
      
      this.connect().catch(error => {
        console.error('Reconnection failed:', error);
      });
    }, this.config.reconnectInterval!);
  }

  // Stop reconnection timer
  private stopReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}

// WebSocket Manager - Manages multiple WebSocket connections
class WebSocketManager {
  private connections: Map<string, WebSocketService> = new Map();

  // Create a new WebSocket connection
  create(id: string, config: WebSocketConfig): WebSocketService {
    // Close existing connection if it exists
    this.close(id);
    
    const service = new WebSocketService(config);
    this.connections.set(id, service);
    return service;
  }

  // Get existing WebSocket connection
  get(id: string): WebSocketService | undefined {
    return this.connections.get(id);
  }

  // Close WebSocket connection
  close(id: string): void {
    const service = this.connections.get(id);
    if (service) {
      service.disconnect();
      this.connections.delete(id);
    }
  }

  // Close all WebSocket connections
  closeAll(): void {
    this.connections.forEach((service, id) => {
      service.disconnect();
    });
    this.connections.clear();
  }

  // Get all active connections
  getActiveConnections(): string[] {
    return Array.from(this.connections.keys()).filter(id => 
      this.connections.get(id)?.isConnectionOpen()
    );
  }
}

// Create singleton WebSocket manager
export const webSocketManager = new WebSocketManager();

// Preset WebSocket configurations
export const WEBSOCKET_ENDPOINTS = {
  DASHBOARD: '/ws/dashboard',
  PRESENCE: '/ws/presence',
  NOTIFICATIONS: '/ws/notifications',
  COLLABORATION: '/ws/collaboration',
  SYSTEM_HEALTH: '/ws/system-health',
} as const;

// Helper function to create dashboard WebSocket
export function createDashboardWebSocket(userId: string): WebSocketService {
  const url = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080'}${WEBSOCKET_ENDPOINTS.DASHBOARD}/${userId}`;
  
  return webSocketManager.create('dashboard', {
    url,
    protocols: ['dashboard-v1'],
    reconnectInterval: 5000,
    maxReconnectAttempts: 10,
    heartbeatInterval: 30000,
  });
}

// Helper function to create presence WebSocket
export function createPresenceWebSocket(userId: string): WebSocketService {
  const url = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080'}${WEBSOCKET_ENDPOINTS.PRESENCE}/${userId}`;
  
  return webSocketManager.create('presence', {
    url,
    protocols: ['presence-v1'],
    reconnectInterval: 3000,
    maxReconnectAttempts: 15,
    heartbeatInterval: 15000,
  });
}

// Helper function to create notifications WebSocket
export function createNotificationsWebSocket(userId: string): WebSocketService {
  const url = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080'}${WEBSOCKET_ENDPOINTS.NOTIFICATIONS}/${userId}`;
  
  return webSocketManager.create('notifications', {
    url,
    protocols: ['notifications-v1'],
    reconnectInterval: 10000,
    maxReconnectAttempts: 5,
    heartbeatInterval: 60000,
  });
}

// React Hook for WebSocket
export function useWebSocket(config: WebSocketConfig) {
  const [service, setService] = useState<WebSocketService | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);

  useEffect(() => {
    const wsService = new WebSocketService({
      ...config,
      onOpen: () => {
        setIsConnected(true);
        config.onOpen?.();
      },
      onMessage: (message) => {
        setLastMessage(message);
        config.onMessage?.(message);
      },
      onError: (error) => {
        setIsConnected(false);
        config.onError?.(error);
      },
      onClose: () => {
        setIsConnected(false);
        config.onClose?.();
      },
    });

    setService(wsService);
    wsService.connect().catch(console.error);

    return () => {
      wsService.disconnect();
    };
  }, [config.url, config]);

  return {
    service,
    isConnected,
    lastMessage,
    send: (message: WebSocketMessage) => service?.send(message) ?? false,
    subscribe: (type: string, callback: (data: any) => void) => 
      service?.subscribe(type, callback) ?? null,
    unsubscribe: (type: string) => service?.unsubscribe(type),
  };
}

export { WebSocketService, WebSocketManager };
