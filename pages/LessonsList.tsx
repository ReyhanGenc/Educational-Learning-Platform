import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '../src/lib/supabase';

interface LessonsListProps {
  onSelectLesson: (courseId: string, lessonId: string) => void;
  onBack: () => void;
}

const LessonsList: React.FC<LessonsListProps> = ({ onSelectLesson, onBack }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('All Topics');
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lessons, setLessons] = useState<any[]>([]);
  const itemsPerPage = 6;

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        setLoading(true);
        // Fetch lessons with chapter and course context
        const { data, error } = await supabase
          .from('lessons')
          .select(`
            id,
            title,
            chapters!inner (
              title,
              courses!inner (
                id,
                title,
                category,
                image,
                description
              )
            )
          `);

        if (error) throw error;

        // Flatten the structure for easier UI use
        const flattened = (data || []).map(item => {
          const chapter = Array.isArray(item.chapters) ? item.chapters[0] : item.chapters;
          const course = chapter ? (Array.isArray(chapter.courses) ? chapter.courses[0] : chapter.courses) : null;

          return {
            id: item.id,
            title: item.title,
            chapterTitle: chapter?.title,
            courseId: course?.id,
            courseTitle: course?.title,
            category: course?.category || 'Educational',
            image: course?.image,
            description: course?.description || ''
          };
        });

        setLessons(flattened);
      } catch (err) {
        console.error('Error fetching lessons list:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLessons();
  }, []);

  // Extract unique topics (categories) for the filter
  const topics = useMemo(() => {
    const uniqueTopics = Array.from(new Set(lessons.map(l => l.category)));
    return ['All Topics', ...uniqueTopics];
  }, [lessons]);

  const filteredLessons = useMemo(() => {
    return lessons.filter(l => {
      const matchesSearch = l.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (l.courseTitle && l.courseTitle.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesTopic = selectedTopic === 'All Topics' || l.category === selectedTopic;
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

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center bg-slate-100">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Loading Lessons...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 space-y-10 min-h-full flex flex-col max-w-[1400px] mx-auto pb-24 text-slate-900 bg-slate-100 animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 shrink-0">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-brand-500 font-bold text-[10px] uppercase tracking-[0.3em] mb-2 font-black">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
            Instructional Modules
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight uppercase">Subject Explanations</h2>
          <p className="text-slate-600 font-medium text-base">Explore deep-dive lessons across all registered academic courses.</p>
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
              placeholder="Search by lesson title..."
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-10">
            {paginatedLessons.map((lesson) => (
              <div
                key={lesson.id}
                className="bg-white rounded-[40px] overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition-all group flex flex-col cursor-pointer"
                onClick={() => onSelectLesson(lesson.courseId, lesson.id)}
              >
                <div className="aspect-[2/1] overflow-hidden relative">
                  <img
                    src={lesson.image || `https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&q=80`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                    alt={lesson.title}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-8">
                    <span className="text-white font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">visibility</span>
                      Read Explanation
                    </span>
                  </div>
                </div>
                <div className="p-8 lg:p-10 flex-1 flex flex-col">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="bg-brand-50 text-brand-600 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-brand-100">
                        {lesson.category} • {lesson.courseTitle}
                      </span>
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-tight group-hover:text-brand-500 transition-colors">
                      {lesson.title}
                    </h3>
                    <p className="text-sm text-slate-500 leading-relaxed font-medium line-clamp-2">
                      Chapter: {lesson.chapterTitle} — {lesson.description}
                    </p>
                  </div>
                  <div className="mt-8 pt-8 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                        <span className="material-symbols-outlined text-slate-400 text-sm">auto_stories</span>
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Konu Anlatımı
                      </span>
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
            <p className="text-sm font-bold uppercase tracking-widest">No lessons matching your search.</p>
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
