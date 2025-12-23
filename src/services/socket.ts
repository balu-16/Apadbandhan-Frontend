import { io, Socket } from 'socket.io-client';

export const WS_EVENTS = {
  DEVICE_EVENT: 'device_event',
  DEVICE_ACCIDENT: 'device_accident',
  DEVICE_TELEMETRY: 'device_telemetry',
  DEVICE_STATUS: 'device_status',
  ALERT_CREATED: 'alert_created',
  CONNECTION_STATUS: 'connection_status',
};

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || 'https://apadbandhav-backend.vercel.app';

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  connect(): Socket {
    if (this.socket?.connected) return this.socket;

    this.socket = io(`${SOCKET_URL}/events`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
    });

    this.socket.on('connect', () => {
      if (import.meta.env.DEV) console.log('🔌 WebSocket connected');
    });
    this.socket.on('disconnect', (r) => {
      if (import.meta.env.DEV) console.log('🔌 Disconnected:', r);
    });

    Object.values(WS_EVENTS).forEach((event) => {
      this.socket?.on(event, (data) => {
        this.listeners.get(event)?.forEach((cb) => cb(data));
      });
    });

    return this.socket;
  }

  on(event: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(callback);
    return () => this.listeners.get(event)?.delete(callback);
  }

  emit(event: string, data?: any): void {
    this.socket?.connected && this.socket.emit(event, data);
  }

  subscribeDevice(deviceId: string): void {
    this.emit('subscribe_device', { deviceId });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  get connected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();
export default socketService;
