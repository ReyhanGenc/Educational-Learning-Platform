
import React from 'react';

import { Course } from '../types';

interface CourseDetailsProps {
  onBack: () => void;
  onStartLesson: () => void;
  course?: Course;
  previewMode?: boolean;
}

const CourseDetails: React.FC<CourseDetailsProps> = ({ onBack, onStartLesson, course, previewMode = false }) => {
  const syllabus = [
    { title: 'Foundations of Vector Calculus', duration: '45m', status: 'Completed', id: '1' },
    { title: 'Linear Transformations & Matrices', duration: '1h 12m', status: 'Current', id: '2' },
    { title: 'Eigenvalues and Eigenvectors', duration: '55m', status: 'Locked', id: '3' },
    { title: 'Complex Vector Spaces', duration: '1h 30m', status: 'Locked', id: '4' },
    { title: 'Differential Geometry Intro', duration: '50m', status: 'Locked', id: '5' },
  ];

  const displaySyllabus = previewMode ? syllabus.map((item, index) => ({
    ...item,
    status: index === 0 ? item.status : 'Locked'
  })) : syllabus;

  return (
    <div className="min-h-full bg-slate-100 flex flex-col pb-24 lg:pb-10 text-slate-900">
      <header className="bg-white border-b border-slate-200 px-8 py-6 sticky top-0 z-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="material-symbols-outlined p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-900 font-bold">arrow_back</button>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase leading-none">{course?.title || 'Advanced Calculus II'}</h1>
            <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest mt-1">
              {course?.category || 'Mathematics'} • {course?.instructor || 'Dr. Sarah Jenkins'}
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
            <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Institutional Syllabus</h2>
            <p className="text-base text-slate-700 leading-relaxed font-bold">
              {previewMode ?
                "This preview gives you access to the first chapter of the course. Unlock the full course to access all modules, resources, and certification." :
                "This course explores the advanced mechanics of vector calculus within the context of linear transformations. Students will develop a deep theoretical understanding of multidimensional spaces, focusing on differential forms, Stokes' theorem, and applications in theoretical physics."
              }
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <div className="bg-brand-50 border border-brand-200 px-6 py-4 rounded-2xl flex flex-col">
                <span className="text-[9px] font-black text-brand-600 uppercase tracking-widest">Difficulty</span>
                <span className="text-xs font-black text-brand-700 uppercase tracking-widest mt-0.5">Advanced</span>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex justify-between items-center px-2">
              <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Curriculum {previewMode && '(Preview)'}</h2>
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">{previewMode ? '1 Chapter Available' : '5 Modules • 12.5 Total Hours'}</span>
            </div>
            <div className="space-y-4">
              {displaySyllabus.map((lesson) => (
                <div
                  key={lesson.id}
                  onClick={lesson.status !== 'Locked' ? onStartLesson : undefined}
                  className={`p-8 bg-white rounded-[24px] border border-slate-200 shadow-sm flex items-center justify-between transition-all group ${lesson.status === 'Locked' ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:border-brand-500 cursor-pointer hover:shadow-xl'
                    }`}
                >
                  <div className="flex items-center gap-6">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${lesson.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                      lesson.status === 'Current' ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30 border-brand-500' :
                        'bg-slate-100 text-slate-500 border-slate-200'
                      }`}>
                      <span className="material-symbols-outlined text-2xl font-bold">
                        {lesson.status === 'Completed' ? 'check' : lesson.status === 'Current' ? 'play_arrow' : 'lock'}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-base font-black text-slate-900 tracking-tight uppercase group-hover:text-brand-500 transition-colors">{lesson.title}</h4>
                      <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-1">Duration: {lesson.duration} • Theoretical Unit</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-slate-500 group-hover:text-brand-500 transition-colors font-bold">arrow_forward_ios</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-10">
          <div className="bg-slate-900 rounded-[32px] p-10 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/20 rounded-full -mr-16 -mt-16 blur-3xl"></div>
            <div className="relative z-10 space-y-8">
              <div>
                <h3 className="text-xl font-black tracking-tight uppercase">Performance Goal</h3>
                <p className="text-slate-400 text-[10px] uppercase tracking-widest mt-1 font-bold">Institutional Benchmark</p>
              </div>
              {!previewMode && (
                <div className="flex flex-col items-center justify-center py-6">
                  <div className="text-5xl font-black tracking-tighter">88%</div>
                  <div className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.3em] mt-2">Predicted Mastery</div>
                </div>
              )}
              {!previewMode && (
                <div className="h-4"></div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-[32px] p-10 border border-slate-200 shadow-sm space-y-8">
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Resources</h3>
            {previewMode ? (
              <div className="flex flex-col items-center justify-center py-10 opacity-50">
                <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">lock</span>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Resources Locked</p>
              </div>
            ) : (
              <div className="space-y-4">
                {['Lecture Notes.pdf', 'Cheat Sheet.pdf', 'Exercise Lab.zip'].map((res, i) => (
                  <div key={i} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-200 group transition-all">
                    <div className="flex items-center gap-4">
                      <span className="material-symbols-outlined text-slate-600 font-bold">description</span>
                      <span className="text-xs font-black text-slate-800 uppercase tracking-widest">{res}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CourseDetails;
