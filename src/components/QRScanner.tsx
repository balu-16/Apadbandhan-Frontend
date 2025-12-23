import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (error: string) => void;
  onClose?: () => void;
}

const QRScanner = ({ onScanSuccess, onScanError, onClose }: QRScannerProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const startScanning = async () => {
    setError(null);
    
    try {
      // Check if camera permission is granted
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setHasPermission(true);

      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode('qr-reader');
      }

      setIsScanning(true);

      await scannerRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          // Validate 16-digit code
          const cleanCode = decodedText.replace(/\s/g, '');
          if (/^\d{16}$/.test(cleanCode)) {
            stopScanning();
            onScanSuccess(cleanCode);
          } else {
            setError('Invalid QR code. Please scan a valid 16-digit device code.');
          }
        },
        (errorMessage) => {
          // Ignore continuous scan errors
          console.log('Scan error:', errorMessage);
        }
      );
    } catch (err: any) {
      console.error('Camera error:', err);
      setHasPermission(false);
      
      if (err.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access to scan QR codes.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else {
        setError(`Camera error: ${err.message || 'Unknown error'}`);
      }
      
      if (onScanError) {
        onScanError(err.message);
      }
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        setIsScanning(false);
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
  };

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  return (
    <div className="relative w-full">
      {/* Scanner Container */}
      <div 
        ref={containerRef}
        className="relative bg-black/90 rounded-2xl overflow-hidden"
        style={{ minHeight: '300px' }}
      >
        {/* QR Reader Element */}
        <div id="qr-reader" className="w-full" />

        {/* Overlay when not scanning */}
        {!isScanning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-deepblue/95 p-6">
            {error ? (
              <div className="text-center">
                <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
                <p className="text-destructive mb-4">{error}</p>
                <Button onClick={startScanning} variant="outline">
                  Try Again
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-24 h-24 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-6">
                  <Camera className="w-12 h-12 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Ready to Scan
                </h3>
                <p className="text-muted-foreground mb-6 max-w-xs">
                  Click the button below to enable your camera and scan the device QR code
                </p>
                <Button onClick={startScanning} className="gap-2">
                  <Camera className="w-5 h-5" />
                  Enable Camera & Scan
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Scanning indicator */}
        {isScanning && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Corner markers */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
              
              {/* Scanning line */}
              <div className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-scan" />
            </div>
          </div>
        )}

        {/* Close button */}
        {onClose && (
          <button
            onClick={() => {
              stopScanning();
              onClose();
            }}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Instructions */}
      {isScanning && (
        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground">
            Position the QR code within the frame to scan
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-3"
            onClick={stopScanning}
          >
            Cancel Scanning
          </Button>
        </div>
      )}
    </div>
  );
};

export default QRScanner;
