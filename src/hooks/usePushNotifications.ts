import { useState, useEffect, useCallback } from 'react';
import { pushAPI } from '../services/api';

export type PushPermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

interface UsePushNotificationsReturn {
  permission: PushPermissionState;
  isSubscribed: boolean;
  isLoading: boolean;
  error: string | null;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  requestPermission: () => Promise<boolean>;
  sendTestNotification: () => Promise<void>;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const [permission, setPermission] = useState<PushPermissionState>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // Check if push notifications are supported
  const isSupported = 'serviceWorker' in navigator && 'PushManager' in window;

  // Initialize: register service worker and check subscription status
  useEffect(() => {
    if (!isSupported) {
      setPermission('unsupported');
      return;
    }

    const init = async () => {
      try {
        // Check current permission
        const currentPermission = Notification.permission as PushPermissionState;
        setPermission(currentPermission);

        // Register service worker
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });
        setSwRegistration(registration);

        // Check if already subscribed
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      } catch (err) {
        console.error('Failed to initialize push notifications:', err);
        setError('Failed to initialize push notifications');
      }
    };

    init();
  }, [isSupported]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError('Push notifications are not supported in this browser');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result as PushPermissionState);
      return result === 'granted';
    } catch (err) {
      console.error('Failed to request permission:', err);
      setError('Failed to request notification permission');
      return false;
    }
  }, [isSupported]);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !swRegistration) {
      setError('Push notifications are not available');
      return false;
    }

    if (permission !== 'granted') {
      const granted = await requestPermission();
      if (!granted) {
        setError('Notification permission denied');
        return false;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get VAPID public key from server
      const { data: vapidData } = await pushAPI.getVapidPublicKey();
      const vapidPublicKey = vapidData.publicKey;

      if (!vapidPublicKey) {
        throw new Error('VAPID public key not configured on server');
      }

      // Create push subscription
      const subscription = await swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      // Extract subscription data
      const subscriptionJson = subscription.toJSON();
      
      // Send subscription to server
      await pushAPI.subscribe({
        endpoint: subscriptionJson.endpoint!,
        keys: {
          p256dh: subscriptionJson.keys!.p256dh,
          auth: subscriptionJson.keys!.auth,
        },
        userAgent: navigator.userAgent,
      });

      setIsSubscribed(true);
      return true;
    } catch (err: any) {
      console.error('Failed to subscribe:', err);
      setError(err.message || 'Failed to subscribe to push notifications');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, swRegistration, permission, requestPermission]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!swRegistration) {
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const subscription = await swRegistration.pushManager.getSubscription();
      
      if (subscription) {
        // Unsubscribe from browser
        await subscription.unsubscribe();
        
        // Remove from server
        await pushAPI.unsubscribe(subscription.endpoint);
      }

      setIsSubscribed(false);
      return true;
    } catch (err: any) {
      console.error('Failed to unsubscribe:', err);
      setError(err.message || 'Failed to unsubscribe from push notifications');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [swRegistration]);

  const sendTestNotification = useCallback(async (): Promise<void> => {
    if (!isSubscribed) {
      setError('You must be subscribed to send test notifications');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await pushAPI.sendTest();
    } catch (err: any) {
      console.error('Failed to send test notification:', err);
      setError(err.message || 'Failed to send test notification');
    } finally {
      setIsLoading(false);
    }
  }, [isSubscribed]);

  return {
    permission,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    requestPermission,
    sendTestNotification,
  };
}
