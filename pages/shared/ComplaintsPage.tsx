import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import MainLayout from '../../components/layout/MainLayout';
import { UserRole, Complaint, ComplaintStatus, Driver } from '../../types';
import * as SupabaseService from '../../services/supabaseService';
import Card from '../../components/common/Card';
import { X } from 'lucide-react';

const ComplaintsPage: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <MainLayout role={user.role} title="Complaints">
      {user.role === UserRole.STUDENT && <StudentComplaintsView />}
      {user.role === UserRole.ADMIN && <AdminComplaintsView />}
    </MainLayout>
  );
};

const StudentComplaintsView: React.FC = () => {
    const { user } = useAuth();
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    // FIX: Updated driver state type to include 'name' and 'email' properties, aligning with the data returned from getDriverByVanId.
    const [driver, setDriver] = useState<(Driver & { name: string; email: string; }) | null>(null);
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if(user?.student?.id) {
            SupabaseService.getComplaintsByStudentId(user.student.id).then(setComplaints);
        }
        if(user?.student?.van_id) {
            SupabaseService.getDriverByVanId(user.student.van_id).then(setDriver);
        }
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if(!user?.student?.id || !driver?.id) {
            setError('Cannot submit complaint. You are not fully set up in the system.');
            return;
        }
        
        try {
            const newComplaint = await SupabaseService.submitComplaint({
                description,
                studentId: user.student.id,
                driverId: driver.id
            });
            setComplaints(prev => [{...newComplaint, driver_name: driver.name}, ...prev]);
            setDescription('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to submit complaint.');
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card title="Submit a New Complaint">
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Driver</label>
                        <p className="mt-1 text-gray-900 dark:text-gray-100">{driver?.name || 'No driver assigned to your van.'}</p>
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                        <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={4} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
                    </div>
                    <button type="submit" disabled={!driver} className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-300">
                        Submit Complaint
                    </button>
                </form>
            </Card>
            <Card title="Your Complaint History">
                <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                    {complaints.map(c => (
                        <div key={c.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-semibold">Complaint against: {c.driver_name}</h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{c.description}</p>
                                    {c.admin_reply && <p className="text-sm text-green-700 dark:text-green-400 mt-2 p-2 bg-green-50 dark:bg-green-900/50 rounded-md"><b>Admin Reply:</b> {c.admin_reply}</p>}
                                </div>
                                <span className={`flex-shrink-0 ml-4 px-2 py-1 text-xs font-semibold rounded-full ${c.status === ComplaintStatus.PENDING ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' : 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'}`}>
                                    {c.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
};

const AdminComplaintsView: React.FC = () => {
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
    const [reply, setReply] = useState('');
    
    useEffect(() => {
        SupabaseService.getAllComplaints().then(setComplaints);
    }, []);

    const handleResolve = async () => {
        if (!selectedComplaint) return;
        
        const updatedComplaint = await SupabaseService.resolveComplaint(selectedComplaint.id, reply);
        setComplaints(prev => prev.map(c => c.id === selectedComplaint.id ? {...updatedComplaint, student_name: c.student_name, driver_name: c.driver_name} : c));
        setSelectedComplaint(null);
        setReply('');
    };

    return (
         <>
         <Card title="All User Complaints">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Student</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Driver</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Action</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {complaints.map(c => (
                            <tr key={c.id}>
                                <td className="px-6 py-4 whitespace-nowrap">{c.student_name}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{c.driver_name}</td>
                                <td className="px-6 py-4 whitespace-nowrap max-w-sm truncate">{c.description}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${c.status === ComplaintStatus.PENDING ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                                        {c.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    {c.status === ComplaintStatus.PENDING && (
                                        <button onClick={() => setSelectedComplaint(c)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">Resolve</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
        {selectedComplaint && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <Card title={`Reply to ${selectedComplaint.student_name}`} className="w-full max-w-lg">
                     <button onClick={() => setSelectedComplaint(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <X size={24} />
                    </button>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2"><strong>Complaint:</strong> {selectedComplaint.description}</p>
                    <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={4} placeholder="Enter your reply..." required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
                    <button onClick={handleResolve} className="mt-4 w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700">
                        Mark as Resolved & Send Reply
                    </button>
                </Card>
            </div>
        )}
        </>
    );
};

export default ComplaintsPage;
