import React, { useState, useEffect, useRef } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { UserRole } from '../../types';
import Card from '../../components/common/Card';
import MapView from '../../components/common/MapView';
import { updateVanLocation } from '../../services/supabaseService';
import { PlayCircle, StopCircle, UserCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const DriverDashboard: React.FC = () => {
  const { user } = useAuth();
  const [isTripActive, setIsTripActive] = useState(false);
  const [location, setLocation] = useState<[number, number]>([28.6139, 77.2090]);
  const locationIntervalRef = useRef<number | null>(null);

  const vanId = user?.driver?.van_id;

  const handleTripToggle = () => {
    setIsTripActive(prev => !prev);
  };

  useEffect(() => {
    if (isTripActive && vanId) {
      const updateAndSendLocation = () => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setLocation([latitude, longitude]);
            updateVanLocation(vanId, { latitude, longitude });
            console.log("Location updated:", { latitude, longitude });
          },
          (error) => console.error("Geolocation error:", error),
          { enableHighAccuracy: true }
        );
      };
      
      updateAndSendLocation(); // Initial update
      locationIntervalRef.current = window.setInterval(updateAndSendLocation, 10000); // Update every 10 seconds

    } else {
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
        locationIntervalRef.current = null;
      }
    }

    return () => {
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
      }
    };
  }, [isTripActive, vanId]);

  return (
    <MainLayout role={UserRole.DRIVER} title="Driver Dashboard">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        <div className="lg:col-span-3 flex flex-col gap-6">
          <Card>
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">Trip Status: {isTripActive ? 'Active' : 'Inactive'}</h3>
                 {!vanId && <p className="text-red-500 text-sm mt-1">You are not assigned to a van. Location sharing is disabled.</p>}
                <p className="text-gray-500 dark:text-gray-400">
                  {isTripActive ? 'Your location is being shared with students.' : 'Start the trip to begin sharing your location.'}
                </p>
              </div>
              <button
                onClick={handleTripToggle}
                disabled={!vanId}
                className={`mt-4 md:mt-0 inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white ${
                  isTripActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                } disabled:bg-gray-400 disabled:cursor-not-allowed`}
              >
                {isTripActive ? <StopCircle className="w-5 h-5 mr-2"/> : <PlayCircle className="w-5 h-5 mr-2"/>}
                {isTripActive ? 'End Trip' : 'Start Trip'}
              </button>
            </div>
          </Card>
          <div className="flex-grow h-[60vh] lg:h-auto">
             <Card className="h-full w-full" title="Your Location">
                <MapView userPosition={location} />
             </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default DriverDashboard;
