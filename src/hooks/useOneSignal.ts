import { useCallback, useEffect, useState, useRef } from 'react';
import { notificationLogger } from '@/lib/logger';

declare global {
  interface Window {
    OneSignalDeferred?: Array<(OneSignal: any) => Promise<void>>;
    OneSignal?: any;
  }
}

interface OneSignalState {
  isInitialized: boolean;
  isSubscribed: boolean;
  permission: NotificationPermission | 'default';
  isSupported: boolean;
  isReady: boolean;
}

export const useOneSignal = () => {
  const [state, setState] = useState<OneSignalState>({
    isInitialized: false,
    isSubscribed: false,
    permission: 'default',
    isSupported: 'Notification' in window && 'serviceWorker' in navigator,
    isReady: false,
  });
  
  const oneSignalRef = useRef<any>(null);
  const initPromiseRef = useRef<Promise<any> | null>(null);

  // Get OneSignal instance safely - with proper initialization wait
  const getOneSignal = useCallback((): Promise<any> => {
    // Return cached instance if already initialized
    if (oneSignalRef.current && state.isReady) {
      return Promise.resolve(oneSignalRef.current);
    }

    // Return existing promise if initialization is in progress
    if (initPromiseRef.current) {
      return initPromiseRef.current;
    }

    // Create new initialization promise
    initPromiseRef.current = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('OneSignal initialization timeout'));
      }, 10000);

      const tryGetOneSignal = () => {
        if (window.OneSignal && typeof window.OneSignal.User !== 'undefined') {
          clearTimeout(timeout);
          oneSignalRef.current = window.OneSignal;
          resolve(window.OneSignal);
          return;
        }

        if (!window.OneSignalDeferred) {
          // Create the deferred array if it doesn't exist
          window.OneSignalDeferred = [];
        }

        window.OneSignalDeferred.push(async (OneSignal: any) => {
          clearTimeout(timeout);
          oneSignalRef.current = OneSignal;
          resolve(OneSignal);
        });
      };

      // Small delay to ensure SDK script has loaded
      setTimeout(tryGetOneSignal, 100);
    });

    return initPromiseRef.current;
  }, [state.isReady]);

  // Initialize and check subscription status
  useEffect(() => {
    const initializeState = async () => {
      try {
        const OneSignal = await getOneSignal();
        
        const isPushSupported = OneSignal.Notifications.isPushSupported();
        const permission = await OneSignal.Notifications.permission;
        const isSubscribed = await OneSignal.User.PushSubscription.optedIn;

        setState({
          isInitialized: true,
          isSubscribed: isSubscribed || false,
          permission: permission ? 'granted' : Notification.permission,
          isSupported: isPushSupported,
          isReady: true,
        });

        // Listen for subscription changes
        OneSignal.User.PushSubscription.addEventListener('change', (event: any) => {
          setState(prev => ({
            ...prev,
            isSubscribed: event.current.optedIn || false,
          }));
        });

      } catch (error) {
        notificationLogger.error('Failed to initialize state', error);
        setState(prev => ({ ...prev, isInitialized: false }));
      }
    };

    initializeState();
  }, [getOneSignal]);

  // Request permission and subscribe
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const OneSignal = await getOneSignal();
      
      // Request permission using OneSignal's method
      await OneSignal.Notifications.requestPermission();
      
      const isSubscribed = await OneSignal.User.PushSubscription.optedIn;
      
      setState(prev => ({
        ...prev,
        isSubscribed: isSubscribed || false,
        permission: Notification.permission,
      }));

      return isSubscribed || false;
    } catch (error) {
      notificationLogger.error('Failed to request permission', error);
      return false;
    }
  }, [getOneSignal]);

  // Set external user ID for targeting - uses both login (for external_id) and tags (for fallback)
  // IMPORTANT: login() is critical for multi-device support - it associates this subscription with the external_id
  const setExternalUserId = useCallback(async (userId: string, userRole?: string): Promise<void> => {
    if (!userId) {
      notificationLogger.warn('No user ID provided');
      return;
    }

    // Wait for SDK to be available
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      const OneSignal = await getOneSignal();
      
      if (!OneSignal || !OneSignal.User) {
        notificationLogger.warn('SDK not ready, skipping user identification');
        return;
      }

      // CRITICAL: Call login() FIRST to associate this subscription with the external_id
      // This enables multi-device notifications - all devices with the same login will receive notifications
      let loginSuccessful = false;
      try {
        if (OneSignal.login && typeof OneSignal.login === 'function') {
          await OneSignal.login(userId);
          loginSuccessful = true;
          notificationLogger.info('Login successful for:', userId);
        }
      } catch (loginError: any) {
        notificationLogger.warn('Login failed:', loginError?.message || loginError);
        // Continue to set tags as fallback
      }

      // Also set tags as fallback for notification targeting
      // Tags work per-subscription and provide defense-in-depth if login fails
      const tags: Record<string, string> = {
        user_id: userId,
        external_user_id: userId,
      };
      
      if (userRole) {
        tags.role = userRole;
      }

      await OneSignal.User.addTags(tags);
      notificationLogger.info('User tags set', { tags, loginSuccessful });

    } catch (error: any) {
      notificationLogger.error('Failed to set user identification', error);
    }
  }, [getOneSignal]);

  // Remove external user ID on logout
  const removeExternalUserId = useCallback(async (): Promise<void> => {
    try {
      const OneSignal = await getOneSignal();
      
      if (!OneSignal || !OneSignal.User) {
        return;
      }

      // Remove tags first (always works)
      try {
        await OneSignal.User.removeTags(['user_id', 'external_user_id', 'role']);
        notificationLogger.info('User tags removed');
      } catch (e) {
        notificationLogger.debug('Failed to remove tags', e);
      }

      // Try logout but don't fail if it doesn't work
      try {
        if (OneSignal.logout && typeof OneSignal.logout === 'function') {
          await OneSignal.logout();
          notificationLogger.info('Logout successful');
        }
      } catch (logoutError) {
        notificationLogger.debug('Logout skipped', logoutError);
      }
    } catch (error) {
      notificationLogger.error('Failed to remove external user ID', error);
    }
  }, [getOneSignal]);

  // Opt out of push notifications
  const optOut = useCallback(async (): Promise<void> => {
    try {
      const OneSignal = await getOneSignal();
      await OneSignal.User.PushSubscription.optOut();
      
      setState(prev => ({ ...prev, isSubscribed: false }));
      notificationLogger.info('User opted out');
    } catch (error) {
      notificationLogger.error('Failed to opt out', error);
    }
  }, [getOneSignal]);

  // Opt in to push notifications
  const optIn = useCallback(async (): Promise<void> => {
    try {
      const OneSignal = await getOneSignal();
      await OneSignal.User.PushSubscription.optIn();
      
      setState(prev => ({ ...prev, isSubscribed: true }));
      notificationLogger.info('User opted in');
    } catch (error) {
      notificationLogger.error('Failed to opt in', error);
    }
  }, [getOneSignal]);

  // Get the OneSignal player ID (subscription ID)
  const getPlayerId = useCallback(async (): Promise<string | null> => {
    try {
      const OneSignal = await getOneSignal();
      const subscription = await OneSignal.User.PushSubscription;
      return subscription?.id || null;
    } catch (error) {
      notificationLogger.error('Failed to get player ID', error);
      return null;
    }
  }, [getOneSignal]);

  // Add tags for targeting
  const addTags = useCallback(async (tags: Record<string, string>): Promise<void> => {
    try {
      const OneSignal = await getOneSignal();
      await OneSignal.User.addTags(tags);
      notificationLogger.info('Tags added', tags);
    } catch (error) {
      notificationLogger.error('Failed to add tags', error);
    }
  }, [getOneSignal]);

  // Remove tags
  const removeTags = useCallback(async (tagKeys: string[]): Promise<void> => {
    try {
      const OneSignal = await getOneSignal();
      await OneSignal.User.removeTags(tagKeys);
      notificationLogger.info('Tags removed', tagKeys);
    } catch (error) {
      notificationLogger.error('Failed to remove tags', error);
    }
  }, [getOneSignal]);

  return {
    ...state,
    requestPermission,
    setExternalUserId,
    removeExternalUserId,
    optIn,
    optOut,
    getPlayerId,
    addTags,
    removeTags,
  };
};

export default useOneSignal;
