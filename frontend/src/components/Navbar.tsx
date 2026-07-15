import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Megaphone, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-brand-500/20">
            <Megaphone className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-brand-400 bg-clip-text text-transparent">
              CivicVoice
            </span>
            <div className="text-[10px] text-slate-400 font-medium uppercase tracking-widest leading-none mt-0.5">
              Resolution Engine
            </div>
          </div>
        </Link>

        {user ? (
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 bg-slate-800/40 py-1.5 pl-3 pr-4 rounded-full border border-slate-700/50">
              <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs font-semibold text-brand-300">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-left leading-tight">
                <div className="text-xs font-semibold text-slate-200">{user.name}</div>
                <div className="text-[10px] text-brand-400 font-medium uppercase tracking-wider">
                  {user.role} {user.departmentName ? `(${user.departmentName})` : ''}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-rose-400 transition-colors py-1.5 px-3 rounded-lg hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="text-sm font-semibold text-slate-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="bg-brand-600 hover:bg-brand-700 text-sm font-bold text-white py-2 px-5 rounded-xl transition-all shadow-md hover:shadow-brand-500/20"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};
export default Navbar;
