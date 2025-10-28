import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

interface MapViewProps {
  userPosition: [number, number];
  vanPosition?: [number, number];
  zoom?: number;
}

const userIconHtml = `
  <div class="p-2 rounded-full shadow-lg bg-red-500">
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6 text-white">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  </div>`;

const vanIconHtml = `
  <div class="p-2 rounded-full shadow-lg bg-primary-500">
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6 text-white">
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
      <circle cx="7" cy="17" r="2"/>
      <circle cx="17" cy="17" r="2"/>
      <path d="M9 17h6"/>
    </svg>
  </div>`;


const userIcon = L.divIcon({
  html: userIconHtml,
  className: 'bg-transparent border-0',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

const vanIcon = L.divIcon({
  html: vanIconHtml,
  className: 'bg-transparent border-0',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

const MapView: React.FC<MapViewProps> = ({ userPosition, vanPosition, zoom = 13 }) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // ensure the MapContainer mounts only in the browser
    setIsClient(true);
  }, []);

  if (!isClient) {
    // lightweight placeholder until client mount
    return <div className="h-full w-full flex items-center justify-center bg-gray-200 dark:bg-gray-800 rounded-lg">Loading map...</div>;
  }

  return (
    <MapContainer
      center={userPosition}
      zoom={zoom}
      scrollWheelZoom={true}
      style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
      whenReady={() => {
        // Optional safety measure: ensure leaflet map is ready
      }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={userPosition} icon={userIcon}>
        <Popup>Your current location.</Popup>
      </Marker>
      {vanPosition && (
        <Marker position={vanPosition} icon={vanIcon}>
          <Popup>Van's live location.</Popup>
        </Marker>
      )}
    </MapContainer>
  );
};

export default MapView;