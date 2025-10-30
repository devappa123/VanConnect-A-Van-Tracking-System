import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { UserRole, LocationUpdate, Attendance, Driver, Notification } from '../../types';
import Card from '../../components/common/Card';
import MapView from '../../components/common/MapView';
import { getLiveVanLocation, getDriverByVanId, getStudentAttendance, getNotificationsByVanNumber } from '../../services/supabaseService';
import { supabase } from '../../services/supabaseClient';
import { Phone, MessageSquare, UserCheck, Calendar, Bell } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [vanLocation, setVanLocation] = useState<LocationUpdate | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [driver, setDriver] = useState<(Driver & { name: string; email: string; }) | null>(null);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const vanId = user?.student?.van_id;
  const vanNumber = user?.student?.van_number;

  // Effect to get user's location
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation([position.coords.latitude, position.coords.longitude]);
      },
      () => setUserLocation([28.6139, 77.2090]) // Fallback
    );
  }, []);

  // Effect for fetching initial dashboard data
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
        const locationPromise = getLiveVanLocation(vanId);
        const driverPromise = getDriverByVanId(vanId);
        const attendancePromise = getStudentAttendance(user.student.id);
        const notificationsPromise = vanNumber
          ? getNotificationsByVanNumber(vanNumber)
          : Promise.resolve([]);

        const [
          location,
          driverDetails,
          attendanceRecords,
          initialNotifications,
        ] = await Promise.all([
          locationPromise,
          driverPromise,
          attendancePromise,
          notificationsPromise,
        ]);
        
        setVanLocation(location);
        setDriver(driverDetails);
        setAttendance(attendanceRecords);
        setNotifications(initialNotifications);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        setError("Could not fetch required data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, vanId, vanNumber]);

  // Effect for real-time notifications
  useEffect(() => {
    if (!vanNumber) return;

    const channel = supabase.channel(`public:notifications:van_number=eq.${vanNumber}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, payload => {
        setNotifications(prev => [payload.new as Notification, ...prev]);
      })
      .subscribe();
    
    return () => {
        supabase.removeChannel(channel);
    }
  }, [vanNumber]);
  
  // Effect for real-time van location
  useEffect(() => {
    if (!vanId) return;

    const locationChannel = supabase
      .channel(`van-location-updates-${vanId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'locations',
          filter: `van_id=eq.${vanId}`,
        },
        (payload) => {
          if (payload.new) {
            setVanLocation(payload.new as LocationUpdate);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(locationChannel);
    };
  }, [vanId]);
  

  const isLoading = loading || !userLocation;

  return (
    <MainLayout role={UserRole.STUDENT} title="Dashboard">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        {/* Map View */}
        <div className="lg:col-span-2 h-[60vh] lg:h-full">
            <Card className="h-full w-full flex flex-col" title="Live Van Tracking" bodyClassName="flex-grow">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="w-8 h-8 border-2 border-t-blue-500 border-slate-200 rounded-full animate-spin"></div>
                        <p className="ml-2 text-slate-600">Loading map and location...</p>
                    </div>
                ) : (
                  <>
                    {error && <div className="text-center text-red-500 p-4">{error}</div>}
                    {!error && userLocation && (
                      <MapView 
                          userPosition={userLocation}
                          vanPosition={vanLocation ? [vanLocation.latitude, vanLocation.longitude] : undefined}
                      />
                    )}
                  </>
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
                        <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100">{driver.name}</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Phone: {driver.phone || 'N/A'}</p>
                    </div>
                </div>
                <div className="mt-6 flex space-x-4">
                    <a href={`tel:${driver.phone}`} className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 transition-colors">
                        <Phone className="w-5 h-5 mr-2"/> Call Driver
                    </a>
                    <a href={`mailto:${driver.email}`} className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-lg text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors">
                        <MessageSquare className="w-5 h-5 mr-2"/> Message
                    </a>
                </div>
                </>
            ) : <p className="text-slate-500 dark:text-slate-400">Driver not assigned.</p>}
          </Card>
           <Card title="Notifications">
             <div className="space-y-3 max-h-48 overflow-y-auto">
                {notifications.length > 0 ? notifications.map(notif => (
                  <div key={notif.id} className="p-3 bg-blue-50 dark:bg-slate-700 rounded-lg">
                      <div className="flex items-start">
                          <Bell className="w-5 h-5 text-blue-500 mr-3 mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-sm text-slate-800 dark:text-slate-200">{notif.message}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{new Date(notif.created_at).toLocaleString()}</p>
                          </div>
                      </div>
                  </div>
                )) : (
                  <p className="text-center text-slate-500 dark:text-slate-400">No notifications from your driver.</p>
                )}
            </div>
          </Card>
          <Card title="My Attendance">
             <div className="space-y-3 max-h-48 overflow-y-auto">
                {attendance.length > 0 ? attendance.map(att => (
                  <div key={att.id} className="flex items-center justify-between p-2 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                    <div className="flex items-center">
                      <Calendar className="w-5 h-5 text-blue-500 mr-3" />
                      <p className="font-medium text-slate-700 dark:text-slate-200">{new Date(att.date).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${att.status === 'Present' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {att.status}
                    </span>
                  </div>
                )) : (
                  <p className="text-center text-slate-500 dark:text-slate-400">No attendance records found.</p>
                )}
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default StudentDashboard;