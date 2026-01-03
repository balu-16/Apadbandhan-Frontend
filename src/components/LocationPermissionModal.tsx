import { useState, useEffect, useCallback } from 'react';
import { MapPin, AlertTriangle, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocationTracking } from '@/contexts/LocationTrackingContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const LOCATION_PROMPT_KEY = 'location_permission_prompted';
const LOCATION_DENIED_KEY = 'location_permission_denied';

interface LocationPermissionModalProps {
  forceShow?: boolean;
  onClose?: () => void;
  serviceContext?: 'device' | 'onduty' | 'map' | 'general';
}

export const LocationPermissionModal = ({ 
  forceShow = false, 
  onClose,
  serviceContext = 'general'
}: LocationPermissionModalProps) => {
  const { isAuthenticated, user } = useAuth();
  const { permissionStatus, requestLocationPermission } = useLocationTracking();
  const [isOpen, setIsOpen] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [showDeniedWarning, setShowDeniedWarning] = useState(false);

  const getContextMessage = useCallback(() => {
    switch (serviceContext) {
      case 'device':
        return 'Location access is required to track your device location and show it on the map.';
      case 'onduty':
        return 'Location access is required to enable on-duty mode and receive nearby emergency alerts.';
      case 'map':
        return 'Location access is required to display location coordinates on the map.';
      default:
        return 'Apadbandhav needs your location to provide emergency services and real-time tracking.';
    }
  }, [serviceContext]);

  const getRoleMessage = useCallback(() => {
    if (!user) return '';
    
    switch (user.role) {
      case 'police':
      case 'hospital':
        return 'As a responder, your location helps us connect you with nearby emergencies and enables the on-duty feature.';
      case 'user':
      default:
        return 'Your location helps us track your devices and alert emergency services in case of an accident.';
    }
  }, [user]);

  // Check if we should show the modal on login
  useEffect(() => {
    if (forceShow) {
      setIsOpen(true);
      return;
    }

    if (!isAuthenticated || !user) return;

    // Check if permission is already granted
    if (permissionStatus === 'granted') {
      return;
    }

    // Check if we've already prompted in this session
    const hasPrompted = sessionStorage.getItem(LOCATION_PROMPT_KEY);
    if (hasPrompted) {
      return;
    }

    // Show modal for first-time login
    setIsOpen(true);
    sessionStorage.setItem(LOCATION_PROMPT_KEY, 'true');
  }, [isAuthenticated, user, permissionStatus, forceShow]);

  // Handle permission denied state
  useEffect(() => {
    if (permissionStatus === 'denied') {
      localStorage.setItem(LOCATION_DENIED_KEY, 'true');
      setShowDeniedWarning(true);
    } else if (permissionStatus === 'granted') {
      localStorage.removeItem(LOCATION_DENIED_KEY);
      setShowDeniedWarning(false);
    }
  }, [permissionStatus]);

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    try {
      const granted = await requestLocationPermission();
      if (granted) {
        setIsOpen(false);
        onClose?.();
      } else {
        setShowDeniedWarning(true);
      }
    } catch (error) {
      console.error('Failed to request location permission:', error);
      setShowDeniedWarning(true);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  const handleDismiss = () => {
    // Only allow dismissing if it's a forceShow (service-specific request)
    // For initial login prompt, we want them to make a choice
    if (forceShow) {
      handleClose();
    }
  };

  if (!isAuthenticated) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleDismiss()}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <MapPin className="w-6 h-6 text-primary" />
            </div>
            <DialogTitle className="text-xl">Location Permission Required</DialogTitle>
          </div>
          <DialogDescription className="text-left space-y-3">
            <p>{getContextMessage()}</p>
            <p className="text-muted-foreground">{getRoleMessage()}</p>
          </DialogDescription>
        </DialogHeader>

        {showDeniedWarning && (
          <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-destructive">Location access denied</p>
              <p className="text-muted-foreground mt-1">
                Some features like device tracking, emergency alerts, and on-duty mode won't work without location access. 
                Please enable location in your browser settings to use these features.
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 mt-4">
          <Button
            onClick={handleRequestPermission}
            disabled={isRequesting}
            className="w-full"
          >
            {isRequesting ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Requesting...
              </>
            ) : permissionStatus === 'denied' ? (
              'Try Again'
            ) : (
              'Allow Location Access'
            )}
          </Button>
          
          {forceShow && (
            <Button
              variant="ghost"
              onClick={handleClose}
              className="w-full"
            >
              <X className="w-4 h-4 mr-2" />
              Not Now
            </Button>
          )}
          
          {!forceShow && permissionStatus !== 'denied' && (
            <p className="text-xs text-center text-muted-foreground">
              You can change this later in your browser settings
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Hook to check if location permission is needed before using a service
export const useLocationPermissionCheck = () => {
  const { permissionStatus, requestLocationPermission } = useLocationTracking();
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [serviceContext, setServiceContext] = useState<'device' | 'onduty' | 'map' | 'general'>('general');

  const checkAndRequestPermission = useCallback(async (
    context: 'device' | 'onduty' | 'map' | 'general' = 'general'
  ): Promise<boolean> => {
    if (permissionStatus === 'granted') {
      return true;
    }

    // If permission not granted, show modal
    setServiceContext(context);
    setShowPermissionModal(true);
    return false;
  }, [permissionStatus]);

  const handleModalClose = useCallback(() => {
    setShowPermissionModal(false);
  }, []);

  return {
    permissionStatus,
    showPermissionModal,
    serviceContext,
    checkAndRequestPermission,
    handleModalClose,
    requestLocationPermission,
    PermissionModal: showPermissionModal ? (
      <LocationPermissionModal
        forceShow={true}
        serviceContext={serviceContext}
        onClose={handleModalClose}
      />
    ) : null,
  };
};

export default LocationPermissionModal;
