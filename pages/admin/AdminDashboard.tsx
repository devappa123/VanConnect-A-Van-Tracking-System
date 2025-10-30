import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import { UserRole, Van, Complaint, StudentWithUser, DriverWithUser } from '../../types';
import Card from '../../components/common/Card';
import { Car, User as UserIcon, Users, MessageSquareWarning, X, Edit, Trash2, PlusCircle, AlertTriangle, BarChart2 } from 'lucide-react';
import * as SupabaseService from '../../services/supabaseService';

const AdminDashboard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
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

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab') || 'overview';
    setActiveTab(tab);
  }, [location.search]);

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
  
  const renderContent = () => {
    if (loading) {
      return <div className="flex justify-center items-center p-8"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
    }

    switch(activeTab) {
      case 'overview':
      default:
        return <OverviewTab stats={{vans: vans.length, drivers: drivers.length, students: students.length, complaints: complaints.filter(c => c.status === 'Pending').length}} />;
      case 'vans':
        return <VansTab vans={vans} onEdit={openVanModal} onDelete={(van) => openDeleteModal({id: van.id, name: van.van_no, type: 'van'})} onAdd={() => openVanModal()} />;
      case 'drivers':
        return <DriversTab drivers={drivers} onEdit={openEditUserModal} onDelete={(driver) => openDeleteModal({id: driver.id, name: driver.user?.name || 'Driver', type: 'driver'})} vans={vans}/>;
      case 'students':
        return <StudentsTab students={students} onEdit={openEditUserModal} onDelete={(student) => openDeleteModal({id: student.id, name: student.user?.name || 'Student', type: 'student'})} vans={vans}/>;
      case 'complaints':
        return <ComplaintsTab complaints={complaints} />;
      case 'reports':
        return <ReportsTab />;
    }
  };

  return (
    <MainLayout role={UserRole.ADMIN} title="Admin Panel">
        <div className="animate-fade-in-up">
          {renderContent()}
        </div>
        
        {isEditUserModalOpen && editingUser && <EditUserModal user={editingUser} vans={vans} onClose={closeModal} onSave={handleSaveUserAssignment} />}
        {isVanModalOpen && <VanFormModal van={editingVan} onClose={closeModal} onSave={handleSaveVan} />}
        {isDeleteModalOpen && itemToDelete && <ConfirmDeleteModal item={itemToDelete} onClose={closeModal} onConfirm={handleDelete} />}
    </MainLayout>
  );
};

// --- Table Cell Styles ---
const thCell = "px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider";
const tdCell = "px-6 py-4 whitespace-nowrap text-sm text-slate-800 dark:text-slate-200";

// --- TAB COMPONENTS ---
const OverviewTab: React.FC<{stats: {vans: number, drivers: number, students: number, complaints: number}}> = ({ stats }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Vans" value={stats.vans.toString()} icon={Car} />
        <StatCard title="Total Drivers" value={stats.drivers.toString()} icon={UserIcon} />
        <StatCard title="Total Students" value={stats.students.toString()} icon={Users} />
        <StatCard title="Pending Complaints" value={stats.complaints.toString()} icon={MessageSquareWarning} />
    </div>
);
const VansTab: React.FC<{ vans: Van[], onEdit: (van: Van) => void, onDelete: (van: Van) => void, onAdd: () => void }> = ({ vans, onEdit, onDelete, onAdd }) => (
    <Card>
         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 px-4 pt-4 gap-3">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Manage College Vans</h3>
            <button onClick={onAdd} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-all duration-200 transform hover:scale-105">
                <PlusCircle className="w-5 h-5 mr-2" /> Add Van
            </button>
        </div>
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                <thead className="bg-slate-50 dark:bg-slate-900/50">
                    <tr><th className={thCell}>Van No</th><th className={thCell}>Route</th><th className={thCell}>Driver</th><th className={thCell}>Capacity</th><th className={`${thCell} text-right`}>Actions</th></tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                    {vans.map((van) => (<tr key={van.id} className="transition-colors hover:bg-slate-100 dark:hover:bg-slate-700/50">
                        <td className={`${tdCell} font-medium text-slate-900 dark:text-white`}>{van.van_no}</td><td className={tdCell}>{van.route_name}</td><td className={tdCell}>{van.driver_name || <span className="text-slate-500 italic">Unassigned</span>}</td><td className={tdCell}>{van.capacity}</td>
                        <td className={`${tdCell} text-right space-x-2`}>
                          <button onClick={() => onEdit(van)} className="p-2 rounded-full text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-500/10 transition-colors" aria-label="Edit"><Edit size={16}/></button>
                          <button onClick={() => onDelete(van)} className="p-2 rounded-full text-red-500 hover:bg-red-100 dark:hover:bg-red-500/10 transition-colors" aria-label="Delete"><Trash2 size={16}/></button>
                        </td>
                    </tr>))}
                </tbody>
            </table>
        </div>
    </Card>
);
const DriversTab: React.FC<{ drivers: DriverWithUser[], vans: Van[], onEdit: (driver: DriverWithUser) => void, onDelete: (driver: DriverWithUser) => void }> = ({ drivers, vans, onEdit, onDelete }) => (
    <Card title="Manage Drivers">
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                 <thead className="bg-slate-50 dark:bg-slate-900/50"><tr><th className={thCell}>Name</th><th className={thCell}>Email</th><th className={thCell}>Phone</th><th className={thCell}>Assigned Van</th><th className={`${thCell} text-right`}>Actions</th></tr></thead>
                <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                    {drivers.map(driver => {
                        const assignedVan = vans.find(v => v.id === driver.van_id);
                        return (<tr key={driver.id} className="transition-colors hover:bg-slate-100 dark:hover:bg-slate-700/50">
                            <td className={tdCell}>{driver.user?.name || 'N/A'}</td><td className={tdCell}>{driver.user?.email || 'N/A'}</td><td className={tdCell}>{driver.phone || 'N/A'}</td><td className={tdCell}>{assignedVan?.van_no || <span className="text-slate-500 italic">Not Assigned</span>}</td>
                            <td className={`${tdCell} text-right space-x-2`}>
                              <button onClick={() => onEdit(driver)} className="p-2 rounded-full text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-500/10 transition-colors" aria-label="Edit"><Edit size={16}/></button>
                              <button onClick={() => onDelete(driver)} className="p-2 rounded-full text-red-500 hover:bg-red-100 dark:hover:bg-red-500/10 transition-colors" aria-label="Delete"><Trash2 size={16}/></button>
                            </td>
                        </tr>);
                    })}
                </tbody>
            </table>
        </div>
    </Card>
);
const StudentsTab: React.FC<{ students: StudentWithUser[], vans: Van[], onEdit: (student: StudentWithUser) => void, onDelete: (student: StudentWithUser) => void }> = ({ students, vans, onEdit, onDelete }) => (
    <Card title="Manage Students">
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                <thead className="bg-slate-50 dark:bg-slate-900/50"><tr><th className={thCell}>Name</th><th className={thCell}>USN</th><th className={thCell}>Phone</th><th className={thCell}>Assigned Van</th><th className={`${thCell} text-right`}>Actions</th></tr></thead>
                <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                    {students.map(student => {
                        const assignedVan = vans.find(v => v.id === student.van_id);
                        return (<tr key={student.id} className="transition-colors hover:bg-slate-100 dark:hover:bg-slate-700/50">
                            <td className={tdCell}>{student.user?.name || 'N/A'}</td><td className={tdCell}>{student.usn || 'N/A'}</td><td className={tdCell}>{student.phone || 'N/A'}</td><td className={tdCell}>{assignedVan?.van_no || <span className="text-slate-500 italic">Not Assigned</span>}</td>
                            <td className={`${tdCell} text-right space-x-2`}>
                              <button onClick={() => onEdit(student)} className="p-2 rounded-full text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-500/10 transition-colors" aria-label="Edit"><Edit size={16}/></button>
                              <button onClick={() => onDelete(student)} className="p-2 rounded-full text-red-500 hover:bg-red-100 dark:hover:bg-red-500/10 transition-colors" aria-label="Delete"><Trash2 size={16}/></button>
                            </td>
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
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                <thead className="bg-slate-50 dark:bg-slate-900/50"><tr><th className={thCell}>Student</th><th className={thCell}>Driver</th><th className={thCell}>Description</th><th className={thCell}>Status</th><th className={`${thCell} text-right`}>Date</th></tr></thead>
                <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                    {complaints.map(c => (<tr key={c.id} className="transition-colors hover:bg-slate-100 dark:hover:bg-slate-700/50">
                        <td className={tdCell}>{c.student_name}</td><td className={tdCell}>{c.driver_name}</td><td className={`${tdCell} max-w-xs truncate`}>{c.description}</td>
                        <td className={tdCell}><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${c.status === 'Pending' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>{c.status}</span></td>
                        <td className={`${tdCell} text-right text-slate-500`}>{new Date(c.created_at).toLocaleDateString()}</td>
                    </tr>))}
                </tbody>
            </table>
        </div>
    </Card>
);
const ReportsTab: React.FC = () => (
    <Card title="Analytics & Reports">
        <div className="h-64 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
            <BarChart2 className="w-16 h-16 mb-4 text-slate-400"/>
            <h3 className="text-lg font-semibold">Analytics Coming Soon</h3>
            <p className="text-sm">We're working on bringing you insightful charts and reports.</p>
        </div>
    </Card>
);

// --- MODAL COMPONENTS ---
const labelStyle = "block text-sm font-medium text-slate-700 dark:text-slate-300";
const inputStyle = "mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-slate-700";
const btnPrimary = "inline-flex justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200";
const btnSecondary = "inline-flex justify-center px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors";
const btnDanger = "inline-flex justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-all duration-200";

interface EditUserModalProps { user: StudentWithUser | DriverWithUser; vans: Van[]; onClose: () => void; onSave: (vanId: string) => void; }
const EditUserModal: React.FC<EditUserModalProps> = ({ user, vans, onClose, onSave }) => {
    const [selectedVanId, setSelectedVanId] = useState(user.van_id || '');
    const selectedVan = vans.find(v => v.id === selectedVanId);

    return (
        <Modal title={`Assign Van for ${user.user?.name || 'User'}`} onClose={onClose}>
            <div className="space-y-4 mt-4">
                <p className="text-sm"><span className="font-semibold text-slate-600 dark:text-slate-400">Email:</span> {user.user?.email || 'N/A'}</p>
                <div>
                    <label htmlFor="van-select" className={labelStyle}>Select a Van</label>
                    <select id="van-select" value={selectedVanId} onChange={e => setSelectedVanId(e.target.value)} className={inputStyle}>
                        <option value="">Not Assigned</option>
                        {vans.map(van => <option key={van.id} value={van.id}>{van.van_no} - {van.route_name}</option>)}
                    </select>
                </div>
                {selectedVan && (
                  <div className="grid grid-cols-2 gap-4 mt-2 p-3 bg-slate-100 dark:bg-slate-700/80 rounded-md border border-slate-200 dark:border-slate-600">
                    <div><p className={`${labelStyle} text-xs`}>Route</p><p className="font-semibold">{selectedVan.route_name}</p></div>
                    <div><p className={`${labelStyle} text-xs`}>Capacity</p><p className="font-semibold">{selectedVan.capacity}</p></div>
                  </div>
                )}
            </div>
            <div className="mt-6 flex justify-end space-x-3">
                <button onClick={onClose} type="button" className={btnSecondary}>Cancel</button>
                <button onClick={() => onSave(selectedVanId)} type="button" className={btnPrimary}>Save Changes</button>
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
            <form onSubmit={e => {e.preventDefault(); handleSubmit()}} className="space-y-4 mt-4">
                <div><label htmlFor="van_no" className={labelStyle}>Van Number</label><input id="van_no" type="text" value={vanNo} onChange={e => setVanNo(e.target.value)} className={inputStyle} required /></div>
                <div><label htmlFor="route_name" className={labelStyle}>Route Name</label><input id="route_name" type="text" value={routeName} onChange={e => setRouteName(e.target.value)} className={inputStyle} required /></div>
                <div><label htmlFor="capacity" className={labelStyle}>Capacity</label><input id="capacity" type="number" value={capacity} onChange={e => setCapacity(Number(e.target.value))} className={inputStyle} required min="0"/></div>
                <div className="mt-6 flex justify-end space-x-3"><button onClick={onClose} type="button" className={btnSecondary}>Cancel</button><button type="submit" className={btnPrimary}>Save Van</button></div>
            </form>
        </Modal>
    );
};
interface ConfirmDeleteModalProps { item: { name: string, type: string }; onClose: () => void; onConfirm: () => void; }
const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({ item, onClose, onConfirm }) => (
    <Modal title={`Delete ${item.type}`} onClose={onClose}>
        <div className="mt-4 flex items-start">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10"><AlertTriangle className="h-6 w-6 text-red-600" /></div>
            <div className="ml-4 text-left">
                <h3 className="text-lg leading-6 font-medium text-slate-900 dark:text-white">Confirm Deletion</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Are you sure you want to delete {item.name}? This will permanently remove the record and cannot be undone.</p>
            </div>
        </div>
        <div className="mt-6 flex justify-end space-x-3"><button onClick={onClose} type="button" className={btnSecondary}>Cancel</button><button onClick={onConfirm} type="button" className={btnDanger}>Delete</button></div>
    </Modal>
);

// --- HELPER & STYLING COMPONENTS ---
const StatCard: React.FC<{title: string, value: string, icon: React.ElementType}> = ({ title, value, icon: Icon }) => (
    <Card className="transform transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/10 rounded-2xl">
        <div className="flex items-center">
            <div className="p-4 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
                <Icon className="h-7 w-7" />
            </div>
            <div className="ml-4">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 truncate">{title}</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
            </div>
        </div>
    </Card>
);
const Modal: React.FC<{title: string, onClose: () => void, children: React.ReactNode}> = ({ title, onClose, children }) => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md animate-fade-in-up">
           <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
             <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
             <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"><X size={20} /></button>
           </div>
           <div className="p-4 md:p-6">{children}</div>
        </div>
    </div>
);

export default AdminDashboard;