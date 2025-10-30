import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import { Mail, Lock, Eye, EyeOff, UserCheck } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.STUDENT);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login({ email, password, role });
      navigate(`/${role}/dashboard`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setLoading(false);
    }
  };
  
  const inputClass = "w-full pl-12 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700/50 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary transition-all";

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-primary via-secondary to-blue-600">
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">VanConnect</h1>
        <p className="mt-2 text-sm text-white/70">East Point College of Engineering and Technology (EPCET)</p>
      </div>

      <div className="w-full max-w-md animate-fade-in-up">
        <div className="bg-lightcard/95 dark:bg-darkcard/90 backdrop-blur-sm p-8 rounded-2xl shadow-dark">
           <h2 className="text-center text-2xl font-semibold text-slate-800 dark:text-white mb-6">
            Member Login
          </h2>
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && <p className="text-center text-sm text-red-500 bg-red-100 dark:bg-red-900/50 p-3 rounded-lg">{error}</p>}
            
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="email"
                placeholder="Email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700/50 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                {showPassword ? <EyeOff className="h-5 w-5 transition-opacity" /> : <Eye className="h-5 w-5 transition-opacity" />}
              </button>
            </div>
            
             <div className="relative">
              <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className={`${inputClass} appearance-none`}
              >
                <option value={UserRole.STUDENT}>Sign in as Student</option>
                <option value={UserRole.DRIVER}>Sign in as Driver</option>
                <option value={UserRole.ADMIN}>Sign in as Admin</option>
              </select>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
                <input type="checkbox" className="rounded border-slate-400 text-primary focus:ring-primary" />
                <span>Remember me</span>
              </label>
              <a href="#" className="font-medium text-primary hover:text-blue-500">
                Forgot password?
              </a>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-md font-semibold text-white bg-gradient-to-r from-primary to-secondary hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary disabled:opacity-70 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 ease-in-out hover:shadow-dark animate-glow-pulse"
              >
                {loading ? 'Signing In...' : 'Login Now'}
              </button>
            </div>
          </form>
        </div>
      </div>
      
       <div className="mt-8 text-center">
         <p className="text-sm text-white/80 mb-2">Not a member?</p>
         <Link to="/signup" className="inline-block px-8 py-3 border border-white/50 text-white font-semibold rounded-lg hover:bg-white/10 transition-colors duration-200">
            Create account
        </Link>
      </div>
    </div>
  );
};

export default LoginPage;