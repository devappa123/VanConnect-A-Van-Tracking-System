import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { renderToStaticMarkup } from 'react-dom/server';
import { Car, MapPin } from 'lucide-react';

interface MapViewProps {
  userPosition: [number, number];
  vanPosition?: [number, number];
}

const createIcon = (icon: React.ReactElement, className: string) => {
  const iconMarkup = renderToStaticMarkup(
    <div className={`p-2 rounded-full shadow-lg ${className}`}>
      {icon}
    </div>
  );
  return L.divIcon({
    html: iconMarkup,
    className: 'bg-transparent border-0',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  });
};

const userIcon = createIcon(<MapPin className="w-6 h-6 text-white" />, 'bg-red-500');
const vanIcon = createIcon(<Car className="w-6 h-6 text-white" />, 'bg-primary-500');

const MapView: React.FC<MapViewProps> = ({ userPosition, vanPosition }) => {
  return (
    <MapContainer center={userPosition} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={userPosition} icon={userIcon}>
        <Popup>
          Your current location.
        </Popup>
      </Marker>
      {vanPosition && (
        <Marker position={vanPosition} icon={vanIcon}>
          <Popup>
            Van's live location.
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
};

export default MapView;
