import { useCallback, useEffect, useState } from 'react';

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
}

export const useOneSignal = () => {
  const [state, setState] = useState<OneSignalState>({
    isInitialized: false,
    isSubscribed: false,
    permission: 'default',
    isSupported: 'Notification' in window && 'serviceWorker' in navigator,
  });

  // Get OneSignal instance safely
  const getOneSignal = useCallback((): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (window.OneSignal) {
        resolve(window.OneSignal);
        return;
      }

      if (!window.OneSignalDeferred) {
        reject(new Error('OneSignal not loaded'));
        return;
      }

      window.OneSignalDeferred.push(async (OneSignal: any) => {
        resolve(OneSignal);
      });
    });
  }, []);

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
        });

        // Listen for subscription changes
        OneSignal.User.PushSubscription.addEventListener('change', (event: any) => {
          setState(prev => ({
            ...prev,
            isSubscribed: event.current.optedIn || false,
          }));
        });

      } catch (error) {
        console.error('[OneSignal] Failed to initialize state:', error);
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
      console.error('[OneSignal] Failed to request permission:', error);
      return false;
    }
  }, [getOneSignal]);

  // Set external user ID for targeting
  const setExternalUserId = useCallback(async (userId: string, userRole?: string): Promise<void> => {
    try {
      const OneSignal = await getOneSignal();
      
      // Set external user ID for targeting
      await OneSignal.login(userId);
      
      // Add tags for role-based targeting
      if (userRole) {
        await OneSignal.User.addTags({
          role: userRole,
          user_id: userId,
        });
      }

      console.log('[OneSignal] External user ID set:', userId, 'role:', userRole);
    } catch (error) {
      console.error('[OneSignal] Failed to set external user ID:', error);
    }
  }, [getOneSignal]);

  // Remove external user ID on logout
  const removeExternalUserId = useCallback(async (): Promise<void> => {
    try {
      const OneSignal = await getOneSignal();
      
      // Logout from OneSignal
      await OneSignal.logout();
      
      console.log('[OneSignal] External user ID removed');
    } catch (error) {
      console.error('[OneSignal] Failed to remove external user ID:', error);
    }
  }, [getOneSignal]);

  // Opt out of push notifications
  const optOut = useCallback(async (): Promise<void> => {
    try {
      const OneSignal = await getOneSignal();
      await OneSignal.User.PushSubscription.optOut();
      
      setState(prev => ({ ...prev, isSubscribed: false }));
      console.log('[OneSignal] User opted out');
    } catch (error) {
      console.error('[OneSignal] Failed to opt out:', error);
    }
  }, [getOneSignal]);

  // Opt in to push notifications
  const optIn = useCallback(async (): Promise<void> => {
    try {
      const OneSignal = await getOneSignal();
      await OneSignal.User.PushSubscription.optIn();
      
      setState(prev => ({ ...prev, isSubscribed: true }));
      console.log('[OneSignal] User opted in');
    } catch (error) {
      console.error('[OneSignal] Failed to opt in:', error);
    }
  }, [getOneSignal]);

  // Get the OneSignal player ID (subscription ID)
  const getPlayerId = useCallback(async (): Promise<string | null> => {
    try {
      const OneSignal = await getOneSignal();
      const subscription = await OneSignal.User.PushSubscription;
      return subscription?.id || null;
    } catch (error) {
      console.error('[OneSignal] Failed to get player ID:', error);
      return null;
    }
  }, [getOneSignal]);

  // Add tags for targeting
  const addTags = useCallback(async (tags: Record<string, string>): Promise<void> => {
    try {
      const OneSignal = await getOneSignal();
      await OneSignal.User.addTags(tags);
      console.log('[OneSignal] Tags added:', tags);
    } catch (error) {
      console.error('[OneSignal] Failed to add tags:', error);
    }
  }, [getOneSignal]);

  // Remove tags
  const removeTags = useCallback(async (tagKeys: string[]): Promise<void> => {
    try {
      const OneSignal = await getOneSignal();
      await OneSignal.User.removeTags(tagKeys);
      console.log('[OneSignal] Tags removed:', tagKeys);
    } catch (error) {
      console.error('[OneSignal] Failed to remove tags:', error);
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
