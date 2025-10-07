/**
 * JSON-RPC 2.0 WebSocket Client
 *
 * Implements JSON-RPC 2.0 protocol over WebSocket with:
 * - Request/response correlation via ID
 * - Promise-based API
 * - Automatic reconnection with exponential backoff
 * - Message queuing during disconnection
 */

export interface JsonRpcRequest {
  jsonrpc: "2.0";
  method: string;
  params?: unknown;
  id?: string | number;
}

export interface JsonRpcResponse {
  jsonrpc: "2.0";
  result?: unknown;
  error?: JsonRpcError;
  id: string | number | null;
}

export interface JsonRpcNotification {
  jsonrpc: "2.0";
  method: string;
  params?: unknown;
}

export interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

type NotificationHandler = (method: string, params: unknown) => void;

export class JsonRpcWebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private requestId = 0;
  private pendingRequests = new Map<
    number,
    {
      resolve: (result: unknown) => void;
      reject: (error: JsonRpcError) => void;
    }
  >();
  private notificationHandlers: NotificationHandler[] = [];
  private messageQueue: JsonRpcRequest[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: number | null = null;
  private isConnected = false;
  private onConnectionChange?: (connected: boolean) => void;

  constructor(url: string) {
    this.url = url;
  }

  /**
   * Connect to WebSocket server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.onConnectionChange?.(true);

          // Send queued messages
          this.flushMessageQueue();

          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error("[JSON-RPC] Failed to parse message:", error);
          }
        };

        this.ws.onerror = (error) => {
          console.error("[JSON-RPC] WebSocket error:", error);
          reject(error);
        };

        this.ws.onclose = () => {
          this.isConnected = false;
          this.onConnectionChange?.(false);
          this.attemptReconnect();
        };
      } catch (error) {
        console.error("[JSON-RPC] Failed to create WebSocket:", error);
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.isConnected = false;
    this.onConnectionChange?.(false);
  }

  /**
   * Send a JSON-RPC request and wait for response
   */
  request(method: string, params?: unknown): Promise<unknown> {
    const id = ++this.requestId;
    const message: JsonRpcRequest = {
      jsonrpc: "2.0",
      method,
      params,
      id,
    };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });

      if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(message));
      } else {
        // Queue message if not connected
        this.messageQueue.push(message);
      }
    });
  }

  /**
   * Send a JSON-RPC notification (no response expected)
   */
  notify(method: string, params?: unknown): void {
    const message: JsonRpcNotification = {
      jsonrpc: "2.0",
      method,
      params,
    };

    if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      // Queue message if not connected
      this.messageQueue.push(message as JsonRpcRequest);
    }
  }

  /**
   * Register a handler for incoming notifications
   */
  onNotification(handler: NotificationHandler): () => void {
    this.notificationHandlers.push(handler);

    // Return unsubscribe function
    return () => {
      const index = this.notificationHandlers.indexOf(handler);
      if (index > -1) {
        this.notificationHandlers.splice(index, 1);
      }
    };
  }

  /**
   * Register connection state change callback
   */
  setConnectionChangeCallback(callback: (connected: boolean) => void): void {
    this.onConnectionChange = callback;
  }

  /**
   * Check if currently connected
   */
  getIsConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Handle incoming message (response or notification)
   */
  private handleMessage(message: JsonRpcResponse | JsonRpcNotification): void {
    // Check if this is a response (has id)
    if ("id" in message && message.id !== null && message.id !== undefined) {
      const response = message as JsonRpcResponse;
      const pending = this.pendingRequests.get(response.id as number);

      if (pending) {
        this.pendingRequests.delete(response.id as number);

        if (response.error) {
          pending.reject(response.error);
        } else {
          pending.resolve(response.result);
        }
      }
      return;
    }

    // This is a notification
    const notification = message as JsonRpcNotification;

    this.notificationHandlers.forEach((handler) => {
      handler(notification.method, notification.params);
    });
  }

  /**
   * Flush queued messages after reconnection
   */
  private flushMessageQueue(): void {
    if (!this.isConnected || !this.ws) return;

    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.ws.send(JSON.stringify(message));
      }
    }
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("[JSON-RPC] Max reconnection attempts reached");
      return;
    }

    // Exponential backoff: 1s, 2s, 4s, 8s, 16s
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 16000);
    this.reconnectAttempts++;

    this.reconnectTimeout = window.setTimeout(() => {
      this.connect().catch((error) => {
        console.error("[JSON-RPC] Reconnection failed:", error);
      });
    }, delay);
  }
}
