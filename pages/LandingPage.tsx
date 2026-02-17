
import React from 'react';

interface LandingPageProps {
  onStart: () => void;
  onRegister: () => void;
  onPricing: () => void;
  onViewLessons?: () => void;
  onSelectLesson?: (id: string) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart, onRegister, onPricing, onViewLessons, onSelectLesson }) => {
  const featuredLessons = [
    { id: '1', title: 'Vector Space Foundations', category: 'Math', image: 'https://picsum.photos/seed/math-hero/600/400', desc: 'A geometric deep-dive into linear combinations.' },
    { id: '2', title: 'CRISPR & Gene Editing', category: 'Biology', image: 'https://picsum.photos/seed/bio-hero/600/400', desc: 'Understanding the future of molecular genetics.' },
    { id: '3', title: 'A* Pathfinding Logic', category: 'CS', image: 'https://picsum.photos/seed/cs-hero/600/400', desc: 'Heuristics and search space optimization.' },
  ];

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
      <section id="lessons" className="py-24 px-4 bg-white border-y border-slate-100">
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
            <button
              onClick={onViewLessons}
              className="px-8 py-4 bg-brand-50 text-brand-600 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] hover:bg-brand-500 hover:text-white transition-all shadow-sm active:scale-95"
            >
              Explore All Explanations
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {featuredLessons.map((lesson, i) => (
              <div
                key={i}
                className="group relative bg-slate-50 rounded-[40px] overflow-hidden border border-slate-100 hover:border-brand-500 transition-all cursor-pointer hover:shadow-2xl"
                onClick={() => onSelectLesson?.(lesson.id)}
              >
                <div className="aspect-[4/3] overflow-hidden relative">
                  <img src={lesson.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={lesson.title} />
                  <div className="absolute top-6 left-6">
                    <span className="bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-900 shadow-sm">
                      {lesson.category}
                    </span>
                  </div>
                </div>
                <div className="p-8 space-y-3">
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight group-hover:text-brand-500 transition-colors">
                    {lesson.title}
                  </h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">
                    {lesson.desc}
                  </p>
                  <div className="pt-4 flex items-center text-brand-500 gap-2 text-[10px] font-black uppercase tracking-widest">
                    <span>Start Learning</span>
                    <span className="material-symbols-outlined text-sm font-bold group-hover:translate-x-1 transition-transform">arrow_forward</span>
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
                  <img src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=400&q=80" className="rounded-2xl" alt="Feature 1" />
                </div>
                <div className="bg-white p-2 rounded-3xl shadow-xl border border-slate-100">
                  <img src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=400&q=80" className="rounded-2xl" alt="Feature 2" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-white p-2 rounded-3xl shadow-xl border border-slate-100">
                  <img src="https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=400&q=80" className="rounded-2xl" alt="Feature 3" />
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
      `}</style>
    </div>
  );
};

export default LandingPage;
