
import React, { useState, useEffect } from 'react';
import { supabase } from '../src/lib/supabase';
import { Course, Chapter, Lesson } from '../types';

interface CourseDetailsProps {
  onBack: () => void;
  onStartLesson: (lessonId?: string) => void;
  course?: Course;
  previewMode?: boolean;
}

const CourseDetails: React.FC<CourseDetailsProps> = ({ onBack, onStartLesson, course, previewMode = false }) => {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (course?.id) {
      fetchCurriculum();
    }
  }, [course?.id]);

  const fetchCurriculum = async () => {
    try {
      setLoading(true);
      const { data } = await supabase
        .from('chapters')
        .select(`*, lessons(*)`)
        .eq('course_id', course?.id)
        .order('order');

      if (data) {
        // Sort lessons
        const sorted = data.map((ch: any) => ({
          ...ch,
          lessons: ch.lessons.sort((a: any, b: any) => a.order - b.order)
        }));
        setChapters(sorted);
      }
    } catch (error) {
      console.error('Error fetching curriculum:', error);
    } finally {
      setLoading(false);
    }
  };

  // Determine status for each lesson
  // Logic: 
  // 1. First lesson of first chapter is ALWAYS Open.
  // 2. A lesson is OPEN if the PREVIOUS lesson is COMPLETED.
  // 3. A lesson is COMPLETED if progress >= 95% (Scroll + Exam).

  // Flatten lessons to find "previous" easily
  const allLessons = chapters.flatMap(ch => ch.lessons);

  const getLessonStatus = (lessonId: string) => {
    if (previewMode) return { status: 'Locked', icon: 'lock', color: 'slate' };

    // Check granular progress
    const progress = course?.lesson_progress?.[lessonId];
    const scrollScore = Math.round((progress?.scroll_percent || 0) / 2);
    const examScore = (progress?.quiz_score || 0) >= 50 ? 50 : 0;
    const totalScore = scrollScore + examScore;

    // If Completed
    if (totalScore >= 95) {
      return { status: 'Completed', icon: 'check_circle', color: 'emerald' };
    }

    // Check Locking
    const index = allLessons.findIndex(l => l.id === lessonId);
    if (index === 0) {
      return { status: 'Open', icon: 'play_arrow', color: 'brand' }; // First lesson always open
    }

    // Check previous lesson status
    const prevLesson = allLessons[index - 1];
    const prevProgress = course?.lesson_progress?.[prevLesson.id];
    const prevTotal = Math.round((prevProgress?.scroll_percent || 0) / 2) + ((prevProgress?.quiz_score || 0) >= 50 ? 50 : 0);

    if (prevTotal >= 95) {
      return { status: 'Open', icon: 'play_arrow', color: 'brand' };
    }

    return { status: 'Locked', icon: 'lock', color: 'slate' };
  };

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
              <div className="space-y-8">
                {chapters.map((chapter) => (
                  <div key={chapter.id} className="space-y-4">
                    <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest px-2">{chapter.title}</h4>
                    {chapter.lessons?.map((lesson) => {
                      const { status, icon, color } = getLessonStatus(lesson.id);
                      const isLocked = status === 'Locked';
                      return (
                        <div
                          key={lesson.id}
                          onClick={() => {
                            if (!previewMode && !isLocked) onStartLesson(lesson.id);
                            if (isLocked) alert('Complete the previous lesson to unlock this one!');
                          }}
                          className={`p-8 bg-white rounded-[24px] border border-slate-200 shadow-sm flex items-center justify-between transition-all group 
                            ${isLocked ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'hover:border-brand-500 cursor-pointer hover:shadow-xl'}
                          `}
                        >
                          <div className="flex items-center gap-6">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border 
                                        ${status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                isLocked ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-brand-50 text-brand-600 border-brand-200'}
                                    `}>
                              <span className="material-symbols-outlined text-2xl font-bold">{icon}</span>
                            </div>
                            <div>
                              <h4 className={`text-base font-black tracking-tight uppercase transition-colors ${isLocked ? 'text-slate-500' : 'text-slate-900 group-hover:text-brand-500'}`}>{lesson.title}</h4>
                              <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-1">Duration: {lesson.duration || '20m'}</p>
                            </div>
                          </div>
                          {!isLocked && <span className="material-symbols-outlined text-slate-500 group-hover:text-brand-500 transition-colors font-bold">arrow_forward_ios</span>}
                          {isLocked && <span className="material-symbols-outlined text-slate-300 font-bold">lock</span>}
                        </div>
                      );
                    })}
                  </div>
                ))}
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
