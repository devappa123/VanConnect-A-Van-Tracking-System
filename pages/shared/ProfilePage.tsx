import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import MainLayout from '../../components/layout/MainLayout';
import { UserRole } from '../../types';
import Card from '../../components/common/Card';
import { Camera } from 'lucide-react';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  // Student specific fields
  const [usn, setUsn] = useState(user?.student?.usn || '');
  const [department, setDepartment] = useState(user?.student?.department || '');
  const [studentPhone, setStudentPhone] = useState(user?.student?.phone || '');
  // Driver specific fields
  const [driverPhone, setDriverPhone] = useState(user?.driver?.phone || '');

  const [isEditing, setIsEditing] = useState(false);
  
  if (!user) {
    return null; // Or a loading spinner
  }

  const handleSave = () => {
    // Here you would call a service to update the user profile in multiple tables
    console.log("Saving profile:", { name, usn, department, studentPhone, driverPhone });
    // Example: await updateUserProfile({ id: user.id, name });
    // if (user.role === UserRole.STUDENT) await updateStudentProfile({ ... });
    // if (user.role === UserRole.DRIVER) await updateDriverProfile({ ... });
    setIsEditing(false);
  };

  const labelStyle = "text-sm font-medium text-slate-500 dark:text-slate-400";
  const valueStyle = "mt-1 text-lg text-slate-800 dark:text-slate-100";
  const inputStyle = `mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-lg`;


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
      <div className="max-w-4xl mx-auto">
        <Card>
          <div className="flex flex-col md:flex-row items-center md:items-start">
            <div className="relative mb-4 md:mb-0 md:mr-8">
              <img 
                className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-slate-800 shadow-lg" 
                src={user.avatar_url || `https://i.pravatar.cc/150?u=${user.id}`} 
                alt="Profile" 
              />
              <label htmlFor="avatar-upload" className="absolute bottom-1 right-1 bg-blue-600 p-2 rounded-full text-white cursor-pointer hover:bg-blue-700 transition-colors">
                <Camera className="w-4 h-4" />
                <input id="avatar-upload" type="file" className="hidden" />
              </label>
            </div>
            <div className="flex-1 w-full">
              <div className="flex justify-between items-center mb-4">
                 <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{user.name}</h2>
                 <button 
                    onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                    className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
                >
                  {isEditing ? 'Save Changes' : 'Edit Profile'}
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={labelStyle}>Full Name</label>
                  {isEditing ? <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputStyle} /> : <p className={valueStyle}>{name}</p>}
                </div>
                <div>
                  <label className={labelStyle}>Email Address</label>
                  <p className={valueStyle}>{user.email}</p>
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