
import React from 'react';
import { UserRole } from '../types';

interface SettingsProps {
  role: UserRole;
}

const Settings: React.FC<SettingsProps> = ({ role }) => {
  const isStudent = role === UserRole.STUDENT;

  return (
    <div className="p-4 lg:p-10 max-w-4xl mx-auto space-y-10 pb-24 lg:pb-10">
      <header>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight uppercase">Account Settings</h1>
        <p className="text-slate-500 mt-1 font-medium">Manage your personal information and institutional preferences.</p>
      </header>

      <section className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-10 border-b border-slate-100 flex flex-col sm:flex-row items-center gap-8">
          <div className="relative group">
            <div className="w-28 h-28 rounded-[32px] bg-brand-100 overflow-hidden border-4 border-white shadow-xl">
              <img 
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${isStudent ? 'Alex' : 'Instructor'}`} 
                alt="Avatar" 
                className="w-full h-full object-cover" 
              />
            </div>
            <button className="absolute -bottom-2 -right-2 bg-brand-500 text-white p-2.5 rounded-2xl shadow-lg hover:bg-brand-600 transition-all border-2 border-white">
              <span className="material-symbols-outlined text-sm">photo_camera</span>
            </button>
          </div>
          <div className="text-center sm:text-left space-y-2">
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{isStudent ? 'Alex Johnson' : 'Professor Smith'}</h3>
            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest opacity-80">{isStudent ? 'Computer Science Undergraduate' : 'Department of Data Science'}</p>
            <div className="mt-4 flex gap-3 justify-center sm:justify-start">
              <span className="px-4 py-1 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase rounded-full tracking-widest border border-emerald-100 shadow-sm">Verified Profile</span>
              <span className="px-4 py-1 bg-slate-50 text-slate-500 text-[9px] font-black uppercase rounded-full tracking-widest border border-slate-200 shadow-sm">Tier: Institutional</span>
            </div>
          </div>
        </div>

        <div className="p-10 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Institutional Name</label>
              <input 
                type="text" 
                defaultValue={isStudent ? 'Alex Johnson' : 'Edward Smith'}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all font-bold text-sm uppercase tracking-wider"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Institutional Email</label>
              <input 
                type="email" 
                defaultValue={isStudent ? 'alex.j@university.edu' : 'smith@faculty.edu'}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all font-bold text-sm lowercase tracking-wider"
              />
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">Security Preferences</h4>
            <div className="space-y-4">
              {[
                { id: '2fa', label: 'Two-Factor Authentication', desc: 'Secure your terminal with biometric handshakes.', default: true },
                { id: 'data-privacy', label: 'Enhanced Data Privacy', desc: 'Control institutional access to your performance metrics.', default: false }
              ].map((notif) => (
                <label key={notif.id} className="flex items-center justify-between p-6 bg-slate-50 rounded-[24px] border border-slate-100 cursor-pointer hover:border-brand-200 transition-all group">
                  <div className="flex-1">
                    <p className="text-xs font-black text-slate-900 uppercase tracking-widest">{notif.label}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest opacity-80 mt-1">{notif.desc}</p>
                  </div>
                  <div className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked={notif.default} className="sr-only peer" />
                    <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500"></div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row gap-6">
            <button className="flex-1 bg-brand-500 hover:bg-brand-600 text-white font-black py-5 rounded-2xl shadow-2xl shadow-brand-500/20 transition-all active:scale-95 text-[10px] uppercase tracking-widest">
              Save Institutional Configuration
            </button>
            <button className="flex-1 bg-white border border-slate-200 text-slate-700 font-black py-5 rounded-2xl hover:bg-slate-50 transition-all text-[10px] uppercase tracking-widest">
              Reset System Defaults
            </button>
          </div>
        </div>
      </section>

      <section className="bg-red-50/50 rounded-[32px] border border-red-100 p-10 flex flex-col sm:flex-row items-center justify-between gap-8">
        <div>
          <h4 className="text-xl font-black text-red-900 uppercase tracking-tight">Danger Zone</h4>
          <p className="text-[11px] text-red-700/70 font-bold uppercase tracking-widest mt-1">Deactivate your institutional credentials.</p>
        </div>
        <button className="px-8 py-4 bg-white border border-red-200 text-red-600 font-black rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-xl text-[10px] uppercase tracking-widest">
          Deactivate Profile
        </button>
      </section>
    </div>
  );
};

export default Settings;
