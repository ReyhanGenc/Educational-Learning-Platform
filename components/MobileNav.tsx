
import React from 'react';
import { UserRole } from '../types';

interface MobileNavProps {
  role: UserRole;
  currentPage: string;
  onNavigate: (page: string) => void;
}

const MobileNav: React.FC<MobileNavProps> = ({ role, currentPage, onNavigate }) => {
  const isStudent = role === UserRole.STUDENT;

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: 'home' },
    { id: 'content', label: isStudent ? 'Courses' : 'Admin', icon: 'auto_stories' },
    { id: 'exams', label: 'Exams', icon: 'quiz' },
    { id: 'analysis', label: 'Stats', icon: 'analytics' },
    { id: 'settings', label: 'Profile', icon: 'person' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-200 px-6 py-3 flex justify-between items-center z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onNavigate(item.id)}
          className={`flex flex-col items-center gap-1 ${
            currentPage === item.id ? 'text-brand-500' : 'text-slate-400'
          }`}
        >
          <span className={`material-symbols-outlined ${currentPage === item.id ? 'fill-1' : ''}`}>
            {item.icon}
          </span>
          <span className="text-[10px] font-bold uppercase">{item.label}</span>
        </button>
      ))}
    </nav>
  );
};

export default MobileNav;
