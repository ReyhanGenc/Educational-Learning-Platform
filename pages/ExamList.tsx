
import React, { useState, useEffect } from 'react';
import { UserRole, Exam } from '../types';
import { supabase } from '../src/lib/supabase';

interface ExamListProps {
  role: UserRole;
  onTakeExam: (id: string) => void;
  onViewResults: (id: string) => void;
}

export const mockExams = [
  { id: '1', title: 'Advanced Calculus Final Assessment', subject: 'Mathematics', duration: 120, questions: 45, dateTime: 'Dec 12 • 09:00 AM', status: 'Priority', color: 'brand' },
  { id: '2', title: 'Introduction to Behavioral Science', subject: 'Psychology', duration: 90, questions: 60, dateTime: 'Dec 14 • 01:30 PM', status: 'Upcoming', color: 'purple' },
  { id: '3', title: 'Organic Chemistry Mid-Term Exam', subject: 'Chemistry', duration: 60, questions: 30, dateTime: 'Dec 15 • 10:00 AM', status: 'Upcoming', color: 'teal' },
  { id: '4', title: 'World War II Global Impact Studies', subject: 'History', duration: 100, questions: 50, dateTime: 'Dec 18 • 03:00 PM', status: 'Upcoming', color: 'orange' },
];

const ExamList: React.FC<ExamListProps> = ({ role, onTakeExam, onViewResults }) => {
  const [exams, setExams] = useState<Exam[]>(mockExams as any); // Fallback until loaded
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.from('exams').select('*').order('created_at', { ascending: false });
        if (error) throw error;

        // Map snake_case to camelCase
        if (data && data.length > 0) {
          const formatted = data.map(d => ({
            id: d.id,
            title: d.title,
            subject: d.subject,
            duration: d.duration,
            questions: d.questions,
            dateTime: d.date_time,
            priority: d.status,
            status: d.status,
            color: d.color
          }));
          setExams(formatted as any);
        }
      } catch (err) {
        console.error('Error fetching exams:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, []);

  const getColors = (c: string) => {
    switch (c) {
      case 'brand': return { bg: 'bg-brand-500', text: 'text-brand-500', light: 'bg-brand-50', border: 'border-brand-200' };
      case 'purple': return { bg: 'bg-purple-500', text: 'text-purple-500', light: 'bg-purple-50', border: 'border-purple-200' };
      case 'teal': return { bg: 'bg-teal-500', text: 'text-teal-500', light: 'bg-teal-50', border: 'border-teal-200' };
      case 'orange': return { bg: 'bg-orange-500', text: 'text-orange-500', light: 'bg-orange-50', border: 'border-orange-200' };
      default: return { bg: 'bg-brand-500', text: 'text-brand-500', light: 'bg-brand-50', border: 'border-brand-200' };
    }
  }

  return (
    <div className="p-6 lg:p-10 flex flex-col h-full overflow-hidden max-w-[1600px] mx-auto pb-24 text-slate-900">
      <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight uppercase tracking-[0.1em]">Examination Hub</h1>
          <p className="text-slate-600 mt-1 text-sm font-medium">Verify credentials and launch institutional assessments.</p>
        </div>
        <div className="relative md:w-80">
          <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 font-bold">search</span>
          <input type="text" placeholder="Search assessments..." className="w-full pl-14 pr-5 py-4 bg-white border border-slate-300 rounded-2xl shadow-sm text-xs font-bold uppercase tracking-widest outline-none focus:border-brand-500 transition-all text-slate-900" />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 overflow-y-auto custom-scrollbar pb-10 px-2">
        {exams.map((exam) => {
          const c = getColors(exam.color);
          return (
            <article key={exam.id} className="bg-white rounded-[32px] border border-slate-200 shadow-[0_4px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.06)] transition-all duration-500 group overflow-hidden flex flex-col min-h-[600px]">
              <div className={`h-4 shrink-0 ${c.bg} opacity-90`}></div>
              <div className="p-12 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-10">
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <span className={`px-4 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${c.light} ${c.text} ${c.border} border`}>
                        {exam.status}
                      </span>
                      <span className="px-4 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest bg-slate-100 text-slate-600 border border-slate-200">
                        {exam.subject}
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 leading-tight tracking-tight group-hover:text-brand-500 transition-colors uppercase">{exam.title}</h3>
                  </div>
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${c.light} ${c.text} shadow-inner border ${c.border}`}>
                    <span className="material-symbols-outlined text-3xl font-bold">verified_user</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-10">
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col gap-1">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Duration</span>
                    <span className="text-sm font-black text-slate-800">{exam.questions * 2} Min</span>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col gap-1">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Questions</span>
                    <span className="text-sm font-black text-slate-800">{exam.questions} Qs</span>
                  </div>
                </div>

                <div className="mb-10 p-6 bg-slate-900 rounded-2xl flex flex-col gap-1 shadow-xl relative overflow-hidden group/box">
                  <div className="absolute right-[-10px] bottom-[-10px] opacity-10 rotate-12 transition-transform group-hover/box:scale-110">
                    <span className="material-symbols-outlined text-[80px] text-white font-bold">calendar_month</span>
                  </div>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest relative z-10">Schedule window</span>
                  <span className="text-sm font-black text-white relative z-10 tracking-wide">{exam.dateTime}</span>
                </div>

                <div className="mt-auto grid grid-cols-2 gap-4">
                  <button
                    onClick={() => onTakeExam(exam.id)}
                    className="py-5 bg-brand-500 text-white font-black text-[9px] uppercase tracking-[0.2em] rounded-2xl hover:bg-brand-600 transition-all shadow-xl shadow-brand-500/20 active:scale-95 flex items-center justify-center gap-2"
                  >
                    Launch
                    <span className="material-symbols-outlined text-lg font-bold">bolt</span>
                  </button>
                  <button
                    onClick={() => onViewResults(exam.id)}
                    className="py-5 bg-white border-2 border-slate-200 text-slate-600 font-black text-[9px] uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-100 hover:border-brand-500 hover:text-brand-500 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    Results
                    <span className="material-symbols-outlined text-lg font-bold">analytics</span>
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};

export default ExamList;
