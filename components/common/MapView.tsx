// FIX: Removed reference to 'google.maps' types which was causing a 'Cannot find type definition file' error.
// The Google Maps script is loaded dynamically in MapContext, and we will reference its objects via the `window` object.
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useMapContext } from '../../contexts/MapContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Route } from '../../types';
import { Loader2, LocateFixed } from 'lucide-react';

interface MapViewProps {
  vanPosition?: [number, number];
  route?: Route;
  driverPosition?: [number, number];
}

const collegeLocation = { lat: 13.0503, lng: 77.7146 };

const MapView: React.FC<MapViewProps> = ({ vanPosition, route, driverPosition }) => {
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

    // Helper to create marker image elements
    const createMarkerElement = (src: string, alt: string) => {
        const img = document.createElement('img');
        img.src = src;
        img.alt = alt;
        img.className = "w-10 h-10 object-contain drop-shadow-lg"; // Responsive size with shadow
        return img;
    };

    const initializeMap = useCallback(() => {
        if (!mapRef.current) return;

        // FIX: Replaced google.maps.MapOptions with `any` to resolve missing type errors.
        const mapOptions: any = {
            center: collegeLocation,
            zoom: 12,
            disableDefaultUI: true,
            zoomControl: true,
            mapId: theme === 'dark' ? 'c911850cf3c87342' : 'a7d833f2334f5495',
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
            mapId: theme === 'dark' ? 'c911850cf3c87342' : 'a7d833f2334f5495',
        });
        directionsRendererRef.current?.setOptions({
             polylineOptions: { strokeColor: theme === 'dark' ? '#4f46e5' : '#3b82f6' }
        });
    }, [theme]);
    
    // Real-time user location tracking
    useEffect(() => {
        if (!isScriptLoaded) return;
        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setUserPosition(newPos);
                if (mapInstance.current && userMarkerRef.current) {
                    userMarkerRef.current.position = newPos;
                } else if (mapInstance.current && !userMarkerRef.current) {
                    const userMarkerContent = createMarkerElement('/assets/images/user.png', 'Your Location');
                    // FIX: Used `window.google` to access the Maps API loaded via script tag.
                    userMarkerRef.current = new (window as any).google.maps.marker.AdvancedMarkerElement({
                        position: newPos,
                        map: mapInstance.current,
                        content: userMarkerContent,
                        title: 'You are here',
                    });
                }
            },
            (err) => console.error("Geolocation watch error:", err),
            { enableHighAccuracy: true }
        );
        return () => navigator.geolocation.clearWatch(watchId);
    }, [isScriptLoaded]);
    
    // Update van marker (for student view) OR driver marker (for driver view)
    useEffect(() => {
        if (!mapInstance.current) return;
        
        // Use either vanPosition or driverPosition, as they represent the same entity (the driver).
        const positionData = vanPosition || driverPosition;
        
        if (positionData) {
            const pos = { lat: positionData[0], lng: positionData[1] };
            if (driverMarkerRef.current) {
                driverMarkerRef.current.position = pos;
            } else {
                const driverMarkerContent = createMarkerElement('/assets/images/driver.png', 'Driver Location');
                // FIX: Used `window.google` to access the Maps API loaded via script tag.
                driverMarkerRef.current = new (window as any).google.maps.marker.AdvancedMarkerElement({
                    position: pos,
                    map: mapInstance.current,
                    content: driverMarkerContent,
                    title: 'Driver Location'
                });
            }
        }
    }, [vanPosition, driverPosition, isScriptLoaded]);

    // Draw route and markers
    useEffect(() => {
        if (!mapInstance.current || !directionsRendererRef.current || !route) return;
        
        // Clear previous route markers before drawing new ones
        routeMarkersRef.current.forEach(marker => marker.map = null);
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
                
                // Automatically adjust map view to fit the entire route
                mapInstance.current?.fitBounds(displayResult.routes[0].bounds);

                // Add custom markers for route points and store them for cleanup
                // FIX: Used `window.google` to access the Maps API loaded via script tag.
                const startPin = new (window as any).google.maps.marker.PinElement({ background: '#34A853', borderColor: '#FFFFFF', glyph: 'S', glyphColor: 'white' });
                const endPin = new (window as any).google.maps.marker.PinElement({ background: '#EA4335', borderColor: '#FFFFFF', glyph: 'E', glyphColor: 'white' });

                const startMarker = new (window as any).google.maps.marker.AdvancedMarkerElement({ map: mapInstance.current, position: start, content: startPin.element, title: 'Route Start' });
                const endMarker = new (window as any).google.maps.marker.AdvancedMarkerElement({ map: mapInstance.current, position: end, content: endPin.element, title: 'Route End' });
                
                // FIX: Used `window.google` to access the Maps API loaded via script tag and cast position to `any`.
                const waypointMarkers = waypoints.map((wp, i) => new (window as any).google.maps.marker.AdvancedMarkerElement({
                    map: mapInstance.current,
                    position: wp.location as any,
                    content: new (window as any).google.maps.marker.PinElement({ background: '#FBBC05', borderColor: '#FFFFFF', scale: 0.8 }).element,
                    title: `Stop ${i + 1}`,
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
  // ... (JSON styling for dark mode)
];

// Light Theme for Google Maps
const lightThemeStyle = [
  // ... (JSON styling for light mode)
];