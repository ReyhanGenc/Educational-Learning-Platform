import React, { useState, useEffect } from 'react';
import { supabase } from '../src/lib/supabase';
import { useAuth } from '../src/contexts/AuthContext';

interface AnalysisProps {
  onBack?: () => void;
  standalone?: boolean;
}

const Analysis: React.FC<AnalysisProps> = ({ onBack, standalone = true }) => {
  const { user } = useAuth();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    avgScore: 0,
    totalExams: 0,
    efficiency: '0m',
    accuracy: '0/0',
    progression: '0%',
  });

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('exam_results')
          .select('id, score')
          .eq('user_id', user.id);

        if (error) throw error;
        setResults(data || []);

        if (data && data.length > 0) {
          const avg = Math.round(data.reduce((acc, curr) => acc + (curr.score || 0), 0) / data.length);

          setStats({
            avgScore: avg,
            totalExams: data.length,
            efficiency: 'Recorded',
            accuracy: 'Recorded',
            progression: `+${data.length * 2}%`,
          });
        }
      } catch (err) {
        console.error('Analysis fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  const size = 240;
  const strokeWidth = 20;
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (stats.avgScore / 100) * circumference;

  if (loading) return (
    <div className="h-full flex items-center justify-center p-20 bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Analytics...</p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] text-slate-900 pb-24">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {!standalone && onBack && (
            <button onClick={onBack} className="material-symbols-outlined p-2 hover:bg-slate-100 rounded-lg transition-all font-bold">arrow_back</button>
          )}
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Academic Analytics</h1>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Institutional Performance Record</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-slate-50">
            <span className="material-symbols-outlined text-[18px]">file_download</span>
            Export Data
          </button>
        </div>
      </header>

      <main className="p-6 lg:p-10 space-y-10 max-w-7xl mx-auto w-full overflow-y-auto custom-scrollbar">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-1 bg-white p-16 rounded-[32px] border border-slate-100 shadow-sm flex flex-col items-center justify-center min-h-[550px]">
            <div className="relative flex items-center justify-center mb-16">
              <svg width={size} height={size} className="transform -rotate-90 overflow-visible">
                <circle
                  stroke="#f1f5f9"
                  fill="transparent"
                  strokeWidth={strokeWidth}
                  r={radius}
                  cx={center}
                  cy={center}
                />
                <circle
                  stroke="#4850e5"
                  fill="transparent"
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${circumference} ${circumference}`}
                  style={{ strokeDashoffset: offset }}
                  strokeLinecap="round"
                  r={radius}
                  cx={center}
                  cy={center}
                  className="transition-all duration-1000 ease-out drop-shadow-[0_0_8px_rgba(72,80,229,0.4)]"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-7xl font-black text-slate-900 tracking-tighter">{stats.avgScore}<span className="text-3xl font-bold text-slate-300">%</span></span>
                <div className="flex flex-col items-center mt-6">
                  <span className="text-emerald-600 font-black text-[9px] bg-emerald-50 px-5 py-2 rounded-full uppercase tracking-widest border border-emerald-100 shadow-sm">
                    {stats.avgScore >= 85 ? 'Grade: Distinction' : stats.avgScore >= 70 ? 'Grade: Merit' : stats.avgScore >= 50 ? 'Grade: Pass' : 'Grade: Needs Improvement'}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-center space-y-3">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Average Proficiency</h3>
              <p className="text-slate-400 font-bold uppercase text-[9px] tracking-[0.2em] opacity-75">Based on {stats.totalExams} recorded evaluations</p>
            </div>
          </div>

          <div className="lg:col-span-2 grid grid-cols-2 gap-8">
            {[
              { label: 'Study Efficiency', val: stats.efficiency, sub: 'Total active assessment time', icon: 'timer', color: 'blue' },
              { label: 'Evaluation Density', val: stats.totalExams, sub: 'Total exams completed', icon: 'task', color: 'purple' },
              { label: 'Accuracy Ratio', val: stats.accuracy, sub: 'Correct vs Total Questions', icon: 'check_circle', color: 'emerald' },
              { label: 'Engagement Index', val: stats.progression, sub: 'Academic progression score', icon: 'trending_up', color: 'amber' }
            ].map((stat, i) => (
              <div key={i} className="bg-white p-12 rounded-[32px] border border-slate-100 shadow-sm group hover:border-brand-500 transition-all flex flex-col justify-between min-h-[260px]">
                <div className="w-14 h-14 bg-brand-50 text-brand-600 rounded-xl flex items-center justify-center mb-8 shadow-sm">
                  <span className="material-symbols-outlined text-3xl font-black">{stat.icon}</span>
                </div>
                <div>
                  <p className="text-slate-400 text-[8px] font-bold uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                  <h4 className="text-2xl font-black text-slate-900 tracking-tight">{stat.val}</h4>
                  <p className="text-[10px] text-brand-600 font-bold mt-2 uppercase tracking-wide">{stat.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <section className="bg-white p-12 rounded-[40px] border border-slate-100 shadow-sm">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase mb-8 flex items-center gap-4">
            <span className="material-symbols-outlined text-brand-500 font-black">history_edu</span>
            Recent Transcript Records
          </h2>
          <div className="space-y-4">
            {results.length > 0 ? results.map((res, i) => (
              <div key={res.id || i} className="p-8 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-between hover:bg-white hover:shadow-xl transition-all group">
                <div className="flex items-center gap-8">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-lg ${res.score >= 50 ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-red-500 text-white shadow-lg shadow-red-500/20'}`}>
                    {res.score}%
                  </div>
                  <div>
                    <h4 className="text-base font-black text-slate-900 uppercase tracking-tight">Assessment Record #{res.id.slice(-4)}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                      {new Date(res.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border-2 ${res.score >= 50 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                    {res.score >= 50 ? 'Successful' : 'Failed'}
                  </span>
                </div>
              </div>
            )) : (
              <div className="text-center py-24 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                <span className="material-symbols-outlined text-5xl text-slate-200 mb-4 block">analytics</span>
                <p className="opacity-30 uppercase font-black tracking-widest text-xs">No records found in institutional database</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Analysis;
