import React from 'react';
import MapView from './MapView';

interface MapPlaceholderProps {
  center: {
    lat: number;
    lng: number;
  };
}

const MapPlaceholder: React.FC<MapPlaceholderProps> = ({ center }) => {
  return <MapView userPosition={[center.lat, center.lng]} />;
};

export default MapPlaceholder;
