import { useEffect, useState, useCallback, useRef } from 'react';
import socketService, { WS_EVENTS } from '@/services/socket';

interface DeviceStatusEvent {
  deviceId: string;
  status: string;
}

interface DeviceTelemetryEvent {
  data: {
    deviceId: string;
    [key: string]: unknown;
  };
}

/**
 * Hook for WebSocket connection and event handling
 */
export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = socketService.connect();
    
    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    setIsConnected(socket.connected);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, []);

  return { isConnected, socket: socketService };
}

/**
 * Hook for listening to device events
 */
export function useDeviceEvents(onEvent?: (data: unknown) => void) {
  const [events, setEvents] = useState<unknown[]>([]);

  useEffect(() => {
    socketService.connect();

    const unsubscribe = socketService.on(WS_EVENTS.DEVICE_EVENT, (data) => {
      setEvents((prev) => [data, ...prev].slice(0, 100));
      onEvent?.(data);
    });

    return unsubscribe;
  }, [onEvent]);

  return events;
}

/**
 * Hook for listening to accident alerts
 */
export function useAccidentAlerts(onAccident?: (data: unknown) => void) {
  const [accidents, setAccidents] = useState<unknown[]>([]);
  const callbackRef = useRef(onAccident);
  callbackRef.current = onAccident;

  useEffect(() => {
    socketService.connect();

    const unsubscribe = socketService.on(WS_EVENTS.DEVICE_ACCIDENT, (data: unknown) => {
      console.warn('🚨 Accident Alert Received:', data);
      setAccidents((prev) => [data, ...prev].slice(0, 50));
      callbackRef.current?.(data);
    });

    return unsubscribe;
  }, []);

  return accidents;
}

/**
 * Hook for device telemetry updates
 */
export function useDeviceTelemetry(deviceId?: string) {
  const [telemetry, setTelemetry] = useState<unknown>(null);

  useEffect(() => {
    socketService.connect();

    const unsubscribe = socketService.on(WS_EVENTS.DEVICE_TELEMETRY, (data: unknown) => {
      const telemetryData = data as DeviceTelemetryEvent;
      if (!deviceId || telemetryData?.data?.deviceId === deviceId) {
        setTelemetry(telemetryData);
      }
    });

    return unsubscribe;
  }, [deviceId]);

  return telemetry;
}

/**
 * Hook for device status updates
 */
export function useDeviceStatus() {
  const [statuses, setStatuses] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    socketService.connect();

    const unsubscribe = socketService.on(WS_EVENTS.DEVICE_STATUS, (data: unknown) => {
      setStatuses((prev) => {
        const next = new Map(prev);
        const statusData = data as DeviceStatusEvent;
        if (statusData && typeof statusData === 'object' && 'deviceId' in statusData && 'status' in statusData) {
           next.set(statusData.deviceId, statusData.status);
        }
        return next;
      });
    });

    return unsubscribe;
  }, []);

  const getStatus = useCallback(
    (deviceId: string) => statuses.get(deviceId) || 'unknown',
    [statuses]
  );

  return { statuses, getStatus };
}

/**
 * Hook for new alert notifications
 */
export function useAlertNotifications(onAlert?: (data: unknown) => void) {
  const [alerts, setAlerts] = useState<unknown[]>([]);
  const callbackRef = useRef(onAlert);
  callbackRef.current = onAlert;

  useEffect(() => {
    socketService.connect();

    const unsubscribe = socketService.on(WS_EVENTS.ALERT_CREATED, (data: unknown) => {
      setAlerts((prev) => [data, ...prev].slice(0, 50));
      callbackRef.current?.(data);
    });

    return unsubscribe;
  }, []);

  return alerts;
}

export { WS_EVENTS };
