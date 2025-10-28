import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { UserRole, Van, Complaint, StudentWithUser, DriverWithUser } from '../../types';
import Card from '../../components/common/Card';
import { Car, User as UserIcon, Users, MessageSquareWarning, BarChart2, X, Edit, Trash2, PlusCircle, AlertTriangle } from 'lucide-react';
import * as SupabaseService from '../../services/supabaseService';

// Add some CSS-in-JS for shared styles to avoid repetition
const AdminDashboardStyles = () => (<style>{`
.th-cell { padding: 0.75rem 1.5rem; text-align: left; font-size: 0.75rem; font-weight: 500; color: rgb(107 114 128 / var(--tw-text-opacity)); text-transform: uppercase; letter-spacing: 0.05em; }
.td-cell { padding: 1rem 1.5rem; white-space: nowrap; }
.action-btn { padding: 0.25rem; border-radius: 9999px; } .action-btn:hover { background-color: rgb(243 244 246 / var(--tw-bg-opacity)); } .dark .action-btn:hover { background-color: rgb(55 65 81 / var(--tw-bg-opacity)); }
.label-style { display: block; font-size: 0.875rem; font-weight: 500; color: rgb(55 65 81 / var(--tw-text-opacity)); } .dark .label-style { color: rgb(209 213 219 / var(--tw-text-opacity)); }
.input-style { margin-top: 0.25rem; display: block; width: 100%; padding: 0.5rem 0.75rem; border-radius: 0.375rem; border: 1px solid rgb(209 213 219); } .dark .input-style { background-color: rgb(55 65 81); border-color: rgb(75 85 99); color: white; }
.btn-primary { padding: 0.5rem 1rem; border: 1px solid transparent; border-radius: 0.375rem; font-size: 0.875rem; font-weight: 500; color: white; background-color: #3b82f6; } .btn-primary:hover { background-color: #2563eb; }
.btn-secondary { padding: 0.5rem 1rem; border: 1px solid rgb(209 213 219); border-radius: 0.375rem; font-size: 0.875rem; font-weight: 500; color: rgb(55 65 81); background-color: white; } .dark .btn-secondary { background-color: rgb(75 85 99); border-color: rgb(107 114 128); color: rgb(229 231 235); } .btn-secondary:hover { background-color: #f9fafb; } .dark .btn-secondary:hover { background-color: rgb(55 65 81); }
.btn-danger { padding: 0.5rem 1rem; border: 1px solid transparent; border-radius: 0.375rem; font-size: 0.875rem; font-weight: 500; color: white; background-color: #dc2626; } .btn-danger:hover { background-color: #b91c1c; }
`}</style>);

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [students, setStudents] = useState<StudentWithUser[]>([]);
  const [drivers, setDrivers] = useState<DriverWithUser[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [vans, setVans] = useState<Van[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<StudentWithUser | DriverWithUser | null>(null);
  
  const [isVanModalOpen, setIsVanModalOpen] = useState(false);
  const [editingVan, setEditingVan] = useState<Van | null>(null);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string; type: 'van' | 'student' | 'driver' } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [studentsData, driversData, complaintsData, vansData] = await Promise.all([
        SupabaseService.getAllStudents(),
        SupabaseService.getAllDrivers(),
        SupabaseService.getAllComplaints(),
        SupabaseService.getVans(),
      ]);
      setStudents(studentsData);
      setDrivers(driversData);
      setComplaints(complaintsData);
      setVans(vansData);
    } catch (error) {
      console.error("Failed to fetch admin data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Modal Handlers ---
  const openEditUserModal = (user: StudentWithUser | DriverWithUser) => {
    setEditingUser(user);
    setIsEditUserModalOpen(true);
  };
  
  const openVanModal = (van: Van | null = null) => {
    setEditingVan(van);
    setIsVanModalOpen(true);
  };

  const openDeleteModal = (item: { id: string; name: string; type: 'van' | 'student' | 'driver' }) => {
    setItemToDelete(item);
    setIsDeleteModalOpen(true);
  };

  const closeModal = () => {
    setIsEditUserModalOpen(false);
    setEditingUser(null);
    setIsVanModalOpen(false);
    setEditingVan(null);
    setIsDeleteModalOpen(false);
    setItemToDelete(null);
  };

  // --- CRUD Handlers ---
  const handleSaveUserAssignment = async (vanId: string) => {
    if (!editingUser) return;

    try {
      const newVanId = vanId === '' ? undefined : vanId;
      if (editingUser.user.role === 'student') {
        if (newVanId) {
          const van = vans.find(v => v.id === newVanId);
          const studentCount = await SupabaseService.getStudentCountForVan(newVanId);
          if (van && studentCount >= van.capacity) {
            alert(`Cannot assign to Van ${van.van_no}. It is already full (Capacity: ${van.capacity}).`);
            return;
          }
        }
        await SupabaseService.updateStudentDetails(editingUser.id, { van_id: newVanId });
      } else { // Driver
         await SupabaseService.assignVanToDriver(editingUser.id, newVanId || null);
      }
      await fetchData(); // Refetch all data to ensure consistency
      closeModal();
    } catch (error) {
      console.error("Failed to update user:", error);
      alert("Failed to save changes. Please try again.");
    }
  };
  
  const handleSaveVan = async (vanData: Pick<Van, 'van_no' | 'route_name' | 'capacity'>) => {
    try {
      if (editingVan) { // Update
        await SupabaseService.updateVan(editingVan.id, vanData);
      } else { // Create
        await SupabaseService.createVan(vanData);
      }
      await fetchData();
      closeModal();
    } catch (error) {
       console.error("Failed to save van:", error);
       alert("Failed to save van. Check if the Van Number is unique.");
    }
  };
  
  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      switch(itemToDelete.type) {
        case 'van': await SupabaseService.deleteVan(itemToDelete.id); break;
        case 'student': await SupabaseService.deleteStudent(itemToDelete.id); break;
        case 'driver': await SupabaseService.deleteDriver(itemToDelete.id); break;
      }
      await fetchData();
      closeModal();
    } catch (error) {
      console.error(`Failed to delete ${itemToDelete.type}:`, error);
      alert(`Failed to delete ${itemToDelete.name}. Please try again.`);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart2 },
    { id: 'vans', label: 'Manage Vans', icon: Car },
    { id: 'drivers', label: 'Manage Drivers', icon: UserIcon },
    { id: 'students', label: 'Manage Students', icon: Users },
    { id: 'complaints', label: 'Complaints', icon: MessageSquareWarning },
  ];

  return (
    <MainLayout role={UserRole.ADMIN} title="Admin Dashboard">
        <AdminDashboardStyles />
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`${activeTab === tab.id ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'} flex items-center whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}>
                <tab.icon className="mr-2 h-5 w-5" />{tab.label}
              </button>
            ))}
          </nav>
        </div>
        
        {loading ? <div className="flex justify-center items-center p-8"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div></div> :
          <div>
            {activeTab === 'overview' && <OverviewTab stats={{vans: vans.length, drivers: drivers.length, students: students.length, complaints: complaints.filter(c => c.status === 'Pending').length}} />}
            {activeTab === 'vans' && <VansTab vans={vans} onEdit={openVanModal} onDelete={(van) => openDeleteModal({id: van.id, name: van.van_no, type: 'van'})} onAdd={() => openVanModal()} />}
            {activeTab === 'drivers' && <DriversTab drivers={drivers} onEdit={openEditUserModal} onDelete={(driver) => openDeleteModal({id: driver.id, name: driver.user?.name || 'Driver', type: 'driver'})} vans={vans}/>}
            {activeTab === 'students' && <StudentsTab students={students} onEdit={openEditUserModal} onDelete={(student) => openDeleteModal({id: student.id, name: student.user?.name || 'Student', type: 'student'})} vans={vans}/>}
            {activeTab === 'complaints' && <ComplaintsTab complaints={complaints} />}
          </div>
        }
        
        {isEditUserModalOpen && editingUser && <EditUserModal user={editingUser} vans={vans} onClose={closeModal} onSave={handleSaveUserAssignment} />}
        {isVanModalOpen && <VanFormModal van={editingVan} onClose={closeModal} onSave={handleSaveVan} />}
        {isDeleteModalOpen && itemToDelete && <ConfirmDeleteModal item={itemToDelete} onClose={closeModal} onConfirm={handleDelete} />}
    </MainLayout>
  );
};

// --- TAB COMPONENTS ---

const OverviewTab: React.FC<{stats: {vans: number, drivers: number, students: number, complaints: number}}> = ({ stats }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Vans" value={stats.vans.toString()} icon={Car} color="blue" />
        <StatCard title="Total Drivers" value={stats.drivers.toString()} icon={UserIcon} color="green" />
        <StatCard title="Total Students" value={stats.students.toString()} icon={Users} color="purple" />
        <StatCard title="Pending Complaints" value={stats.complaints.toString()} icon={MessageSquareWarning} color="red" />
    </div>
);
const VansTab: React.FC<{ vans: Van[], onEdit: (van: Van) => void, onDelete: (van: Van) => void, onAdd: () => void }> = ({ vans, onEdit, onDelete, onAdd }) => (
    <Card title="All Vans">
         <div className="flex justify-end mb-4">
            <button onClick={onAdd} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700">
                <PlusCircle className="w-5 h-5 mr-2" /> Add Van
            </button>
        </div>
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                        <th className="th-cell">Van No</th><th className="th-cell">Route</th><th className="th-cell">Driver</th><th className="th-cell">Capacity</th><th className="th-cell text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {vans.map(van => (<tr key={van.id}>
                        <td className="td-cell font-medium">{van.van_no}</td><td className="td-cell">{van.route_name}</td><td className="td-cell">{van.driver_name}</td><td className="td-cell">{van.capacity}</td>
                        <td className="td-cell text-right space-x-2"><button onClick={() => onEdit(van)} className="action-btn text-blue-500"><Edit size={18}/></button><button onClick={() => onDelete(van)} className="action-btn text-red-500"><Trash2 size={18}/></button></td>
                    </tr>))}
                </tbody>
            </table>
        </div>
    </Card>
);
const DriversTab: React.FC<{ drivers: DriverWithUser[], vans: Van[], onEdit: (driver: DriverWithUser) => void, onDelete: (driver: DriverWithUser) => void }> = ({ drivers, vans, onEdit, onDelete }) => (
    <Card title="All Drivers">
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700"><tr><th className="th-cell">Name</th><th className="th-cell">Email</th><th className="th-cell">Phone</th><th className="th-cell">Assigned Van</th><th className="th-cell text-right">Actions</th></tr></thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {drivers.map(driver => {
                        const assignedVan = vans.find(v => v.id === driver.van_id);
                        return (<tr key={driver.id}>
                            <td className="td-cell">{driver.user?.name || 'N/A'}</td><td className="td-cell">{driver.user?.email || 'N/A'}</td><td className="td-cell">{driver.phone || 'N/A'}</td><td className="td-cell">{assignedVan?.van_no || 'Not Assigned'}</td>
                            <td className="td-cell text-right space-x-2"><button onClick={() => onEdit(driver)} className="action-btn text-blue-500"><Edit size={18}/></button><button onClick={() => onDelete(driver)} className="action-btn text-red-500"><Trash2 size={18}/></button></td>
                        </tr>);
                    })}
                </tbody>
            </table>
        </div>
    </Card>
);
const StudentsTab: React.FC<{ students: StudentWithUser[], vans: Van[], onEdit: (student: StudentWithUser) => void, onDelete: (student: StudentWithUser) => void }> = ({ students, vans, onEdit, onDelete }) => (
    <Card title="All Students">
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700"><tr><th className="th-cell">Name</th><th className="th-cell">USN</th><th className="th-cell">Phone</th><th className="th-cell">Assigned Van</th><th className="th-cell text-right">Actions</th></tr></thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {students.map(student => {
                        const assignedVan = vans.find(v => v.id === student.van_id);
                        return (<tr key={student.id}>
                            <td className="td-cell">{student.user?.name || 'N/A'}</td><td className="td-cell">{student.usn || 'N/A'}</td><td className="td-cell">{student.phone || 'N/A'}</td><td className="td-cell">{assignedVan?.van_no || 'Not Assigned'}</td>
                            <td className="td-cell text-right space-x-2"><button onClick={() => onEdit(student)} className="action-btn text-blue-500"><Edit size={18}/></button><button onClick={() => onDelete(student)} className="action-btn text-red-500"><Trash2 size={18}/></button></td>
                        </tr>);
                    })}
                </tbody>
            </table>
        </div>
    </Card>
);
const ComplaintsTab: React.FC<{ complaints: Complaint[] }> = ({ complaints }) => (
     <Card title="All User Complaints">
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700"><tr><th className="th-cell">Student</th><th className="th-cell">Driver</th><th className="th-cell">Description</th><th className="th-cell">Status</th><th className="th-cell">Date</th></tr></thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {complaints.map(c => (<tr key={c.id}>
                        <td className="td-cell">{c.student_name}</td><td className="td-cell">{c.driver_name}</td><td className="td-cell max-w-xs truncate">{c.description}</td>
                        <td className="td-cell"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${c.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>{c.status}</span></td>
                        <td className="td-cell text-sm text-gray-500">{new Date(c.created_at).toLocaleDateString()}</td>
                    </tr>))}
                </tbody>
            </table>
        </div>
    </Card>
);

// --- MODAL COMPONENTS ---
interface EditUserModalProps { user: StudentWithUser | DriverWithUser; vans: Van[]; onClose: () => void; onSave: (vanId: string) => void; }
const EditUserModal: React.FC<EditUserModalProps> = ({ user, vans, onClose, onSave }) => {
    const [selectedVanId, setSelectedVanId] = useState(user.van_id || '');
    const selectedVan = vans.find(v => v.id === selectedVanId);

    return (
        <Modal title={`Assign Van for ${user.user?.name || 'User'}`} onClose={onClose}>
            <div className="space-y-4 mt-4">
                <p><span className="font-semibold">Email:</span> {user.user?.email || 'N/A'}</p>
                <div>
                    <label htmlFor="van-select" className="label-style">Van</label>
                    <select id="van-select" value={selectedVanId} onChange={e => setSelectedVanId(e.target.value)} className="input-style">
                        <option value="">Not Assigned</option>
                        {vans.map(van => <option key={van.id} value={van.id}>{van.van_no} - {van.route_name}</option>)}
                    </select>
                </div>
                {selectedVan && user.user.role === 'driver' && (
                  <div className="grid grid-cols-2 gap-4 mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-md border dark:border-gray-600">
                    <div><p className="label-style">Route</p><p>{selectedVan.route_name}</p></div>
                    <div><p className="label-style">Capacity</p><p>{selectedVan.capacity}</p></div>
                  </div>
                )}
            </div>
            <div className="mt-6 flex justify-end space-x-3">
                <button onClick={onClose} type="button" className="btn-secondary">Cancel</button>
                <button onClick={() => onSave(selectedVanId)} type="button" className="btn-primary">Save Changes</button>
            </div>
        </Modal>
    );
};
interface VanFormModalProps { van: Van | null; onClose: () => void; onSave: (vanData: Pick<Van, 'van_no' | 'route_name' | 'capacity'>) => void; }
const VanFormModal: React.FC<VanFormModalProps> = ({ van, onClose, onSave }) => {
    const [vanNo, setVanNo] = useState(van?.van_no || '');
    const [routeName, setRouteName] = useState(van?.route_name || '');
    const [capacity, setCapacity] = useState(van?.capacity || 0);
    const handleSubmit = () => onSave({ van_no: vanNo, route_name: routeName, capacity: Number(capacity) });
    return (
        <Modal title={van ? 'Edit Van' : 'Add New Van'} onClose={onClose}>
            <div className="space-y-4 mt-4">
                <div><label htmlFor="van_no" className="label-style">Van Number</label><input id="van_no" type="text" value={vanNo} onChange={e => setVanNo(e.target.value)} className="input-style" /></div>
                <div><label htmlFor="route_name" className="label-style">Route Name</label><input id="route_name" type="text" value={routeName} onChange={e => setRouteName(e.target.value)} className="input-style" /></div>
                <div><label htmlFor="capacity" className="label-style">Capacity</label><input id="capacity" type="number" value={capacity} onChange={e => setCapacity(Number(e.target.value))} className="input-style" /></div>
            </div>
            <div className="mt-6 flex justify-end space-x-3"><button onClick={onClose} type="button" className="btn-secondary">Cancel</button><button onClick={handleSubmit} type="button" className="btn-primary">Save Van</button></div>
        </Modal>
    );
};
interface ConfirmDeleteModalProps { item: { name: string, type: string }; onClose: () => void; onConfirm: () => void; }
const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({ item, onClose, onConfirm }) => (
    <Modal title={`Delete ${item.type}`} onClose={onClose}>
        <div className="mt-4 flex items-start">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10"><AlertTriangle className="h-6 w-6 text-red-600" /></div>
            <div className="ml-4 text-left">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Confirm Deletion</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Are you sure you want to delete {item.name}? This action cannot be undone.</p>
            </div>
        </div>
        <div className="mt-6 flex justify-end space-x-3"><button onClick={onClose} type="button" className="btn-secondary">Cancel</button><button onClick={onConfirm} type="button" className="btn-danger">Delete</button></div>
    </Modal>
);

// --- HELPER & STYLING COMPONENTS ---
const StatCard: React.FC<{title: string, value: string, icon: React.ElementType, color: string}> = ({ title, value, icon: Icon, color }) => (
    <Card><div className="flex items-center"><div className={`p-3 rounded-full bg-${color}-100 dark:bg-${color}-900/50 text-${color}-500`}><Icon className={`h-6 w-6`} /></div><div className="ml-4"><p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{title}</p><p className="text-2xl font-semibold text-gray-900 dark:text-white">{value}</p></div></div></Card>
);
const Modal: React.FC<{title: string, onClose: () => void, children: React.ReactNode}> = ({ title, onClose, children }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
        <Card title={title} className="w-full max-w-md"><button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={24} /></button>{children}</Card>
    </div>
);


export default AdminDashboard;