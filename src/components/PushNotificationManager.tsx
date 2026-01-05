import { useState } from 'react';
import { Bell, BellOff, BellRing, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useOneSignal } from '@/hooks/useOneSignal';

export function PushNotificationManager() {
  const {
    isInitialized,
    isSubscribed,
    permission,
    isSupported,
    requestPermission,
    optIn,
    optOut,
  } = useOneSignal();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const success = await requestPermission();
      if (!success) {
        // If permission was granted but optIn failed, try optIn
        await optIn();
      }
    } catch (err) {
      setError('Failed to enable notifications. Please try again.');
      console.error('[PushNotificationManager] Subscribe error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await optOut();
    } catch (err) {
      setError('Failed to disable notifications. Please try again.');
      console.error('[PushNotificationManager] Unsubscribe error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Push notifications are not supported in this browser.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your browser does not support push notifications. Please use a modern browser like Chrome, Firefox, or Edge.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isSubscribed ? (
            <BellRing className="h-5 w-5 text-green-500" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          Push Notifications
        </CardTitle>
        <CardDescription>
          {isSubscribed
            ? 'You are subscribed to push notifications on this device.'
            : 'Subscribe to receive important alerts even when the browser is closed.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {permission === 'denied' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Notification permission was denied. Please enable notifications in your browser settings to receive alerts.
            </AlertDescription>
          </Alert>
        )}

        {!isInitialized && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Initializing push notifications...</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          {isSubscribed ? (
            <Button
              variant="outline"
              onClick={handleUnsubscribe}
              disabled={isLoading || !isInitialized}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <BellOff className="h-4 w-4" />
              )}
              Unsubscribe
            </Button>
          ) : (
            <Button
              onClick={handleSubscribe}
              disabled={isLoading || permission === 'denied' || !isInitialized}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Bell className="h-4 w-4" />
              )}
              Enable Push Notifications
            </Button>
          )}
        </div>

        {isSubscribed && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            <span>Notifications enabled for this device</span>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Push notifications allow us to send you important alerts about emergencies, SOS events, and system updates even when your browser is closed.
        </p>
      </CardContent>
    </Card>
  );
}
