// API configuration for Go backend communication
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// Safe WebSocket URL initialization that works on both client and server
const getWSBaseURL = () => {
  if (typeof window === 'undefined') return 'ws://localhost:8000';
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/^https?:\/\//, '') || 'localhost:8000';
  return `${protocol}//${host}`;
};

export const API_ENDPOINTS = {
  // Auth endpoints (v1)
  login: `${API_BASE_URL}/api/v1/auth/login`,
  signup: `${API_BASE_URL}/api/v1/auth/signup`,
  
  // Station endpoints (v1)
  stations: `${API_BASE_URL}/api/v1/stations`,
  stationDetails: (id: string) => `${API_BASE_URL}/api/v1/stations/${id}`,
  stationState: (id: string) => `${API_BASE_URL}/api/v1/stations/${id}/state`,
  
  // Reroute suggestion from LangGraph
  rerouteSuggestion: (id: string) => `${API_BASE_URL}/api/v1/stations/${id}/reroute-suggestion`,
  
  // Feedback endpoints
  feedback: `${API_BASE_URL}/api/v1/feedback`,
  
  // WebSocket - use function to get URL lazily
  get ws() {
    return `${getWSBaseURL()}/ws`;
  },
};

export class APIError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string,
  retries = 3
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(endpoint, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new APIError(
          response.status,
          data.code || 'UNKNOWN_ERROR',
          data.message || `API error: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't retry on 4xx errors (except 429)
      if (
        error instanceof APIError &&
        error.status >= 400 &&
        error.status < 500 &&
        error.status !== 429
      ) {
        throw error;
      }

      // Wait before retrying (exponential backoff)
      if (attempt < retries - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
      }
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private token: string;
  private url: string;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;

  constructor(token: string) {
    this.token = token;
    this.url = API_ENDPOINTS.ws;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('[v0] WebSocket connected');
          this.reconnectAttempts = 0;
          
          // Send auth token
          this.send('auth', { token: this.token });
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            const { type, data } = message;
            
            // Emit to listeners
            const handlers = this.listeners.get(type);
            if (handlers) {
              handlers.forEach((handler) => handler(data));
            }
          } catch (error) {
            console.error('[v0] WebSocket message parse error:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('[v0] WebSocket error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('[v0] WebSocket disconnected');
          this.attemptReconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      console.log(`[v0] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        this.connect().catch((error) => {
          console.error('[v0] Reconnection failed:', error);
        });
      }, delay);
    }
  }

  send(type: string, data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, data }));
    } else {
      console.warn('[v0] WebSocket not connected');
    }
  }

  subscribe(type: string, handler: (data: any) => void) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)?.add(handler);

    // Return unsubscribe function
    return () => {
      this.listeners.get(type)?.delete(handler);
    };
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export async function chatStream(
  endpoint: string,
  message: string,
  token: string,
  onChunk: (chunk: string) => void
): Promise<void> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    throw new APIError(
      response.status,
      'STREAM_ERROR',
      `Stream error: ${response.status}`
    );
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      onChunk(chunk);
    }
  } finally {
    reader.releaseLock();
  }
}
