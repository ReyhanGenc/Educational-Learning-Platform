
import React from 'react';
import { UserRole } from '../types';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar, Cell } from 'recharts';

interface DashboardProps {
  role: UserRole;
  onNavigate: (page: string) => void;
  cartCount?: number;
  onOpenCart?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ role, onNavigate, cartCount = 0, onOpenCart }) => {
  const isStudent = role === UserRole.STUDENT;

  // Student Mock Data
  const studentChartData = [
    { subject: 'Math', score: 85, fullMark: 100 },
    { subject: 'History', score: 65, fullMark: 100 },
    { subject: 'Science', score: 92, fullMark: 100 },
    { subject: 'Logic', score: 88, fullMark: 100 },
    { subject: 'Art', score: 70, fullMark: 100 },
  ];

  const studentBarData = [
    { day: 'Mon', active: 4, target: 8 },
    { day: 'Tue', active: 7, target: 8 },
    { day: 'Wed', active: 5, target: 8 },
    { day: 'Thu', active: 9, target: 8 },
    { day: 'Fri', active: 8, target: 8 },
    { day: 'Sat', active: 3, target: 8 },
    { day: 'Sun', active: 6, target: 8 },
  ];

  // Instructor Mock Data
  const instructorPerformanceData = [
    { month: 'Jan', performance: 65 },
    { month: 'Feb', performance: 72 },
    { month: 'Mar', performance: 68 },
    { month: 'Apr', performance: 85 },
    { month: 'May', performance: 82 },
    { month: 'Jun', performance: 90 },
  ];

  const classMetrics = [
    { label: 'Total Students', value: '1,284', icon: 'groups', color: 'indigo' },
    { label: 'Avg. Class Grade', value: '78%', icon: 'trending_up', color: 'emerald' },
    { label: 'Active Courses', value: '12', icon: 'menu_book', color: 'brand' },
    { label: 'Assessments Done', value: '450', icon: 'fact_check', color: 'amber' }
  ];

  if (!isStudent) {
    return (
      <div className="min-h-full p-6 lg:p-10 space-y-12 animate-fade-in max-w-[1600px] mx-auto pb-24">
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-brand-500 font-bold text-[10px] uppercase tracking-[0.3em] mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
              Faculty Dashboard
            </div>
            <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight uppercase">
              Welcome back, Prof. Smith!
            </h1>
            <p className="text-slate-700 font-medium text-base">
              Overall institutional engagement is up <span className="text-emerald-700 font-bold">+8.2% this term</span>
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button className="bg-white border border-slate-300 p-3 rounded-xl hover:bg-slate-50 transition-all shadow-sm">
              <span className="material-symbols-outlined text-slate-700 text-xl">notifications</span>
            </button>
            <div className="w-12 h-12 rounded-xl bg-slate-900 p-0.5 shadow-lg cursor-pointer hover:scale-105 transition-transform overflow-hidden ring-2 ring-white">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Instructor" alt="Profile" className="w-full h-full object-cover rounded-lg" />
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {classMetrics.map((stat, i) => (
            <div key={i} className="bg-white p-14 rounded-[32px] border border-slate-200 shadow-sm transition-all group relative mt-4 min-h-[250px]">
              <div className={`absolute -top-6 left-10 w-12 h-12 rounded-xl shadow-lg transition-all group-hover:-translate-y-1 duration-300 flex items-center justify-center 
                ${stat.color === 'brand' ? 'bg-brand-500 text-white shadow-brand-500/20' :
                  stat.color === 'indigo' ? 'bg-indigo-600 text-white shadow-indigo-600/20' :
                    stat.color === 'emerald' ? 'bg-emerald-500 text-white shadow-emerald-500/20' :
                      'bg-amber-500 text-white shadow-amber-500/20'}`}>
                <span className="material-symbols-outlined text-xl">{stat.icon}</span>
              </div>
              <div className="pt-8">
                <p className="text-slate-700 text-[9px] font-bold uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                <h3 className="text-4xl font-black text-slate-900 tracking-tight">{stat.value}</h3>
                <p className="text-[10px] font-bold text-slate-600 mt-6 uppercase tracking-widest">Active Tracking</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 bg-white p-14 rounded-[32px] border border-slate-200 shadow-sm space-y-12 min-h-[550px]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">Cohort Grade Performance</h3>
                <p className="text-slate-700 text-xs font-medium">Institutional Average Metrics</p>
              </div>
            </div>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={instructorPerformanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPerf" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4850e5" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#4850e5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: '700', fill: '#475569' }} dy={15} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: '600', fill: '#475569' }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.08)', padding: '16px' }}
                  />
                  <Area type="monotone" dataKey="performance" stroke="#4850e5" strokeWidth={4} fillOpacity={1} fill="url(#colorPerf)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-slate-900 rounded-[32px] p-14 shadow-2xl relative overflow-hidden flex flex-col min-h-[550px]">
            <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/10 rounded-full -mr-40 -mt-40 blur-3xl"></div>
            <h3 className="text-xl font-black text-white tracking-widest uppercase mb-12 relative z-10">Unit Engagement</h3>
            <div className="space-y-10 relative z-10 flex-1 overflow-y-auto custom-scrollbar pr-2">
              {[
                { name: 'Advanced Calculus', rate: 92 },
                { name: 'Molecular Genetics', rate: 78 },
                { name: 'UI/UX Fundamentals', rate: 85 },
                { name: 'Cold War History', rate: 64 },
                { name: 'Data Structures', rate: 88 }
              ].map((course, i) => (
                <div key={i} className="space-y-3">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em]">
                    <span className="text-slate-400">{course.name}</span>
                    <span className="text-white">{course.rate}%</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <div className="h-full bg-brand-500 rounded-full transition-all duration-1000" style={{ width: `${course.rate}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => onNavigate('content')} className="mt-12 w-full bg-white text-slate-900 font-black py-5 rounded-2xl shadow-xl hover:bg-slate-100 transition-all text-[10px] uppercase tracking-[0.3em]">
              Manage Repository
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full p-6 lg:p-10 space-y-12 animate-fade-in max-w-[1600px] mx-auto pb-24">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-brand-500 font-bold text-[10px] uppercase tracking-[0.3em] mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
            Academic Overview
          </div>
          <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight uppercase">
            Hi, Alex! 👋
          </h1>
          <p className="text-slate-700 font-medium text-base">
            Weekly performance: <span className="text-brand-600 font-bold">+12.4% Progress</span>
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={onOpenCart}
            className="bg-white border border-slate-300 p-3 rounded-xl hover:bg-slate-50 transition-all relative shadow-sm group"
          >
            <span className="material-symbols-outlined text-slate-700 text-xl group-hover:text-brand-500 transition-colors">shopping_cart</span>
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-brand-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                {cartCount}
              </span>
            )}
          </button>
          <div className="w-12 h-12 rounded-xl bg-brand-500 p-0.5 shadow-lg shadow-brand-500/10 cursor-pointer hover:scale-105 transition-transform overflow-hidden ring-2 ring-white">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex" alt="Profile" className="w-full h-full object-cover rounded-lg" />
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { id: 'content', label: 'Active Courses', value: '06', icon: 'auto_stories', color: 'indigo' },
          { id: 'lessons-list', label: 'Lessons', value: '24', icon: 'description', color: 'brand' },
          { id: 'analysis', label: 'Average GPA', value: '3.82', icon: 'military_tech', color: 'emerald' },
          { id: 'exams', label: 'Exams Passed', value: '14', icon: 'quiz', color: 'amber' }
        ].map((stat, i) => (
          <div
            key={i}
            onClick={() => onNavigate(stat.id)}
            className="bg-white p-14 rounded-[32px] border border-slate-200 shadow-sm transition-all group relative mt-4 min-h-[250px] cursor-pointer hover:border-brand-500"
          >
            <div className={`absolute -top-6 left-10 w-12 h-12 rounded-xl shadow-lg transition-all group-hover:-translate-y-1 duration-300 flex items-center justify-center 
              ${stat.color === 'brand' ? 'bg-brand-500 text-white shadow-brand-500/20' :
                stat.color === 'indigo' ? 'bg-indigo-600 text-white shadow-indigo-600/20' :
                  stat.color === 'emerald' ? 'bg-emerald-500 text-white shadow-emerald-500/20' :
                    'bg-amber-500 text-white shadow-amber-500/20'}`}>
              <span className="material-symbols-outlined text-xl">{stat.icon}</span>
            </div>

            <div className="pt-8">
              <p className="text-slate-700 text-[9px] font-bold uppercase tracking-[0.2em] mb-1">{stat.label}</p>
              <h3 className="text-4xl font-black text-slate-900 tracking-tight">{stat.value}</h3>
              <div className="mt-10 flex items-center gap-2">
                <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden p-[1px] border border-slate-200">
                  <div className={`h-full rounded-full transition-all duration-1000 ${stat.color === 'brand' ? 'bg-brand-500' : 'bg-' + stat.color + '-500'}`} style={{ width: '70%' }}></div>
                </div>
                <span className="text-[9px] font-black text-slate-600">70%</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 bg-white p-14 rounded-[32px] border border-slate-200 shadow-sm space-y-12 min-h-[550px]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase tracking-wider">Learning Momentum</h3>
              <p className="text-slate-700 text-xs font-medium">Productivity Tracking</p>
            </div>
          </div>

          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={studentBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: '700', fill: '#475569' }} dy={15} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: '600', fill: '#475569' }} />
                <Tooltip
                  cursor={{ fill: '#f1f5f9', radius: 12 }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.08)', padding: '16px' }}
                />
                <Bar dataKey="active" radius={[8, 8, 0, 0]} barSize={48}>
                  {studentBarData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.active >= entry.target ? '#4850e5' : '#94a3b8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 rounded-[32px] p-14 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center min-h-[550px]">
          <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/10 rounded-full -mr-40 -mt-40 blur-3xl"></div>

          <div className="w-full text-center mb-12">
            <h3 className="text-xl font-black text-white tracking-widest uppercase">Competency Matrix</h3>
            <p className="text-slate-400 text-[10px] uppercase tracking-[0.25em] mt-1">Institutional Skill Index</p>
          </div>

          <div className="flex-1 w-full h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={studentChartData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fontWeight: '700', fill: 'rgba(255,255,255,0.6)' }} />
                <Radar name="Proficiency" dataKey="score" stroke="#4850e5" strokeWidth={2} fill="#4850e5" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-12 w-full p-10 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-md">
            <p className="text-slate-400 text-[9px] font-bold uppercase tracking-[0.3em] mb-1">Elite Achievement</p>
            <p className="text-white font-black text-2xl tracking-tight">Advanced Analytics</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
