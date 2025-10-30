import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import { Mail, Lock, User as UserIcon, UserCheck, Hash, Phone, Eye, EyeOff } from 'lucide-react';

const SignupPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.STUDENT);
  const [usn, setUsn] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signup({ name, email, password, role, usn: role === UserRole.STUDENT ? usn : undefined, phone });
      navigate(`/${role}/dashboard`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setLoading(false);
    }
  };
  
  const inputClass = "w-full pl-12 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-full bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:shadow-[0_0_6px_#6366F1] transition-all";

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-indigo-600 via-purple-700 to-blue-600">
      <div className="text-center mb-6">
        <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">VanConnect</h1>
        <p className="mt-2 text-sm text-white/70">East Point College of Engineering and Technology (EPCET)</p>
      </div>

      <div className="w-full max-w-md animate-fade-in-up">
        <div className="bg-white/95 dark:bg-slate-800/90 dark:backdrop-blur-sm p-8 rounded-3xl shadow-2xl">
          <h2 className="text-center text-2xl font-semibold text-slate-800 dark:text-white mb-6">
            Join VanConnect – EPCET
          </h2>
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && <p className="text-center text-sm text-red-500 bg-red-100 dark:bg-red-900/50 p-3 rounded-lg">{error}</p>}
            
            <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input type="text" placeholder="Full Name" required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
            </div>

            <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input type="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-3 border border-slate-300 dark:border-slate-600 rounded-full bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:shadow-[0_0_6px_#6366F1] transition-all"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                {showPassword ? <EyeOff className="h-5 w-5 transition-opacity" /> : <Eye className="h-5 w-5 transition-opacity" />}
              </button>
            </div>
            
            <div className="relative">
                <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <select value={role} onChange={(e) => setRole(e.target.value as UserRole)} className={`${inputClass} appearance-none`}>
                    <option value={UserRole.STUDENT}>Sign up as Student</option>
                    <option value={UserRole.DRIVER}>Sign up as Driver</option>
                </select>
            </div>
            
            {role === UserRole.STUDENT && (
               <div className="relative">
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input type="text" placeholder="USN (University Seat No.)" required value={usn} onChange={(e) => setUsn(e.target.value)} className={inputClass} />
                </div>
            )}

            <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input type="tel" placeholder="Phone Number" required value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center mt-2 py-3 px-4 border border-transparent rounded-full shadow-lg text-md font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 transform hover:scale-105 active:scale-95 transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/40"
              >
                {loading ? 'Creating Account...' : 'Sign Up'}
              </button>
            </div>
          </form>
        </div>
      </div>
       <div className="mt-8 text-center">
         <p className="text-sm text-white/80 mb-2">Already a member?</p>
         <Link to="/login" className="inline-block px-8 py-3 border border-white/50 text-white font-semibold rounded-full hover:bg-white/10 transition-colors duration-200">
            Login Now
        </Link>
      </div>
    </div>
  );
};

export default SignupPage;