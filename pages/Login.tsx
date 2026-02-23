
import React, { useState } from 'react';
import { UserRole } from '../types';

interface LoginProps {
  onLogin: (role: UserRole, email?: string, password?: string, rememberMe?: boolean) => void;
  onRegister: () => void;
  onBack: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onRegister, onBack }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.STUDENT);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(selectedRole, email, password, rememberMe);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative">
      <div className="absolute top-6 left-6 z-20">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xl text-sm font-bold text-slate-600 hover:text-brand-500 transition-all hover:bg-white shadow-sm"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Back
        </button>
      </div>

      <div className="w-full max-w-[400px] flex flex-col items-center">
        <div className="mb-10 text-center">
          <div className="bg-brand-500/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-brand-500 text-4xl">menu_book</span>
          </div>
          <h1 className="text-slate-900 text-3xl font-bold tracking-tight">EduExam</h1>
          <p className="text-slate-500 mt-2 text-sm">Empowering the next generation</p>
        </div>

        <div className="w-full bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/50 p-8">
          <div className="flex h-12 items-center justify-center rounded-xl bg-slate-100 p-1 mb-8">
            <button
              type="button"
              onClick={() => setSelectedRole(UserRole.STUDENT)}
              className={`flex-1 h-full rounded-lg text-sm font-semibold transition-all ${selectedRole === UserRole.STUDENT
                ? 'bg-white text-brand-500 shadow-sm'
                : 'text-slate-500'
                }`}
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole(UserRole.INSTRUCTOR)}
              className={`flex-1 h-full rounded-lg text-sm font-semibold transition-all ${selectedRole === UserRole.INSTRUCTOR
                ? 'bg-white text-brand-500 shadow-sm'
                : 'text-slate-500'
                }`}
            >
              Instructor
            </button>
          </div>

          <h2 className="text-slate-900 text-xl font-bold mb-6">Sign In</h2>

          <form onSubmit={handleSubmit}>
            <div className="space-y-5">
              <div className="flex flex-col gap-2">
                <label className="text-slate-600 text-xs font-bold uppercase tracking-widest">Email Address</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xl">mail</span>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-3.5 pl-11 pr-4 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                    type="email"
                    placeholder="name@example.com"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-slate-600 text-xs font-bold uppercase tracking-widest">Password</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xl">lock</span>
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-3.5 pl-11 pr-11 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <span className="material-symbols-outlined text-xl">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-6 mb-8">
              <label className="flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 text-brand-500 focus:ring-brand-500 transition-all"
                />
                <span className="ml-2 text-sm text-slate-600">Remember me</span>
              </label>
              <button type="button" className="text-sm text-brand-500 font-semibold hover:underline">Forgot password?</button>
            </div>

            <button
              type="submit"
              className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-brand-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              Sign In
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </button>
          </form>
        </div>


        <p className="mt-8 text-center text-slate-500 text-sm">
          Don't have an account? <button onClick={onRegister} className="text-brand-500 font-bold hover:underline">Sign up for free</button>
        </p>
      </div>
    </div>
  );
};

export default Login;
