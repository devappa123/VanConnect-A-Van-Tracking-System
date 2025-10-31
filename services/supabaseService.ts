// FIX: Imported `User` type to resolve 'Cannot find name' errors.
import { AuthenticatedUser, UserRole, Van, Complaint, ComplaintStatus, Attendance, LocationUpdate, Student, Driver, User, StudentWithUser, DriverWithUser, Notification, VanWithRoute, Route } from '../types';
import { supabase } from './supabaseClient';

export interface LoginCredentials {
  email: string;
  password: string;
  role: UserRole;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  usn?: string;
  phone?: string;
}

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// --- USER & PROFILE FUNCTIONS ---

// Fetches the composite AuthenticatedUser object
const getAuthenticatedUser = async (userId: string): Promise<AuthenticatedUser | null> => {
    const { data: usersData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .limit(1);

    if (userError) {
        console.error('Error fetching user profile:', userError.message);
        return null;
    }
    
    if (!usersData || usersData.length === 0) {
        console.error('User profile not found for id:', userId);
        return null;
    }

    const userData = usersData[0];
    const authUser: AuthenticatedUser = { ...userData };

    if (authUser.role === UserRole.STUDENT) {
        const { data: studentData, error: studentError } = await supabase
            .from('students')
            .select('*')
            .eq('user_id', userId)
            .limit(1);
        if (studentError) {
            console.error('Error fetching student profile:', studentError.message);
        } else if (studentData && studentData.length > 0) {
            authUser.student = studentData[0];
        }
    } else if (authUser.role === UserRole.DRIVER) {
        const { data: driverData, error: driverError } = await supabase
            .from('drivers')
            .select('*')
            .eq('user_id', userId)
            .limit(1);
        if (driverError) {
            console.error('Error fetching driver profile:', driverError.message);
        } else if (driverData && driverData.length > 0) {
            authUser.driver = driverData[0];
        }
    }

    return authUser;
};

export const getSession = async (): Promise<AuthenticatedUser | null> => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
        console.error("Error getting session:", error);
        return null;
    }
    if (!session) return null;
    
    return await getAuthenticatedUser(session.user.id);
};

export const login = async (credentials: LoginCredentials): Promise<AuthenticatedUser> => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
    });

    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('Login failed, no user returned.');

    const userProfile = await getAuthenticatedUser(data.user.id);
    if (!userProfile) throw new Error('User profile not found.');

    if (userProfile.role !== credentials.role) {
        await supabase.auth.signOut();
        throw new Error('Role mismatch. Please select your correct role.');
    }

    return userProfile;
};

export const signup = async (signupData: SignupData): Promise<AuthenticatedUser> => {
    const { data, error } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: {
            data: {
                name: signupData.name,
                role: signupData.role,
                usn: signupData.usn,
                phone: signupData.phone,
            }
        }
    });
    
    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('Signup failed, no user created.');

    // Poll for the profile to be created by the trigger
    let newUserProfile: AuthenticatedUser | null = null;
    for (let i = 0; i < 10; i++) {
        newUserProfile = await getAuthenticatedUser(data.user.id);
        if (newUserProfile && (newUserProfile.student || newUserProfile.driver || newUserProfile.role === UserRole.ADMIN)) {
            break;
        }
        await delay(300);
    }
    
    if (!newUserProfile) {
        throw new Error("Account created, but profile creation is delayed. Please try logging in.");
    }

    return newUserProfile;
};

export const logout = async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
};

// --- DATA FETCHING FUNCTIONS ---

export const getVanWithRoute = async (vanId: string): Promise<VanWithRoute | null> => {
    const { data, error } = await supabase
        .from('vans')
        .select('*, route:routes(*)')
        .eq('id', vanId)
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error("Error fetching van with route:", error.message);
        return null;
    }
    
    return data as VanWithRoute | null;
};

export const getDriverByUserId = async (userId: string): Promise<Driver | null> => {
  const { data, error } = await supabase
    .from('drivers')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
      console.error("Error getting driver by user id:", error);
      throw error;
  }
  return data;
};

export const getStudentsByVanId = async (vanId: string): Promise<StudentWithUser[]> => {
  const { data, error } = await supabase
    .from('students')
    .select('*, user:users(id, name, email)')
    .eq('van_id', vanId);
  if (error) {
      console.error("Error getting students by van id:", error);
      throw error;
  }
  return (data || []) as StudentWithUser[];
};

export const getStudentsByVanNumber = async (vanNumber: string): Promise<StudentWithUser[]> => {
  const { data, error } = await supabase
    .from('students')
    .select('*, user:users(*)')
    .eq('van_number', vanNumber);
  if (error) {
      console.error("Error getting students by van number:", error);
      throw error;
  }
  return (data || []) as StudentWithUser[];
};


export const getLiveVanLocation = async (vanId: string): Promise<LocationUpdate | null> => {
    const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('van_id', vanId)
        .single();
    if (error && error.code !== 'PGRST116') { // Ignore "0 rows" error
        console.error("Error fetching van location:", error.message);
        return null;
    }
    return data;
};

export const updateVanLocation = async (vanId: string, coords: { latitude: number, longitude: number }): Promise<void> => {
    const { error } = await supabase
        .from('locations')
        .upsert({ 
            van_id: vanId, 
            latitude: coords.latitude, 
            longitude: coords.longitude,
            timestamp: new Date().toISOString() 
        }, { onConflict: 'van_id' });

    if (error) throw new Error(error.message);
};

export const getStudentAttendance = async (studentId: string): Promise<Attendance[]> => {
    const { data, error } = await supabase
        .from('attendance')
        .select('*, student:students(*, user:users(name))')
        .eq('student_id', studentId);
        
    if (error) throw new Error(error.message);

    return data.map((item: any) => ({
        ...item,
        student_name: item.student.user.name,
    }));
};

export const getAllStudents = async (): Promise<StudentWithUser[]> => {
    const { data, error } = await supabase
        .from('students')
        .select('*, user:users(*)');
    if (error) throw new Error(error.message);
    return data as StudentWithUser[];
};

export const getAllDrivers = async (): Promise<DriverWithUser[]> => {
    const { data, error } = await supabase
        .from('drivers')
        .select('*, user:users(*)');
    if (error) throw new Error(error.message);
    return data as DriverWithUser[];
};

export const getVans = async (): Promise<Van[]> => {
    const { data, error } = await supabase
        .from('vans')
        .select('*, driver:drivers!vans_driver_id_fkey(user:users(name)), route:routes(route_name)');
    if (error) throw new Error(error.message);

    return data.map((v: any) => ({
        ...v,
        driver_name: v.driver?.user?.name || null,
        route_name: v.route?.route_name || v.route_name // Prefer joined name
    }));
};

export const getDriverByVanId = async (vanId: string): Promise<(Driver & { name: string, email: string }) | null> => {
    const { data, error } = await supabase
        .from('drivers')
        .select('*, user:users(name, email)')
        .eq('van_id', vanId)
        .maybeSingle();

    if (error) {
        console.error("Error fetching driver by van ID:", error);
        return null;
    }
    if (!data || !data.user) return null;

    const { user, ...driverData } = data;
    return {
        ...driverData,
        name: user.name,
        email: user.email,
    };
};

export const getNotificationsByVanNumber = async (vanNumber: string): Promise<Notification[]> => {
    if (!vanNumber) return [];
    const { data, error } = await supabase
        .from('notifications')
        .select(`*, driver:sender_driver_id(name)`)
        .eq('van_number', vanNumber)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching notifications:', error);
        throw error;
    }

    return (data || []).map((n: any) => ({
        ...n,
        driver_name: n.driver?.name || 'Driver'
    }));
}

export const getAllComplaints = async (): Promise<Complaint[]> => {
    const { data, error } = await supabase
        .from('complaints')
        .select('*, student:students(user:users(name)), driver:drivers(user:users(name))')
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    if (!data) return [];

    return data.map((c: any) => ({
        ...c,
        student_name: c.student?.user?.name || 'Unknown Student',
        driver_name: c.driver?.user?.name || 'Unknown Driver'
    }));
};

export const getComplaintsByStudentId = async (studentId: string): Promise<Complaint[]> => {
    // Fetch student's current van_id and all their complaints in parallel for efficiency
    const [studentRes, complaintsRes] = await Promise.all([
        supabase.from('students').select('van_id').eq('id', studentId).single(),
        supabase.from('complaints').select('*, driver:drivers(user:users(name))').eq('student_id', studentId).order('created_at', { ascending: false })
    ]);

    if (studentRes.error && studentRes.error.code !== 'PGRST116') { // Ignore "0 rows" error which is not a fatal error
        console.error("Error fetching student for complaints:", studentRes.error);
        throw studentRes.error;
    }
    if (complaintsRes.error) {
        console.error("Error fetching complaints:", complaintsRes.error);
        throw complaintsRes.error;
    }

    let currentDriverName: string | undefined = undefined;
    if (studentRes.data?.van_id) {
        // If the student is assigned to a van, find out who the driver is.
        const driver = await getDriverByVanId(studentRes.data.van_id);
        if (driver) {
            currentDriverName = driver.name;
        }
    }
    
    const complaints = complaintsRes.data || [];

    return complaints.map((c: any) => ({
        ...c,
        // Use the driver from the complaint record first (snapshot in time).
        // If that's null, fall back to the student's currently assigned driver.
        driver_name: c.driver?.user?.name || currentDriverName || 'Driver not assigned'
    }));
};

export const submitComplaint = async (data: { description: string, studentId: string, driverId: string }): Promise<Complaint> => {
    const { data: newComplaint, error } = await supabase
        .from('complaints')
        .insert({
            student_id: data.studentId,
            driver_id: data.driverId,
            description: data.description,
            status: ComplaintStatus.PENDING,
        })
        .select();
    
    if (error) throw new Error(error.message);
    if (!newComplaint || newComplaint.length === 0) throw new Error("Failed to create complaint.");
    return newComplaint[0];
};

export const resolveComplaint = async (complaintId: string, reply: string): Promise<Complaint> => {
    const { data, error } = await supabase
        .from('complaints')
        .update({ status: ComplaintStatus.RESOLVED, admin_reply: reply })
        .eq('id', complaintId)
        .select();
        
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) throw new Error("Complaint not found or failed to update.");
    return data[0];
};

// --- ADMIN UPDATE & CRUD FUNCTIONS ---

export const getStudentCountForVan = async (vanId: string): Promise<number> => {
    const { count, error } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('van_id', vanId);
    if (error) {
        console.error('Error getting student count for van:', error);
        throw error;
    }
    return count || 0;
};

export const updateUserDetails = async (userId: string, updates: Partial<Pick<User, 'name'>>): Promise<User> => {
    const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select();
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) throw new Error("User not found or failed to update.");
    return data[0];
};

export const updateStudentDetails = async (studentId: string, updates: Partial<Student>): Promise<Student> => {
    const { data, error } = await supabase
        .from('students')
        .update(updates)
        .eq('id', studentId)
        .select();
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) throw new Error("Student not found or failed to update.");
    return data[0];
};

export const updateDriverDetails = async (driverId: string, updates: Partial<Driver>): Promise<Driver> => {
    const { data, error } = await supabase
        .from('drivers')
        .update(updates)
        .eq('id', driverId)
        .select();
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) throw new Error("Driver not found or failed to update.");
    return data[0];
};

export const assignVanToDriver = async (driverId: string, vanId: string | null): Promise<void> => {
    // This function handles the complex logic of re-assigning vans.
    
    // 1. Find the van being assigned and its current driver (if any)
    let oldDriverId: string | null = null;
    if (vanId) {
        const { data: vanData, error: vanError } = await supabase
            .from('vans')
            .select('driver_id')
            .eq('id', vanId)
            .single();
        if (vanError) throw vanError;
        oldDriverId = vanData.driver_id;
    }
    
    // 2. Un-assign the van from the old driver
    if (oldDriverId) {
        await updateDriverDetails(oldDriverId, { van_id: undefined });
    }

    // 3. Assign the van to the new driver
    await updateDriverDetails(driverId, { van_id: vanId || undefined });
    
    // 4. Update the van's own driver_id record
    if (vanId) {
        await supabase.from('vans').update({ driver_id: driverId }).eq('id', vanId);
    }
};


export const createVan = async (vanData: Pick<Van, 'van_no' | 'route_name' | 'capacity'> & { route_id?: number | null }): Promise<Van> => {
    const { data, error } = await supabase
        .from('vans')
        .insert(vanData)
        .select();
    if (error) throw error;
    if (!data || data.length === 0) throw new Error("Failed to create van.");
    return data[0];
};

export const updateVan = async (vanId: string, vanData: Partial<Pick<Van, 'van_no' | 'route_name' | 'capacity'>> & { route_id?: number | null }): Promise<Van> => {
    const { data, error } = await supabase
        .from('vans')
        .update(vanData)
        .eq('id', vanId)
        .select();
    if (error) throw error;
    if (!data || data.length === 0) throw new Error("Van not found or failed to update.");
    return data[0];
};

export const deleteVan = async (vanId: string): Promise<void> => {
    // When a van is deleted, students/drivers assigned to it should be unassigned (van_id set to null)
    // This is handled by `ON DELETE SET NULL` in the database schema.
    const { error } = await supabase.from('vans').delete().eq('id', vanId);
    if (error) throw error;
};

export const deleteStudent = async (studentId: string): Promise<void> => {
    // Note: The schema has ON DELETE CASCADE from students -> users -> auth.users.
    // Deleting a student profile will delete their user account entirely.
    const { error } = await supabase.from('students').delete().eq('id', studentId);
    if (error) throw error;
};

export const deleteDriver = async (driverId: string): Promise<void> => {
    // Note: The schema has ON DELETE CASCADE from drivers -> users -> auth.users.
    // Deleting a driver profile will delete their user account entirely.
    const { error } = await supabase.from('drivers').delete().eq('id', driverId);
    if (error) throw error;
};


// --- ROUTE MANAGEMENT ---

export const getRoutes = async (): Promise<Route[]> => {
    const { data, error } = await supabase.from('routes').select('*').order('route_name');
    if (error) throw error;
    return data || [];
};

export const createRoute = async (routeData: Omit<Route, 'id'>): Promise<Route> => {
    const { data, error } = await supabase.from('routes').insert(routeData).select().single();
    if (error) throw error;
    if (!data) throw new Error("Failed to create route.");
    return data;
};

export const updateRoute = async (routeId: number, routeData: Partial<Omit<Route, 'id'>>): Promise<Route> => {
    const { data, error } = await supabase.from('routes').update(routeData).eq('id', routeId).select().single();
    if (error) throw error;
    if (!data) throw new Error("Route not found or failed to update.");
    return data;
};

export const deleteRoute = async (routeId: number): Promise<void> => {
    const { error } = await supabase.from('routes').delete().eq('id', routeId);
    if (error) throw error;
};