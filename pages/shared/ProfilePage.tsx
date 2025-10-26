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

  const renderRoleSpecificFields = () => {
    switch(user.role) {
      case UserRole.STUDENT:
        return (
          <>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">USN</label>
              <input type="text" value={usn} onChange={(e) => setUsn(e.target.value)} disabled={!isEditing} className="mt-1 block w-full input-style" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Department</label>
              <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} disabled={!isEditing} className="mt-1 block w-full input-style" />
            </div>
             <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone Number</label>
              <input type="text" value={studentPhone} onChange={(e) => setStudentPhone(e.target.value)} disabled={!isEditing} className="mt-1 block w-full input-style" />
            </div>
          </>
        );
      case UserRole.DRIVER:
        return (
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone Number</label>
            <input type="text" value={driverPhone} onChange={(e) => setDriverPhone(e.target.value)} disabled={!isEditing} className="mt-1 block w-full input-style" />
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
                className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-lg" 
                src={user.avatar_url || `https://i.pravatar.cc/150?u=${user.id}`} 
                alt="Profile" 
              />
              <label htmlFor="avatar-upload" className="absolute bottom-1 right-1 bg-primary-600 p-2 rounded-full text-white cursor-pointer hover:bg-primary-700 transition-colors">
                <Camera className="w-4 h-4" />
                <input id="avatar-upload" type="file" className="hidden" />
              </label>
            </div>
            <div className="flex-1 w-full">
              <div className="flex justify-between items-center mb-4">
                 <h2 className="text-2xl font-bold">{user.name}</h2>
                 <button 
                    onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  {isEditing ? 'Save Changes' : 'Edit Profile'}
                </button>
              </div>

              <div className="space-y-4">
                <style>{`.input-style { all: unset; box-sizing: border-box; } .input-style:not(:disabled) { padding: 0.5rem 0.75rem; border: 1px solid; border-radius: 0.375rem; } .input-style:disabled { padding-top: 0.25rem; font-size: 1.125rem; line-height: 1.75rem; }`}</style>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Full Name</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} disabled={!isEditing}
                    className="mt-1 block w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm disabled:bg-gray-100 dark:disabled:bg-gray-800 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Email Address</label>
                  <p className="mt-1 text-lg">{user.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Role</label>
                  <p className="mt-1 text-lg capitalize">{user.role}</p>
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
