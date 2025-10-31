import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import MainLayout from '../../components/layout/MainLayout';
import { UserRole } from '../../types';
import Card from '../../components/common/Card';
import { Camera } from 'lucide-react';
import { updateUserDetails, updateStudentDetails, updateDriverDetails } from '../../services/supabaseService';

const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  // Student specific fields
  const [usn, setUsn] = useState(user?.student?.usn || '');
  const [department, setDepartment] = useState(user?.student?.department || '');
  const [studentPhone, setStudentPhone] = useState(user?.student?.phone || '');
  // Driver specific fields
  const [driverPhone, setDriverPhone] = useState(user?.driver?.phone || '');

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  if (!user) {
    return null; // Or a loading spinner
  }

  const getProfileImageUrl = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'https://gvhczqbwnvzbmmwnkuuc.supabase.co/storage/v1/object/public/images/images/admin.jpg';
      case UserRole.DRIVER:
        return 'https://gvhczqbwnvzbmmwnkuuc.supabase.co/storage/v1/object/public/images/images/driver.png';
      case UserRole.STUDENT:
      default:
        return 'https://gvhczqbwnvzbmmwnkuuc.supabase.co/storage/v1/object/public/images/images/user.png';
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
        // 1. Update the common `users` table
        if (name !== user.name) {
            await updateUserDetails(user.id, { name });
        }

        // 2. Update the role-specific table
        if (user.role === UserRole.STUDENT && user.student) {
            await updateStudentDetails(user.student.id, {
                usn,
                department,
                phone: studentPhone
            });
        } else if (user.role === UserRole.DRIVER && user.driver) {
            await updateDriverDetails(user.driver.id, {
                phone: driverPhone
            });
        }
        
        // 3. Refresh the user context to reflect changes everywhere
        await refreshUser();
        
        setIsEditing(false);
    } catch (error) {
        console.error("Failed to save profile:", error);
        alert("An error occurred while saving. Please try again.");
    } finally {
        setIsSaving(false);
    }
  };

  const labelStyle = "text-sm font-medium text-slate-500 dark:text-slate-400";
  const valueStyle = "mt-1 text-lg text-slate-800 dark:text-slate-100";
  const inputStyle = `mt-1 block w-full px-3 py-2 bg-lightcard dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-lg`;


  const renderRoleSpecificFields = () => {
    switch(user.role) {
      case UserRole.STUDENT:
        return (
          <>
            <div>
              <label className={labelStyle}>USN</label>
              {isEditing ? <input type="text" value={usn} onChange={(e) => setUsn(e.target.value)} className={inputStyle} /> : <p className={valueStyle}>{usn || 'Not set'}</p>}
            </div>
            <div>
              <label className={labelStyle}>Department</label>
              {isEditing ? <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} className={inputStyle} /> : <p className={valueStyle}>{department || 'Not set'}</p>}
            </div>
             <div>
              <label className={labelStyle}>Phone Number</label>
              {isEditing ? <input type="text" value={studentPhone} onChange={(e) => setStudentPhone(e.target.value)} className={inputStyle} /> : <p className={valueStyle}>{studentPhone || 'Not set'}</p>}
            </div>
          </>
        );
      case UserRole.DRIVER:
        return (
          <div>
            <label className={labelStyle}>Phone Number</label>
             {isEditing ? <input type="text" value={driverPhone} onChange={(e) => setDriverPhone(e.target.value)} className={inputStyle} /> : <p className={valueStyle}>{driverPhone || 'Not set'}</p>}
          </div>
        );
      default:
        return null;
    }
  }

  return (
    <MainLayout role={user.role} title="My Profile">
      <div className="max-w-4xl mx-auto animate-fade-in-up">
        <Card>
          <div className="flex flex-col md:flex-row items-center md:items-start">
            <div className="relative mb-4 md:mb-0 md:mr-8">
              <img 
                className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-darkcard shadow-lg" 
                src={user.avatar_url || getProfileImageUrl(user.role)} 
                alt="Profile" 
              />
              <label htmlFor="avatar-upload" className="absolute bottom-1 right-1 bg-gradient-to-r from-primary to-secondary p-2 rounded-full text-white cursor-pointer hover:opacity-90 transition-all transform hover:scale-110">
                <Camera className="w-4 h-4" />
                <input id="avatar-upload" type="file" className="hidden" />
              </label>
            </div>
            <div className="flex-1 w-full">
              <div className="flex justify-between items-center mb-4">
                 <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{user.name}</h2>
                 <button 
                    onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                    disabled={isSaving}
                    className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-primary to-secondary rounded-lg shadow-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary transition-all transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Saving...' : (isEditing ? 'Save Changes' : 'Edit Profile')}
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={labelStyle}>Full Name</label>
                  {isEditing ? <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputStyle} /> : <p className={valueStyle}>{name}</p>}
                </div>
                <div>
                  <label className={labelStyle}>Email Address</label>
                  <p className={`${valueStyle} text-slate-500`}>{user.email}</p>
                </div>
                <div>
                  <label className={labelStyle}>Role</label>
                  <p className={`${valueStyle} capitalize`}>{user.role}</p>
                </div>
                {renderRoleSpecificFields()}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
};

export default ProfilePage;