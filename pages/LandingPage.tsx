
import React from 'react';

interface LandingPageProps {
  onStart: () => void;
  onRegister: () => void;
  onPricing: () => void;
  onViewLessons?: () => void;
  onSelectLesson?: (courseId: string, lessonId: string) => void;
  onExploreCourses?: () => void;
  onPreviewCourse?: (course: any) => void;
  featuredLessons?: any[];
  featuredCourses?: any[];
}

const LandingPage: React.FC<LandingPageProps> = ({
  onStart,
  onRegister,
  onPricing,
  onViewLessons,
  onSelectLesson,
  onExploreCourses,
  onPreviewCourse,
  featuredLessons = [],
  featuredCourses = []
}) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const container = scrollRef.current;
      const card = container.firstElementChild as HTMLElement;
      if (card) {
        const cardWidth = card.offsetWidth;
        const gap = 32; // gap-8 is 32px
        const scrollStep = (cardWidth + gap) * 3;

        container.scrollBy({
          left: direction === 'left' ? -scrollStep : scrollStep,
          behavior: 'smooth'
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-brand-100 selection:text-brand-700 overflow-x-hidden">
      {/* Subtle Background Glows */}
      <div className="fixed -top-24 -left-24 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="fixed top-1/2 -right-24 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-2.5 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[24px]">school</span>
              </div>
              <span className="font-bold text-2xl tracking-tight text-slate-900">EduExam</span>
            </div>

            <div className="hidden md:flex items-center gap-10">
              <a href="#lessons" className="text-sm font-semibold text-slate-500 hover:text-brand-500 transition-colors uppercase tracking-widest">Explanations</a>
              <a href="#features" className="text-sm font-semibold text-slate-500 hover:text-brand-500 transition-colors uppercase tracking-widest">Features</a>
              <button onClick={onPricing} className="text-sm font-semibold text-slate-500 hover:text-brand-500 transition-colors uppercase tracking-widest">Pricing</button>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={onStart}
                className="hidden sm:block text-sm font-bold text-slate-600 hover:text-brand-500 transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={onRegister}
                className="bg-brand-500 hover:bg-brand-600 text-white px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-xl shadow-brand-500/20 active:scale-95 flex items-center gap-2"
              >
                Sign Up for Free
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-52 lg:pb-40 px-4">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-50 border border-brand-100 text-brand-700 text-xs font-bold mb-8 animate-bounce-subtle">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
            </span>
            Future of Learning
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-slate-900 tracking-tight leading-[0.95] mb-8 max-w-5xl mx-auto">
            The future of <span className="bg-gradient-to-r from-brand-500 to-indigo-600 bg-clip-text text-transparent">academic success</span> is here.
          </h1>

          <p className="text-xl md:text-2xl text-slate-500 mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
            Elevate learning with precision exam tools, immersive 3D content, and analytics that actually make sense.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
            <button
              onClick={onStart}
              className="w-full sm:w-auto px-10 py-5 bg-slate-900 hover:bg-black text-white text-lg font-bold rounded-2xl shadow-2xl transition-all flex items-center justify-center gap-3 group"
            >
              Get Started for Free
              <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">bolt</span>
            </button>
            <button
              onClick={onViewLessons}
              className="w-full sm:w-auto px-10 py-5 bg-white border border-slate-200 text-slate-700 text-lg font-bold rounded-2xl hover:bg-slate-50 transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">menu_book</span>
              View Free Lessons
            </button>
          </div>
        </div>
      </section>

      {/* Featured Lesson Explanations Section */}
      <section id="lessons" className="py-24 px-4 bg-white border-y border-slate-100 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div className="space-y-4 max-w-2xl">
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-none uppercase">
                Master Complex Topics
              </h2>
              <p className="text-lg text-slate-500 font-medium">
                Our immersive Lesson Explanations break down advanced institutional concepts into visual, interactive deep-dives.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex gap-2 mr-4">
                <button
                  onClick={() => scroll('left')}
                  className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-brand-500 hover:text-white hover:border-brand-500 transition-all shadow-sm active:scale-90"
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <button
                  onClick={() => scroll('right')}
                  className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-brand-500 hover:text-white hover:border-brand-500 transition-all shadow-sm active:scale-90"
                >
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
              <button
                onClick={onViewLessons}
                className="px-8 py-4 bg-brand-50 text-brand-600 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] hover:bg-brand-500 hover:text-white transition-all shadow-sm active:scale-95 whitespace-nowrap"
              >
                Explore All
              </button>
            </div>
          </div>

          <div
            ref={scrollRef}
            className="flex gap-8 overflow-x-auto pb-12 no-scrollbar snap-x snap-mandatory px-4"
            style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
          >
            {featuredLessons.map((lesson, i) => (
              <div
                key={i}
                className="min-w-[280px] md:min-w-[380px] snap-start"
              >
                <div
                  className="group relative bg-slate-50 rounded-[40px] overflow-hidden border border-slate-100 hover:border-brand-500 transition-all cursor-pointer hover:shadow-2xl h-full"
                  onClick={() => onSelectLesson?.(lesson.courseId, lesson.id)}
                >
                  <div className="aspect-[4/3] overflow-hidden relative">
                    <img src={lesson.image || `https://picsum.photos/seed/${lesson.id}/1200/800`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={lesson.title} />
                    <div className="absolute top-6 left-6">
                      <span className="bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-900 shadow-sm">
                        {lesson.category} • {lesson.courseTitle}
                      </span>
                    </div>
                  </div>
                  <div className="p-8 space-y-3">
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight group-hover:text-brand-500 transition-colors line-clamp-1">
                      {lesson.title}
                    </h3>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">
                      Course: {lesson.courseTitle}
                    </p>
                    <div className="pt-4 flex items-center text-brand-500 gap-2 text-[10px] font-black uppercase tracking-widest">
                      <span>Start Learning</span>
                      <span className="material-symbols-outlined text-sm font-bold group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section id="features" className="py-32 px-4 bg-slate-50/50 relative">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 leading-tight">
                Designed for the <span className="text-brand-500">modern</span> educator.
              </h2>
              <p className="text-lg text-slate-500 mb-10 leading-relaxed font-medium">
                Our suite of tools eliminates administrative overhead, letting you focus on what matters most: student growth and meaningful assessment.
              </p>

              <div className="space-y-6">
                {[
                  { title: "Smart Proctoring", desc: "AI-driven identity verification and activity monitoring.", icon: "security" },
                  { title: "Dynamic Questions", desc: "Support for 20+ question types including interactive code and math.", icon: "extension" },
                  { title: "Instant Feedback", desc: "Automated grading and personalized performance reports.", icon: "speed" }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-2xl hover:bg-white transition-colors group">
                    <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-500 flex items-center justify-center shrink-0 group-hover:bg-brand-500 group-hover:text-white transition-all">
                      <span className="material-symbols-outlined">{item.icon}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{item.title}</h4>
                      <p className="text-slate-500 text-sm font-medium">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4 pt-12">
                <div className="bg-white p-2 rounded-3xl shadow-xl border border-slate-100">
                  <img src="https://picsum.photos/seed/feature1/1200/800" className="rounded-2xl" alt="Feature 1" />
                </div>
                <div className="bg-white p-2 rounded-3xl shadow-xl border border-slate-100">
                  <img src="https://picsum.photos/seed/feature2/1200/800" className="rounded-2xl" alt="Feature 2" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-white p-2 rounded-3xl shadow-xl border border-slate-100">
                  <img src="https://picsum.photos/seed/feature3/1200/800" className="rounded-2xl" alt="Feature 3" />
                </div>
                <div className="bg-brand-500 p-8 rounded-3xl shadow-xl text-white flex flex-col justify-end min-h-[200px]">
                  <h4 className="text-2xl font-bold leading-tight">Join 5,000+ Schools</h4>
                  <p className="text-brand-100 text-sm mt-2 font-medium">Standardizing excellence.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Course Catalog Preview - Call to Action */}
      <section className="py-24 px-4 bg-slate-900 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-brand-500/10 blur-[120px] rounded-full pointer-events-none -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-1/4 h-full bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none translate-y-1/2"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16 space-y-4">
            <div className="inline-flex px-4 py-2 rounded-full bg-white/5 border border-white/10 text-brand-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
              Premium Learning Paths
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight uppercase">
              Expansive <span className="text-brand-400">Course Ecosystem</span>
            </h2>
            <p className="text-slate-400 text-lg font-medium max-w-2xl mx-auto">
              Unlock professional-grade curricula across engineering, health, and social sciences.
              Join thousands of students on their journey to mastery.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {featuredCourses.slice(0, 3).map((course, i) => (
              <div
                key={i}
                className="bg-white rounded-[24px] shadow-2xl border border-slate-200 overflow-hidden flex flex-col group hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all duration-700 h-[520px]"
              >
                <div className="relative aspect-video overflow-hidden">
                  <img src={course.image || `https://picsum.photos/seed/${course.id}/800/1000`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={course.title} />
                  <div className="absolute top-6 left-6 flex flex-col gap-2">
                    <span className="bg-white/95 backdrop-blur-md py-1.5 px-3 rounded-lg text-[8px] font-black text-slate-900 uppercase tracking-widest shadow-lg border border-slate-200">
                      {course.category}
                    </span>
                  </div>
                </div>

                <div className="p-8">
                  <div>
                    <h3 className="font-black text-slate-900 text-base mb-3 leading-tight tracking-tight group-hover:text-brand-500 transition-colors uppercase line-clamp-2">
                      {course.title}
                    </h3>
                    <div className="flex items-center gap-2 text-slate-600 mb-4 font-bold">
                      <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${course.instructor || 'Instructor'}`} className="w-5 h-5 rounded-full ring-2 ring-slate-200" />
                      <p className="text-[9px] font-black uppercase tracking-widest">{course.instructor || 'Lead Instructor'}</p>
                    </div>
                    <p className="text-[9px] text-slate-600 font-bold leading-relaxed">
                      Integrated curriculum covering advanced methodologies within the {course.category} institutional framework.
                    </p>
                  </div>

                  <div className="space-y-4 mt-6">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={onRegister}
                          className="flex-1 bg-brand-500 text-white py-4 rounded-xl font-black text-[9px] uppercase tracking-[0.3em] hover:bg-brand-600 transition-all flex items-center justify-center gap-2 shadow-xl active:scale-95"
                        >
                          Join Us
                          <span className="material-symbols-outlined text-base font-bold">bolt</span>
                        </button>
                        <button
                          onClick={() => onPreviewCourse?.(course)}
                          className="w-14 h-14 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center hover:bg-slate-200 transition-all active:scale-95 shadow-md group/preview"
                        >
                          <span className="material-symbols-outlined text-xl group-hover/preview:scale-110 transition-transform">visibility</span>
                        </button>
                      </div>
                      <p className="text-[7px] text-center font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
                        <span>Preview available</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        <span className="text-slate-900 font-black">${course.price ? Number(course.price).toFixed(2) : '0.00'}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <button
              onClick={onExploreCourses}
              className="inline-flex items-center gap-3 px-12 py-5 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-widest hover:bg-brand-50 transition-all active:scale-95 shadow-2xl"
            >
              Explore Full Catalog
              <span className="material-symbols-outlined">rocket_launch</span>
            </button>
          </div>
        </div>
      </section>

      <footer className="py-12 px-4 border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-[20px]">school</span>
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">EduExam</span>
          </div>

          <p className="text-slate-400 text-sm font-medium">&copy; 2024 EduExam Academic Systems. All rights reserved.</p>

          <div className="flex gap-6">
            {/* Empty icons removed */}
          </div>
        </div>
      </footer>

      {/* Custom Styles for landing specific animations */}
      <style>{`
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 3s infinite ease-in-out;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
