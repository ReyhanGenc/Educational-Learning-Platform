
import React, { useState } from 'react';
import { UserRole } from '../types';
import { useAuth } from '../src/contexts/AuthContext';

interface SettingsProps {
  role: UserRole;
}

const Settings: React.FC<SettingsProps> = ({ role }) => {
  const { user, userMetadata, signOut, updateProfile, resetProgress } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(userMetadata?.full_name || '');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'account' | 'notifications'>('profile');

  const displayName = userMetadata?.full_name || 'User';
  const email = user?.email || 'No email';

  const handleUpdate = async () => {
    if (!newName.trim()) return;
    setLoading(true);
    try {
      await updateProfile(newName);
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      alert('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleResetProgress = async () => {
    if (window.confirm('Are you sure you want to reset your learning progress? This will clear all course completion data but keep your purchases. This action cannot be undone.')) {
      try {
        await resetProgress();
      } catch (err) {
        console.error(err);
        alert('Failed to reset progress');
      }
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto pb-24 space-y-8">
      <header className="mb-8">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight uppercase tracking-[0.1em]">Settings</h1>
        <p className="text-slate-600 mt-1 text-sm font-medium">Manage your account preferences and profile.</p>
      </header>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Navigation */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'profile'
                ? 'bg-brand-50 text-brand-600'
                : 'text-slate-600 hover:bg-slate-50'
                }`}
            >
              <span className="material-symbols-outlined">person</span>
              Profile Info
            </button>
            <button
              onClick={() => setActiveTab('account')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'account'
                ? 'bg-brand-50 text-brand-600'
                : 'text-slate-600 hover:bg-slate-50'
                }`}
            >
              <span className="material-symbols-outlined">manage_accounts</span>
              Account Security
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'notifications'
                ? 'bg-brand-50 text-brand-600'
                : 'text-slate-600 hover:bg-slate-50'
                }`}
            >
              <span className="material-symbols-outlined">notifications</span>
              Notifications
            </button>
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-8 animate-fade-in">
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-4">Public Profile</h2>

              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-32 h-32 rounded-full p-1 bg-slate-100">
                    <img
                      src={`https://api.dicebear.com/7.x/initials/svg?seed=${displayName}`}
                      alt="Profile"
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                </div>

                <div className="flex-1 w-full space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Full Name</label>
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <input
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          className="flex-1 bg-slate-50 border-b-2 border-brand-500 px-4 py-2 outline-none font-bold text-slate-900"
                          autoFocus
                        />
                        <button
                          onClick={handleUpdate}
                          disabled={loading}
                          className="bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-bold"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setIsEditing(false)}
                          className="bg-slate-100 text-slate-600 px-4 py-2 rounded-lg text-sm font-bold"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <span className="font-bold text-slate-900">{displayName}</span>
                        <button
                          onClick={() => { setIsEditing(true); setNewName(displayName); }}
                          className="text-slate-400 hover:text-brand-500 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Email Address</label>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-slate-500 font-bold flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">lock</span>
                      {email}
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">Email address cannot be changed.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Role</label>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-slate-900 font-bold capitalize">
                      {role === UserRole.STUDENT ? 'Student Account' : 'Instructor Account'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'account' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6">
                <h2 className="text-lg font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-4">Account Actions</h2>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <h3 className="font-bold text-slate-900">Sign Out</h3>
                    <p className="text-sm text-slate-500">Sign out of your account on this device.</p>
                  </div>
                  <button
                    onClick={signOut}
                    className="px-6 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-sm hover:bg-slate-200 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </div>

              <div className="bg-red-50 rounded-2xl border border-red-100 p-8 space-y-6">
                <h2 className="text-lg font-black text-red-700 uppercase tracking-widest border-b border-red-200 pb-4">Danger Zone</h2>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-red-900">Reset Progress</h3>
                    <p className="text-sm text-red-700 mt-1">Clear all course progress and exam results. Purchases remain intact.</p>
                  </div>
                  <button
                    onClick={handleResetProgress}
                    className="px-6 py-2 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20"
                  >
                    Reset Progress
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6">
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-4">Notification Preferences</h2>
              <div className="py-10 text-center text-slate-400 font-medium">
                No notification settings available yet.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
