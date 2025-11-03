import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import MainLayout from '../../components/layout/MainLayout';
import { UserRole } from '../../types';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import Card from '../../components/common/Card';
import { Send, Loader2 } from 'lucide-react';

export default function DriverMessagePage(): React.ReactElement | null {
  const { user, loading: authLoading } = useAuth();
  const [message, setMessage] = useState('');
  const [vanNumber, setVanNumber] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingVan, setIsLoadingVan] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkVanAssignment = async () => {
      if (authLoading) return;

      if (!user) {
        setIsLoadingVan(false);
        return;
      }
      
      const driverVanId = user.driver?.van_id;

      if (driverVanId) {
        try {
          // Fetch the van number using the van_id as the source of truth, aligning with dashboard logic.
          const { data, error: vanError } = await supabase
            .from('vans')
            .select('van_no')
            .eq('id', driverVanId)
            .single();
          
          if (vanError) throw vanError;

          if (data && data.van_no) {
            setVanNumber(data.van_no);
            setError(null);
          } else {
            setError('Could not find details for your assigned van. The van record may be incomplete.');
          }
        } catch (e: any) {
          console.error("Failed to fetch van details:", e);
          setError('An error occurred while fetching your van details.');
        } finally {
          setIsLoadingVan(false);
        }
      } else {
        setError('You are not assigned to a van, so you cannot send messages.');
        setIsLoadingVan(false);
      }
    };
    
    checkVanAssignment();
  }, [user, authLoading]);

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

  if (!authLoading && !user) {
     navigate('/login', { replace: true });
     return null;
  }

  return (
    <MainLayout role={UserRole.DRIVER} title="Send Message">
      <div className="max-w-2xl mx-auto animate-fade-in-up">
        {authLoading || isLoadingVan ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
            <p className="text-slate-600 dark:text-slate-400">Checking van assignment...</p>
          </div>
        ) : (
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
                  className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-primary focus:border-primary dark:bg-slate-700 dark:text-white"
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
                  className="inline-flex items-center justify-center px-6 py-2 border border-transparent text-sm font-semibold rounded-lg shadow-sm text-white bg-gradient-to-r from-primary to-secondary hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {isSending ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}