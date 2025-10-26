import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { UserRole, LocationUpdate, AutocompletePrediction, Attendance, Driver } from '../../types';
import Card from '../../components/common/Card';
import MapView from '../../components/common/MapView';
import { getLiveVanLocation, getDriverByVanId, getStudentAttendance } from '../../services/supabaseService';
import { autocompletePlaces } from '../../services/placesService';
import { Phone, MessageSquare, Search, UserCheck, Calendar } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [vanLocation, setVanLocation] = useState<LocationUpdate | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [driver, setDriver] = useState<(Driver & { name: string; email: string; }) | null>(null);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AutocompletePrediction[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const vanId = user?.student?.van_id;

  // Effect to get user's location
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation([position.coords.latitude, position.coords.longitude]);
      },
      () => setUserLocation([28.6139, 77.2090]) // Fallback
    );
  }, []);

  // Effect for fetching van data, location, and attendance
  useEffect(() => {
    const fetchData = async () => {
      if (!user || !user.student) return;

      setLoading(true);
      setError(null);

      if (!vanId) {
        setError("You are not assigned to a van. Please contact an administrator.");
        setLoading(false);
        return;
      }

      try {
        const [location, driverDetails, attendanceRecords] = await Promise.all([
            getLiveVanLocation(vanId),
            getDriverByVanId(vanId),
            getStudentAttendance(user.student.id)
        ]);
        setVanLocation(location);
        setDriver(driverDetails);
        setAttendance(attendanceRecords);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        setError("Could not fetch required data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Set up polling for live location
    const interval = setInterval(() => {
        if (vanId) {
            getLiveVanLocation(vanId).then(setVanLocation).catch(console.error);
        }
    }, 10000);

    return () => clearInterval(interval);
  }, [user, vanId]);
  
  // Effect for place search
  useEffect(() => {
    if (searchQuery.length < 3) {
      setSearchResults([]);
      return;
    }
    const handler = setTimeout(async () => {
        setIsSearching(true);
        const results = await autocompletePlaces(searchQuery).catch(() => []);
        setSearchResults(results);
        setIsSearching(false);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const isLoading = loading || !userLocation;

  return (
    <MainLayout role={UserRole.STUDENT} title="Dashboard">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        {/* Map View */}
        <div className="lg:col-span-2 h-[60vh] lg:h-full">
            <Card className="h-full w-full flex flex-col" title="Live Van Tracking">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="w-8 h-8 border-2 border-t-primary-500 border-gray-200 rounded-full animate-spin"></div>
                        <p className="ml-2">Loading map and location...</p>
                    </div>
                ) : (
                  <div className="flex flex-col h-full">
                    <div className="flex-grow">
                        {error && <div className="text-center text-red-500 p-4">{error}</div>}
                        {!error && userLocation && (
                          <MapView 
                              userPosition={userLocation}
                              vanPosition={vanLocation ? [vanLocation.latitude, vanLocation.longitude] : undefined}
                          />
                        )}
                    </div>
                  </div>
                )}
            </Card>
        </div>
        
        <div className="lg:col-span-1 flex flex-col gap-6">
          <Card title="Driver Details">
            {driver ? (
                <>
                <div className="flex items-center space-x-4">
                    <img className="w-16 h-16 rounded-full" src={`https://i.pravatar.cc/150?u=${driver.user_id}`} alt="Driver"/>
                    <div>
                        <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100">{driver.name}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Phone: {driver.phone || 'N/A'}</p>
                    </div>
                </div>
                <div className="mt-6 flex space-x-4">
                    <a href={`tel:${driver.phone}`} className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700">
                        <Phone className="w-5 h-5 mr-2"/> Call Driver
                    </a>
                    <a href={`mailto:${driver.email}`} className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                        <MessageSquare className="w-5 h-5 mr-2"/> Message
                    </a>
                </div>
                </>
            ) : <p className="text-gray-500 dark:text-gray-400">Driver not assigned.</p>}
          </Card>
          <Card title="My Attendance">
             <div className="space-y-3 max-h-48 overflow-y-auto">
                {attendance.length > 0 ? attendance.map(att => (
                  <div key={att.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center">
                      <Calendar className="w-5 h-5 text-primary-500 mr-3" />
                      <p className="font-medium">{new Date(att.date).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${att.status === 'Present' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {att.status}
                    </span>
                  </div>
                )) : (
                  <p className="text-center text-gray-500 dark:text-gray-400">No attendance records found.</p>
                )}
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default StudentDashboard;
