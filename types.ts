
export enum UserRole {
  STUDENT = 'student',
  DRIVER = 'driver',
  ADMIN = 'admin',
}

export enum ComplaintStatus {
  PENDING = 'Pending',
  RESOLVED = 'Resolved',
}

export enum AttendanceStatus {
    PRESENT = 'Present',
    ABSENT = 'Absent',
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
}

// Driver-specific details from public.drivers
export interface Driver {
  id:string; // driver record pk
  user_id: string; // fk to users
  phone?: string;
  van_id?: string;
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


export interface Van {
  id: string;
  van_no: string;
  route_name: string;
  driver_id: string;
  driver_name?: string; // For display
  capacity: number;
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

export interface Attendance {
    id: string;
    student_id: string;
    student_name: string;
    van_id: string;
    date: string;
    status: AttendanceStatus;
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