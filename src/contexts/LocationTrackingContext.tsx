import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { deviceLocationsAPI, devicesAPI } from '@/services/api';

interface AxiosErrorLike {
  response?: {
    data?: {
      message?: string;
    };
    status?: number;
  };
  message?: string;
}

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  timestamp: number | null;
}

interface LocationTrackingContextType {
  // Permission state
  permissionStatus: 'granted' | 'denied' | 'prompt' | 'unavailable';
  isPermissionRequested: boolean;
  
  // Location state
  currentLocation: LocationState | null;
  lastKnownLocation: LocationState | null;
  isTracking: boolean;
  
  // Actions
  requestLocationPermission: () => Promise<boolean>;
  startTracking: () => void;
  stopTracking: () => void;
  
  // Error state
  locationError: string | null;
}

const LocationTrackingContext = createContext<LocationTrackingContextType | undefined>(undefined);

const LOCATION_UPDATE_INTERVAL = 20000; // 20 seconds
const LOCATION_STORAGE_KEY = 'last_known_location';

interface Device {
  _id?: string;
  id?: string;
  status: string;
}

export const LocationTrackingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt' | 'unavailable'>('prompt');
  const [isPermissionRequested, setIsPermissionRequested] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationState | null>(null);
  const [lastKnownLocation, setLastKnownLocation] = useState<LocationState | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [trackingIntervalId, setTrackingIntervalId] = useState<NodeJS.Timeout | null>(null);

  // Load last known location from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(LOCATION_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setLastKnownLocation(parsed);
      } catch (e) {
        console.error('Failed to parse stored location:', e);
      }
    }
  }, []);

  // Check if geolocation is available
  useEffect(() => {
    if (!navigator.geolocation) {
      setPermissionStatus('unavailable');
      setLocationError('Geolocation is not supported by this browser');
    }
  }, []);

  // Check permission status on mount
  useEffect(() => {
    if (navigator.permissions && navigator.geolocation) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setPermissionStatus(result.state as 'granted' | 'denied' | 'prompt');
        
        // Listen for permission changes
        result.onchange = () => {
          setPermissionStatus(result.state as 'granted' | 'denied' | 'prompt');
        };
      }).catch(() => {
        // Permissions API not supported, will check on first request
      });
    }
  }, []);

  // Save location to localStorage whenever it updates
  const saveLocationToStorage = useCallback((location: LocationState) => {
    localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(location));
    setLastKnownLocation(location);
  }, []);

  // Update location on server for user's devices
  const updateLocationOnServer = useCallback(async (location: LocationState) => {
    // Only track location for regular users, not admin/police/hospital
    const userRole = user?.role;
    if (userRole && userRole !== 'user') {
      console.log('[Location] Skipping update - not a regular user, role:', userRole);
      return;
    }
    
    if (!isAuthenticated || !location.latitude || !location.longitude) {
      console.log('[Location] Skipping update - not authenticated or no location');
      return;
    }

    try {
      // Get user's devices
      const devicesResponse = await devicesAPI.getAll();
      const devices = devicesResponse.data;

      console.log('[Location] Found devices:', devices?.length || 0);

      if (devices && Array.isArray(devices) && devices.length > 0) {
        // Filter only online devices (status field is 'online', not isOnline boolean)
        const onlineDevices = devices.filter((device: Device) => device.status === 'online');
        console.log('[Location] Online devices:', onlineDevices.length);

        if (onlineDevices.length === 0) {
          console.log('[Location] No online devices found, skipping location update');
          return;
        }

        // Update location only for online devices
        for (const device of onlineDevices) {
          const deviceId = device._id || device.id;
          if (deviceId) {
            try {
              console.log(`[Location] Updating location for device ${deviceId}:`, {
                lat: location.latitude,
                lng: location.longitude,
              });
              await deviceLocationsAPI.create({
                deviceId,
                latitude: location.latitude,
                longitude: location.longitude,
                accuracy: location.accuracy || undefined,
                source: 'browser',
              });
              console.log(`[Location] Successfully updated location for device ${deviceId}`);
            } catch (error: unknown) {
              const err = error as AxiosErrorLike;
              console.error(`[Location] Failed to update location for device ${deviceId}:`, 
                JSON.stringify(err?.response?.data || err.message, null, 2),
                'Status:', err?.response?.status
              );
            }
          }
        }
      } else {
        console.log('[Location] No devices found for user');
      }
    } catch (error: unknown) {
      const err = error as AxiosErrorLike;
      console.error('[Location] Failed to update location on server:', err?.response?.data || err.message);
    }
  }, [isAuthenticated, user?.role]);

  // Get current position
  const getCurrentPosition = useCallback((): Promise<LocationState> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: LocationState = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          };
          resolve(location);
        },
        (error) => {
          let errorMessage = 'Failed to get location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied';
              setPermissionStatus('denied');
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
          }
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 30000, // 30 seconds for mobile GPS
          maximumAge: 10000, // Accept cached position up to 10 seconds old
        }
      );
    });
  }, []);

  // Request location permission
  const requestLocationPermission = useCallback(async (): Promise<boolean> => {
    setIsPermissionRequested(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setPermissionStatus('unavailable');
      setLocationError('Geolocation is not supported by this browser');
      return false;
    }

    try {
      const location = await getCurrentPosition();
      setCurrentLocation(location);
      saveLocationToStorage(location);
      setPermissionStatus('granted');
      
      // Update location on server
      await updateLocationOnServer(location);
      
      return true;
    } catch (error: unknown) {
      const err = error as Error;
      setLocationError(err.message);
      if (err.message.includes('denied')) {
        setPermissionStatus('denied');
      }
      return false;
    }
  }, [getCurrentPosition, saveLocationToStorage, updateLocationOnServer]);

  // Update location periodically
  const updateLocation = useCallback(async () => {
    if (permissionStatus !== 'granted') {
      console.log('[Location] Cannot update - permission not granted:', permissionStatus);
      return;
    }

    try {
      console.log('[Location] Getting current position...');
      const location = await getCurrentPosition();
      console.log('[Location] Got position:', location);
      setCurrentLocation(location);
      saveLocationToStorage(location);
      setLocationError(null);
      
      // Update location on server
      await updateLocationOnServer(location);
    } catch (error: unknown) {
      const err = error as Error;
      console.error('[Location] Failed to update location:', err);
      setLocationError(err.message);
    }
  }, [permissionStatus, getCurrentPosition, saveLocationToStorage, updateLocationOnServer]);

  // Start tracking
  const startTracking = useCallback(() => {
    if (isTracking) {
      console.log('[Location] Already tracking, skipping start');
      return;
    }
    if (permissionStatus !== 'granted') {
      console.log('[Location] Cannot start tracking - permission not granted:', permissionStatus);
      return;
    }

    console.log('[Location] Starting tracking with 20s interval');
    setIsTracking(true);
    
    // Get initial position
    updateLocation();

    // Set up interval for periodic updates
    const intervalId = setInterval(() => {
      console.log('[Location] Interval tick - updating location');
      updateLocation();
    }, LOCATION_UPDATE_INTERVAL);
    setTrackingIntervalId(intervalId);
  }, [isTracking, permissionStatus, updateLocation]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    if (trackingIntervalId) {
      clearInterval(trackingIntervalId);
      setTrackingIntervalId(null);
    }
    setIsTracking(false);
  }, [trackingIntervalId]);

  // Auto-start tracking when authenticated and permission is granted
  // Only for regular users, not admin/police/hospital
  useEffect(() => {
    const userRole = user?.role;
    const isRegularUser = !userRole || userRole === 'user';
    
    if (isAuthenticated && permissionStatus === 'granted' && !isTracking && isRegularUser) {
      startTracking();
    }
    
    // Stop tracking if user is not a regular user
    if (isAuthenticated && isTracking && !isRegularUser) {
      console.log('[Location] Stopping tracking - not a regular user, role:', userRole);
      stopTracking();
    }
  }, [isAuthenticated, permissionStatus, isTracking, startTracking, stopTracking, user?.role]);

  // Stop tracking on logout
  useEffect(() => {
    if (!isAuthenticated && isTracking) {
      stopTracking();
    }
  }, [isAuthenticated, isTracking, stopTracking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (trackingIntervalId) {
        clearInterval(trackingIntervalId);
      }
    };
  }, [trackingIntervalId]);

  return (
    <LocationTrackingContext.Provider
      value={{
        permissionStatus,
        isPermissionRequested,
        currentLocation,
        lastKnownLocation,
        isTracking,
        requestLocationPermission,
        startTracking,
        stopTracking,
        locationError,
      }}
    >
      {children}
    </LocationTrackingContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useLocationTracking = () => {
  const context = useContext(LocationTrackingContext);
  if (context === undefined) {
    throw new Error('useLocationTracking must be used within a LocationTrackingProvider');
  }
  return context;
};
