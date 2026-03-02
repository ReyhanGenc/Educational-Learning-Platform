
import React from 'react';
import { UserRole } from '../types';
import { useAuth } from '../src/contexts/AuthContext';

interface SidebarProps {
  role: UserRole;
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ role, currentPage, onNavigate, onLogout }) => {
  const { userMetadata } = useAuth();
  const isInstructor = role === UserRole.INSTRUCTOR;

  const displayName = userMetadata?.full_name || (isInstructor ? 'Instructor' : 'Student');

  const navItems = !isInstructor ? [
    { id: 'dashboard', label: 'Home', icon: 'home' },
    { id: 'content', label: 'Courses', icon: 'auto_stories' },
    { id: 'exams', label: 'Exams', icon: 'quiz' },
    { id: 'lessons-list', label: 'Lessons', icon: 'menu_book' },
    { id: 'analysis', label: 'Analysis', icon: 'analytics' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ] : [
    { id: 'dashboard', label: 'Home', icon: 'home' },
    { id: 'content', label: 'Contents', icon: 'auto_stories' },
    { id: 'bank', label: 'Bank', icon: 'payments' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ];

  return (
    <aside className="hidden md:flex flex-col w-[280px] bg-white border-r border-slate-200 sticky top-0 h-screen shrink-0 z-40 shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-all">
      <div className="p-8">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onNavigate('dashboard')}>
          <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center text-white shadow-xl shadow-brand-500/30 group-hover:scale-105 transition-all">
            <span className="material-symbols-outlined text-[24px]">school</span>
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900 group-hover:text-brand-500 transition-colors">EduExam</span>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1.5 mt-2">
        {navItems.map((item) => {
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3.5 px-5 py-3.5 rounded-2xl transition-all group relative ${isActive
                ? 'bg-brand-50 text-brand-600 font-bold'
                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
            >
              {isActive && (
                <div className="absolute left-0 w-1 h-6 bg-brand-500 rounded-r-full"></div>
              )}
              <span className={`material-symbols-outlined text-[24px] transition-all ${isActive ? 'text-brand-600 fill-1' : 'text-slate-600 group-hover:text-slate-800'
                }`}>{item.icon}</span>
              <span className="text-[15px]">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-6 border-t border-slate-100">
        <div className="bg-slate-100 rounded-2xl p-4 mb-5 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-100 overflow-hidden shrink-0 border-2 border-white shadow-sm ring-2 ring-brand-500/5">
              <img
                alt="Profile"
                className="w-full h-full object-cover"
                src={`https://api.dicebear.com/7.x/initials/svg?seed=${displayName}`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">
                {displayName}
              </p>
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest truncate">
                {!isInstructor ? 'UG Student' : 'Senior Faculty'}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl border border-red-100 bg-red-50/30 text-red-600 font-bold text-sm hover:bg-red-50 hover:border-red-200 transition-all active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          Log Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
