import React, { useState, useEffect } from 'react';
import { supabase } from '../src/lib/supabase';
import { useAuth } from '../src/contexts/AuthContext';

interface LessonViewProps {
  onBack: () => void;
  courseId: string;
  onComplete?: () => void;
  onTakeExam?: (lessonId: string, lessonTitle: string) => void;
}

const LessonView: React.FC<LessonViewProps> = ({ onBack, courseId, onComplete, onTakeExam }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [chapters, setChapters] = useState<any[]>([]);
  const [currentLesson, setCurrentLesson] = useState<any>(null);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [course, setCourse] = useState<any>(null);

  useEffect(() => {
    fetchLessonData();
  }, [courseId, user]);

  const fetchLessonData = async () => {
    try {
      setLoading(true);

      // Parallelize Course and Chapter fetching
      const [courseRes, chaptersRes] = await Promise.all([
        supabase.from('courses').select('*').eq('id', courseId).single(),
        supabase.from('chapters').select('*, lessons (*)').eq('course_id', courseId).order('order')
      ]);

      setCourse(courseRes.data);

      const chaptersData = chaptersRes.data;
      if (chaptersData) {
        chaptersData.forEach(chapter => {
          chapter.lessons.sort((a: any, b: any) => a.order - b.order);
        });
        setChapters(chaptersData);
      }

      // 3. Fetch Enrollment separately (depends on user)
      let enrollmentData = null;
      if (user) {
        const { data } = await supabase
          .from('enrollments')
          .select('*')
          .eq('user_id', user.id)
          .eq('course_id', courseId)
          .single();
        enrollmentData = data;
        setEnrollment(enrollmentData);
      }

      // Determine which lesson to show
      let lessonToLoad = null;

      if (enrollmentData?.last_accessed_lesson_id) {
        for (const ch of (chaptersData || [])) {
          const found = ch.lessons.find((l: any) => l.id === enrollmentData.last_accessed_lesson_id);
          if (found) {
            lessonToLoad = found;
            break;
          }
        }
      }

      if (!lessonToLoad && chaptersData) {
        const completedIds = enrollmentData?.completed_lesson_ids || [];
        for (const ch of chaptersData) {
          for (const l of ch.lessons) {
            if (!completedIds.includes(l.id)) {
              lessonToLoad = l;
              break;
            }
          }
          if (lessonToLoad) break;
        }
      }

      if (!lessonToLoad && chaptersData && chaptersData.length > 0 && chaptersData[0].lessons.length > 0) {
        lessonToLoad = chaptersData[0].lessons[0];
      }

      // Only update state once
      setCurrentLesson(lessonToLoad);

      // Async update last accessed (fire and forget)
      if (lessonToLoad && enrollmentData) {
        supabase.from('enrollments').update({
          last_accessed_lesson_id: lessonToLoad.id
        }).eq('id', enrollmentData.id).then();
      }

    } catch (error) {
      console.error('Error loading lesson:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper to calculate and update progress
  const updateProgress = async (type: 'read' | 'quiz', value: any) => {
    if (!user || !enrollment || !currentLesson) return;

    try {
      // 1. Get current lesson progress map 
      const currentProgressMap = enrollment.lesson_progress || {};
      const lessonProgress = currentProgressMap[currentLesson.id] || {};

      // 2. Update specific field
      if (type === 'read') {
        lessonProgress.read = true;
        // Set scroll_percent to 100 for backward compatibility if needed, or ignore
        lessonProgress.scroll_percent = 100;
      }
      if (type === 'quiz') lessonProgress.quiz_score = value;

      const newProgressMap = {
        ...currentProgressMap,
        [currentLesson.id]: lessonProgress
      };

      // 3. Calculate Global Progress (Course Level)
      let totalPointsPossible = 0;
      let totalPointsEarned = 0;

      // Calculate score for THIS lesson first
      const isRead = lessonProgress.read || false;
      const currentReadScore = isRead ? 50 : 0;
      const currentExamScore = (lessonProgress.quiz_score || 0) >= 50 ? 50 : 0;
      const currentLessonTotal = currentReadScore + currentExamScore;

      const isLessonCompleted = currentLessonTotal >= 95;

      // Recalculate Course Progress
      chapters.forEach(ch => {
        ch.lessons.forEach((l: any) => {
          totalPointsPossible += 100;
          const p = newProgressMap[l.id] || {};
          // Score = (Read ? 50 : 0) + (ExamPass ? 50 : 0)
          const rScore = p.read ? 50 : 0;
          const qScore = (p.quiz_score || 0) >= 50 ? 50 : 0;

          totalPointsEarned += (rScore + qScore);
        });
      });

      const newGlobalProgress = totalPointsPossible > 0
        ? Math.round((totalPointsEarned / totalPointsPossible) * 100)
        : 0;

      const { error } = await supabase
        .from('enrollments')
        .update({
          lesson_progress: newProgressMap,
          progress: newGlobalProgress,
          completed_lesson_ids: isLessonCompleted
            ? [...new Set([...(enrollment.completed_lesson_ids || []), currentLesson.id])]
            : (enrollment.completed_lesson_ids || [])
        })
        .eq('id', enrollment.id);

      if (error) throw error;

      // Local Update
      setEnrollment({
        ...enrollment,
        lesson_progress: newProgressMap,
        progress: newGlobalProgress,
        completed_lesson_ids: isLessonCompleted
          ? [...new Set([...(enrollment.completed_lesson_ids || []), currentLesson.id])]
          : (enrollment.completed_lesson_ids || [])
      });

      if (isLessonCompleted && onComplete) onComplete();

    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const handleMarkAsRead = () => {
    updateProgress('read', true);
  };



  // Removed legacy handleMarkAsRead and handleTakeQuiz as they are replaced/automated

  if (loading) return <div className="p-10 text-center">Loading Lesson Content...</div>;
  if (!currentLesson) return <div className="p-10 text-center">No lessons available for this course.</div>;

  const isCompleted = enrollment?.completed_lesson_ids?.includes(currentLesson.id);

  return (
    <div className="flex flex-col h-full bg-white text-slate-900">
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="material-symbols-outlined text-brand-500 p-2 hover:bg-brand-50 rounded-full font-bold">arrow_back</button>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-brand-500 uppercase tracking-wider">{course?.title}</span>
            <span className="text-sm font-bold text-slate-900 truncate max-w-[200px]">{currentLesson.title}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <div className="text-[10px] font-bold text-slate-500 mb-1">LESSON PROGRESS</div>
            <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-500 transition-all duration-500"
                style={{ width: `${Math.round(((enrollment?.lesson_progress?.[currentLesson?.id]?.scroll_percent || 0) / 2) + ((enrollment?.lesson_progress?.[currentLesson?.id]?.quiz_score || 0) >= 50 ? 50 : 0))}%` }}
              ></div>
            </div>
            <span className="text-[10px] font-bold text-brand-500 mt-1">
              {Math.round(((enrollment?.lesson_progress?.[currentLesson?.id]?.scroll_percent || 0) / 2) + ((enrollment?.lesson_progress?.[currentLesson?.id]?.quiz_score || 0) >= 50 ? 50 : 0))}%
            </span>
          </div>


        </div>
      </nav>

      <main className="flex-1 overflow-y-auto custom-scrollbar pb-32 w-full">
        <div className="max-w-3xl mx-auto">
          <header className="px-5 pt-12 pb-4">
            <div className="flex items-center gap-2 text-slate-600 text-xs mb-3 font-bold uppercase">
              <span className="material-symbols-outlined text-sm font-bold">auto_stories</span>
              <span>Unit Lesson</span>
            </div>
            <h1 className="text-3xl font-black leading-tight tracking-tight mb-2 text-slate-900 uppercase">
              {currentLesson.title}
            </h1>
          </header>

          <div className="px-5 space-y-8">
            <article className="space-y-6 text-lg leading-relaxed text-slate-800">
              <div className="prose prose-lg prose-slate max-w-none 
                prose-headings:font-black prose-headings:text-slate-900 prose-headings:tracking-tight 
                prose-p:text-slate-700 prose-p:leading-relaxed 
                prose-strong:text-brand-600 prose-strong:font-black
                prose-ul:list-disc prose-ul:pl-6 prose-li:marker:text-brand-500
                prose-blockquote:border-l-4 prose-blockquote:border-brand-500 prose-blockquote:bg-slate-50 prose-blockquote:py-2 prose-blockquote:px-6 prose-blockquote:rounded-r-lg prose-blockquote:not-italic
                ">
                {currentLesson.content ? (
                  <div dangerouslySetInnerHTML={{ __html: currentLesson.content }} />
                ) : (
                  <div className="p-10 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl text-center">
                    <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">engineering</span>
                    <p className="text-slate-500 font-bold">Lesson content is currently being updated.</p>
                  </div>
                )}
              </div>

              {currentLesson.video_url && (
                <div className="aspect-video rounded-2xl overflow-hidden bg-slate-900 shadow-xl my-8">
                  <iframe src={currentLesson.video_url} className="w-full h-full" allowFullScreen title="Lesson Video" />
                </div>
              )}

              {/* Manual Confirmation Section */}
              <div className="my-12 p-8 bg-slate-50 rounded-3xl border border-slate-200 text-center">
                <h3 className="font-black text-lg text-slate-900 mb-2">Finished Reading?</h3>
                <p className="text-sm text-slate-500 mb-6 font-bold">Mark this lesson as read to complete 50% of your progress.</p>

                {enrollment?.lesson_progress?.[currentLesson.id]?.read ? (
                  <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest cursor-default">
                    <span className="material-symbols-outlined">check_circle</span>
                    Marked as Read
                  </div>
                ) : (
                  <button
                    onClick={handleMarkAsRead}
                    className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-8 py-4 rounded-xl font-black uppercase text-xs tracking-widest shadow-xl shadow-brand-500/20 active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined">check</span>
                    Mark as Completed
                  </button>
                )}
              </div>

              {/* Unit Exam Redirect Section */}
              <section className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl mt-16 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                  <div className="w-16 h-16 bg-brand-500 rounded-2xl flex items-center justify-center shrink-0 shadow-lg mt-2">
                    <span className="material-symbols-outlined text-3xl font-bold">quiz</span>
                  </div>
                  <div className="flex-1 w-full">
                    <h3 className="font-black text-2xl leading-tight uppercase tracking-tight mb-2">Unit Knowledge Check</h3>
                    <p className="text-slate-400 text-sm font-bold mb-6">Complete a comprehensive exam to verify your understanding. Passing score contributes 50% to your lesson progress.</p>

                    {enrollment?.lesson_progress?.[currentLesson.id]?.quiz_score >= 50 ? (
                      <div className="bg-emerald-500/20 border border-emerald-500/50 rounded-2xl p-6 flex items-center justify-between">
                        <div>
                          <h4 className="text-emerald-400 font-black uppercase tracking-widest text-sm">Exam Passed</h4>
                          <p className="text-xs text-emerald-200 mt-1 font-bold">Your Score: {enrollment.lesson_progress[currentLesson.id].quiz_score}%</p>
                        </div>
                        <span className="material-symbols-outlined text-emerald-400 text-3xl">verified</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => onTakeExam && onTakeExam(currentLesson.id, currentLesson.title)}
                        className="inline-flex items-center gap-3 bg-white text-slate-900 hover:bg-brand-50 hover:text-brand-600 px-8 py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-xl active:scale-95"
                      >
                        Start Unit Exam
                        <span className="material-symbols-outlined text-lg">arrow_forward</span>
                      </button>
                    )}
                  </div>
                </div>
              </section>
            </article>
          </div>
        </div>
      </main>

    </div>
  );
};

export default LessonView;
