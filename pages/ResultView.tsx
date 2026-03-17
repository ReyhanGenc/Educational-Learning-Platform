
import React, { useState, useEffect } from 'react';
import { supabase } from '../src/lib/supabase';
import { useAuth } from '../src/contexts/AuthContext';
import { UNIT_EXAMS } from '../src/data/unit_exams';
import { Exam, ExamResult, ExamQuestion } from '../types';

interface ResultViewProps {
  onBack: () => void;
  examId?: string | null;
  resultId?: string | null;
  examData?: any;
}

const ResultView: React.FC<ResultViewProps> = ({ onBack, examId, resultId, examData }) => {
  const { user } = useAuth();
  const [exam, setExam] = useState<Exam | null>(null);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResultData = async () => {
      setLoading(true);
      try {
        // Handle Unit Exams (Stored in Enrollments)
        if (examId && examId.startsWith('unit-')) {
          const lessonId = examId.replace('unit-', '');

          // 1. Fetch any enrollment that might have this lesson
          const { data: enrollments } = await supabase
            .from('enrollments')
            .select('*')
            .eq('user_id', user?.id);

          const enrollment = (enrollments || []).find(e => e.lesson_progress && e.lesson_progress[lessonId]);
          const progress = enrollment?.lesson_progress?.[lessonId];

          // 2. Fetch Questons: Try UNIT_EXAMS first, then Supabase 'exams' table for that chapter
          let unitQuestions = UNIT_EXAMS[lessonId] || [];
          let dbExam: any = null;

          if (unitQuestions.length === 0) {
            const { data: exData } = await supabase.from('exams').select('*').eq('chapter_id', lessonId).order('created_at', { ascending: false }).limit(1).maybeSingle();
            if (exData && Array.isArray(exData.questions)) {
              unitQuestions = exData.questions;
              dbExam = exData;
            }
          }

          setQuestions(unitQuestions.map((q: any, i) => ({ ...q, id: `u-${i}`, exam_id: examId, order_num: i + 1 } as any)));

          if (progress) {
            const studentAnswers = progress.quiz_answers || {};
            let correctCount = 0;
            let incorrectCount = 0;

            unitQuestions.forEach((q: any, idx) => {
              const ans = studentAnswers[idx + 1];
              if (ans) {
                const correctId = q.correct_option_id || q.correctOptionId;
                if (ans === correctId) correctCount++;
                else incorrectCount++;
              }
            });

            setResult({
              id: 'local-' + lessonId,
              user_id: user?.id || '',
              exam_id: examId,
              score: progress.quiz_score || 0,
              total_questions: unitQuestions.length,
              correct_answers: correctCount,
              incorrect_answers: incorrectCount,
              time_spent_seconds: progress.time_spent_seconds || 0,
              answers: studentAnswers,
              created_at: new Date().toISOString()
            } as any);

            setExam({
              id: examId,
              title: dbExam?.title || ('Unit Assessment: ' + lessonId),
              subject: 'Course Work',
              duration: 30,
              questions: unitQuestions.length,
              dateTime: '',
              status: 'Completed',
              color: 'brand'
            } as any);
          }
        } else if (examId) {
          // Standard Exam Flow
          const { data: eData } = await supabase.from('exams').select('*').eq('id', examId).single();
          if (eData) setExam({ ...eData, dateTime: eData.date_time } as any);

          // Fetch questions for standard exam to show review
          const { data: qData } = await supabase.from('exam_questions').select('*').eq('exam_id', examId).order('order_num', { ascending: true });
          
          let currentQuestions: ExamQuestion[] = [];
          if (qData && qData.length > 0) {
            currentQuestions = qData as any;
          } else if (eData && Array.isArray(eData.questions)) {
            currentQuestions = eData.questions as any;
          }
          setQuestions(currentQuestions);

          if (user) {
            let query = supabase
              .from('exam_results')
              .select('id, user_id, exam_id, score, answers, total_questions, correct_answers, incorrect_answers, time_spent_seconds')
              .eq('exam_id', examId)
              .eq('user_id', user.id);

            if (resultId) {
              query = query.eq('id', resultId);
            } else {
              // Fallback to id ordering if created_at is missing in this table
              query = query.order('id', { ascending: false }).limit(1);
            }

            const { data: rData, error: rError } = await query.maybeSingle();
            if (rError) console.error('ResultView: Error fetching exam result:', rError);
            
            if (rData) {
              // Backward compatibility: If result is missing breakdown, calculate it
              if ((rData.correct_answers === null || rData.correct_answers === undefined) && rData.answers && currentQuestions.length > 0) {
                let c = 0; let i = 0;
                currentQuestions.forEach((q, idx) => {
                  const ans = rData.answers[idx + 1];
                  const correctId = q.correct_option_id || (q as any).correctOptionId;
                  if (ans) {
                    if (ans === correctId) c++;
                    else i++;
                  }
                });
                rData.correct_answers = c;
                rData.incorrect_answers = i;
                rData.total_questions = currentQuestions.length;
              }
              
              setResult(rData as any);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching result data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResultData();
  }, [examId, resultId, user]);
  console.log('Final Result State in ResultView:', result);
  // Use DB data if available, fallback to mock/examData
  const rawQ = exam?.questions || examData?.questions;
  const totalQuestions = result?.total_questions || (Array.isArray(rawQ) ? rawQ.length : (parseInt(rawQ) || 50));

  // Use exact values from DB if available. Use ?? to allow 0.
  const correctAnswers = result?.correct_answers ?? 0;
  const incorrectAnswers = result?.incorrect_answers ?? 0;
  const skipped = totalQuestions - correctAnswers - incorrectAnswers;

  const initialDuration = totalQuestions * 2;
  // If result exists, rigorously use its time_spent. Otherwise mock something reasonable based on duration limit.
  const timeSpentSeconds = result?.time_spent_seconds != null
    ? result.time_spent_seconds
    : Math.floor(initialDuration * 60 * 0.8);

  const m = Math.floor(timeSpentSeconds / 60);
  const s = timeSpentSeconds % 60;
  const timeSpentStr = `${m}m ${s}s`;

  const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
  const displayScore = result?.score ?? accuracy;

  const stats = [
    { label: 'Total Score', value: `${displayScore}%`, icon: 'grade', color: 'brand' },
    { label: 'Time Spent', value: timeSpentStr, icon: 'timer', color: 'indigo' },
    { label: 'Accuracy', value: `${accuracy}%`, icon: 'check_circle', color: 'emerald' },
  ];

  if (!loading && !result) {
    return (
      <div className="min-h-full bg-slate-100 flex flex-col items-center justify-center p-8 animate-fade-in text-slate-900">
        <div className="bg-white p-12 rounded-[32px] shadow-xl border border-slate-200 text-center max-w-lg">
          <div className="w-20 h-20 bg-slate-100 text-slate-400 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-4xl block">history_toggle_off</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase mb-4">Assessment Not Yet Completed</h2>
          <p className="text-slate-500 font-medium mb-8">There is no attempt record for this exam yet. Once you complete the assessment, you can review your results here.</p>
          <button onClick={onBack} className="bg-brand-500 text-white font-black text-[10px] uppercase tracking-widest px-8 py-4 rounded-xl shadow-lg shadow-brand-500/20 hover:bg-brand-600 transition-all">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-100 flex flex-col pb-24 lg:pb-10 animate-fade-in text-slate-900">
      <header className="bg-white border-b border-slate-200 px-8 py-6 sticky top-0 z-10 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="material-symbols-outlined p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-900 font-bold">arrow_back</button>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase leading-none">Performance Report</h1>
            <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest mt-1">{exam?.title || examData?.title || 'Mathematics Final'} • {exam?.dateTime || examData?.dateTime || 'Dec 12'}</p>
          </div>
        </div>
      </header>

      <main className="p-6 lg:p-12 max-w-6xl mx-auto w-full space-y-12">
        {loading ? (
          <div className="flex flex-1 items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
          </div>
        ) : (
          <>
            <div className="bg-white p-16 rounded-[48px] border border-slate-200 shadow-xl flex flex-col items-center text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-500/5 rounded-full -ml-32 -mb-32 blur-3xl"></div>

              <div className={`w-32 h-32 ${displayScore >= 50 ? 'bg-emerald-500 text-white shadow-emerald-500/20 ring-emerald-50' : 'bg-red-500 text-white shadow-red-500/20 ring-red-50'} rounded-[32px] flex items-center justify-center mb-10 shadow-2xl ring-4`}>
                <span className="material-symbols-outlined text-6xl font-bold">{displayScore >= 50 ? 'verified' : 'cancel'}</span>
              </div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-4 leading-none">{displayScore >= 50 ? 'Assessment Passed' : 'Assessment Failed'}</h2>
              <p className="text-slate-600 font-black uppercase tracking-[0.2em] text-[11px] mb-2">{displayScore >= 50 ? 'Credential issued on' : 'Attempt recorded on'} {examData?.dateTime?.split(' • ')[0] || 'Dec 12, 2024'}</p>
              <div className="h-1 w-20 bg-brand-500 rounded-full mx-auto"></div>

              <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-3xl mx-auto">
                {stats.map((s, i) => (
                  <div key={i} className="flex flex-col items-center gap-4 group">
                    <div className={`w-16 h-16 rounded-2xl bg-${s.color}-50 text-${s.color}-600 flex items-center justify-center border border-${s.color}-200 transition-transform group-hover:scale-110 shadow-sm`}>
                      <span className="material-symbols-outlined text-2xl font-bold">{s.icon}</span>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">{s.label}</p>
                      <p className="text-2xl font-black text-slate-900 tracking-tight">{s.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <section className="bg-white p-12 rounded-[32px] border border-slate-200 shadow-sm space-y-8">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Question Breakdown</h3>
                <div className="space-y-6">
                  {[
                    { label: 'Correct Answers', value: correctAnswers, color: 'bg-emerald-500' },
                    { label: 'Incorrect Answers', value: incorrectAnswers, color: 'bg-red-500' },
                    { label: 'Skipped', value: skipped, color: 'bg-slate-300' }
                  ].map((b, i) => (
                    <div key={i} className="space-y-3">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                        <span className="text-slate-600">{b.label}</span>
                        <span className="text-slate-900">{b.value} items</span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                        <div className={`h-full ${b.color} rounded-full transition-all duration-1000`} style={{ width: `${totalQuestions > 0 ? (b.value / totalQuestions) * 100 : 0}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="bg-slate-900 p-12 rounded-[32px] text-white shadow-2xl space-y-8 flex flex-col justify-center border border-slate-800">
                <div>
                  <h3 className="text-xl font-black tracking-tight uppercase">Institutional Analytics</h3>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Intelligence Module v4.2</p>
                </div>
                <div className="bg-white/5 p-8 rounded-[24px] border border-white/5">
                  <p className="text-slate-300 text-base leading-relaxed font-bold italic">
                    {displayScore >= 80
                      ? "You demonstrated exceptional proficiency in these core topics. Recommendation: proceed to the next unit for advanced certification."
                      : "Solid effort. We recommend reviewing the 'Subject Explanation' content again to strengthen your core understanding before the final exam."}
                  </p>
                </div>
                <div className="pt-4">
                  <button onClick={onBack} className="w-full bg-white text-slate-900 py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-100 transition-all shadow-xl active:scale-95">
                    {examId?.startsWith('unit-') ? 'Return to Lesson' : 'Return to Exam Hub'}
                  </button>
                </div>
              </section>
            </div>
            {/* Detailed Question Review */}
            {questions.length > 0 && result?.answers && (
              <section className="bg-white p-12 rounded-[32px] border border-slate-200 shadow-sm space-y-10">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Question by Question Review</h3>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                      <span className="text-[10px] font-black uppercase text-slate-500">Correct</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-[10px] font-black uppercase text-slate-500">Incorrect</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  {questions.map((q: any, idx) => {
                    const studentAnsId = result.answers[idx + 1];
                    const correctId = q.correct_option_id || q.correctOptionId;
                    const isCorrect = studentAnsId === correctId;
                    const studentAnsLabel = q.options.find((o: any) => o.id === studentAnsId)?.label || q.options.find((o: any) => o.id === studentAnsId)?.text || 'Not Answered';
                    const correctAnsLabel = q.options.find((o: any) => o.id === correctId)?.label || q.options.find((o: any) => o.id === correctId)?.text;

                    return (
                      <div key={idx} className={`p-8 rounded-3xl border-2 transition-all ${isCorrect ? 'border-emerald-50 bg-emerald-50/20' : 'border-red-50 bg-red-50/20'}`}>
                        <div className="flex items-start gap-6">
                          <div className={`w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center font-black text-lg ${isCorrect ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                            {idx + 1}
                          </div>
                          <div className="flex-1 space-y-4">
                            <h4 className="text-lg font-bold text-slate-900 leading-snug">
                              {typeof (q.question_text || q.text) === 'object' ? 'Question Data Error' : String(q.question_text || q.text || 'Untitled')}
                            </h4>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                              <div className="space-y-1">
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Your Answer</p>
                                <div className={`px-4 py-3 rounded-xl border font-bold text-sm ${isCorrect ? 'bg-white border-emerald-200 text-emerald-700' : 'bg-white border-red-200 text-red-700'}`}>
                                  {typeof studentAnsLabel === 'object' ? 'Option Error' : String(studentAnsLabel)}
                                </div>
                              </div>
                              {!isCorrect && (
                                <div className="space-y-1 animate-fade-in">
                                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Correct Answer</p>
                                  <div className="px-4 py-3 rounded-xl bg-white border border-emerald-200 text-emerald-700 font-bold text-sm">
                                    {typeof correctAnsLabel === 'object' ? 'Option Error' : String(correctAnsLabel)}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className={`px-4 py-2 rounded-full font-black text-[9px] uppercase tracking-widest ${isCorrect ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                            {isCorrect ? 'Correct' : 'Incorrect'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-10 border-t border-slate-100 flex justify-center">
                  <button onClick={onBack} className="bg-slate-900 text-white px-12 py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl hover:bg-brand-500 transition-all active:scale-95">
                    {examId?.startsWith('unit-') ? 'Back to Lesson Content' : 'Back to Exams Hub'}
                  </button>
                </div>
              </section>
            )}
          </>
        )}
      </main>

      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.4s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default ResultView;
