// FIX: Removed reference to 'google.maps' types which was causing a 'Cannot find type definition file' error.
// The Google Maps script is loaded dynamically in MapContext, and we will reference its objects via the `window` object.
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useMapContext } from '../../contexts/MapContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Route, UserRole } from '../../types';
import { Loader2, LocateFixed } from 'lucide-react';

interface MapViewProps {
  vanPosition?: [number, number];
  route?: Route;
  driverPosition?: [number, number];
  userRole?: UserRole;
}

const collegeLocation = { lat: 13.0503, lng: 77.7146 };

const MapView: React.FC<MapViewProps> = ({ vanPosition, route, driverPosition, userRole }) => {
    const { isScriptLoaded } = useMapContext();
    const { theme } = useTheme();
    const mapRef = useRef<HTMLDivElement>(null);
    // FIX: Replaced google.maps.Map with `any` to resolve missing type errors.
    const mapInstance = useRef<any | null>(null);
    
    // Refs for map objects
    const userMarkerRef = useRef<any | null>(null);
    const driverMarkerRef = useRef<any | null>(null);
    // FIX: Replaced google.maps.DirectionsRenderer with `any` to resolve missing type errors.
    const directionsRendererRef = useRef<any | null>(null);
    // FIX: Replaced google.maps.marker.AdvancedMarkerElement[] with `any[]` to resolve missing type errors.
    const routeMarkersRef = useRef<any[]>([]);
    
    // FIX: Replaced google.maps.LatLngLiteral with a specific object type to resolve missing type errors.
    const [userPosition, setUserPosition] = useState<{ lat: number; lng: number; } | null>(null);

    const initializeMap = useCallback(() => {
        if (!mapRef.current) return;

        // FIX: Replaced google.maps.MapOptions with `any` to resolve missing type errors.
        const mapOptions: any = {
            center: collegeLocation,
            zoom: 12,
            disableDefaultUI: true,
            zoomControl: true,
            // REMOVED: mapId is no longer needed as we are using classic markers.
            styles: theme === 'dark' ? darkThemeStyle : lightThemeStyle,
        };
        // FIX: Used `window.google` to access the Maps API loaded via script tag.
        const map = new (window as any).google.maps.Map(mapRef.current, mapOptions);
        mapInstance.current = map;
        
        // Initialize Directions Renderer
        // FIX: Used `window.google` to access the Maps API loaded via script tag.
        directionsRendererRef.current = new (window as any).google.maps.DirectionsRenderer({
            map: map,
            suppressMarkers: true, // We use custom markers
            polylineOptions: {
                strokeColor: theme === 'dark' ? '#4f46e5' : '#3b82f6',
                strokeWeight: 5,
                strokeOpacity: 0.8,
            },
        });
        
    }, [theme]);
    
    useEffect(() => {
        if (isScriptLoaded && !mapInstance.current) {
            initializeMap();
        }
    }, [isScriptLoaded, initializeMap]);
    
    // Update map style on theme change
    useEffect(() => {
        mapInstance.current?.setOptions({
             styles: theme === 'dark' ? darkThemeStyle : lightThemeStyle,
        });
        directionsRendererRef.current?.setOptions({
             polylineOptions: { strokeColor: theme === 'dark' ? '#4f46e5' : '#3b82f6' }
        });
    }, [theme]);
    
    // Real-time user location tracking (only for students)
    useEffect(() => {
        if (!isScriptLoaded || userRole !== UserRole.STUDENT) return;
        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setUserPosition(newPos);
                if (mapInstance.current && userMarkerRef.current) {
                    userMarkerRef.current.setPosition(newPos);
                } else if (mapInstance.current && !userMarkerRef.current) {
                    // Use classic marker for the student's location
                    userMarkerRef.current = new (window as any).google.maps.Marker({
                        position: newPos,
                        map: mapInstance.current,
                        title: 'You are here',
                        // Using a custom icon to represent the user's location
                        icon: {
                            path: (window as any).google.maps.SymbolPath.CIRCLE,
                            scale: 8,
                            fillColor: '#4285F4',
                            fillOpacity: 1,
                            strokeColor: 'white',
                            strokeWeight: 2,
                        },
                    });
                }
            },
            (err) => console.error("Geolocation watch error:", err),
            { enableHighAccuracy: true }
        );
        return () => navigator.geolocation.clearWatch(watchId);
    }, [isScriptLoaded, userRole]);
    
    // Update van marker (for student view) OR driver marker (for driver view)
    useEffect(() => {
        if (!mapInstance.current) return;
        
        const positionData = vanPosition || driverPosition;
        
        if (positionData) {
            const pos = { lat: positionData[0], lng: positionData[1] };
            if (driverMarkerRef.current) {
                driverMarkerRef.current.setPosition(pos);
            } else {
                // Use classic marker with emoji label for the driver
                driverMarkerRef.current = new (window as any).google.maps.Marker({
                    position: pos,
                    map: mapInstance.current,
                    label: { text: '🚌', fontSize: '24px', className: 'map-emoji-label' },
                    // Use a transparent icon so only the emoji label shows
                    icon: {
                        url: 'data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><circle cx="20" cy="20" r="18" fill="rgba(0,0,0,0.0)" /></svg>',
                        anchor: new (window as any).google.maps.Point(20, 20),
                    },
                    title: 'Driver Location'
                });
            }
        }
    }, [vanPosition, driverPosition, isScriptLoaded]);

    // Draw route and markers
    useEffect(() => {
        if (!mapInstance.current || !directionsRendererRef.current || !route) return;
        
        // Clear previous route markers before drawing new ones
        routeMarkersRef.current.forEach(marker => marker.setMap(null));
        routeMarkersRef.current = [];

        // FIX: Used `window.google` to access the Maps API loaded via script tag.
        const directionsService = new (window as any).google.maps.DirectionsService();

        const start = { lat: route.start_latitude, lng: route.start_longitude };
        const end = { lat: route.end_latitude, lng: route.end_longitude };
        const waypoints = route.stops?.map(s => ({ location: { lat: s.latitude, lng: s.longitude }, stopover: true })) || [];

        // FIX: Replaced google.maps.DirectionsRequest with `any` to resolve missing type errors.
        const request: any = {
            origin: start,
            destination: end,
            waypoints: waypoints,
            // FIX: Used `window.google` to access the Maps API loaded via script tag.
            travelMode: (window as any).google.maps.TravelMode.DRIVING,
            avoidFerries: true,
            avoidHighways: false,
            avoidTolls: false,
            drivingOptions: {
              departureTime: new Date(),
              // FIX: Used `window.google` to access the Maps API loaded via script tag.
              trafficModel: (window as any).google.maps.TrafficModel.PESSIMISTIC,
            },
            region: "IN",
            optimizeWaypoints: true,
            provideRouteAlternatives: true,
        };

        directionsService.route(request, (result: any, status: any) => {
            if (status === 'OK' && result) {
                let shortestRoute = result.routes[0];
                if (result.routes.length > 1) {
                    let shortestDistance = Number.MAX_VALUE;
                    result.routes.forEach((r: any) => {
                        const distance = r.legs.reduce((acc: number, leg: any) => acc + leg.distance.value, 0);
                        if (distance < shortestDistance) {
                            shortestDistance = distance;
                            shortestRoute = r;
                        }
                    });
                }
                const displayResult = { ...result, routes: [shortestRoute] };
                
                directionsRendererRef.current?.setDirections(displayResult);
                
                mapInstance.current?.fitBounds(displayResult.routes[0].bounds);

                // Add classic markers for route points
                const startMarker = new (window as any).google.maps.Marker({ map: mapInstance.current, position: start, label: 'S', title: 'Route Start' });
                const endMarker = new (window as any).google.maps.Marker({ map: mapInstance.current, position: end, label: 'E', title: 'Route End' });
                
                const waypointMarkers = waypoints.map((wp, i) => new (window as any).google.maps.Marker({
                    map: mapInstance.current,
                    position: wp.location as any,
                    title: `Stop ${i + 1}`,
                    icon: {
                        path: (window as any).google.maps.SymbolPath.CIRCLE,
                        scale: 6,
                        fillColor: '#FBBC05',
                        fillOpacity: 1,
                        strokeWeight: 1,
                        strokeColor: 'white',
                    }
                }));
                
                routeMarkersRef.current = [startMarker, endMarker, ...waypointMarkers];

            } else {
                console.error('Directions request failed due to ' + status);
            }
        });
    }, [route, isScriptLoaded]);
    
    const handleCenterOnUser = () => {
        if (mapInstance.current && userPosition) {
            mapInstance.current.panTo(userPosition);
            mapInstance.current.setZoom(16);
        }
    };

    if (!isScriptLoaded) {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                <p className="text-slate-600 dark:text-slate-400">Loading map...</p>
            </div>
        );
    }

    return (
        <div className="h-full w-full relative">
            <div ref={mapRef} className="h-full w-full rounded-2xl overflow-hidden" />
            <style>{`.map-emoji-label { text-shadow: 1px 1px 2px rgba(0,0,0,0.5); }`}</style>
            <button
                onClick={handleCenterOnUser}
                disabled={!userPosition}
                className="absolute bottom-4 right-4 z-10 w-12 h-12 bg-white dark:bg-slate-700 rounded-full shadow-lg flex items-center justify-center text-primary dark:text-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-110 active:scale-100"
                aria-label="Center on my location"
            >
                <LocateFixed className="w-6 h-6" />
            </button>
        </div>
    );
};

export default MapView;

// Dark Theme for Google Maps
const darkThemeStyle = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#263c3f" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6b9a76" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#38414e" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#212a37" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9ca5b3" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#746855" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1f2835" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#f3d19c" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#2f3948" }],
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#17263c" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#515c6d" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#17263c" }],
  },
];

// Light Theme for Google Maps
const lightThemeStyle = [
    // Standard Google Maps styling, no custom styles needed.
];