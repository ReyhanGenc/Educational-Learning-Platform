
import React, { useState, useEffect } from 'react';
import { supabase } from '../src/lib/supabase';
import { useAuth } from '../src/contexts/AuthContext';
import { ExamQuestion, Exam } from '../types';

interface ExamTakerProps {
  onExit: () => void;
  onSubmit?: (resultId?: string) => void;
  onComplete?: (score: number) => void;
  examId?: string | null;
  resultId?: string | null;
  examData?: any;
}

const ExamTaker: React.FC<ExamTakerProps> = ({ onExit, onSubmit, onComplete, examId, resultId, examData }) => {
  const { user } = useAuth();
  const [timeLeft, setTimeLeft] = useState(examData?.duration ? examData.duration * 60 : 3600);
  const [initialDuration, setInitialDuration] = useState(examData?.duration ? examData.duration * 60 : 3600);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [exam, setExam] = useState<Exam | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(!!examId);
  const [reviewMode, setReviewMode] = useState(false);

  const selectedOption = answers[currentQuestion] || null;

  const totalQuestions = examId ? Math.max(questions.length, 1) : (examData?.questions ? (typeof examData.questions === 'number' ? examData.questions : examData.questions.length) : (examData?.totalQuestions || 5));

  useEffect(() => {
    setCurrentQuestion(1);
    if (examData?.duration) {
      setTimeLeft(examData.duration * 60);
      setInitialDuration(examData.duration * 60);
    }
    setAnswers({});
  }, [examData, examId]);

  useEffect(() => {
    if (!examId) return;
    const fetchExamData = async () => {
      setLoading(true);
      try {
        const { data: eData } = await supabase.from('exams').select('*').eq('id', examId).single();
        if (eData) {
          setExam(eData as any);
          const durationSecs = (eData.questions || 10) * 2 * 60;

          // Check if user already took this exam
          if (user) {
            let query = supabase
              .from('exam_results')
              .select('*')
              .eq('exam_id', examId)
              .eq('user_id', user.id);

            if (resultId) {
              query = query.eq('id', resultId);
            } else {
              query = query.order('created_at', { ascending: false }).limit(1);
            }

            const { data: rData } = await query.maybeSingle();

            if (rData) {
              setReviewMode(true);
              setInitialDuration(durationSecs);
              setTimeLeft(0);
              if (rData.answers) {
                setAnswers(rData.answers);
              }
            } else {
              setTimeLeft(durationSecs);
              setInitialDuration(durationSecs);
            }
          } else {
            setTimeLeft(durationSecs);
            setInitialDuration(durationSecs);
          }
        }

        const { data: qData } = await supabase.from('exam_questions').select('*').eq('exam_id', examId).order('order_num', { ascending: true });
        if (qData && qData.length > 0) {
          setQuestions(qData as any);
        } else if (eData) {
          // Fallback to generate mock questions if table has no entries for this exam
          const totalQ = eData.questions || 10;
          const mockQ = Array.from({ length: totalQ }).map((_, i) => ({
            id: `mock-${i}`,
            exam_id: examId,
            question_text: `The actual content for Question ${i + 1} is missing from the database. Please select the correct generic option provided below.`,
            options: [
              { id: 'A', label: 'First Valid Option' },
              { id: 'B', label: 'Second Option' },
              { id: 'C', label: 'Third Error Option' },
              { id: 'D', label: 'Last Option' }
            ],
            correct_option_id: 'A',
            order_num: i + 1
          }));
          setQuestions(mockQ);
        }
      } catch (err) {
        console.error('Error fetching exam details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchExamData();
  }, [examId]);

  // ... (timer logic)

  const handleFinish = async () => {
    let score = 100;

    if (examId && questions.length > 0 && user) {
      let correctCount = 0;
      let incorrectCount = 0;
      questions.forEach((q, idx) => {
        const answer = answers[idx + 1];
        if (answer) {
          if (answer === q.correct_option_id) {
            correctCount++;
          } else {
            incorrectCount++;
          }
        }
      });
      score = Math.round((correctCount / questions.length) * 100);
      const timeSpent = initialDuration - timeLeft;

      try {
        const { data: resultData, error } = await supabase.from('exam_results').insert({
          user_id: user.id,
          exam_id: examId,
          score,
          total_questions: questions.length,
          correct_answers: correctCount,
          incorrect_answers: incorrectCount,
          time_spent_seconds: timeSpent,
          answers: answers
        }).select().single();

        if (error) throw error;

        if (onSubmit) {
          onSubmit(resultData.id);
          return;
        }
      } catch (err: any) {
        console.error('Error saving exam result:', err);
        alert(`Your exam result could not be saved! Please ensure you have added the 'answers' column in Supabase. Error: ${err.message}`);
      }
    }

    if (onComplete) {
      onComplete(score);
    } else if (onSubmit) {
      onSubmit();
    }
  };

  // Replace existing onSubmit in modal with handleFinish

  useEffect(() => {
    if (reviewMode) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);
    return () => clearInterval(timer);
  }, [reviewMode]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleNext = () => {
    if (currentQuestion === totalQuestions) {
      setIsModalOpen(true);
    } else {
      setCurrentQuestion(prev => Math.min(totalQuestions, prev + 1));
    }
  };

  const handlePrev = () => {
    setCurrentQuestion(prev => Math.max(1, prev - 1));
  };

  const currentQData = questions[currentQuestion - 1];

  const demoOptions = [
    { id: 'A', label: 'Power Rule' },
    { id: 'B', label: 'Product Rule' },
    { id: 'C', label: 'Quotient Rule' },
    { id: 'D', label: 'Chain Rule' },
  ];

  const activeOptions = examId && currentQData?.options ? currentQData.options : demoOptions;
  const questionTitle = examId ? (exam?.title || 'Examination') : 'Adv. Mathematics - Midterm';
  const questionText = examId && currentQData ? currentQData.question_text : 'A student is calculating the derivative of f(x) = sin(x) * cos(x). Which of the following rules should be applied first to find the correct derivative?';

  const progress = (currentQuestion / totalQuestions) * 100;

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white flex-col gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Loading Assessment...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-50 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center justify-between p-4 pb-2 lg:px-8">
          <div className="flex items-center gap-2">
            <button
              onClick={() => reviewMode ? onExit() : setIsModalOpen(true)}
              className="material-symbols-outlined text-slate-600 hover:text-slate-900 transition-colors"
            >
              close
            </button>
            <div className="hidden lg:block ml-2">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest block mb-0.5">Examination Mode</span>
              <h1 className="text-sm font-bold">{questionTitle}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-red-500/10 px-3 py-1.5 rounded-full border border-red-500/20">
            <span className="material-symbols-outlined text-red-600 text-sm">timer</span>
            <p className="text-red-600 text-sm font-bold tracking-tight">{formatTime(timeLeft)}</p>
          </div>
        </div>
        <div className="px-4 pb-3 pt-1 lg:px-8">
          <div className="flex justify-between items-end mb-1.5">
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-600">Exam Progress</span>
            <span className="text-[10px] font-bold text-brand-500">{Math.round(progress)}% Complete</span>
          </div>
          <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-brand-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden lg:px-8">
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar">
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-brand-500 text-xs font-bold uppercase tracking-widest">Question {currentQuestion} of {totalQuestions}</span>
                <h2 className="text-2xl lg:text-3xl font-bold leading-tight text-slate-900 uppercase">
                  {examId ? `Question ${currentQuestion}` : 'Derivative calculation for trigonometric functions'}
                </h2>
              </div>
              <button className="p-2 rounded-full hover:bg-slate-100 text-slate-500">
                <span className="material-symbols-outlined">bookmark</span>
              </button>
            </div>

            <div className="text-slate-700 text-lg leading-relaxed font-medium">
              <p>{questionText}</p>
            </div>

            <div className="flex flex-col gap-3">
              {reviewMode && !selectedOption && (
                <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-2xl flex items-center gap-3 font-medium text-sm mb-2">
                  <span className="material-symbols-outlined">warning</span>
                  This question was left blank.
                </div>
              )}
              {activeOptions.map((opt: any) => {
                const isSelected = selectedOption === opt.id;
                let optionClass = 'border-slate-100 hover:border-slate-200 bg-white';
                let iconClass = 'border-slate-200 text-slate-500';
                let showCheck = isSelected;

                if (reviewMode && currentQData) {
                  const isCorrect = opt.id === currentQData.correct_option_id;
                  if (isCorrect) {
                    optionClass = 'border-green-500 bg-green-50';
                    iconClass = 'border-green-500 bg-green-500 text-white';
                    showCheck = true;
                  } else if (isSelected && !isCorrect) {
                    optionClass = 'border-red-500 bg-red-50';
                    iconClass = 'border-red-500 bg-red-500 text-white';
                    showCheck = false;
                  } else {
                    optionClass = 'border-slate-100 bg-white opacity-50';
                  }
                } else if (isSelected) {
                  optionClass = 'border-brand-500 bg-brand-50';
                  iconClass = 'border-brand-500 bg-brand-500 text-white';
                }

                return (
                  <button
                    key={opt.id}
                    onClick={() => !reviewMode && setAnswers(prev => ({ ...prev, [currentQuestion]: opt.id }))}
                    disabled={reviewMode}
                    className={`group flex items-center gap-4 rounded-2xl border-2 p-6 transition-all text-left ${optionClass}`}
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 font-bold text-sm ${iconClass}`}>
                      {opt.id}
                    </div>
                    <div className="flex grow font-black text-xs uppercase tracking-widest text-slate-800">{opt.label}</div>
                    {showCheck && <span className={`material-symbols-outlined ${reviewMode && opt.id === currentQData?.correct_option_id ? 'text-green-500' : (reviewMode && isSelected ? 'text-red-500' : 'text-brand-500')}`}>
                      {reviewMode && opt.id !== currentQData?.correct_option_id && isSelected ? 'cancel' : 'check_circle'}
                    </span>}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-4 pt-4">
              <button
                disabled={currentQuestion === 1}
                onClick={handlePrev}
                className="flex-1 flex items-center justify-center gap-2 py-5 rounded-2xl border border-slate-200 font-black text-[10px] uppercase tracking-widest text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-lg">arrow_back</span>
                Previous
              </button>
              <button
                onClick={() => {
                  if (reviewMode && currentQuestion === totalQuestions) {
                    onExit();
                  } else {
                    handleNext();
                  }
                }}
                className="flex-1 flex items-center justify-center gap-2 py-5 rounded-2xl bg-brand-500 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-brand-500/20 hover:bg-brand-600 transition-colors"
              >
                {currentQuestion === totalQuestions ? (reviewMode ? 'Exit Review' : 'Finish') : 'Next'}
                <span className="material-symbols-outlined text-lg">{currentQuestion === totalQuestions && reviewMode ? 'exit_to_app' : 'arrow_forward'}</span>
              </button>
            </div>
          </div>
        </main>

        <aside className="hidden xl:flex flex-col w-80 border-l border-slate-100 bg-white h-full relative">
          <div className="p-8 pb-4 border-b border-slate-100">
            <h3 className="text-lg font-black uppercase tracking-tight text-slate-900">Question Index</h3>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
            <div className="grid grid-cols-5 gap-2">
              {[...Array(totalQuestions)].map((_, i) => (
                <div
                  key={i}
                  onClick={() => setCurrentQuestion(i + 1)}
                  className={`aspect-square flex items-center justify-center rounded-xl font-bold text-xs cursor-pointer transition-all ${i + 1 < currentQuestion ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20' :
                    i + 1 === currentQuestion ? 'border-2 border-brand-500 bg-brand-50 text-brand-500' :
                      'border border-slate-200 text-slate-600 hover:border-slate-400'
                    }`}
                >
                  {i + 1}
                </div>
              ))}
            </div>
          </div>
          <div className="p-8 pt-4 border-t border-slate-100 bg-white">
            {!reviewMode ? (
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl hover:bg-brand-600 transition-all active:scale-95"
              >
                Submit Exam
              </button>
            ) : (
              <button
                onClick={() => onExit()}
                className="w-full bg-slate-100 text-slate-600 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-slate-200 hover:bg-slate-200 transition-all"
              >
                Exit Review
              </button>
            )}
          </div>
        </aside>
      </div>

      {/* Confirmation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-[32px] p-10 shadow-2xl border border-slate-100 flex flex-col items-center text-center animate-scale-up">
            <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center mb-8 border border-amber-100 shadow-inner">
              <span className="material-symbols-outlined text-4xl font-bold">warning</span>
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase mb-4">
              {reviewMode ? 'Exit Review?' : 'Finish Exam?'}
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed font-medium mb-10">
              {reviewMode
                ? 'Are you sure you want to exit the result review session?'
                : <>Are you sure you want to finish the exam? {currentQuestion < totalQuestions ? <>You have <span className="text-brand-500 font-bold">{totalQuestions - currentQuestion}</span> questions remaining.</> : <>You have reached the end of the exam.</>} This action cannot be undone.</>
              }
            </p>
            <div className="flex flex-col w-full gap-3">
              <button
                onClick={reviewMode ? onExit : handleFinish}
                className="w-full bg-brand-500 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-brand-600 transition-all active:scale-95"
              >
                {reviewMode ? 'Yes, Exit Now' : 'Yes, Finalize Submission'}
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-full bg-slate-100 text-slate-600 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-slate-200 hover:bg-slate-200 transition-all"
              >
                {reviewMode ? 'Cancel' : 'No, Continue Exam'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scale-up {
          from { transform: scale(0.95) translateY(10px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }
        .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
        .animate-scale-up {
          animation: scale-up 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ExamTaker;
