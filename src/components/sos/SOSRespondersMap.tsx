import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Police siren sound URL (using a free sound effect)
const SIREN_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

// Types
interface Responder {
  id: string;
  name: string;
  role: 'police' | 'hospital';
  phone: string;
  distance: number;
  distanceMeters: number;
  lastActiveLocation: {
    type: string;
    coordinates: [number, number]; // [lng, lat]
  };
  onDuty: boolean;
  lastUpdated: Date;
}

interface SOSRespondersMapProps {
  victimLocation: { lat: number; lng: number };
  responders: {
    police: Responder[];
    hospitals: Responder[];
  };
  onResponderClick?: (responder: Responder) => void;
}

// Custom icons - Blinking SOS victim icon
const victimIcon = L.divIcon({
  className: 'custom-marker sos-active',
  html: `
    <div class="sos-marker-container" style="position: relative; width: 50px; height: 50px;">
      <div class="sos-pulse-ring" style="position: absolute; top: 5px; left: 5px; width: 40px; height: 40px; border-radius: 50%; background: rgba(239, 68, 68, 0.4); animation: sos-pulse-ring 1.5s ease-out infinite;"></div>
      <div class="sos-pulse-ring" style="position: absolute; top: 5px; left: 5px; width: 40px; height: 40px; border-radius: 50%; background: rgba(239, 68, 68, 0.4); animation: sos-pulse-ring 1.5s ease-out infinite 0.5s;"></div>
      <div class="sos-marker-blink" style="
        position: absolute;
        top: 5px;
        left: 5px;
        width: 40px;
        height: 40px;
        background: #ef4444;
        border: 3px solid #fff;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.5);
        animation: sos-blink 0.8s ease-in-out infinite;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2">
          <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      </div>
    </div>
  `,
  iconSize: [50, 50],
  iconAnchor: [25, 25],
  popupAnchor: [0, -25],
});

const policeIcon = L.divIcon({
  className: 'custom-marker',
  html: `
    <div style="
      width: 36px;
      height: 36px;
      background: #3b82f6;
      border: 2px solid #fff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
    ">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="#fff">
        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
      </svg>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});

const hospitalIcon = L.divIcon({
  className: 'custom-marker',
  html: `
    <div style="
      width: 36px;
      height: 36px;
      background: #22c55e;
      border: 2px solid #fff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(34, 197, 94, 0.4);
    ">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="#fff">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z"/>
      </svg>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});

// Component to fit map bounds
const FitBounds: React.FC<{ bounds: L.LatLngBoundsExpression }> = ({ bounds }) => {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [map, bounds]);
  return null;
};

const SOSRespondersMap: React.FC<SOSRespondersMapProps> = ({
  victimLocation,
  responders,
  onResponderClick,
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isSirenPlaying, setIsSirenPlaying] = useState(false);

  // Play siren sound on mount
  useEffect(() => {
    const audio = new Audio(SIREN_SOUND_URL);
    audio.loop = true;
    audio.volume = 0.3;
    audioRef.current = audio;

    // Auto-play siren (may require user interaction due to browser policies)
    const playSiren = async () => {
      try {
        await audio.play();
        setIsSirenPlaying(true);
      } catch (err) {
        console.log('Auto-play blocked, user interaction required');
      }
    };
    playSiren();

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  const toggleSiren = () => {
    if (audioRef.current) {
      if (isSirenPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsSirenPlaying(!isSirenPlaying);
    }
  };

  // Calculate bounds to fit all markers
  const allPoints: [number, number][] = [
    [victimLocation.lat, victimLocation.lng],
    ...responders.police.map(r => [
      r.lastActiveLocation.coordinates[1],
      r.lastActiveLocation.coordinates[0],
    ] as [number, number]),
    ...responders.hospitals.map(r => [
      r.lastActiveLocation.coordinates[1],
      r.lastActiveLocation.coordinates[0],
    ] as [number, number]),
  ];

  const bounds = L.latLngBounds(allPoints.map(p => L.latLng(p[0], p[1])));

  const formatDistance = (km: number) => {
    if (km < 1) return `${Math.round(km * 1000)}m`;
    return `${km.toFixed(1)}km`;
  };

  return (
    <div className="w-full h-full min-h-[400px] rounded-xl overflow-hidden border border-border/50 relative">
      {/* Siren Toggle Button */}
      <button
        onClick={toggleSiren}
        className={`absolute top-3 right-3 z-[1000] px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium shadow-lg transition-all ${
          isSirenPlaying
            ? 'bg-red-500 text-white animate-pulse'
            : 'bg-white text-gray-700 hover:bg-gray-100'
        }`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          {isSirenPlaying ? (
            <path d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6"/>
          ) : (
            <path d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
          )}
        </svg>
        {isSirenPlaying ? 'Mute Siren' : 'Play Siren'}
      </button>
      <MapContainer
        center={[victimLocation.lat, victimLocation.lng]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Fit bounds to all markers */}
        {allPoints.length > 1 && <FitBounds bounds={bounds} />}

        {/* 5km radius circle */}
        <Circle
          center={[victimLocation.lat, victimLocation.lng]}
          radius={5000}
          pathOptions={{
            color: '#ef4444',
            fillColor: '#ef4444',
            fillOpacity: 0.1,
            weight: 2,
            dashArray: '5, 5',
          }}
        />

        {/* 10km radius circle */}
        <Circle
          center={[victimLocation.lat, victimLocation.lng]}
          radius={10000}
          pathOptions={{
            color: '#f59e0b',
            fillColor: '#f59e0b',
            fillOpacity: 0.05,
            weight: 1,
            dashArray: '10, 10',
          }}
        />

        {/* Victim marker */}
        <Marker
          position={[victimLocation.lat, victimLocation.lng]}
          icon={victimIcon}
        >
          <Popup>
            <div className="text-center p-2">
              <div className="font-bold text-red-500 mb-1">SOS Location</div>
              <div className="text-sm text-gray-600">
                {victimLocation.lat.toFixed(6)}, {victimLocation.lng.toFixed(6)}
              </div>
            </div>
          </Popup>
        </Marker>

        {/* Police markers */}
        {responders.police.map((responder) => (
          <Marker
            key={responder.id}
            position={[
              responder.lastActiveLocation.coordinates[1],
              responder.lastActiveLocation.coordinates[0],
            ]}
            icon={policeIcon}
            eventHandlers={{
              click: () => onResponderClick?.(responder),
            }}
          >
            <Popup>
              <div className="p-2 min-w-[200px]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">{responder.name}</div>
                    <div className="text-xs text-blue-500">Police</div>
                  </div>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Distance:</span>
                    <span className="font-medium">{formatDistance(responder.distance)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Phone:</span>
                    <a href={`tel:${responder.phone}`} className="text-blue-500 hover:underline">
                      {responder.phone}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      responder.onDuty ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {responder.onDuty ? 'On Duty' : 'Offline'}
                    </span>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Hospital markers */}
        {responders.hospitals.map((responder) => (
          <Marker
            key={responder.id}
            position={[
              responder.lastActiveLocation.coordinates[1],
              responder.lastActiveLocation.coordinates[0],
            ]}
            icon={hospitalIcon}
            eventHandlers={{
              click: () => onResponderClick?.(responder),
            }}
          >
            <Popup>
              <div className="p-2 min-w-[200px]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">{responder.name}</div>
                    <div className="text-xs text-green-500">Hospital</div>
                  </div>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Distance:</span>
                    <span className="font-medium">{formatDistance(responder.distance)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Phone:</span>
                    <a href={`tel:${responder.phone}`} className="text-green-500 hover:underline">
                      {responder.phone}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      responder.onDuty ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {responder.onDuty ? 'On Duty' : 'Offline'}
                    </span>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg z-[1000]">
        <div className="text-xs font-semibold text-gray-700 mb-2">Legend</div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            <span className="text-xs text-gray-600">SOS Location</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            <span className="text-xs text-gray-600">Police</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            <span className="text-xs text-gray-600">Hospital</span>
          </div>
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200">
            <div className="w-4 h-0.5 bg-red-400 border-dashed"></div>
            <span className="text-xs text-gray-500">5km radius</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-amber-400 border-dashed"></div>
            <span className="text-xs text-gray-500">10km radius</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SOSRespondersMap;
