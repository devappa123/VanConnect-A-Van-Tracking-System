export enum UserRole {
  STUDENT = 'student',
  DRIVER = 'driver',
  ADMIN = 'admin',
}

export enum ComplaintStatus {
  PENDING = 'Pending',
  RESOLVED = 'Resolved',
}

// Base user from auth.users and public.users
export interface User {
  id: string; // from auth.users
  name: string;
  email: string;
  role: UserRole;
  avatar_url?: string;
}

// Student-specific details from public.students
export interface Student {
  id: string; // student record pk
  user_id: string; // fk to users
  usn?: string;
  department?: string;
  phone?: string;
  van_id?: string;
  van_number?: string;
}

// Driver-specific details from public.drivers
export interface Driver {
  id:string; // driver record pk
  user_id: string; // fk to users
  phone?: string;
  van_id?: string;
  van_number?: string;
}

// The main user object for the app session, combining base User with role-specific details
export type AuthenticatedUser = User & {
  student?: Student;
  driver?: Driver;
};

// Type for admin dashboard lists, keeping user data nested
export interface StudentWithUser extends Student {
  user: User;
}
export interface DriverWithUser extends Driver {
  user: User;
}

export interface Stop {
  name: string;
  latitude: number;
  longitude: number;
}

export interface Route {
  id: number;
  route_name: string;
  start_latitude: number;
  start_longitude: number;
  end_latitude: number;
  end_longitude: number;
  stops?: Stop[];
}

export interface Van {
  id: string;
  van_no: string;
  route_name: string;
  driver_id: string;
  driver_name?: string; // For display
  capacity: number;
  route_id?: number;
  route?: { route_name: string }; // For joined data
}

export interface VanWithRoute extends Van {
  route?: Route;
}

export interface LocationUpdate {
  van_id: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}

export interface Complaint {
  id: string;
  student_id: string;
  driver_id: string;
  description: string;
  status: ComplaintStatus;
  admin_reply?: string;
  created_at: string;
  // For display purposes, populated by service
  student_name?: string;
  driver_name?: string;
}

export interface Notification {
  id: string;
  sender_driver_id: string;
  van_number: string;
  message: string;
  created_at: string;
  driver_name?: string;
}

// Types for Google Places Autocomplete API
export interface AutocompletePrediction {
  place: string;
  placeId: string;
  text: {
    text: string;
    matches: {
      endOffset: number;
    }[];
  };
}

export interface AutocompleteResponse {
    predictions: AutocompletePrediction[];
}

// Types for Google Place Details API
export interface PlaceDetails {
    location: {
        latitude: number;
        longitude: number;
    };
    displayName: {
        text: string;
    }
}

export interface PlaceDetailsResponse {
    place: PlaceDetails;
}