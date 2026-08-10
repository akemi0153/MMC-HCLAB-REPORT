import React, { useState } from 'react';
import { Building2, ArrowRight } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (email: string, pass: string) => Promise<void>;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const email = username.includes('@') ? username : `${username}@hclab.local`;
    
    if (!username || !password) {
      setError('Username and password are required');
      return;
    }

    setLoading(true);
    try {
      await onLogin(email, password);
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password login is not enabled in Firebase. Please go to the Firebase Console -> Authentication -> Sign-in method, and enable "Email/Password".');
      } else {
        setError(err.message || 'Login failed');
      }
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-50 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        <div className="px-8 pt-10 pb-8 text-center bg-gradient-to-br from-slate-900 to-slate-800">
          <div className="flex items-center justify-center mb-6">
            <span className="text-5xl font-black text-white tracking-tighter">MM</span>
            <div className="relative flex items-center justify-center">
              <span className="text-5xl font-black text-white tracking-tighter">C</span>
              <span className="text-3xl font-black text-teal-500 absolute ml-2 -mt-2">+</span>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">HCLAB Reports Generator</h2>
          <p className="text-slate-400 mt-2 text-sm font-medium">Please sign in to access your dashboard</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 text-sm border border-red-100 rounded-xl">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 rounded-xl bg-slate-50 focus:bg-white transition-all text-slate-900 placeholder:text-slate-400"
                placeholder="Enter your username"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 rounded-xl bg-slate-50 focus:bg-white transition-all text-slate-900 placeholder:text-slate-400"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center space-x-2 mt-4"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        </div>
        
        <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-center space-x-3">
          <div className="flex items-center">
            <span className="text-xl font-black text-slate-800 tracking-tighter">MM</span>
            <div className="relative flex items-center justify-center">
              <span className="text-xl font-black text-slate-800 tracking-tighter">C</span>
              <span className="text-lg font-black text-teal-600 absolute ml-1 -mt-1">+</span>
            </div>
          </div>
          <div className="w-px h-6 bg-slate-300"></div>
          <span className="text-xs text-slate-500 font-semibold tracking-wider uppercase">Makati Medical Center</span>
        </div>
      </div>
    </div>
  );
};
