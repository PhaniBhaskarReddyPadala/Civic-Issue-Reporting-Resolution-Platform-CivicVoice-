import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthScreenProps {
  isRegister: boolean;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ isRegister }) => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'CITIZEN' | 'OFFICER'>('CITIZEN');
  const [departmentId, setDepartmentId] = useState<number | ''>('');
  const [departments, setDepartments] = useState<Array<{ id: number; name: string }>>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios.get('/api/departments')
      .then((res) => setDepartments(res.data))
      .catch((err) => console.error(err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const payload = isRegister
        ? { email, password, name, role, departmentId: role === 'OFFICER' ? Number(departmentId) : null }
        : { email, password };

      const res = await axios.post(endpoint, payload);
      login(res.data.token, res.data.user);
      
      if (res.data.user.role === 'OFFICER') {
        navigate('/officer');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto my-12">
      <div className="glass-panel p-8 rounded-2xl shadow-2xl">
        <h2 className="text-3xl font-extrabold text-white text-center mb-2 tracking-tight">
          {isRegister ? 'Create an Account' : 'Welcome Back'}
        </h2>
        <p className="text-slate-400 text-center text-sm mb-8">
          {isRegister ? 'Join CivicVoice to report and follow complaints' : 'Access your CivicVoice portal'}
        </p>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {isRegister && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Full Name
              </label>
              <input
                type="text"
                required
                className="w-full glass-input px-4 py-3 rounded-xl text-sm"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Email Address
            </label>
            <input
              type="email"
              required
              className="w-full glass-input px-4 py-3 rounded-xl text-sm"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Password
            </label>
            <input
              type="password"
              required
              className="w-full glass-input px-4 py-3 rounded-xl text-sm"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {isRegister && (
            <>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Account Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('CITIZEN')}
                    className={`py-3 px-4 rounded-xl border text-sm font-bold transition-all ${
                      role === 'CITIZEN'
                        ? 'bg-brand-600/20 border-brand-500 text-brand-400'
                        : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    Citizen
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('OFFICER')}
                    className={`py-3 px-4 rounded-xl border text-sm font-bold transition-all ${
                      role === 'OFFICER'
                        ? 'bg-brand-600/20 border-brand-500 text-brand-400'
                        : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    Govt Officer
                  </button>
                </div>
              </div>

              {role === 'OFFICER' && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Assigned Department
                  </label>
                  <select
                    required
                    className="w-full bg-slate-900 border border-slate-800 text-slate-200 px-4 py-3 rounded-xl text-sm focus:border-brand-500 focus:outline-none"
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value ? Number(e.target.value) : '')}
                  >
                    <option value="">Select Department...</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg hover:shadow-brand-500/20 text-sm mt-6 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <span>{isRegister ? 'Register Account' : 'Sign In'}</span>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-400">
          {isRegister ? (
            <p>
              Already have an account?{' '}
              <Link to="/login" className="text-brand-400 hover:text-brand-300 font-bold transition-colors">
                Log In
              </Link>
            </p>
          ) : (
            <p>
              Don't have an account?{' '}
              <Link to="/register" className="text-brand-400 hover:text-brand-300 font-bold transition-colors">
                Sign Up
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
export default AuthScreen;
