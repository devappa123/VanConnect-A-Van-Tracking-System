
import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { UserRole, Van, Complaint, ComplaintStatus, StudentWithUser, DriverWithUser } from '../../types';
import Card from '../../components/common/Card';
import { Car, User as UserIcon, Users, MessageSquareWarning, BarChart2, X, AlertCircle } from 'lucide-react';
import * as SupabaseService from '../../services/supabaseService';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [students, setStudents] = useState<StudentWithUser[]>([]);
  const [drivers, setDrivers] = useState<DriverWithUser[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [vans, setVans] = useState<Van[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<StudentWithUser | DriverWithUser | null>(null);
  const [userType, setUserType] = useState<'student' | 'driver' | null>(null);

  useEffect(() => {
    // Fetch data for all tabs for overview stats and to prevent re-fetching on tab switch
    SupabaseService.getAllStudents().then(setStudents);
    SupabaseService.getAllDrivers().then(setDrivers);
    SupabaseService.getAllComplaints().then(setComplaints);
    SupabaseService.getVans().then(setVans);
  }, []);

  const handleEdit = (user: StudentWithUser | DriverWithUser, type: 'student' | 'driver') => {
    setEditingUser(user);
    setUserType(type);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setUserType(null);
  };
  
  const handleSaveUser = async (vanId: string) => {
    if (!editingUser || !userType) return;

    try {
        const newVanId = vanId === '' ? undefined : vanId;
        if (userType === 'student') {
            await SupabaseService.updateStudentDetails(editingUser.id, { van_id: newVanId });
            setStudents(prev => prev.map(s => s.id === editingUser.id ? { ...s, van_id: newVanId } : s));
        } else {
            await SupabaseService.updateDriverDetails(editingUser.id, { van_id: newVanId });
            setDrivers(prev => prev.map(d => d.id === editingUser.id ? { ...d, van_id: newVanId } : d));
        }
        handleCloseModal();
    } catch (error) {
        console.error("Failed to update user:", error);
        alert("Failed to save changes. Please try again.");
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart2 },
    { id: 'drivers', label: 'Drivers', icon: UserIcon },
    { id: 'vans', label: 'Vans', icon: Car },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'complaints', label: 'Complaints', icon: MessageSquareWarning },
  ];

  const TabContent = () => {
    switch (activeTab) {
      case 'drivers':
        return <DriversTab drivers={drivers} onEdit={(driver) => handleEdit(driver, 'driver')} />;
      case 'vans':
        return <VansTab vans={vans} />;
      case 'students':
        return <StudentsTab students={students} onEdit={(student) => handleEdit(student, 'student')} />;
      case 'complaints':
        return <ComplaintsTab complaints={complaints} />;
      case 'overview':
      default:
        return <OverviewTab stats={{vans: vans.length, drivers: drivers.length, students: students.length, complaints: complaints.filter(c => c.status === 'Pending').length}} />;
    }
  };
  
  return (
    <MainLayout role={UserRole.ADMIN} title="Admin Dashboard">
      <div className="flex flex-col">
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                } flex items-center whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                <tab.icon className="mr-2 h-5 w-5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        <div>
          <TabContent />
        </div>
        {isModalOpen && editingUser && userType && (
            <EditUserModal
                user={editingUser}
                vans={vans}
                onClose={handleCloseModal}
                onSave={handleSaveUser}
            />
        )}
      </div>
    </MainLayout>
  );
};

const OverviewTab: React.FC<{stats: {vans: number, drivers: number, students: number, complaints: number}}> = ({ stats }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Vans" value={stats.vans.toString()} icon={Car} color="blue" />
        <StatCard title="Total Drivers" value={stats.drivers.toString()} icon={UserIcon} color="green" />
        <StatCard title="Total Students" value={stats.students.toString()} icon={Users} color="purple" />
        <StatCard title="Pending Complaints" value={stats.complaints.toString()} icon={MessageSquareWarning} color="red" />
    </div>
);

const StatCard: React.FC<{title: string, value: string, icon: React.ElementType, color: string}> = ({ title, value, icon: Icon, color }) => (
    <Card>
        <div className="flex items-center">
            <div className={`p-3 rounded-full bg-${color}-100 dark:bg-${color}-900/50 text-${color}-500`}>
                <Icon className={`h-6 w-6`} />
            </div>
            <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{title}</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
            </div>
        </div>
    </Card>
);

const DriversTab: React.FC<{ drivers: DriverWithUser[], onEdit: (driver: DriverWithUser) => void }> = ({ drivers, onEdit }) => (
    <Card title="Manage Drivers">
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Phone</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Assigned Van</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {drivers.map(driver => (
                        <tr key={driver.id}>
                            <td className="px-6 py-4 whitespace-nowrap">{driver.user.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{driver.user.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{driver.phone || 'N/A'}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{driver.van_id || 'Not Assigned'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button onClick={() => onEdit(driver)} className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300">Edit</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </Card>
);

const VansTab: React.FC<{ vans: Van[] }> = ({ vans }) => (
    <Card title="Manage Vans">
         <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Van No</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Route</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Driver</th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Capacity</th>
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {vans.map(van => (
                        <tr key={van.id}>
                            <td className="px-6 py-4 whitespace-nowrap">{van.van_no}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{van.route_name}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{van.driver_name}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{van.capacity}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </Card>
);

const StudentsTab: React.FC<{ students: StudentWithUser[], onEdit: (student: StudentWithUser) => void }> = ({ students, onEdit }) => (
    <Card title="Manage Students">
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">USN</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Phone</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Assigned Van</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {students.map(student => (
                        <tr key={student.id}>
                            <td className="px-6 py-4 whitespace-nowrap">{student.user.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{student.usn || 'N/A'}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{student.phone || 'N/A'}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{student.van_id || 'Not Assigned'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button onClick={() => onEdit(student)} className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300">Edit</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </Card>
);

const ComplaintsTab: React.FC<{ complaints: Complaint[] }> = ({ complaints }) => (
     <Card title="Manage Complaints">
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Student</th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Driver</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {complaints.map(c => (
                        <tr key={c.id}>
                            <td className="px-6 py-4 whitespace-nowrap">{c.student_name}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{c.driver_name}</td>
                            <td className="px-6 py-4 whitespace-nowrap max-w-xs truncate">{c.description}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${c.status === ComplaintStatus.PENDING ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                                    {c.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(c.created_at).toLocaleDateString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </Card>
);

interface EditUserModalProps {
    user: StudentWithUser | DriverWithUser;
    vans: Van[];
    onClose: () => void;
    onSave: (vanId: string) => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ user, vans, onClose, onSave }) => {
    const [selectedVanId, setSelectedVanId] = useState(user.van_id || '');

    const handleSave = () => {
        onSave(selectedVanId);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card title={`Edit ${user.user.name}`} className="w-full max-w-md">
                 <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    <X size={24} />
                </button>
                <div className="space-y-4 mt-4">
                    <p><span className="font-semibold">Email:</span> {user.user.email}</p>
                     <p><span className="font-semibold">Role:</span> <span className="capitalize">{user.user.role}</span></p>
                     <div>
                        <label htmlFor="van-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Assign Van
                        </label>
                        <select
                            id="van-select"
                            value={selectedVanId}
                            onChange={e => setSelectedVanId(e.target.value)}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                            <option value="">Not Assigned</option>
                            {vans.map(van => (
                                <option key={van.id} value={van.id}>{van.van_no} - {van.route_name}</option>
                            ))}
                        </select>
                     </div>
                </div>
                 <div className="mt-6 flex justify-end space-x-3">
                    <button onClick={onClose} type="button" className="bg-white dark:bg-gray-700 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none">
                        Cancel
                    </button>
                    <button onClick={handleSave} type="button" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none">
                        Save Changes
                    </button>
                </div>
            </Card>
        </div>
    );
};


export default AdminDashboard;