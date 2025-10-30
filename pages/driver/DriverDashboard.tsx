import React, { useEffect, useState, useRef } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { UserRole, StudentWithUser, Driver } from '../../types';
import Card from '../../components/common/Card';
import MapView from '../../components/common/MapView';
import { updateVanLocation, getDriverByUserId, getStudentsByVanId } from '../../services/supabaseService';
import { PlayCircle, StopCircle, Phone } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const DriverDashboard: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [isTripActive, setIsTripActive] = useState(false);
  const [location, setLocation] = useState<[number, number]>([28.6139, 77.2090]); // Default location
  const [students, setStudents] = useState<StudentWithUser[]>([]);
  const locationIntervalRef = useRef<number | null>(null);
  const [vanId, setVanId] = useState<string | null>(null);
  const [vanNumber, setVanNumber] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 1. Auth Guard
  useEffect(() => {
    if (!loading && !user) {
      navigate('/login', { replace: true });
    }
  }, [user, loading, navigate]);

  // 2. Fetch driver profile and initial data
  useEffect(() => {
    if (!user) return;
    
    const fetchDriverProfile = async () => {
      try {
        const driverProfile = await getDriverByUserId(user.id);
        if (driverProfile) {
          setVanId(driverProfile.van_id || null);
          setVanNumber(driverProfile.van_number || null);
          if (!driverProfile.van_id) {
            setError("You are not assigned to a van. Location sharing is disabled.");
          }
        } else {
           setError("Driver profile not found.");
        }
      } catch (err) {
        console.error("Error fetching driver profile:", err);
        setError("Could not fetch your profile.");
      }
    };
    fetchDriverProfile();
  }, [user]);

  // 3. Fetch assigned students when van ID is available
  useEffect(() => {
    if (!vanId) {
        setStudents([]);
        return;
    };

    let isCancelled = false;
    const fetchStudents = async () => {
      try {
        const studentList = await getStudentsByVanId(vanId);
        if (!isCancelled) {
          setStudents(studentList);
        }
      } catch (err) {
        console.error("Error fetching students:", err);
      }
    };
    fetchStudents();
    return () => { isCancelled = true; };
  }, [vanId]);

  // 4. Handle location updates
  useEffect(() => {
    if (isTripActive && vanId) {
      const sendLocationUpdate = () => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setLocation([latitude, longitude]);
            updateVanLocation(vanId, { latitude, longitude }).catch(e => console.error("Failed to send location", e));
          },
          (geoError) => console.error("Geolocation error:", geoError.message),
          { enableHighAccuracy: true }
        );
      };
      
      sendLocationUpdate(); // Initial update
      locationIntervalRef.current = window.setInterval(sendLocationUpdate, 10000); // Update every 10 seconds

    } else {
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
        locationIntervalRef.current = null;
      }
       // Get one-time location for map display even if trip is not active
      navigator.geolocation.getCurrentPosition(
        (position) => setLocation([position.coords.latitude, position.coords.longitude]),
        (geoError) => console.error("Geolocation error:", geoError.message)
      );
    }

    return () => {
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
      }
    };
  }, [isTripActive, vanId]);
  
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
          <Card className="h-full w-full flex flex-col" title="Your Location" bodyClassName="flex-grow p-2">
              <MapView userPosition={location} />
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default DriverDashboard;