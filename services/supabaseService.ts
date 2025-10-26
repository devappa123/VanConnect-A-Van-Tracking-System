
// FIX: Imported `User` type to resolve 'Cannot find name' errors.
import { AuthenticatedUser, UserRole, Van, Complaint, ComplaintStatus, Attendance, LocationUpdate, Student, Driver, User, StudentWithUser, DriverWithUser } from '../types';
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
        .select('*, driver:drivers(user:users(name))');
    if (error) throw new Error(error.message);

    return data.map((v: any) => ({
        ...v,
        driver_name: v.driver?.user?.name || 'N/A'
    }));
};

export const getDriverByVanId = async (vanId: string): Promise<(Driver & { name: string, email: string }) | null> => {
    const { data, error } = await supabase
        .from('vans')
        .select('drivers(*, users(*))')
        .eq('id', vanId)
        .single();
    if (error || !data || !data.drivers) return null;
    const { drivers } = data as any;
    return { ...drivers, ...drivers.users };
};

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
    const { data, error } = await supabase
        .from('complaints')
        .select('*, driver:drivers(user:users(name))')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data.map((c: any) => ({
        ...c,
        driver_name: c.driver?.user?.name || 'Unknown Driver'
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
        .select()
        .single();
    
    if (error) throw new Error(error.message);
    return newComplaint;
};

export const resolveComplaint = async (complaintId: string, reply: string): Promise<Complaint> => {
    const { data, error } = await supabase
        .from('complaints')
        .update({ status: ComplaintStatus.RESOLVED, admin_reply: reply })
        .eq('id', complaintId)
        .select()
        .single();
        
    if (error) throw new Error(error.message);
    return data;
};

// --- ADMIN UPDATE FUNCTIONS ---

export const updateStudentDetails = async (studentId: string, updates: Partial<Student>): Promise<Student> => {
    const { data, error } = await supabase
        .from('students')
        .update(updates)
        .eq('id', studentId)
        .select()
        .single();
    if (error) throw new Error(error.message);
    return data;
};

export const updateDriverDetails = async (driverId: string, updates: Partial<Driver>): Promise<Driver> => {
    const { data, error } = await supabase
        .from('drivers')
        .update(updates)
        .eq('id', driverId)
        .select()
        .single();
    if (error) throw new Error(error.message);
    return data;
};