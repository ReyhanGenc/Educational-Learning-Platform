
import React, { useState, useEffect } from 'react';
import { supabase } from '../src/lib/supabase';
import { Course, Chapter, Lesson } from '../types';

interface CourseDetailsProps {
  onBack: () => void;
  onStartLesson: (lessonId?: string) => void;
  onTakeExam: (lessonId: string, title: string) => void;
  course?: Course;
  previewMode?: boolean;
}

const CourseDetails: React.FC<CourseDetailsProps> = ({ course, onBack, onStartLesson, onTakeExam, previewMode = false }) => {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingIntro, setViewingIntro] = useState<Chapter | null>(null);

  useEffect(() => {
    const fetchCurriculum = async () => {
      if (!course?.id) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('chapters')
          .select('*, lessons(*)')
          .eq('course_id', course.id)
          .order('order');

        if (error) throw error;
        // Sort lessons
        const sorted = data.map((ch: any) => ({
          ...ch,
          lessons: ch.lessons.sort((a: any, b: any) => a.order - b.order)
        }));
        setChapters(sorted || []);
      } catch (err) {
        console.error('Error fetching curriculum:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCurriculum();
  }, [course?.id]);

  // Determine status for each lesson
  const allLessons = chapters.flatMap(ch => ch.lessons || []);

  const getIntroStatus = (chapterId: string): 'Completed' | 'Open' | 'Locked' => {
    if (previewMode) return 'Locked';
    const progress = course?.lesson_progress?.[`intro-${chapterId}`];
    return progress?.read ? 'Completed' : 'Open';
  };

  const getLessonStatus = (lessonId: string, chapterId: string): { status: 'Completed' | 'Partially Completed' | 'Open' | 'Locked'; icon: string } => {
    if (previewMode) return { status: 'Locked', icon: 'lock' };

    // A lesson is LOCKED if the Chapter Intro is not completed
    const introStatus = getIntroStatus(chapterId);
    if (introStatus !== 'Completed') return { status: 'Locked', icon: 'lock' };

    const progress = course?.lesson_progress?.[lessonId];
    const isLegacy = course?.completed_lesson_ids?.includes(lessonId);

    const readScore = (progress?.read || isLegacy) ? 50 : 0;
    const examScore = ((progress?.quiz_score || 0) >= 50 || isLegacy) ? 50 : 0;
    const totalScore = readScore + examScore;

    if (totalScore >= 95) return { status: 'Completed', icon: 'check_circle' };
    if (readScore >= 50) return { status: 'Partially Completed', icon: 'pending' };

    // Internal locking within chapter
    const chapter = chapters.find(c => c.id === chapterId);
    if (!chapter) return { status: 'Locked', icon: 'lock' };

    const lessons = chapter.lessons || [];
    const index = lessons.findIndex(l => l.id === lessonId);
    if (index === 0) return { status: 'Open', icon: 'play_arrow' };

    const prevLesson = lessons[index - 1];
    const prevStatus = getLessonStatus(prevLesson.id, chapterId).status;
    if (prevStatus === 'Completed') return { status: 'Open', icon: 'play_arrow' };

    return { status: 'Locked', icon: 'lock' };
  };

  const getChapterStatus = (chapterId: string): 'Completed' | 'Open' | 'Locked' => {
    if (previewMode) return 'Locked';
    const chIndex = chapters.findIndex(c => c.id === chapterId);
    if (chIndex === -1) return 'Locked';

    const ch = chapters[chIndex];
    const introDone = getIntroStatus(ch.id) === 'Completed';
    const lessonsDone = ch.lessons && ch.lessons.length > 0 && ch.lessons.every(l => {
      const progress = course?.lesson_progress?.[l.id];
      const isLegacy = course?.completed_lesson_ids?.includes(l.id);
      return (progress?.read || isLegacy) && ((progress?.quiz_score || 0) >= 50 || isLegacy);
    });

    if (introDone && lessonsDone) return 'Completed';
    if (chIndex === 0) return 'Open';

    // A chapter is OPEN if the PREVIOUS chapter is COMPLETED
    const prevCh = chapters[chIndex - 1];
    const prevIntroDone = getIntroStatus(prevCh.id) === 'Completed';
    const prevLessonsDone = prevCh.lessons && prevCh.lessons.length > 0 && prevCh.lessons.every(l => {
      const progress = course?.lesson_progress?.[l.id];
      const isLegacy = course?.completed_lesson_ids?.includes(l.id);
      return (progress?.read || isLegacy) && ((progress?.quiz_score || 0) >= 50 || isLegacy);
    });

    if (prevIntroDone && prevLessonsDone) return 'Open';
    return 'Locked';
  };

  const handleCompleteIntro = async (chapterId: string) => {
    if (previewMode || !course?.id) return;
    try {
      // Find current enrollment
      const { data: enrollment } = await supabase
        .from('enrollments')
        .select('*')
        .eq('course_id', course.id)
        .single();

      if (!enrollment) return;

      const newProgress = {
        ...(enrollment.lesson_progress || {}),
        [`intro-${chapterId}`]: { read: true }
      };

      await supabase
        .from('enrollments')
        .update({ lesson_progress: newProgress })
        .eq('id', enrollment.id);

      setViewingIntro(null);
      // Trigger global refresh
      window.dispatchEvent(new Event('refresh-progress'));
      // Local reload logic if needed, but App.tsx usually handles this via props refresh
    } catch (err) {
      console.error('Error completing intro:', err);
    }
  };

  if (viewingIntro) {
    return (
      <div className="min-h-full bg-white flex flex-col p-8 lg:p-20 relative animate-fade-in overflow-y-auto">
        <button
          onClick={() => setViewingIntro(null)}
          className="absolute top-10 left-10 flex items-center gap-2 text-slate-400 hover:text-slate-900 font-black uppercase tracking-widest text-[10px]"
        >
          <span className="material-symbols-outlined">arrow_back</span> Back
        </button>

        <div className="max-w-3xl mx-auto w-full pt-10">
          <div className="flex items-center gap-3 text-brand-500 font-black uppercase tracking-widest text-xs mb-4">
            <span className="material-symbols-outlined">auto_stories</span>
            <span>{viewingIntro.title}</span>
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight uppercase mb-12">
            {viewingIntro.title}
          </h2>

          <div className="space-y-10">
            {viewingIntro.content_blocks && Array.isArray(viewingIntro.content_blocks) && viewingIntro.content_blocks.map((block: any, idx: number) => (
              block.type === 'text' ? (
                <div key={block.id || idx} className="text-xl text-slate-700 font-medium leading-relaxed prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: block.content }} />
              ) : (
                <div key={block.id || idx} className="rounded-[40px] overflow-hidden border-4 border-slate-100 shadow-2xl">
                  <img src={block.content} className="w-full h-auto object-cover" alt="Intro Visual" />
                </div>
              )
            ))}
          </div>

          <div className="mt-20 pt-10 border-t border-slate-100 flex justify-center">
            <button
              onClick={() => handleCompleteIntro(viewingIntro.id)}
              className="px-12 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl hover:bg-brand-500 transition-all active:scale-95 flex items-center gap-4"
            >
              <span className="material-symbols-outlined font-black">verified</span>
              Understood & Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-100 flex flex-col pb-24 lg:pb-10 text-slate-900">
      <header className="bg-white border-b border-slate-200 px-8 py-6 sticky top-0 z-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="material-symbols-outlined p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-900 font-bold">arrow_back</button>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase leading-none">{course?.title || 'Course Details'}</h1>
            <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest mt-1">
              {course?.category || 'General'} • {course?.instructor || 'Instructor'}
              {previewMode && <span className="ml-2 px-2 py-0.5 bg-brand-100 text-brand-600 rounded-md">PREVIEW MODE</span>}
            </p>
          </div>
        </div>
      </header>

      {/* Hero Image Section */}
      <div className="w-full px-4 lg:px-10 pt-6">
        <div className="aspect-[3/1] rounded-[40px] overflow-hidden shadow-2xl border-4 border-white ring-1 ring-slate-200">
          <img src={course?.image || "https://picsum.photos/seed/calc-main/1200/400"} className="w-full h-full object-cover" alt="Course Hero" />
        </div>
      </div>

      <main className="p-6 lg:p-10 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <section className="bg-white p-12 rounded-[32px] border border-slate-200 shadow-sm space-y-6">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">About Course</h2>
            <p className="text-base text-slate-700 leading-relaxed font-bold">
              {course?.description || "No description available."}
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <div className="bg-brand-50 border border-brand-200 px-6 py-4 rounded-2xl flex flex-col">
                <span className="text-[9px] font-black text-brand-600 uppercase tracking-widest">Level</span>
                <span className="text-xs font-black text-brand-700 uppercase tracking-widest mt-0.5">{course?.level || 'All Levels'}</span>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex justify-between items-center px-2">
              <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Curriculum {previewMode && '(Preview)'}</h2>
            </div>

            {loading ? (
              <div className="p-10 text-center font-bold text-slate-400">Loading Curriculum...</div>
            ) : (
              <div className="space-y-10">
                {chapters.map((chapter) => {
                  const chStatus = getChapterStatus(chapter.id);
                  const isChLocked = chStatus === 'Locked';
                  const isChCompleted = chStatus === 'Completed';
                  const introStatus = getIntroStatus(chapter.id);

                  return (
                    <div key={chapter.id} className={`bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden transition-all duration-500
                                ${isChLocked ? 'opacity-40 grayscale pointer-events-none' : 'opacity-100 grayscale-0'}
                    `}>
                      <div className={`p-8 border-b border-slate-100 flex flex-col gap-2 ${isChCompleted ? 'bg-emerald-50/30' : 'bg-slate-50/50'}`}>
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                            <span className={`w-2 h-2 rounded-full ${isChCompleted ? 'bg-emerald-500' : 'bg-brand-500'}`}></span>
                            {chapter.title}
                          </h4>
                          {isChCompleted && (
                            <span className="material-symbols-outlined text-emerald-500 font-black animate-bounce-in">check_circle</span>
                          )}
                        </div>
                      </div>

                      <div className="p-4 space-y-4">
                        {/* Chapter Intro Button Item */}
                        <div
                          className={`p-6 rounded-[24px] border flex items-center justify-between gap-4 transition-all group cursor-pointer
                             ${introStatus === 'Completed' ? 'bg-slate-50 border-emerald-100' : 'bg-white border-slate-100 hover:border-brand-500 hover:shadow-md'}
                           `}
                          onClick={() => setViewingIntro(chapter)}
                        >
                          <div className="flex items-center gap-6">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border
                              ${introStatus === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-brand-50 text-brand-600 border-brand-200'}
                            `}>
                              <span className="material-symbols-outlined text-2xl font-bold">
                                {introStatus === 'Completed' ? 'verified' : 'auto_stories'}
                              </span>
                            </div>
                            <div>
                              <h4 className={`text-sm font-black tracking-tight uppercase transition-colors group-hover:text-brand-500`}>{chapter.title}</h4>
                              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Start unit from beginning</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {introStatus === 'Completed' ? (
                              <span className="material-symbols-outlined text-emerald-500 font-bold">check_circle</span>
                            ) : (
                              <span className="material-symbols-outlined text-slate-300 group-hover:text-brand-500 transition-colors font-bold">arrow_forward_ios</span>
                            )}
                          </div>
                        </div>

                        {chapter.lessons?.map((lesson) => {
                          const { status, icon } = getLessonStatus(lesson.id, chapter.id);
                          const isLocked = status === 'Locked';
                          return (
                            <div
                              key={lesson.id}
                              className={`p-6 rounded-[24px] border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all group 
                                ${isLocked ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'hover:border-brand-500 cursor-pointer hover:bg-slate-50 hover:shadow-md'}
                              `}
                              onClick={(e) => {
                                if (!previewMode && !isLocked) onStartLesson(lesson.id);
                                if (isLocked) alert(introStatus === 'Completed' ? 'Complete the previous lesson to unlock this one!' : 'Please read the Unit Intro first!');
                              }}
                            >
                              <div className="flex items-center gap-6">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border 
                                            ${status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                    status === 'Partially Completed' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                      isLocked ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-brand-50 text-brand-600 border-brand-200'}
                                        `}>
                                  <span className="material-symbols-outlined text-2xl font-bold">{icon}</span>
                                </div>
                                <div>
                                  <h4 className={`text-sm font-black tracking-tight uppercase transition-colors ${isLocked ? 'text-slate-500' : 'text-slate-900 group-hover:text-brand-500'}`}>{lesson.title}</h4>
                                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Duration: {lesson.duration || '20m'}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                {!isLocked && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onTakeExam(lesson.id, lesson.title);
                                    }}
                                    className="px-4 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-brand-600 transition-all flex items-center gap-2"
                                  >
                                    <span className="material-symbols-outlined text-sm text-brand-400">quiz</span>
                                    Take Exam
                                  </button>
                                )}
                                {!isLocked && <span className="material-symbols-outlined text-slate-300 group-hover:text-brand-500 transition-colors font-bold ml-2">arrow_forward_ios</span>}
                                {isLocked && <span className="material-symbols-outlined text-slate-300 font-bold">lock</span>}
                              </div>
                            </div>
                          );
                        })}

                        {/* Unit Assessment Item */}
                        <div
                          className={`p-6 rounded-[24px] border flex items-center justify-between gap-4 transition-all group cursor-pointer mt-4
                             ${isChCompleted ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-900 text-white border-slate-800 hover:bg-brand-500'}
                             ${introStatus !== 'Completed' ? 'opacity-50 grayscale pointer-events-none' : ''}
                           `}
                          onClick={() => onTakeExam(chapter.id, chapter.title)}
                        >
                          <div className="flex items-center gap-6">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border
                              ${isChCompleted ? 'bg-emerald-100 text-emerald-600 border-emerald-200' : 'bg-white/10 text-white border-white/20'}
                            `}>
                              <span className="material-symbols-outlined text-2xl font-bold">
                                {isChCompleted ? 'verified' : 'fact_check'}
                              </span>
                            </div>
                            <div>
                              <h4 className={`text-sm font-black tracking-tight uppercase`}>Unit Final Assessment</h4>
                              <p className={`text-[9px] font-black uppercase tracking-widest mt-1 ${isChCompleted ? 'text-emerald-600' : 'text-slate-400'}`}>
                                {isChCompleted ? 'Assessment Mastered' : 'Unlock after lessons'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {isChCompleted ? (
                              <span className="material-symbols-outlined text-emerald-500 font-bold">check_circle</span>
                            ) : (
                              <span className="material-symbols-outlined text-white/30 group-hover:text-white transition-colors font-bold">arrow_forward_ios</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-10">
          <div className="bg-slate-900 rounded-[32px] p-10 text-white shadow-2xl relative overflow-hidden">
            {/* Stats Placeholder */}
            <div className="relative z-10">
              <h3 className="text-xl font-black tracking-tight uppercase mb-4">Your Progress</h3>
              <div className="text-4xl font-black tracking-tighter">{course?.progress || 0}%</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CourseDetails;
