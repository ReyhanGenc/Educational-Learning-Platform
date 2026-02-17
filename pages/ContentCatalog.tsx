
import React, { useState } from 'react';

import { Course } from '../types';

interface ContentCatalogProps {
  courses: Course[];
  onSelectCourse: (id: string) => void;
  cart: Course[];
  onAddToCart: (course: Course) => void;
  onOpenCart: () => void;
  onPreview: (course: Course) => void;
}

const ContentCatalog: React.FC<ContentCatalogProps> = ({ courses, onSelectCourse, cart, onAddToCart, onOpenCart, onPreview }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.instructor.toLowerCase().includes(searchQuery.toLowerCase())
  );
  return (
    <div className="p-6 lg:p-10 space-y-10 h-full overflow-hidden flex flex-col max-w-[1600px] mx-auto pb-24 text-slate-900">
      <header className="shrink-0 flex items-center justify-between">
        <div className="flex-1">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight uppercase tracking-[0.1em]">Curriculum Catalog</h1>
          <p className="text-slate-600 mt-1 text-sm font-medium">Personalized Institutional Academic Pathways.</p>
        </div>
        <div className="flex items-center gap-6 flex-1 justify-end">
          <div className="relative w-full max-w-md hidden md:block">
            <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">search</span>
            <input
              type="text"
              placeholder="Search by title, subject or instructor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-5 py-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm text-xs font-bold uppercase tracking-widest outline-none focus:border-brand-500 transition-all text-slate-900"
            />
          </div>
          <button
            onClick={onOpenCart}
            className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center relative hover:bg-slate-50 transition-colors shrink-0"
          >
            <span className="material-symbols-outlined text-slate-700">shopping_cart</span>
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 w-6 h-6 bg-brand-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-slate-50">
                {cart.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Mobile Search */}
      <div className="md:hidden relative w-full mb-4">
        <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">search</span>
        <input
          type="text"
          placeholder="Search assessments..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-14 pr-5 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm text-xs font-bold uppercase tracking-widest outline-none focus:border-brand-500 transition-all text-slate-900"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 overflow-y-auto custom-scrollbar pb-20 px-2">
        {filteredCourses.length > 0 ? (
          filteredCourses.map(course => (
            <div key={course.id} className="bg-white rounded-[24px] shadow-[0_4px_30px_rgba(0,0,0,0.02)] border border-slate-200 overflow-hidden flex flex-col group hover:shadow-2xl transition-all duration-700 min-h-[650px]">
              <div className="relative aspect-[4/5] overflow-hidden">
                <img src={course.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={course.title} />
                <div className="absolute top-8 left-8 flex flex-col gap-2">
                  <span className="bg-white/95 backdrop-blur-md py-2 px-4 rounded-lg text-[8px] font-black text-slate-900 uppercase tracking-widest shadow-lg border border-slate-200">
                    {course.category}
                  </span>
                  {course.isPurchased && (
                    <span className="bg-brand-500 text-white py-2 px-4 rounded-lg text-[8px] font-black uppercase tracking-widest shadow-lg">
                      {course.progress}% Completed
                    </span>
                  )}
                </div>
              </div>

              <div className="p-10 flex flex-col flex-1">
                <div className="flex-1">
                  <h3 className="font-black text-slate-900 text-lg mb-4 leading-tight tracking-tight group-hover:text-brand-500 transition-colors uppercase line-clamp-2">
                    {course.title}
                  </h3>
                  <div className="flex items-center gap-2.5 text-slate-600 mb-6 font-bold">
                    <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${course.instructor}`} className="w-6 h-6 rounded-full ring-2 ring-slate-200" />
                    <p className="text-[10px] font-black uppercase tracking-widest">{course.instructor}</p>
                  </div>
                  <p className="text-[10px] text-slate-600 font-bold leading-relaxed mb-8">
                    Integrated curriculum covering advanced methodologies within the {course.category} institutional framework.
                  </p>
                </div>

                <div className="space-y-8 mt-auto">
                  {course.isPurchased ? (
                    <>
                      <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest">
                        <span className="text-slate-500">Progression</span>
                        <span className="text-slate-900">{course.completed} / {course.total} Units</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200 p-[1px]">
                        <div className="h-full bg-brand-500 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(72,80,229,0.3)]" style={{ width: `${course.progress}%` }}></div>
                      </div>
                      <button
                        onClick={() => onSelectCourse(course.id)}
                        className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-brand-500 transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95"
                      >
                        Continue
                        <span className="material-symbols-outlined text-lg font-bold">play_arrow</span>
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-4">
                        {cart.find(c => c.id === course.id) ? (
                          <button
                            disabled
                            className="flex-1 bg-emerald-500 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 shadow-xl opacity-90 cursor-default"
                          >
                            In Cart
                            <span className="material-symbols-outlined text-lg font-bold">check</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => onAddToCart(course)}
                            className="flex-1 bg-brand-500 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-brand-600 transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95"
                          >
                            Add to Cart
                            <span className="material-symbols-outlined text-lg font-bold">shopping_cart</span>
                          </button>
                        )}
                        <button
                          onClick={() => onPreview(course)}
                          className="w-16 h-16 bg-slate-100 text-slate-500 rounded-2xl flex items-center justify-center hover:bg-slate-200 transition-all active:scale-95 shadow-md group/preview"
                          title="Preview Chapter 1"
                        >
                          <span className="material-symbols-outlined text-2xl group-hover/preview:scale-110 transition-transform">visibility</span>
                        </button>
                      </div>
                      <p className="text-[8px] text-center font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
                        <span>Preview available for Chapter 1</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        <span className="text-slate-900">${course.price}</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center space-y-4 bg-white/50 backdrop-blur-sm rounded-[32px] border border-dashed border-slate-300">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
              <span className="material-symbols-outlined text-4xl">search_off</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">No courses found</h3>
              <p className="text-slate-500 text-sm mt-1">We couldn't find any courses matching "{searchQuery}"</p>
            </div>
            <button
              onClick={() => setSearchQuery('')}
              className="text-brand-500 font-bold text-sm hover:underline"
            >
              Clear search
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentCatalog;
