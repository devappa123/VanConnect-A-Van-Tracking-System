import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import MainLayout from '../../components/layout/MainLayout';
import { UserRole } from '../../types';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { getDriverByUserId } from '../../services/supabaseService';
import Card from '../../components/common/Card';
import { Send } from 'lucide-react';

const DriverMessagePage: React.FC = () => {
  const { user, loading } = useAuth();
  const [message, setMessage] = useState('');
  const [vanNumber, setVanNumber] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !user) return;
    
    getDriverByUserId(user.id)
      .then(driverProfile => {
        if (driverProfile && driverProfile.van_number) {
          setVanNumber(driverProfile.van_number);
        } else {
          setError('You are not assigned to a van, so you cannot send messages.');
        }
      })
      .catch(err => {
        console.error('Error fetching driver profile:', err);
        setError('Could not retrieve your details.');
      });
  }, [user, loading]);

  const handleSendMessage = async () => {
    if (!vanNumber || !message.trim() || !user) {
      setError('Message cannot be empty and you must be assigned to a van.');
      return;
    }

    setIsSending(true);
    setError(null);
    try {
      const { error: insertError } = await supabase.from('notifications').insert({
        sender_driver_id: user.id,
        van_number: vanNumber,
        message: message.trim(),
      });

      if (insertError) throw insertError;

      // Success, clear message and navigate back
      setMessage('');
      alert('Message sent successfully!');
      navigate('/driver/dashboard');

    } catch (err: any) {
      console.error('Failed to send message:', err);
      setError(`Failed to send message: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  if (loading) {
     return <div className="h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (!user) {
     navigate('/login', { replace: true });
     return null;
  }

  return (
    <MainLayout role={UserRole.DRIVER} title="Send Message">
      <div className="max-w-2xl mx-auto">
        <Card title="Send a Message to Your Van">
          <div className="space-y-4">
            <p className="text-slate-600 dark:text-slate-400">
              Use this form to send a short message to all students assigned to your van (e.g., "Running 10 minutes late due to traffic").
            </p>
            <div>
              <label htmlFor="message-textarea" className="sr-only">Message</label>
              <textarea
                id="message-textarea"
                rows={5}
                className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message here..."
                disabled={!vanNumber || isSending}
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex justify-end">
              <button
                onClick={handleSendMessage}
                disabled={!vanNumber || isSending || !message.trim()}
                className="inline-flex items-center justify-center px-6 py-2 border border-transparent text-sm font-semibold rounded-xl shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <Send className="w-4 h-4 mr-2" />
                {isSending ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
};

export default DriverMessagePage;