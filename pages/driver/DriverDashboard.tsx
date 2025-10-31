import React, { useEffect, useState, useRef } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { UserRole, StudentWithUser, VanWithRoute } from '../../types';
import Card from '../../components/common/Card';
import MapView from '../../components/common/MapView';
import { updateVanLocation, getDriverByUserId, getStudentsByVanId, getVanWithRoute } from '../../services/supabaseService';
import { PlayCircle, StopCircle, Phone } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const DriverDashboard: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [isTripActive, setIsTripActive] = useState(false);
  const [location, setLocation] = useState<[number, number] | undefined>(undefined);
  const [students, setStudents] = useState<StudentWithUser[]>([]);
  const [route, setRoute] = useState<VanWithRoute['route'] | undefined>(undefined);
  const locationIntervalRef = useRef<number | null>(null);
  const [vanId, setVanId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch driver profile and initial data
  useEffect(() => {
    if (!user || !user.driver) return;
    
    const fetchDriverData = async () => {
      try {
        const driverProfile = user.driver;
        const currentVanId = driverProfile.van_id || null;
        setVanId(currentVanId);

        if (!currentVanId) {
          setError("You are not assigned to a van. Location sharing is disabled.");
          return;
        }

        const [studentList, vanDetails] = await Promise.all([
          getStudentsByVanId(currentVanId),
          getVanWithRoute(currentVanId)
        ]);

        setStudents(studentList);
        if (vanDetails?.route) {
          setRoute(vanDetails.route);
        } else {
          setError("No route assigned to your van.");
        }

      } catch (err) {
        console.error("Error fetching driver data:", err);
        setError("Could not fetch your details or assigned route/students.");
      }
    };
    fetchDriverData();
  }, [user]);

  // 2. Handle location updates
  useEffect(() => {
    const sendLocationUpdate = (pos: GeolocationPosition) => {
        const { latitude, longitude } = pos.coords;
        setLocation([latitude, longitude]);
        if (vanId && isTripActive) {
            updateVanLocation(vanId, { latitude, longitude }).catch(e => console.error("Failed to send location", e));
        }
    };

    const handleError = (geoError: GeolocationPositionError) => {
        console.error("Geolocation error:", geoError.message);
        // Fallback to college location if permission is denied
        if (!location) setLocation([13.0503, 77.7146]);
    };

    // Get initial position
    navigator.geolocation.getCurrentPosition(sendLocationUpdate, handleError);

    if (isTripActive && vanId) {
      locationIntervalRef.current = window.setInterval(() => {
         navigator.geolocation.getCurrentPosition(sendLocationUpdate, handleError, { enableHighAccuracy: true });
      }, 10000); // Update every 10 seconds
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
  }, [isTripActive, vanId, location]);
  
  const handleTripToggle = () => setIsTripActive(prev => !prev);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center h-screen bg-lightbg dark:bg-darkbg">
        <div className="w-16 h-16 border-4 border-t-primary border-slate-200 dark:border-slate-700 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <MainLayout role={UserRole.DRIVER} title="Driver Dashboard">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full animate-fade-in-up">
        <div className="lg:col-span-1 flex flex-col gap-6">
           <Card>
            <div className="flex flex-col items-center justify-between text-center">
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Trip Status: {isTripActive ? 'Active' : 'Inactive'}</h3>
                 {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                  {isTripActive ? 'Your location is being shared with students.' : 'Start the trip to begin sharing your location.'}
                </p>
              </div>
              <button
                onClick={handleTripToggle}
                disabled={!vanId}
                className={`mt-4 w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-semibold rounded-xl shadow-md text-white transition-all duration-300 ease-in-out transform hover:scale-105 ${
                  isTripActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                } disabled:bg-slate-400 disabled:cursor-not-allowed`}
              >
                {isTripActive ? <StopCircle className="w-5 h-5 mr-2"/> : <PlayCircle className="w-5 h-5 mr-2"/>}
                {isTripActive ? 'End Trip' : 'Start Trip'}
              </button>
              <Link to="/driver/message" className="mt-3 inline-block text-sm text-primary hover:text-blue-500 font-medium">
                Send late message
              </Link>
            </div>
          </Card>

          <Card title="Assigned Students">
            <div className="space-y-3 max-h-[calc(100vh-24rem)] overflow-y-auto">
                {students.length > 0 ? students.map((student) => (
                    <div key={student.id} className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                        <div>
                            <p className="font-medium text-sm text-slate-800 dark:text-slate-200">{student.user?.name || 'Unnamed Student'}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{student.usn || 'No USN'}</p>
                        </div>
                        <a href={`tel:${student.phone}`} className="p-2 rounded-full text-green-600 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900/50 transition-colors">
                            <Phone className="w-4 h-4"/>
                        </a>
                    </div>
                )) : (
                    <p className="text-center text-sm text-slate-500 dark:text-slate-400">No students assigned to your van.</p>
                )}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2 h-[70vh] lg:h-full">
          <Card className="h-full w-full flex flex-col" title={route?.route_name || "Your Location"} bodyClassName="flex-grow p-2">
              <MapView driverPosition={location} route={route} />
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default DriverDashboard;