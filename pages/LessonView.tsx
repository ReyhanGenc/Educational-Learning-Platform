import React, { useState, useEffect } from 'react';
import { supabase } from '../src/lib/supabase';
import { useAuth } from '../src/contexts/AuthContext';
import { RICH_LESSONS_CONTENT } from '../src/data/rich_lessons';

interface LessonViewProps {
  onBack: () => void;
  courseId: string;
  initialLessonId?: string | null;
  onComplete?: () => void;
  onTakeExam?: (lessonId: string, lessonTitle: string) => void;
}

const LessonView: React.FC<LessonViewProps> = ({ onBack, courseId, initialLessonId, onComplete, onTakeExam }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [chapters, setChapters] = useState<any[]>([]);
  const [currentLesson, setCurrentLesson] = useState<any>(null);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [course, setCourse] = useState<any>(null);

  // Ref for scroll tracking
  const mainRef = React.useRef<HTMLDivElement>(null);
  const [canComplete, setCanComplete] = useState(false);

  useEffect(() => {
    // Reset and delay completion check when lesson changes to avoid accidental mount triggers
    setCanComplete(false);
    const timer = setTimeout(() => setCanComplete(true), 1500);
    return () => clearTimeout(timer);
  }, [currentLesson?.id]);

  useEffect(() => {
    fetchLessonData();
  }, [courseId, initialLessonId, user]);

  const fetchLessonData = async () => {
    // Validate UUID format to avoid Supabase 400 errors
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!courseId || !uuidRegex.test(courseId)) {
      console.warn('LessonView: Invalid courseId format, skipping fetch:', courseId);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Parallelize Course and Chapter fetching
      const courseRes = await supabase.from('courses').select('*').eq('id', courseId).single();
      const chaptersRes = await supabase
        .from('chapters')
        .select('*, lessons (*)')
        .eq('course_id', courseId)
        .order('created_at');

      if (chaptersRes.error) {
        console.error('Error fetching chapters:', chaptersRes.error);
        throw chaptersRes.error;
      }

      setCourse(courseRes.data);

      const chaptersData = chaptersRes.data;

      if (chaptersData) {
        chaptersData.forEach(chapter => {
          // Lessons don't have order yet, sort by created_at
          if (chapter.lessons) {
            chapter.lessons.sort((a: any, b: any) =>
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
          }
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
          .eq('course_id', courseId);

        // Use the first enrollment if multiple exist (shouldn't happen but for safety)
        enrollmentData = (data && data.length > 0) ? data[0] : null;
        setEnrollment(enrollmentData);
      }

      // Determine which lesson to show
      let lessonToLoad = null;

      // Try 0: Specific initial lesson requested
      if (initialLessonId) {
        for (const ch of (chaptersData || [])) {
          const found = ch.lessons.find((l: any) => l.id === initialLessonId);
          if (found) {
            lessonToLoad = found;
            console.log('Loading explicitly requested initial lesson:', lessonToLoad.title);
            break;
          }
        }
      }

      // Try 1: Last accessed
      if (!lessonToLoad && enrollmentData?.last_accessed_lesson_id) {
        for (const ch of (chaptersData || [])) {
          const found = ch.lessons.find((l: any) => l.id === enrollmentData.last_accessed_lesson_id);
          if (found) {
            lessonToLoad = found;
            console.log('Loading last accessed lesson:', lessonToLoad.title);
            break;
          }
        }
      }

      // Try 2: First uncompleted lesson
      if (!lessonToLoad && chaptersData) {
        const completedIds = enrollmentData?.completed_lesson_ids || [];
        for (const ch of chaptersData) {
          for (const l of ch.lessons) {
            if (!completedIds.includes(l.id)) {
              lessonToLoad = l;
              console.log('Loading first uncompleted lesson:', lessonToLoad.title);
              break;
            }
          }
          if (lessonToLoad) break;
        }
      }

      // Try 3: Absolute first lesson of the course
      if (!lessonToLoad && chaptersData) {
        for (const ch of chaptersData) {
          if (ch.lessons && ch.lessons.length > 0) {
            lessonToLoad = ch.lessons[0];
            console.log('Fallback to absolute first lesson:', lessonToLoad.title);
            break;
          }
        }
      }

      console.log('Final lesson plan:', lessonToLoad?.title || 'NONE FOUND');

      // FALLBACK: If we have a high-quality local version of this lesson, Use it!
      // This bypasses any DB permission issues during the 'rebuild' phase.
      if (lessonToLoad && RICH_LESSONS_CONTENT[lessonToLoad.id]) {
        lessonToLoad = {
          ...lessonToLoad,
          content: RICH_LESSONS_CONTENT[lessonToLoad.id]
        };
      }

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

  useEffect(() => {
    if (!loading && !currentLesson && initialLessonId) {
      onBack();
    }
  }, [loading, currentLesson, initialLessonId]);

  // Helper to calculate and update progress
  const updateProgress = async (type: 'read' | 'quiz', value: any) => {
    // CRITICAL: Only track progress for authenticated students
    if (!user || !enrollment || !currentLesson) {
      console.log('Progress tracking disabled for visitor/unauthenticated user');
      return;
    }

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

      const isRead = lessonProgress.read || false;
      const isExamPassed = (lessonProgress.quiz_score || 0) >= 50;
      const isLessonCompleted = isRead; // We only require reading now for this part

      // Recalculate Course Progress based on COMPLETED CHAPTERS
      let totalChaptersCount = chapters.length || 1;
      let completedChaptersCount = 0;

      chapters.forEach(ch => {
        const introDone = (newProgressMap[`intro-${ch.id}`]?.read);
        const lessonsInChapter = ch.lessons || [];
        const lessonsDone = lessonsInChapter.length === 0 || lessonsInChapter.every((l: any) => {
          const p = newProgressMap[l.id] || {};
          return p.read;
        });
        const examDone = (newProgressMap[ch.id]?.quiz_score || 0) >= 50;

        if (introDone && lessonsDone && examDone) {
          completedChaptersCount++;
        }
      });

      const newGlobalProgress = Math.round((completedChaptersCount / totalChaptersCount) * 100);

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
    // Only invoke if not already read to prevent spamming
    if (!enrollment?.lesson_progress?.[currentLesson?.id]?.read) {
      updateProgress('read', true);
    }
  };



  // Removed legacy handleMarkAsRead and handleTakeQuiz as they are replaced/automated

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-10 bg-slate-50 min-h-[400px]">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Loading content...</p>
      </div>
    );
  }

  if (!currentLesson) {
    return null; // Auto-redirecting via useEffect
  }

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
          {user && (
            <div className="flex flex-col items-end">
              <div className="text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-widest">Lesson Progress</div>
              <div className="flex items-center gap-3">
                <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden p-[1px] border border-slate-200">
                  <div
                    className="h-full bg-brand-500 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(72,80,229,0.3)]"
                    style={{ width: `${Math.round(((enrollment?.lesson_progress?.[currentLesson?.id]?.read ? 50 : 0)) + ((enrollment?.lesson_progress?.[currentLesson?.id]?.quiz_score || 0) >= 50 ? 50 : 0))}%` }}
                  ></div>
                </div>
                <span className="text-[10px] font-black text-brand-500">
                  {Math.round(((enrollment?.lesson_progress?.[currentLesson?.id]?.read ? 50 : 0)) + ((enrollment?.lesson_progress?.[currentLesson?.id]?.quiz_score || 0) >= 50 ? 50 : 0))}%
                </span>
              </div>
            </div>
          )}
        </div>
      </nav>

      <main
        ref={mainRef}
        className="flex-1 overflow-y-auto custom-scrollbar pb-32 w-full"
      >
        <div className="max-w-3xl mx-auto">
          <header className="px-5 pt-12 pb-4">
            <div className="flex items-center gap-2 text-brand-500 text-xs mb-3 font-black uppercase tracking-widest">
              <span className="material-symbols-outlined text-sm font-black">auto_stories</span>
              <span>{courseId && courseId !== 'preview-mode' ? 'Unit Content' : 'Subject Explanation'}</span>
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
                {currentLesson.content_blocks && Array.isArray(currentLesson.content_blocks) ? (
                  <div className="space-y-8">
                    {currentLesson.content_blocks.map((block: any) => (
                      block.type === 'text' ? (
                        <div key={block.id} className="text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: block.content }} />
                      ) : (
                        <div key={block.id} className="rounded-[32px] overflow-hidden shadow-2xl border border-slate-200">
                          <img src={block.content} className="w-full h-auto object-cover" alt="Lesson Visual" />
                        </div>
                      )
                    ))}
                  </div>
                ) : currentLesson.content ? (
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

              {/* Actions Section - Restored Card Based Layout */}
              <div className="my-12 grid grid-cols-1 md:grid-cols-2 gap-6">
                {!user ? (
                  <div className="md:col-span-2 p-10 bg-white rounded-[40px] border-2 border-slate-100 text-center shadow-xl shadow-slate-200/40 space-y-6">
                    <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="material-symbols-outlined text-4xl">person_add</span>
                    </div>
                    <div>
                      <h3 className="font-black text-2xl text-slate-900 mb-2 uppercase tracking-tight">Save Your Progress</h3>
                      <p className="text-slate-500 font-medium max-w-md mx-auto">Join the platform to track your academic journey and take exams.</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Mark as Completed Card */}
                    <div className={`p-8 rounded-[32px] border-2 transition-all flex flex-col items-center text-center gap-4
                        ${enrollment?.lesson_progress?.[currentLesson.id]?.read
                        ? 'bg-emerald-50 border-emerald-100 shadow-sm'
                        : 'bg-white border-slate-100 shadow-xl shadow-slate-200/40 hover:border-brand-500'}`}
                    >
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-2 
                        ${enrollment?.lesson_progress?.[currentLesson.id]?.read ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                        <span className="material-symbols-outlined text-2xl font-black">
                          {enrollment?.lesson_progress?.[currentLesson.id]?.read ? 'verified' : 'menu_book'}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-black text-lg text-slate-900 uppercase tracking-tight">Lesson Study</h3>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Mark this session as reviewed</p>
                      </div>
                      <button
                        onClick={handleMarkAsRead}
                        disabled={enrollment?.lesson_progress?.[currentLesson.id]?.read}
                        className={`w-full mt-2 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all
                            ${enrollment?.lesson_progress?.[currentLesson.id]?.read
                            ? 'bg-emerald-100 text-emerald-700 cursor-default'
                            : 'bg-slate-900 text-white shadow-lg hover:bg-brand-500 active:scale-95'
                          }`}
                      >
                        {enrollment?.lesson_progress?.[currentLesson.id]?.read ? 'Completed' : 'Mark Completed'}
                      </button>
                    </div>

                    {/* Take Unit Exam Card */}
                    <div className="p-8 rounded-[32px] bg-white border-2 border-slate-100 shadow-xl shadow-slate-200/40 hover:border-brand-500 transition-all flex flex-col items-center text-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-500 flex items-center justify-center mb-2 shadow-inner">
                        <span className="material-symbols-outlined text-2xl font-black">quiz</span>
                      </div>
                      <div>
                        <h3 className="font-black text-lg text-slate-900 uppercase tracking-tight">Knowledge Check</h3>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Validate your understanding</p>
                      </div>
                      <button
                        onClick={() => onTakeExam?.(currentLesson.chapter_id || currentLesson.id, currentLesson.title)}
                        className="w-full mt-2 py-4 rounded-xl bg-brand-500 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-brand-500/20 hover:bg-brand-600 active:scale-95 transition-all"
                      >
                        Take Unit Exam
                      </button>
                    </div>
                  </>
                )}
              </div>
            </article>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LessonView;
