
import React, { useState, useMemo } from 'react';

interface LessonsListProps {
  onSelectLesson: (id: string) => void;
  onBack: () => void;
}

const LessonsList: React.FC<LessonsListProps> = ({ onSelectLesson, onBack }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('All Topics');
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 4;

  const lessons = useMemo(() => [
    { id: '1', name: 'Introduction to Vector Spaces', course: 'Adv. Calculus II', image: 'https://picsum.photos/seed/math-l/800/450', description: 'Deep dive into the axioms of vector spaces and linear combinations.' },
    { id: '2', name: 'DNA Sequencing Ethics', course: 'Molecular Genetics', image: 'https://picsum.photos/seed/bio-l/800/450', description: 'Exploring the moral landscape of modern genomic editing and privacy.' },
    { id: '3', name: 'Heuristic Search Algorithms', course: 'CS Algorithms', image: 'https://picsum.photos/seed/cs-l/800/450', description: 'Understanding A* and other informed search techniques in AI.' },
    { id: '4', name: 'Visual Hierarchy in UI Design', course: 'Design Systems', image: 'https://picsum.photos/seed/design-l/800/450', description: 'How to guide user attention through typography, color, and scale.' },
    { id: '5', name: 'Quantum Entanglement Basics', course: 'Physics III', image: 'https://picsum.photos/seed/physics-l/800/450', description: 'Analyzing the phenomenon of non-local correlation in quantum states.' },
    { id: '6', name: 'Macroeconomics 101', course: 'Economics', image: 'https://picsum.photos/seed/econ-l/800/450', description: 'Fiscal policies, inflation, and the dynamics of national production.' },
    { id: '7', name: 'Linear Regression Analysis', course: 'Statistics', image: 'https://picsum.photos/seed/stat-l/800/450', description: 'Predictive modeling through single and multiple variable regression.' },
    { id: '8', name: 'Organic Bond Hybridization', course: 'Chemistry II', image: 'https://picsum.photos/seed/chem-l/800/450', description: 'Sp, sp2, and sp3 orbitals explained through molecular geometry.' },
  ], []);

  // Extract unique topics for the combobox
  const topics = useMemo(() => {
    const uniqueTopics = Array.from(new Set(lessons.map(l => l.course)));
    return ['All Topics', ...uniqueTopics];
  }, [lessons]);

  const filteredLessons = useMemo(() => {
    return lessons.filter(l => {
      const matchesSearch = l.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           l.course.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTopic = selectedTopic === 'All Topics' || l.course === selectedTopic;
      return matchesSearch && matchesTopic;
    });
  }, [lessons, searchTerm, selectedTopic]);

  const totalPages = Math.ceil(filteredLessons.length / itemsPerPage);
  const paginatedLessons = filteredLessons.slice(
    currentPage * itemsPerPage, 
    (currentPage + 1) * itemsPerPage
  );

  const handleNext = () => {
    if (currentPage < totalPages - 1) setCurrentPage(prev => prev + 1);
  };

  const handlePrev = () => {
    if (currentPage > 0) setCurrentPage(prev => prev - 1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(0);
  };

  const handleTopicChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTopic(e.target.value);
    setCurrentPage(0);
  };

  return (
    <div className="p-6 lg:p-10 space-y-10 min-h-full flex flex-col max-w-[1400px] mx-auto pb-24 text-slate-900 bg-slate-100 animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 shrink-0">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-brand-500 font-bold text-[10px] uppercase tracking-[0.3em] mb-2 font-black">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
            Instructional Modules
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight uppercase">Lesson Explanations</h2>
          <p className="text-slate-600 font-medium text-base">Stand-alone deep dives into specific academic topics.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative w-full sm:w-auto">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">filter_list</span>
            <select 
              value={selectedTopic}
              onChange={handleTopicChange}
              className="pl-12 pr-10 py-3 bg-white border border-slate-200 rounded-2xl w-full sm:w-48 appearance-none outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all font-bold text-xs uppercase tracking-widest text-slate-900 shadow-sm cursor-pointer"
            >
              {topics.map(topic => (
                <option key={topic} value={topic}>{topic}</option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-lg">expand_more</span>
          </div>
          
          <div className="relative w-full sm:w-auto">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input 
              type="text" 
              placeholder="Search by title..." 
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-12 pr-6 py-3 bg-white border border-slate-200 rounded-2xl w-full sm:w-64 lg:w-80 outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all font-bold text-xs uppercase tracking-widest text-slate-900 shadow-sm"
            />
          </div>
          <button 
            onClick={onBack}
            className="bg-white border border-slate-300 p-4 rounded-2xl flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm font-black text-[10px] uppercase tracking-widest text-slate-700 w-full sm:w-auto justify-center"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Return
          </button>
        </div>
      </header>

      {/* Grid Display */}
      <div className="flex-1">
        {paginatedLessons.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {paginatedLessons.map((lesson) => (
              <div 
                key={lesson.id} 
                className="bg-white rounded-[40px] overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition-all group flex flex-col cursor-pointer"
                onClick={() => onSelectLesson(lesson.id)}
              >
                <div className="aspect-[2/1] overflow-hidden relative">
                  <img 
                    src={lesson.image} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100" 
                    alt={lesson.name} 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-8">
                     <span className="text-white font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">visibility</span>
                        Enter Lesson Mode
                     </span>
                  </div>
                </div>
                <div className="p-10 flex-1 flex flex-col">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="bg-brand-50 text-brand-600 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-brand-100">
                        {lesson.course}
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-tight group-hover:text-brand-500 transition-colors">
                      {lesson.name}
                    </h3>
                    <p className="text-sm text-slate-500 leading-relaxed font-medium">
                      {lesson.description}
                    </p>
                  </div>
                  <div className="mt-10 pt-8 border-t border-slate-100 flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                           <span className="material-symbols-outlined text-slate-400 text-sm">history</span>
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">15m Duration</span>
                     </div>
                     <span className="material-symbols-outlined text-slate-300 group-hover:text-brand-500 group-hover:translate-x-1 transition-all">arrow_forward</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-96 flex flex-col items-center justify-center text-slate-400 space-y-4">
             <span className="material-symbols-outlined text-6xl">search_off</span>
             <p className="text-sm font-bold uppercase tracking-widest">No lessons matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Navigation / Pagination Footer */}
      {totalPages > 1 && (
        <footer className="flex items-center justify-between pt-10 border-t border-slate-200">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
             Page {currentPage + 1} of {totalPages} • {filteredLessons.length} Results
           </p>
           <div className="flex gap-4">
              <button 
                onClick={handlePrev} 
                disabled={currentPage === 0}
                className="w-12 h-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-600 hover:text-brand-500 hover:border-brand-500 disabled:opacity-30 disabled:pointer-events-none transition-all"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button 
                onClick={handleNext} 
                disabled={currentPage >= totalPages - 1}
                className="w-12 h-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-600 hover:text-brand-500 hover:border-brand-500 disabled:opacity-30 disabled:pointer-events-none transition-all"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
           </div>
        </footer>
      )}
    </div>
  );
};

export default LessonsList;
