
import React, { useState, useEffect } from 'react';
import { supabase } from '../src/lib/supabase';
import { UserRole } from '../types';
import { useAuth } from '../src/contexts/AuthContext';

type ManagementView = 'list' | 'create-course' | 'create-exam' | 'create-lesson' | 'view-course' | 'view-lesson' | 'view-exam';

interface QuestionOption {
  id: string;
  text: string;
}

interface Question {
  id: string;
  type: string;
  text: string;
  points: number;
  difficulty: string;
  options: QuestionOption[];
  correctOptionId: string;
}

interface ContentBlock {
  id: string;
  type: 'text' | 'image';
  content: string;
}

interface Chapter {
  id: string;
  title: string;
  blocks: ContentBlock[];
}

const Management: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'courses' | 'exams' | 'lessons'>('courses');
  const [view, setView] = useState<ManagementView>('list');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; itemName: string; itemId: string | number } | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [courseImage, setCourseImage] = useState<string | null>(null);
  const [lessonImage, setLessonImage] = useState<string | null>(null);
  const [courseChapters, setCourseChapters] = useState<Chapter[]>([]);
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [lessonBlocks, setLessonBlocks] = useState<ContentBlock[]>([]);
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [currentModalQuestion, setCurrentModalQuestion] = useState<Partial<Question>>({});

  const { user, userMetadata } = useAuth();
  const instructorName = userMetadata?.full_name || 'Anonymous Instructor';

  const [realCourses, setRealCourses] = useState<any[]>([]);
  const [realExams, setRealExams] = useState<any[]>([]);
  const [realLessons, setRealLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      if (activeTab === 'courses') {
        const { data } = await supabase
          .from('courses')
          .select('*')
          .eq('instructor', instructorName)
          .order('created_at', { ascending: false });
        setRealCourses(data || []);
      } else if (activeTab === 'exams') {
        const { data, error } = await supabase
          .from('exams')
          .select('*')
          .eq('instructor', instructorName)
          .order('created_at', { ascending: false });

        if (error && (error.code === 'PGRST116' || error.message.includes('column'))) { // Column not found fallback
          const { data: allData } = await supabase.from('exams').select('*').order('created_at', { ascending: false });
          setRealExams(allData || []);
        } else {
          setRealExams(data || []);
        }
      } else if (activeTab === 'lessons') {
        const { data } = await supabase
          .from('lessons')
          .select('*, chapters!inner(title, courses!inner(title, instructor))')
          .eq('chapters.courses.instructor', instructorName)
          .order('created_at', { ascending: false });
        setRealLessons(data || []);
      }
    } catch (err) {
      console.error('Error fetching management data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'course' | 'lesson' | { type: 'course-block' | 'lesson-block', id: string }) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (target === 'course') setCourseImage(result);
        else if (target === 'lesson') setLessonImage(result);
        else {
          updateBlock(target.type === 'course-block' ? 'course' : 'lesson', target.id, result);
        }
      };
      reader.onerror = () => console.error("FileReader error");
      reader.readAsDataURL(file);
    }
  };

  const uploadTargetRef = React.useRef<{ type: 'course' | 'lesson' | 'course-block' | 'lesson-block', id?: string } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const triggerFileUpload = (target: 'course' | 'lesson' | 'course-block' | 'lesson-block', id?: string) => {
    uploadTargetRef.current = { type: target, id };
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const startNewArchitect = (type: 'course' | 'exam' | 'lesson') => {
    setSelectedItem(null);
    if (type === 'course') {
      setCourseChapters([{ id: 'ch-new', title: 'Chapter 1: New Chapter', blocks: [{ id: 'b-new', type: 'text', content: '' }] }]);
      setActiveChapterIndex(0);
      setCourseImage(null);
      setView('create-course');
    } else if (type === 'exam') {
      setExamQuestions([]);
      setView('create-exam');
    } else if (type === 'lesson') {
      setLessonBlocks([{ id: 'l-new', type: 'text', content: '' }]);
      setLessonImage(null);
      setView('create-lesson');
    }
  };

  const startEditingArchitect = async (type: 'course' | 'exam' | 'lesson', item: any) => {
    setSelectedItem(item);
    if (type === 'course') {
      setLoading(true);
      const { data: chs } = await supabase.from('chapters').select('*').eq('course_id', item.id).order('order');
      if (chs && chs.length > 0) {
        setCourseChapters(chs.map((c: any) => ({ ...c, blocks: c.content_blocks || [] })));
      } else {
        setCourseChapters([{ id: 'ch-new', title: 'Chapter 1: New Chapter', blocks: [{ id: 'b-new', type: 'text', content: '' }] }]);
      }
      setActiveChapterIndex(0);
      setCourseImage(item.image);
      setLoading(false);
      setView('create-course');
    } else if (type === 'exam') {
      setExamQuestions(item.questions || []);
      setView('create-exam');
    } else if (type === 'lesson') {
      setLessonBlocks(item.content_blocks || []);
      setLessonImage(item.image_url);
      setView('create-lesson');
    }
  };

  const handleTitleClick = async (item: any, type: 'view-course' | 'view-lesson' | 'view-exam') => {
    setSelectedItem(item);
    if (type === 'view-course') {
      setLoading(true);
      const { data: chs } = await supabase.from('chapters').select('*').eq('course_id', item.id).order('order');
      setCourseChapters(chs?.map((c: any) => ({ ...c, blocks: c.content_blocks || [] })) || []);
      setLoading(false);
    }
    if (type === 'view-lesson') {
      setLessonBlocks(item.content_blocks || []);
    }
    if (type === 'view-exam') {
      setExamQuestions(item.questions || []);
    }
    setView(type);
  };

  const handleDeleteClick = (itemName: string, itemId: string | number) => {
    setDeleteModal({ isOpen: true, itemName, itemId });
  };

  const handleBulkReorder = () => {
    setExamQuestions([...examQuestions].sort(() => Math.random() - 0.5));
  };

  const addChapter = () => {
    const nextNum = courseChapters.length + 1;
    const newChapter: Chapter = {
      id: `ch${Date.now()}`,
      title: `Chapter ${nextNum}: New Chapter`,
      blocks: [{ id: `b${Date.now()}`, type: 'text', content: '' }]
    };
    setCourseChapters([...courseChapters, newChapter]);
    setActiveChapterIndex(courseChapters.length);
  };

  const addBlock = (target: 'course' | 'lesson', type: 'text' | 'image') => {
    const newBlock = { id: Date.now().toString(), type, content: '' };
    if (target === 'course') {
      setCourseChapters(prev => prev.map((ch, idx) =>
        idx === activeChapterIndex
          ? { ...ch, blocks: [...ch.blocks, newBlock] }
          : ch
      ));
    } else {
      setLessonBlocks(prev => [...prev, newBlock]);
    }
  };

  const updateBlock = (target: 'course' | 'lesson', id: string, content: string) => {
    if (target === 'course') {
      setCourseChapters(prev => prev.map((ch, idx) =>
        idx === activeChapterIndex
          ? { ...ch, blocks: ch.blocks.map(b => b.id === id ? { ...b, content } : b) }
          : ch
      ));
    } else {
      setLessonBlocks(prev => prev.map(b => b.id === id ? { ...b, content } : b));
    }
  };

  const deleteBlock = (target: 'course' | 'lesson', id: string) => {
    if (target === 'course') {
      setCourseChapters(prev => prev.map((ch, idx) =>
        idx === activeChapterIndex
          ? { ...ch, blocks: ch.blocks.filter(b => b.id !== id) }
          : ch
      ));
    } else {
      setLessonBlocks(prev => prev.filter(b => b.id !== id));
    }
  };

  const openExamItemModal = (index: number | null = null) => {
    if (index !== null) {
      setEditingQuestionIndex(index);
      setCurrentModalQuestion({ ...examQuestions[index] });
    } else {
      setEditingQuestionIndex(null);
      setCurrentModalQuestion({
        text: '', type: 'MCQ', points: 5, difficulty: 'Standard',
        options: [{ id: 'A', text: '' }, { id: 'B', text: '' }, { id: 'C', text: '' }, { id: 'D', text: '' }],
        correctOptionId: 'A'
      });
    }
    setImportModalOpen(true);
  };

  const saveExamQuestion = () => {
    const q = currentModalQuestion as Question;
    if (editingQuestionIndex !== null) {
      const newQs = [...examQuestions];
      newQs[editingQuestionIndex] = q;
      setExamQuestions(newQs);
    } else {
      setExamQuestions([...examQuestions, { ...q, id: `q${Date.now()}` }]);
    }
    setImportModalOpen(false);
  };

  const handleSaveCourse = async () => {
    if (!selectedItem && !courseChapters[0]?.title) return;
    setLoading(true);
    try {
      const courseData: any = {
        title: selectedItem?.title || courseChapters[0]?.title,
        description: courseChapters[0]?.blocks.find(b => b.type === 'text')?.content || '',
        image: courseImage,
        category: 'Instructional',
        instructor: instructorName,
        price: '0.00',
        level: 'Beginner',
        rating: 5,
        total_duration: '2h'
      };

      let courseId = selectedItem?.id;
      if (courseId) {
        const { error: updateError } = await supabase.from('courses').update(courseData).eq('id', courseId);
        if (updateError) throw updateError;
      } else {
        const { data, error: insertError } = await supabase.from('courses').insert(courseData).select().single();
        if (insertError) throw insertError;
        courseId = data?.id;
      }

      if (!courseId) throw new Error("Course ID could not be retrieved");

      // Save Chapters
      for (let i = 0; i < courseChapters.length; i++) {
        const ch = courseChapters[i];
        const chData = {
          course_id: courseId,
          title: ch.title,
          order: i,
          content_blocks: ch.blocks
        };

        if (ch.id && !ch.id.includes('new') && !ch.id.includes('ch')) {
          const { error: chUpdateError } = await supabase.from('chapters').update(chData).eq('id', ch.id);
          if (chUpdateError) console.error("Error updating chapter:", chUpdateError);
        } else {
          const { error: chInsertError } = await supabase.from('chapters').insert(chData);
          if (chInsertError) console.error("Error inserting chapter:", chInsertError);
        }
      }

      setView('list');
      fetchData();
    } catch (err: any) {
      console.error('Error saving course:', err);
      alert(`Kurs kaydedilirken bir hata oluştu: ${err.message || 'Bilinmeyen hata'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLesson = async () => {
    if (!selectedItem && !selectedItem?.title) return;
    setLoading(true);
    try {
      const lessonData: any = {
        title: selectedItem?.title || 'New Lesson',
        content_blocks: lessonBlocks,
        image_url: lessonImage
      };

      if (selectedItem?.id) {
        await supabase.from('lessons').update(lessonData).eq('id', selectedItem.id);
      } else {
        await supabase.from('lessons').insert(lessonData);
      }

      setView('list');
      fetchData();
    } catch (err) {
      console.error('Error saving lesson:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveExam = async () => {
    if (!selectedItem && !selectedItem?.title) return;
    setLoading(true);
    try {
      const examData = {
        title: selectedItem?.title || 'New Exam',
        questions: examQuestions,
        questions_count: examQuestions.length,
        instructor: instructorName
      };

      if (selectedItem?.id) {
        await supabase.from('exams').update(examData).eq('id', selectedItem.id);
      } else {
        await supabase.from('exams').insert(examData);
      }

      setView('list');
      fetchData();
    } catch (err) {
      console.error('Error saving exam:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal) return;
    setLoading(true);
    try {
      const { itemId } = deleteModal;
      if (activeTab === 'courses') {
        await supabase.from('courses').delete().eq('id', itemId);
      } else if (activeTab === 'exams') {
        await supabase.from('exams').delete().eq('id', itemId);
      } else if (activeTab === 'lessons') {
        await supabase.from('lessons').delete().eq('id', itemId);
      }
      setDeleteModal(null);
      fetchData();
    } catch (err) {
      console.error('Error deleting item:', err);
    } finally {
      setLoading(false);
    }
  };

  let content;

  if (view === 'view-course' && selectedItem) {
    content = (
      <div className="min-h-full bg-slate-200 p-6 lg:p-12 animate-fade-in max-w-6xl mx-auto space-y-10 pb-32 text-slate-900">
        <header className="flex items-center justify-between bg-white p-8 rounded-[32px] border border-slate-300 shadow-sm">
          <div className="flex items-center gap-6">
            <button onClick={() => setView('list')} className="material-symbols-outlined w-12 h-12 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-xl transition-all text-slate-900 font-black">arrow_back</button>
            <div>
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{selectedItem.title}</h2>
              <p className="text-[10px] font-bold text-slate-700 uppercase tracking-widest mt-1">Instructor: {selectedItem.instructor} • Curriculum Detail</p>
            </div>
          </div>
          <button onClick={() => startEditingArchitect('course', selectedItem)} className="bg-brand-500 text-white px-8 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-2">
            <span className="material-symbols-outlined text-sm font-black">edit</span> Edit Course Architect
          </button>
        </header>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
          <aside className="lg:col-span-1 space-y-6">
            <div className="bg-white p-8 rounded-[32px] border border-slate-300 shadow-sm">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6 border-b border-slate-200 pb-4">Chapters List</h3>
              <div className="space-y-2">
                {courseChapters.map((ch, idx) => (
                  <button
                    key={ch.id}
                    onClick={() => setActiveChapterIndex(idx)}
                    className={`w-full text-left p-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeChapterIndex === idx ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                      }`}
                  >
                    {ch.title}
                  </button>
                ))}
              </div>
            </div>
          </aside>
          <main className="lg:col-span-3 bg-white p-12 rounded-[40px] border border-slate-300 shadow-sm space-y-10">
            <div className="border-b border-slate-200 pb-6">
              <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">{courseChapters[activeChapterIndex]?.title}</h3>
              <p className="text-[10px] font-bold text-slate-700 uppercase tracking-widest mt-2 font-black">Displaying all instructional segments for this chapter</p>
            </div>
            <div className="space-y-8">
              {courseChapters[activeChapterIndex]?.blocks.map(block => (
                <div key={block.id} className="animate-fade-in">
                  {block.type === 'text' ? (
                    <p className="text-lg text-slate-800 leading-relaxed font-medium bg-slate-100 p-8 rounded-[24px] border border-slate-200">
                      {block.content || 'No description added yet.'}
                    </p>
                  ) : (
                    <div className="rounded-[32px] overflow-hidden border border-slate-300 shadow-lg">
                      {block.content ? (
                        <img src={block.content} className="w-full aspect-video object-cover" />
                      ) : (
                        <div className="aspect-video bg-slate-100 flex items-center justify-center text-slate-700 font-black uppercase text-[10px]">Placeholder Image Asset</div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>
    );
  } else if (view === 'view-lesson' && selectedItem) {
    content = (
      <div className="min-h-full bg-slate-200 p-6 lg:p-12 animate-fade-in max-w-4xl mx-auto space-y-10 pb-32 text-slate-900">
        <header className="flex items-center justify-between border-b border-slate-300 pb-8 bg-white p-8 rounded-[32px] shadow-sm">
          <div className="flex items-center gap-6">
            <button onClick={() => setView('list')} className="material-symbols-outlined p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-900 font-black">arrow_back</button>
            <div>
              <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">{selectedItem.title}</h2>
              <p className="text-[10px] font-bold text-slate-700 uppercase tracking-widest mt-1">Lesson Explanation • Added by {selectedItem.chapters?.courses?.instructor || 'Unknown'}</p>
            </div>
          </div>
          <button onClick={() => startEditingArchitect('lesson', selectedItem)} className="bg-slate-900 text-white px-8 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-2">
            <span className="material-symbols-outlined text-sm font-black">edit</span> Edit Lesson Designer
          </button>
        </header>
        <div className="bg-white p-12 rounded-[40px] shadow-sm border border-slate-300 space-y-10">
          {lessonBlocks.map(block => (
            <div key={block.id}>
              {block.type === 'text' ? (
                <div className="text-xl text-slate-900 leading-relaxed font-medium prose max-w-none bg-slate-100 p-10 rounded-[32px] border border-slate-200">
                  {block.content || 'Instructional narrative missing.'}
                </div>
              ) : (
                <div className="rounded-[40px] overflow-hidden shadow-xl border border-slate-300">
                  <img src={block.content} className="w-full aspect-video object-cover" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  } else if (view === 'view-exam' && selectedItem) {
    content = (
      <div className="min-h-full bg-slate-200 p-6 lg:p-12 animate-fade-in max-w-[1400px] mx-auto pb-32 text-slate-900">
        <header className="flex items-center justify-between bg-white p-10 rounded-[40px] border border-slate-300 shadow-xl mb-12">
          <div className="flex items-center gap-6 text-slate-900">
            <button onClick={() => setView('list')} className="material-symbols-outlined w-14 h-14 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all shadow-inner text-slate-900 font-black">arrow_back</button>
            <div>
              <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">{selectedItem.title}</h2>
              <p className="text-[11px] font-bold text-slate-700 uppercase tracking-[0.3em] mt-2">Assessment Pipeline • Added by {selectedItem.instructor || 'Unknown'}</p>
            </div>
          </div>
          <button onClick={() => startEditingArchitect('exam', selectedItem)} className="bg-brand-500 text-white px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl flex items-center gap-3">
            <span className="material-symbols-outlined text-lg font-black">edit</span> Edit Assessment Architect
          </button>
        </header>
        <div className="space-y-8">
          {examQuestions.map((q, idx) => (
            <div key={idx} className="bg-white p-12 rounded-[40px] border border-slate-300 shadow-sm space-y-8">
              <div className="flex justify-between items-center">
                <span className="bg-slate-900 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">Question {idx + 1}</span>
                <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest font-black">Difficulty: {q.difficulty} • {q.points} Pts</span>
              </div>
              <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-tight">{q.text}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {q.options.map(opt => (
                  <div key={opt.id} className={`p-6 rounded-[24px] border-2 flex items-center gap-4 ${q.correctOptionId === opt.id ? 'bg-emerald-50 border-emerald-500' : 'bg-slate-100 border-slate-300'}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] ${q.correctOptionId === opt.id ? 'bg-emerald-500 text-white' : 'bg-white text-slate-900 shadow-sm'}`}>{opt.id}</div>
                    <span className={`text-xs font-black uppercase tracking-widest ${q.correctOptionId === opt.id ? 'text-emerald-700' : 'text-slate-700'}`}>{opt.text}</span>
                    {q.correctOptionId === opt.id && <span className="material-symbols-outlined text-emerald-600 ml-auto font-black">check_circle</span>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  } else if (view === 'create-course') {
    content = (
      <div className="min-h-full bg-slate-200 p-6 lg:p-12 animate-fade-in max-w-6xl mx-auto space-y-12 pb-32 text-slate-900">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setView('list')} className="material-symbols-outlined p-2 hover:bg-white rounded-xl transition-all shadow-sm text-slate-900 font-black">arrow_back</button>
            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Institutional Course Architect</h2>
          </div>
          <div className="flex gap-4">
            <button onClick={handleSaveCourse} disabled={loading} className="bg-brand-500 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-brand-500/20 active:scale-95 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm font-black">{loading ? 'sync' : 'publish'}</span>
              {loading ? 'Committing...' : 'Publish Repository'}
            </button>
          </div>
        </header>

        {/* Primary Content Hero Section at Top */}
        <div className="bg-white p-8 rounded-[32px] border border-slate-300 shadow-sm space-y-6">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-4">Primary Cover Asset</h3>
          <div className="aspect-[3/1] bg-slate-100 rounded-[28px] overflow-hidden relative group border-2 border-dashed border-slate-300 flex flex-col items-center justify-center transition-all hover:bg-brand-50 shadow-inner">
            {courseImage ? (
              <div className="w-full h-full relative">
                <img src={courseImage} className="w-full h-full object-cover" />
                <button onClick={(e) => { e.stopPropagation(); setCourseImage(null); }} className="absolute top-6 right-6 w-12 h-12 bg-white/90 backdrop-blur-sm text-red-500 rounded-xl flex items-center justify-center shadow-xl hover:bg-red-500 hover:text-white transition-all font-black">
                  <span className="material-symbols-outlined font-black">delete</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 text-slate-700 cursor-pointer p-10" onClick={() => triggerFileUpload('course')}>
                <span className="material-symbols-outlined text-5xl font-black">add_photo_alternate</span>
                <span className="text-[10px] font-black uppercase tracking-widest">Upload Master Institutional Graphic</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-12 space-y-8">
            <div className="bg-white p-10 rounded-[32px] border border-slate-300 shadow-sm space-y-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Master Repository Title</label>
                <input
                  type="text"
                  value={selectedItem?.title || ''}
                  onChange={(e) => setSelectedItem({ ...selectedItem, title: e.target.value })}
                  placeholder="e.g. Advanced Quantum Mechanics"
                  className="w-full bg-slate-100 border-2 border-slate-200 p-6 rounded-[24px] outline-none font-bold text-lg text-slate-900 focus:border-brand-500"
                />
              </div>
              <div className="flex flex-wrap gap-3 py-4 border-b border-slate-200 overflow-x-auto">
                {courseChapters.map((ch, idx) => (
                  <button key={ch.id} onClick={() => setActiveChapterIndex(idx)} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeChapterIndex === idx ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200'}`}>
                    {ch.title.split(':')[0]}
                  </button>
                ))}
                <button onClick={addChapter} className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-brand-50 text-brand-500 border border-brand-100 hover:bg-brand-100">
                  + Add Chapter
                </button>
              </div>
              <div className="space-y-6 pt-6">
                <input type="text" value={courseChapters[activeChapterIndex]?.title || ''} onChange={(e) => { const updated = [...courseChapters]; updated[activeChapterIndex].title = e.target.value; setCourseChapters(updated); }} className="bg-transparent border-none text-xl font-black text-slate-900 uppercase tracking-tighter outline-none w-full" />
                {courseChapters[activeChapterIndex]?.blocks.map((block) => (
                  <div key={block.id} className="relative group animate-fade-in">
                    <button onClick={() => deleteBlock('course', block.id)} className="absolute -right-3 -top-3 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-lg shadow-red-500/30">
                      <span className="material-symbols-outlined text-sm font-black">close</span>
                    </button>
                    {block.type === 'text' ? (
                      <textarea value={block.content} onChange={(e) => updateBlock('course', block.id, e.target.value)} placeholder="Type course summary..." className="w-full bg-slate-100 border-2 border-slate-200 p-8 rounded-[32px] min-h-[180px] outline-none focus:border-brand-500 font-medium text-slate-900 leading-relaxed" />
                    ) : (
                      <div className="w-full aspect-video bg-slate-100 border-2 border-dashed border-slate-300 rounded-[32px] flex flex-col items-center justify-center p-4">
                        {block.content ? (
                          <div className="relative w-full h-full overflow-hidden rounded-[24px]">
                            <img src={block.content} className="w-full h-full object-cover" />
                            <button onClick={() => updateBlock('course', block.id, '')} className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-xl shadow-lg hover:scale-110 transition-transform"><span className="material-symbols-outlined font-black">delete</span></button>
                          </div>
                        ) : (
                          <button onClick={() => triggerFileUpload('course-block', block.id)} className="flex flex-col items-center gap-2 text-slate-700 hover:text-brand-500 transition-colors">
                            <span className="material-symbols-outlined text-4xl font-black">add_photo_alternate</span>
                            <span className="text-[9px] font-black uppercase tracking-widest">Select Course Image Asset</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                <div className="flex gap-4 pt-4 border-t border-slate-200">
                  <button onClick={() => addBlock('course', 'text')} className="flex-1 py-4 bg-slate-100 text-slate-700 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-slate-300 hover:bg-slate-200 flex items-center justify-center gap-2 font-black transition-all">
                    <span className="material-symbols-outlined text-lg font-black">notes</span> Add Text Segment
                  </button>
                  <button onClick={() => addBlock('course', 'image')} className="flex-1 py-4 bg-slate-100 text-slate-700 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-slate-300 hover:bg-slate-200 flex items-center justify-center gap-2 font-black transition-all">
                    <span className="material-symbols-outlined text-lg font-black">image</span> Insert Visual Aid
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } else if (view === 'create-lesson') {
    content = (
      <div className="min-h-full bg-slate-200 p-6 lg:p-12 animate-fade-in max-w-5xl mx-auto space-y-12 pb-32 text-slate-900">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setView('list')} className="material-symbols-outlined p-2 hover:bg-white rounded-xl transition-all shadow-sm text-slate-900 font-black">arrow_back</button>
            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Lesson Designer</h2>
          </div>
          <button onClick={handleSaveLesson} disabled={loading} className="bg-brand-500 text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-brand-500/20 active:scale-95 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm font-black">{loading ? 'sync' : 'rocket_launch'}</span>
            {loading ? 'Syncing...' : 'Commit Explanation'}
          </button>
        </header>

        {/* Primary Content Hero Section at Top */}
        <div className="bg-white p-10 rounded-[40px] border border-slate-300 shadow-sm space-y-8">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-4 font-black">Master Narrative Visual</h3>
          <div className="aspect-[2.5/1] bg-slate-900 rounded-[28px] overflow-hidden relative group border-4 border-slate-100 shadow-xl ring-1 ring-slate-200">
            {lessonImage ? (
              <div className="w-full h-full relative">
                <img src={lessonImage} className="w-full h-full object-cover opacity-80" />
                <button onClick={(e) => { e.stopPropagation(); setLessonImage(null); }} className="absolute top-6 right-6 w-12 h-12 bg-white text-red-500 rounded-xl flex items-center justify-center shadow-xl hover:bg-red-500 hover:text-white transition-all font-black">
                  <span className="material-symbols-outlined font-black">delete</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 text-slate-400 cursor-pointer h-full justify-center hover:bg-white/5 transition-colors" onClick={() => triggerFileUpload('lesson')}>
                <span className="material-symbols-outlined text-5xl font-black">smart_display</span>
                <span className="text-[10px] font-black uppercase tracking-widest">Select Narrative Cover Asset</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-1 gap-12">
          <div className="space-y-10">
            <div className="bg-white p-10 rounded-[40px] border border-slate-300 shadow-sm space-y-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Lesson Nomenclature</label>
                <input
                  type="text"
                  value={selectedItem?.title || ''}
                  onChange={(e) => setSelectedItem({ ...selectedItem, title: e.target.value })}
                  placeholder="e.g. Molecular Bond Heuristics"
                  className="w-full bg-slate-100 border border-slate-200 p-6 rounded-[24px] outline-none font-bold text-lg text-slate-900 focus:border-brand-500"
                />
              </div>
              <div className="space-y-6">
                {lessonBlocks.map((block) => (
                  <div key={block.id} className="relative group animate-fade-in">
                    <button onClick={() => deleteBlock('lesson', block.id)} className="absolute -right-3 -top-3 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-lg">
                      <span className="material-symbols-outlined text-sm font-bold">close</span>
                    </button>
                    {block.type === 'text' ? (
                      <textarea
                        value={block.content}
                        onChange={(e) => updateBlock('lesson', block.id, e.target.value)}
                        placeholder="Compose instructional content..."
                        className="w-full bg-slate-100 border border-slate-200 p-8 rounded-[32px] min-h-[250px] outline-none focus:ring-4 focus:ring-brand-500/10 font-medium text-slate-900 leading-relaxed"
                      />
                    ) : (
                      <div className="w-full aspect-video bg-slate-100 border-2 border-dashed border-slate-300 rounded-[32px] flex flex-col items-center justify-center p-4 shadow-inner">
                        {block.content ? (
                          <div className="relative w-full h-full overflow-hidden rounded-[24px]">
                            <img src={block.content} className="w-full h-full object-cover" />
                            <button onClick={() => updateBlock('lesson', block.id, '')} className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-xl shadow-lg hover:scale-110 transition-transform font-black"><span className="material-symbols-outlined font-black">delete</span></button>
                          </div>
                        ) : (
                          <button onClick={() => triggerFileUpload('lesson-block', block.id)} className="flex flex-col items-center gap-2 text-slate-700 hover:text-brand-500 transition-colors">
                            <span className="material-symbols-outlined text-4xl font-black">add_photo_alternate</span>
                            <span className="text-[9px] font-black uppercase tracking-widest">Select Lesson Media Asset</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                <div className="flex gap-4 pt-4 border-t border-slate-200">
                  <button onClick={() => addBlock('lesson', 'text')} className="flex-1 py-4 bg-slate-100 text-slate-700 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-slate-300 hover:bg-slate-200 flex items-center justify-center gap-2 transition-all font-black">
                    <span className="material-symbols-outlined text-lg font-black">segment</span> Add Narrative
                  </button>
                  <button onClick={() => addBlock('lesson', 'image')} className="flex-1 py-4 bg-slate-100 text-slate-700 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-slate-300 hover:bg-slate-200 flex items-center justify-center gap-2 transition-all font-black">
                    <span className="material-symbols-outlined text-lg font-black">wallpaper</span> Insert Visual Aid
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } else if (view === 'create-exam') {
    content = (
      <div className="min-h-full bg-slate-200 p-6 lg:p-12 animate-fade-in max-w-[1400px] mx-auto pb-32 text-slate-900">
        <header className="flex items-center justify-between bg-white p-10 rounded-[40px] border border-slate-300 shadow-xl mb-12">
          <div className="flex items-center gap-6 text-slate-900">
            <button onClick={() => setView('list')} className="material-symbols-outlined w-14 h-14 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all shadow-inner text-slate-900 font-black">arrow_back</button>
            <div>
              <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">Assessment Architect</h2>
              <p className="text-[11px] font-bold text-brand-500 uppercase tracking-[0.3em] mt-2 flex items-center gap-2 font-black">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse"></span>
                ACTIVE PIPELINE DESIGNER
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => handleTitleClick(selectedItem, 'view-exam')} className="px-8 py-5 bg-slate-100 text-slate-800 border border-slate-300 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all">Audit Preview</button>
            <button onClick={handleSaveExam} disabled={loading} className="px-10 py-5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl active:scale-95 transition-all flex items-center gap-2">
              <span className="material-symbols-outlined text-sm font-black">{loading ? 'sync' : 'database'}</span>
              {loading ? 'Processing...' : 'Deploy Examination'}
            </button>
          </div>
        </header>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          <aside className="lg:col-span-1 space-y-10">
            <div className="bg-white p-10 rounded-[40px] border border-slate-300 shadow-sm space-y-8 font-black">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-4">Configuration</h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-700 uppercase tracking-widest px-1">Institutional Title</label>
                  <input
                    type="text"
                    value={selectedItem?.title || ''}
                    onChange={(e) => setSelectedItem({ ...selectedItem, title: e.target.value })}
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl p-4 font-bold text-xs uppercase outline-none focus:border-brand-500 text-slate-900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-700 uppercase tracking-widest px-1">Logic Model</label>
                  <select className="w-full bg-slate-100 border border-slate-200 rounded-xl p-4 font-bold text-xs uppercase outline-none focus:border-brand-500 text-slate-900">
                    <option>Standard Linear</option>
                    <option>Adaptive Heuristic</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-700 uppercase tracking-widest px-1">Time Limit (MIN)</label>
                  <input type="number" defaultValue="60" className="w-full bg-slate-100 border border-slate-200 p-4 rounded-xl text-xs font-bold outline-none text-slate-900" />
                </div>
              </div>
            </div>
          </aside>
          <main className="lg:col-span-3 space-y-10">
            <div className="flex justify-between items-center px-6">
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none font-black">Question Pipeline <span className="text-slate-600 ml-2 font-black">({examQuestions.length}/25)</span></h3>
              <div className="flex gap-4">
                <button onClick={handleBulkReorder} className="bg-white px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border border-slate-300 shadow-sm hover:bg-slate-100 text-slate-700 transition-all font-black">Shuffle Pipeline</button>
                <button onClick={() => openExamItemModal()} className="bg-slate-900 text-white px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">Add Pipeline Item</button>
              </div>
            </div>
            <div className="space-y-8">
              {examQuestions.map((q, idx) => (
                <div key={idx} className="bg-white p-12 rounded-[40px] border border-slate-300 shadow-sm hover:border-brand-500/30 transition-all group relative">
                  <div className="flex justify-between items-start mb-8 text-slate-900">
                    <div className="flex gap-4">
                      <span className="bg-slate-900 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">Item {idx + 1}</span>
                      <span className="bg-brand-50 text-brand-500 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-brand-200">{q.type}</span>
                      <span className="bg-slate-100 text-slate-700 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-300 font-black">{q.points} Pts</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => openExamItemModal(idx)} className="w-12 h-12 bg-slate-100 text-slate-700 hover:text-brand-500 hover:bg-brand-50 rounded-xl transition-all flex items-center justify-center font-black">
                        <span className="material-symbols-outlined text-xl font-black">edit</span>
                      </button>
                      <button onClick={() => setExamQuestions(examQuestions.filter((_, i) => i !== idx))} className="w-12 h-12 bg-slate-100 text-slate-700 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all flex items-center justify-center font-black">
                        <span className="material-symbols-outlined text-xl font-black">delete</span>
                      </button>
                    </div>
                  </div>
                  <p className="text-xl font-black text-slate-900 leading-tight uppercase tracking-tight">{q.text}</p>
                  <div className="mt-8 pt-8 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Difficulty Heuristic: <span className="text-slate-900">{q.difficulty}</span></span>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-600">
                      <span className="material-symbols-outlined text-sm font-black">check_circle</span>
                      Answer Key: {q.correctOptionId}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </main>
        </div>
        {importModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md animate-fade-in" onClick={() => setImportModalOpen(false)}></div>
            <div className="relative bg-white w-full max-w-2xl rounded-[40px] overflow-hidden shadow-2xl animate-scale-up border border-slate-300 flex flex-col max-h-[90vh]">
              <div className="p-10 border-b border-slate-200 bg-slate-100 flex items-center justify-between">
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{editingQuestionIndex !== null ? 'Modify' : 'Inject'} Pipeline Item</h3>
                <button onClick={() => setImportModalOpen(false)} className="material-symbols-outlined p-2 hover:bg-white rounded-xl transition-all text-slate-700 font-black">close</button>
              </div>
              <div className="p-10 space-y-8 flex-1 overflow-y-auto custom-scrollbar text-slate-900">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest px-1">Problem Statement</label>
                  <textarea
                    value={currentModalQuestion.text}
                    onChange={(e) => setCurrentModalQuestion({ ...currentModalQuestion, text: e.target.value })}
                    placeholder="Input pedagogical content or mathematical expressions..."
                    className="w-full bg-slate-100 border border-slate-200 p-6 rounded-[24px] h-36 outline-none focus:border-brand-500 font-bold text-base text-slate-900 leading-relaxed"
                  ></textarea>
                </div>
                <div className="space-y-6">
                  <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest px-1">Response Candidates</label>
                  {currentModalQuestion.options?.map((opt, i) => (
                    <div key={opt.id} className="flex gap-4 items-center group">
                      <div className={`w-10 h-10 rounded-xl font-black flex items-center justify-center shrink-0 border-2 transition-all ${currentModalQuestion.correctOptionId === opt.id ? 'bg-brand-500 text-white border-brand-500' : 'bg-slate-100 text-slate-600 border-slate-200 shadow-inner'
                        }`}>
                        {opt.id}
                      </div>
                      <input
                        type="text"
                        value={opt.text}
                        onChange={(e) => {
                          const newOpts = [...(currentModalQuestion.options || [])];
                          newOpts[i].text = e.target.value;
                          setCurrentModalQuestion({ ...currentModalQuestion, options: newOpts });
                        }}
                        placeholder={`Option ${opt.id} narrative...`}
                        className="flex-1 bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none focus:border-brand-500 font-bold text-xs uppercase tracking-wider text-slate-900 shadow-sm"
                      />
                      <button
                        onClick={() => setCurrentModalQuestion({ ...currentModalQuestion, correctOptionId: opt.id })}
                        className={`w-10 h-10 rounded-full border-4 flex items-center justify-center transition-all ${currentModalQuestion.correctOptionId === opt.id ? 'bg-emerald-500 border-emerald-200 text-white' : 'border-slate-300 hover:border-brand-500'
                          }`}
                      >
                        {currentModalQuestion.correctOptionId === opt.id && <span className="material-symbols-outlined text-sm font-black">check</span>}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-8 border-t border-slate-200 bg-slate-50 flex gap-4">
                <button onClick={() => setImportModalOpen(false)} className="flex-1 bg-white text-slate-700 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-slate-300 hover:bg-slate-100 transition-all font-black">Abort Changes</button>
                <button onClick={saveExamQuestion} className="flex-1 bg-brand-500 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-brand-500/20 active:scale-95 transition-all font-black">
                  {editingQuestionIndex !== null ? 'Apply Amendments' : 'Commit to Pipeline'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  } else {
    content = (
      <div className="p-6 lg:p-12 space-y-12 min-h-full flex flex-col max-w-[1600px] mx-auto pb-32 text-slate-900 bg-[#f8fafc] animate-fade-in">
        <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-10 shrink-0">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-brand-500 font-bold text-[10px] uppercase tracking-[0.4em] mb-2 font-black">
              <span className="w-2 h-2 rounded-full bg-brand-500 shadow-[0_0_10px_rgba(72,80,229,0.5)]"></span>
              Institutional Control Center
            </div>
            <h2 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter leading-tight uppercase">Faculty Repository</h2>
            <p className="text-slate-600 font-medium text-lg max-w-2xl">Manage your academic deployments and curate student instructional pathways.</p>

            {instructorName === 'Anonymous Instructor' && (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center gap-4 text-amber-800 text-[10px] font-black uppercase tracking-widest animate-pulse">
                <span className="material-symbols-outlined text-lg">warning</span>
                Instructor profile incomplete. Please set your full name in Settings for correct deployment mapping.
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-6">
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors font-black">search</span>
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                className="w-full sm:w-80 pl-16 pr-6 py-5 bg-white border border-slate-200 rounded-[22px] shadow-sm focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all font-bold text-[11px] uppercase tracking-widest text-slate-900"
              />
            </div>
            <button
              onClick={() => {
                if (activeTab === 'courses') startNewArchitect('course');
                else if (activeTab === 'exams') startNewArchitect('exam');
                else startNewArchitect('lesson');
              }}
              className="bg-slate-900 text-white font-black py-5 px-10 rounded-[22px] flex items-center justify-center gap-4 shadow-2xl hover:bg-brand-500 transition-all text-[11px] uppercase tracking-widest active:scale-95 group"
            >
              <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center group-hover:rotate-90 transition-transform">
                <span className="material-symbols-outlined text-sm font-black">add</span>
              </div>
              New {activeTab.slice(0, -1)} Architect
            </button>
          </div>
        </header>

        {/* Improved Tab Navigation */}
        <div className="flex gap-10 border-b border-slate-200 shrink-0 overflow-x-auto custom-scrollbar-hide">
          {[
            { id: 'courses', label: 'Master Courses', icon: 'account_tree', count: realCourses.length },
            { id: 'exams', label: 'Assessment Models', icon: 'terminal', count: realExams.length },
            { id: 'lessons', label: 'Lesson Pipelines', icon: 'view_quilt', count: realLessons.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-6 flex items-center gap-3 px-4 transition-all relative group ${activeTab === tab.id ? 'text-brand-500 scale-105' : 'text-slate-500 hover:text-slate-900'}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${activeTab === tab.id ? 'bg-brand-50 text-brand-500 shadow-inner' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
                <span className="material-symbols-outlined text-[20px] font-black">{tab.icon}</span>
              </div>
              <div className="flex flex-col items-start">
                <span className="text-[11px] font-black uppercase tracking-[0.2em]">{tab.label}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{tab.count} Active Entities</span>
              </div>
              {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-brand-500 rounded-full shadow-[0_-4px_10px_rgba(72,80,229,0.3)]"></div>}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-40 bg-white border border-slate-200 rounded-[48px] shadow-sm space-y-6">
            <div className="w-16 h-16 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Optimizing Repository Data...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-8 pb-32">
            {activeTab === 'courses' && realCourses.map((item, idx) => (
              <div key={idx} className="bg-white rounded-[40px] border border-slate-200 p-8 shadow-sm hover:shadow-2xl hover:border-brand-500/30 transition-all duration-500 group relative flex flex-col min-h-[450px]">
                <div className="relative aspect-[16/9] rounded-[32px] overflow-hidden mb-8 shadow-lg bg-slate-100">
                  <img src={item.image || `https://picsum.photos/seed/course-${idx}/640/360`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={item.title} />
                  <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-4 py-2 rounded-xl text-[8px] font-black text-slate-900 uppercase tracking-widest shadow-xl">
                    {item.category}
                  </div>
                </div>

                <h3 onClick={() => handleTitleClick(item, 'view-course')} className="text-xl font-black text-slate-900 uppercase tracking-tight mb-3 group-hover:text-brand-500 transition-colors cursor-pointer leading-tight">
                  {item.title}
                </h3>

                <div className="flex items-center gap-3 mb-auto">
                  <div className="w-6 h-6 rounded-full bg-slate-900 flex items-center justify-center text-[8px] font-black text-white">{item.instructor?.charAt(0)}</div>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{item.instructor}</p>
                </div>

                <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-slate-400 font-bold">payments</span>
                    <span className="text-[10px] font-black text-slate-900">${item.price}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startEditingArchitect('course', item)} className="w-11 h-11 bg-slate-50 text-slate-900 rounded-xl hover:bg-brand-500 hover:text-white transition-all shadow-sm flex items-center justify-center">
                      <span className="material-symbols-outlined text-lg font-black">edit</span>
                    </button>
                    <button onClick={() => handleDeleteClick(item.title, item.id)} className="w-11 h-11 bg-slate-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm flex items-center justify-center">
                      <span className="material-symbols-outlined text-lg font-black">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {activeTab === 'exams' && realExams.map((item, idx) => (
              <div key={idx} className="bg-slate-900 rounded-[40px] p-10 shadow-2xl hover:shadow-brand-500/20 transition-all duration-500 group relative flex flex-col min-h-[400px]">
                <div className="w-16 h-16 bg-brand-500/20 rounded-[22px] flex items-center justify-center mb-10 border border-brand-500/30">
                  <span className="material-symbols-outlined text-3xl font-black text-brand-500">terminal</span>
                </div>

                <h3 onClick={() => handleTitleClick(item, 'view-exam')} className="text-2xl font-black text-white uppercase tracking-tight mb-4 group-hover:text-brand-400 transition-colors cursor-pointer leading-tight">
                  {item.title}
                </h3>

                <div className="flex flex-wrap gap-2 mb-auto">
                  <span className="bg-white/5 text-slate-400 px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest border border-white/10">{item.subject}</span>
                  <span className="bg-brand-500/10 text-brand-400 px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest border border-brand-500/20">{item.question_count || 0} ITEMS</span>
                </div>

                <div className="flex items-center justify-between mt-10 pt-8 border-t border-white/10">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Logic Model</span>
                    <span className="text-[10px] font-black text-white uppercase tracking-wider">{item.priority || 'Standard'}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startEditingArchitect('exam', item)} className="w-11 h-11 bg-white/5 text-white rounded-xl hover:bg-white/20 transition-all flex items-center justify-center">
                      <span className="material-symbols-outlined text-lg font-black">edit</span>
                    </button>
                    <button onClick={() => handleDeleteClick(item.title, item.id)} className="w-11 h-11 bg-white/5 text-red-400 rounded-xl hover:bg-red-600/20 hover:text-red-400 transition-all flex items-center justify-center">
                      <span className="material-symbols-outlined text-lg font-black">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {activeTab === 'lessons' && realLessons.map((item, idx) => (
              <div key={idx} className="bg-white rounded-[40px] border border-slate-200 p-10 shadow-sm hover:shadow-2xl hover:border-brand-500/30 transition-all duration-500 group relative flex flex-col min-h-[450px]">
                <div className="relative w-20 h-20 rounded-[28px] overflow-hidden mb-10 shadow-xl border-4 border-slate-50">
                  <img src={item.image_url || `https://api.dicebear.com/7.x/shapes/svg?seed=lesson-${idx}`} className="w-full h-full object-cover" alt={item.title} />
                </div>

                <h3 onClick={() => handleTitleClick(item, 'view-lesson')} className="text-xl font-black text-slate-900 uppercase tracking-tight mb-4 group-hover:text-brand-500 transition-colors cursor-pointer leading-tight">
                  {item.title}
                </h3>

                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Integrated Pipeline</p>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex-1">
                  <p className="text-[9px] font-black text-slate-700 uppercase tracking-[0.1em] mb-1">Target Repository</p>
                  <p className="text-[11px] font-black text-slate-900 uppercase tracking-tighter truncate">{item.chapters?.courses?.title || 'Standalone Pipeline'}</p>
                </div>

                <div className="flex items-center justify-between mt-10 pt-8 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Active System</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startEditingArchitect('lesson', item)} className="w-11 h-11 bg-slate-50 text-slate-900 rounded-xl hover:bg-brand-500 hover:text-white transition-all shadow-sm flex items-center justify-center">
                      <span className="material-symbols-outlined text-lg font-black">edit</span>
                    </button>
                    <button onClick={() => handleDeleteClick(item.title, item.id)} className="w-11 h-11 bg-slate-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm flex items-center justify-center">
                      <span className="material-symbols-outlined text-lg font-black">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {(activeTab === 'courses' ? realCourses : activeTab === 'exams' ? realExams : realLessons).length === 0 && (
              <div className="col-span-full py-40 flex flex-col items-center justify-center text-center space-y-8 bg-white/50 backdrop-blur-md border-4 border-dashed border-slate-200 rounded-[64px]">
                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
                  <span className="material-symbols-outlined text-5xl">inventory_2</span>
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Repository Empty</h3>
                  <p className="text-slate-500 font-medium max-w-sm mx-auto mt-2">No {activeTab} discovered in your local faculty node. Start architecting now.</p>
                </div>
                <button
                  onClick={() => {
                    if (activeTab === 'courses') startNewArchitect('course');
                    else if (activeTab === 'exams') startNewArchitect('exam');
                    else startNewArchitect('lesson');
                  }}
                  className="bg-brand-50 text-brand-500 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-brand-500 hover:text-white transition-all active:scale-95"
                >
                  Initiate Architect Mode
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-full">
      {content}

      {deleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setDeleteModal(null)}></div>
          <div className="relative bg-white w-full max-w-md rounded-[40px] p-12 shadow-2xl border border-slate-300 flex flex-col items-center text-center animate-scale-up">
            <div className="w-24 h-24 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mb-10 border border-red-200">
              <span className="material-symbols-outlined text-5xl font-black">delete_forever</span>
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase mb-4">Permanent Removal?</h3>
            <p className="text-slate-700 text-sm leading-relaxed font-medium mb-12">
              Deleting <span className="text-slate-900 font-bold">"{deleteModal.itemName}"</span> is permanent and will cascade to all associated student data.
            </p>
            <div className="flex flex-col w-full gap-4">
              <button onClick={handleConfirmDelete} disabled={loading} className="w-full bg-red-600 text-white py-6 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-red-500/20 active:scale-95 transition-all">
                {loading ? 'Deleting...' : 'Yes, Delete Permanent'}
              </button>
              <button onClick={() => setDeleteModal(null)} className="w-full bg-slate-100 text-slate-800 py-6 rounded-2xl font-black text-[11px] uppercase tracking-widest border border-slate-300 hover:bg-slate-200 transition-all">Cancel Action</button>
            </div>
          </div>
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        className="fixed -top-full -left-full opacity-0 pointer-events-none"
        accept="image/*"
        onChange={(e) => {
          const target = uploadTargetRef.current;
          if (target) {
            handleImageUpload(e, target.id ? { type: target.type as 'course-block' | 'lesson-block', id: target.id } : target.type as 'course' | 'lesson');
          }
          e.target.value = '';
        }}
      />

      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scale-up { 
          from { transform: scale(0.9) translateY(20px); opacity: 0; } 
          to { transform: scale(1) translateY(0); opacity: 1; } 
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        .animate-scale-up { animation: scale-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .custom-scrollbar-hide::-webkit-scrollbar { display: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; border: 2px solid #f1f5f9; }
      `}</style>
    </div>
  );
};

export default Management;

