
import type { AutocompletePrediction, AutocompleteResponse, PlaceDetailsResponse, PlaceDetails } from '../types';

const RAPIDAPI_KEY = '011cc0c653msh48fedefcd628682p1dcabcjsnf69ae353ac39';
const API_HOST = 'google-map-places-new-v2.p.rapidapi.com';
const AUTOCOMPLETE_API_URL = 'https://google-map-places-new-v2.p.rapidapi.com/v1/places:autocomplete';
const DETAILS_API_URL_BASE = 'https://google-map-places-new-v2.p.rapidapi.com/v1/places/';

export const autocompletePlaces = async (input: string): Promise<AutocompletePrediction[]> => {
    if (!input) {
        return [];
    }

    // This payload can be customized with the user's current location for more relevant results
    const payload = {
        input: input,
        locationBias: {
            circle: {
                center: {
                    latitude: 28.6139, // Example: Delhi, India
                    longitude: 77.2090
                },
                radius: 50000 // 50km radius
            }
        },
        includeQueryPredictions: true,
    };

    try {
        const response = await fetch(AUTOCOMPLETE_API_URL, {
            method: 'POST',
            headers: {
                'x-rapidapi-key': RAPIDAPI_KEY,
                'x-rapidapi-host': API_HOST,
                'Content-Type': 'application/json',
                'X-Goog-FieldMask': '*',
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error: ${response.status} ${errorText}`);
        }

        const result: AutocompleteResponse = await response.json();
        return result.predictions || [];

    } catch (error) {
        console.error("Failed to fetch place predictions:", error);
        throw error;
    }
};

export const getPlaceDetails = async (placeId: string): Promise<PlaceDetails> => {
    const url = `${DETAILS_API_URL_BASE}${placeId}`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'x-rapidapi-key': RAPIDAPI_KEY,
                'x-rapidapi-host': API_HOST,
                'X-Goog-FieldMask': 'places.location,places.displayName',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error fetching details: ${response.status} ${errorText}`);
        }

        const result: PlaceDetailsResponse = await response.json();
        if (!result.place) {
            throw new Error("Invalid response format from Place Details API.");
        }
        return result.place;

    } catch (error) {
        console.error("Failed to fetch place details:", error);
        throw error;
    }
};

export const getEta = (
  driverCoords: { lat: number; lng: number },
  studentCoords: { lat: number; lng: number }
): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!(window as any).google || !(window as any).google.maps) {
      return reject(new Error("Google Maps script not loaded."));
    }

    const service = new (window as any).google.maps.DistanceMatrixService();
    
    const request = {
      origins: [driverCoords],
      destinations: [studentCoords],
      travelMode: (window as any).google.maps.TravelMode.DRIVING,
      drivingOptions: {
        departureTime: new Date(),
        trafficModel: (window as any).google.maps.TrafficModel.BEST_GUESS,
      },
    };

    service.getDistanceMatrix(request, (response: any, status: any) => {
      if (status === 'OK' && response) {
        const element = response.rows[0]?.elements[0];
        if (element?.status === 'OK') {
          resolve(element.duration.text);
        } else {
          console.warn("Unable to calculate ETA: element status", element?.status);
          resolve("Unavailable");
        }
      } else {
        console.error("Distance Matrix request failed due to " + status);
        reject(new Error("Distance Matrix request failed with status: " + status));
      }
    });
  });
};
