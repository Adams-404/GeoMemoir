import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Coordinates, Pin, UserLocation } from '../types';

// --- Icons ---

const createCustomIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-icon',
    html: `<div class="w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center ${color}" style="transform: translate(-50%, -50%);">
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
           </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -20],
  });
};

const pinIcon = createCustomIcon('bg-accent');
const searchResultIcon = createCustomIcon('bg-indigo-500');

// User Dot (Static)
const userDotIcon = L.divIcon({
  className: 'user-pulse',
  html: `<div class="relative w-6 h-6">
           <div class="absolute inset-0 bg-blue-500 rounded-full opacity-20 animate-ping"></div>
           <div class="absolute inset-1 bg-blue-600 rounded-full border-2 border-white shadow-sm"></div>
         </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// User Arrow (Moving/Driving)
const createUserArrowIcon = (heading: number) => L.divIcon({
  className: 'user-arrow',
  html: `<div style="transform: rotate(${heading}deg); transition: transform 0.3s ease;" class="relative w-10 h-10 flex items-center justify-center">
           <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
             <path d="M12 2L2 22L12 18L22 22L12 2Z" fill="#2563eb" stroke="white" stroke-width="2" stroke-linejoin="round"/>
           </svg>
         </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

// --- Components ---

const LocationMarker = ({ 
  userLocation, 
  onMapClick 
}: { 
  userLocation: UserLocation | null;
  onMapClick: (coords: Coordinates) => void;
}) => {
  useMapEvents({
    click(e) {
      onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });

  const icon = (userLocation?.heading !== null && userLocation?.heading !== undefined) 
    ? createUserArrowIcon(userLocation.heading) 
    : userDotIcon;

  return userLocation === null ? null : (
    <Marker 
      position={[userLocation.lat, userLocation.lng]} 
      icon={icon} 
      zIndexOffset={1000} 
    >
      <Popup className="font-sans">
        <div className="text-center">
          <p className="font-bold text-slate-700">You</p>
          <p className="text-xs text-slate-500">
            {userLocation.speed ? `${(userLocation.speed * 3.6).toFixed(1)} km/h` : 'Stationary'}
          </p>
        </div>
      </Popup>
    </Marker>
  );
};

// Controls map movement
const MapController = ({ 
  center, 
  mode,
  onUserInteract 
}: { 
  center: Coordinates | null, 
  mode: 'fly' | 'follow',
  onUserInteract: () => void
}) => {
  const map = useMap();
  const isFirstLoad = useRef(true);

  // Listen for manual interactions to break "follow" mode
  useMapEvents({
    dragstart: () => onUserInteract(),
    mousedown: () => onUserInteract(),
  });

  useEffect(() => {
    if (center) {
      if (mode === 'fly' || isFirstLoad.current) {
        map.flyTo([center.lat, center.lng], 16, { duration: 1.5 });
        isFirstLoad.current = false;
      } else {
        // For driving/following, use a gentle pan or immediate setView to avoid lag
        map.panTo([center.lat, center.lng], { animate: true, duration: 0.5 });
      }
    }
  }, [center, mode, map]);

  return null;
};

interface MapViewProps {
  userLocation: UserLocation | null;
  pins: Pin[];
  focusCoords: { coords: Coordinates; mode: 'fly' | 'follow' } | null;
  onAddPinRequest: (coords: Coordinates) => void;
  onPinClick?: (pin: Pin) => void;
  onUserMapInteraction: () => void;
  searchResultPin?: Coordinates | null;
  mapStyle: 'street' | 'satellite';
}

export const MapView: React.FC<MapViewProps> = ({ 
  userLocation, 
  pins, 
  focusCoords, 
  onAddPinRequest, 
  onPinClick,
  onUserMapInteraction,
  searchResultPin,
  mapStyle
}) => {
  // Default center (London) if nothing else available
  const initialCenter = userLocation ? [userLocation.lat, userLocation.lng] : [51.505, -0.09];

  return (
    <div className="h-full w-full z-0 relative bg-slate-100">
      <MapContainer 
        center={initialCenter as L.LatLngExpression} 
        zoom={mapStyle === 'satellite' ? 15 : 13} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        {mapStyle === 'street' ? (
          <TileLayer
            key="street"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
        ) : (
          <>
            <TileLayer
              key="satellite-base"
              attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
            <TileLayer
              key="satellite-labels"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png"
            />
          </>
        )}
        
        <LocationMarker userLocation={userLocation} onMapClick={onAddPinRequest} />
        
        {focusCoords && (
          <MapController 
            center={focusCoords.coords} 
            mode={focusCoords.mode} 
            onUserInteract={onUserMapInteraction}
          />
        )}

        {/* Persistent Pins */}
        {pins.map((pin) => (
          <Marker 
            key={pin.id} 
            position={[pin.lat, pin.lng]} 
            icon={pinIcon}
            eventHandlers={{
              click: () => onPinClick && onPinClick(pin)
            }}
          >
            <Popup className="custom-popup">
              <div className="p-1 max-w-[200px]">
                <p className="font-medium text-slate-800 text-sm">{pin.message}</p>
                <span className="text-xs text-slate-400 mt-2 block">
                  {new Date(pin.timestamp).toLocaleDateString()}
                </span>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Temporary Search Result Marker */}
        {searchResultPin && (
          <Marker position={[searchResultPin.lat, searchResultPin.lng]} icon={searchResultIcon}>
            <Popup>
              <span className="text-sm font-medium">Search Result</span>
            </Popup>
          </Marker>
        )}

      </MapContainer>
    </div>
  );
};