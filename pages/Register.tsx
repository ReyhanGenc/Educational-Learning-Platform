import React, { useState } from 'react';
import { UserRole } from '../types';

interface RegisterProps {
    onRegister: (role: UserRole, name: string) => void;
    onLogin: () => void;
    onBack: () => void;
}

const Register: React.FC<RegisterProps> = ({ onRegister, onLogin, onBack }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<UserRole>(UserRole.STUDENT);
    const [loading, setLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // Simulate API call
        setTimeout(() => {
            onRegister(role, name);
        }, 1000);
    };

    return (
        <div className="min-h-screen bg-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -right-[10%] w-[700px] h-[700px] bg-indigo-50/50 rounded-full blur-3xl"></div>
                <div className="absolute top-[20%] -left-[10%] w-[500px] h-[500px] bg-brand-50/50 rounded-full blur-3xl"></div>
            </div>

            <div className="absolute top-6 left-6 z-20">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xl text-sm font-bold text-slate-600 hover:text-brand-500 transition-all hover:bg-white shadow-sm"
                >
                    <span className="material-symbols-outlined text-lg">arrow_back</span>
                    Back
                </button>
            </div>

            <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
                <div className="flex justify-center mb-6">
                    <div className="w-12 h-12 bg-brand-500 rounded-xl flex items-center justify-center text-white shadow-xl shadow-brand-500/20">
                        <span className="material-symbols-outlined text-[28px]">school</span>
                    </div>
                </div>
                <h2 className="text-center text-3xl font-black text-slate-900 tracking-tight">
                    Create your account
                </h2>
                <p className="mt-2 text-center text-sm text-slate-600 font-medium">
                    Join thousands of learners on EduExam
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-[480px] relative z-10">
                <div className="bg-white py-10 px-6 shadow-[0_0_40px_-10px_rgba(0,0,0,0.1)] sm:rounded-[32px] sm:px-10 border border-slate-100">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="name" className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-2">
                                Full Name
                            </label>
                            <div className="mt-1 relative">
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="appearance-none block w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 sm:text-sm font-medium transition-all"
                                    placeholder="John Doe"
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <span className="material-symbols-outlined text-slate-400 text-lg">person</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-2">
                                Email address
                            </label>
                            <div className="mt-1 relative">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="appearance-none block w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 sm:text-sm font-medium transition-all"
                                    placeholder="you@example.com"
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <span className="material-symbols-outlined text-slate-400 text-lg">mail</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-2">
                                Password
                            </label>
                            <div className="mt-1 relative">
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="appearance-none block w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 sm:text-sm font-medium transition-all"
                                    placeholder="••••••••"
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <span className="material-symbols-outlined text-slate-400 text-lg">lock</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-4">
                                I am a...
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setRole(UserRole.STUDENT)}
                                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${role === UserRole.STUDENT
                                        ? 'border-brand-500 bg-brand-50/50 text-brand-700'
                                        : 'border-slate-200 hover:border-slate-300 text-slate-500'
                                        }`}
                                >
                                    <span className={`material-symbols-outlined mb-2 ${role === UserRole.STUDENT ? 'fill-1' : ''}`}>school</span>
                                    <span className="text-xs font-black uppercase tracking-widest">Student</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRole(UserRole.INSTRUCTOR)}
                                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${role === UserRole.INSTRUCTOR
                                        ? 'border-brand-500 bg-brand-50/50 text-brand-700'
                                        : 'border-slate-200 hover:border-slate-300 text-slate-500'
                                        }`}
                                >
                                    <span className={`material-symbols-outlined mb-2 ${role === UserRole.INSTRUCTOR ? 'fill-1' : ''}`}>cast_for_education</span>
                                    <span className="text-xs font-black uppercase tracking-widest">Instructor</span>
                                </button>
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-lg shadow-brand-500/30 text-sm font-black text-white bg-brand-500 hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all uppercase tracking-widest disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Creating Account...' : 'Sign Up'}
                            </button>
                        </div>
                    </form>

                    <div className="mt-8 pt-6 border-t border-slate-100">
                        <div className="flex items-center justify-center gap-2">
                            <span className="text-sm text-slate-500 font-medium">Already have an account?</span>
                            <button type="button" onClick={onLogin} className="text-sm font-bold text-brand-600 hover:text-brand-500">
                                Sign in
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
