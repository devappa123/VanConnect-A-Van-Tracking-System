import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { UserRole, LocationUpdate, Driver, Notification, VanWithRoute } from '../../types';
import Card from '../../components/common/Card';
import MapView from '../../components/common/MapView';
import { getLiveVanLocation, getDriverByVanId, getNotificationsByVanNumber, getVanWithRoute } from '../../services/supabaseService';
import { supabase } from '../../services/supabaseClient';
import { Phone, MessageSquare, Bell } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [vanLocation, setVanLocation] = useState<LocationUpdate | null>(null);
  const [driver, setDriver] = useState<(Driver & { name: string; email: string; avatar_url?: string; }) | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [vanDetails, setVanDetails] = useState<VanWithRoute | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const vanId = user?.student?.van_id;
  const vanNumber = user?.student?.van_number;

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
        const vanDetailsPromise = getVanWithRoute(vanId);
        const notificationsPromise = vanNumber
          ? getNotificationsByVanNumber(vanNumber)
          : Promise.resolve([]);

        const [
          vanData,
          location,
          driverDetails,
          initialNotifications,
        ] = await Promise.all([
          vanDetailsPromise,
          locationPromise,
          driverPromise,
          notificationsPromise,
        ]);
        
        setVanDetails(vanData);
        setVanLocation(location);
        setDriver(driverDetails);
        setNotifications(initialNotifications);

        if (vanData && !vanData.route) {
          setError("No route information available for your van.");
        }
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

    const channel = supabase
      .channel('student-notifications-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `van_number=eq.${vanNumber}`,
        },
        async (payload) => {
          const newNotification = payload.new as Notification;
          
          // The payload.new from a subscription doesn't include joined data like the driver's name.
          // We need to fetch the driver's name separately for the new notification.
          const { data: driverData } = await supabase
            .from('users')
            .select('name')
            .eq('id', newNotification.sender_driver_id)
            .single();

          newNotification.driver_name = driverData?.name || 'Driver';

          setNotifications(prev => [newNotification, ...prev]);
        }
      )
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
  

  return (
    <MainLayout role={UserRole.STUDENT} title="Dashboard">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full animate-fade-in-up">
        {/* Map View */}
        <div className="lg:col-span-2 h-[60vh] lg:h-full">
            <Card className="h-full w-full flex flex-col" title={vanDetails?.route?.route_name ? `Live Tracking: ${vanDetails.route.route_name}`: "Live Van Tracking"} bodyClassName="flex-grow p-2">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="w-8 h-8 border-2 border-t-primary border-slate-200 dark:border-slate-700 rounded-full animate-spin"></div>
                        <p className="ml-2 text-slate-600 dark:text-slate-400">Loading data...</p>
                    </div>
                ) : (
                  <>
                    {error && <div className="text-center text-red-500 p-4">{error}</div>}
                    {!error && user && (
                      <MapView 
                          vanPosition={vanLocation ? [vanLocation.latitude, vanLocation.longitude] : undefined}
                          route={vanDetails?.route}
                          userRole={user.role}
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
                    <img className="w-16 h-16 rounded-full object-cover" src={driver.avatar_url || 'https://gvhczqbwnvzbmmwnkuuc.supabase.co/storage/v1/object/public/images/images/driver.png'} alt="Driver"/>
                    <div>
                        <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100">{driver.name}</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Phone: {driver.phone || 'N/A'}</p>
                    </div>
                </div>
                <div className="mt-6 flex space-x-4">
                    <a href={`tel:${driver.phone}`} className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 transition-all duration-200 transform hover:scale-105">
                        <Phone className="w-5 h-5 mr-2"/> Call Driver
                    </a>
                    <a href={`mailto:${driver.email}`} className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-lg text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors">
                        <MessageSquare className="w-5 h-5 mr-2"/> Message
                    </a>
                </div>
                </>
            ) : <p className="text-slate-500 dark:text-slate-400">Driver not assigned.</p>}
          </Card>
           <Card title="Notifications">
             <div className="space-y-3 max-h-48 overflow-y-auto">
                {notifications.length > 0 ? notifications.map(notif => (
                  <div key={notif.id} className="p-3 bg-blue-50 dark:bg-slate-700/50 rounded-lg">
                      <div className="flex items-start">
                          <Bell className="w-5 h-5 text-primary mr-3 mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{notif.driver_name || 'Driver'} says:</p>
                            <p className="text-sm text-slate-800 dark:text-slate-200 mt-1">{notif.message}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{new Date(notif.created_at).toLocaleString()}</p>
                          </div>
                      </div>
                  </div>
                )) : (
                  <p className="text-center text-slate-500 dark:text-slate-400">No notifications from your driver.</p>
                )}
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default StudentDashboard;