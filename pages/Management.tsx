
import React, { useState, useEffect } from 'react';
import { supabase } from '../src/lib/supabase';
import { UserRole, ACADEMIC_LEVELS } from '../types';
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
  exam?: {
    id?: string;
    title: string;
    questions: Question[];
  };
}

const Management: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'courses' | 'exams' | 'lessons'>('courses');
  const [view, setView] = useState<ManagementView>('list');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; itemName: string; itemId: string | number } | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [courseImage, setCourseImage] = useState<string | null>(null);
  const [lessonImage, setLessonImage] = useState<string | null>(null);
  const [courseChapters, setCourseChapters] = useState<Chapter[]>([]);
  const [coursePrice, setCoursePrice] = useState<string>('0.00');
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [lessonBlocks, setLessonBlocks] = useState<ContentBlock[]>([]);
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [currentModalQuestion, setCurrentModalQuestion] = useState<Partial<Question>>({});
  const [currentExamQuestionIndex, setCurrentExamQuestionIndex] = useState(0);
  const [preExamView, setPreExamView] = useState<ManagementView>('list');
  const [examCreatedStatus, setExamCreatedStatus] = useState<{ success: boolean; questionsCount: number; chapterIndex: number } | null>(null);
  const [sourceCourse, setSourceCourse] = useState<any>(null);
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [courseCategory, setCourseCategory] = useState('Math');
  const [courseEducationLevel, setCourseEducationLevel] = useState('High School');
  const [courseLevelSelection, setCourseLevelSelection] = useState('Grade 10');
  const [lessonCategory, setLessonCategory] = useState('Math');

  const categories = ['History', 'Chemistry', 'Biology', 'Math', 'Physics', 'Art', 'Geography', 'Music'];

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
    const userId = user?.id;
    try {
      if (activeTab === 'courses') {
        // Use separate queries to avoid problematic OR filter parsing with spaces/special chars
        const { data: ownedData, error: ownedError } = await supabase
          .from('courses')
          .select('*, chapters(id, lessons(id))')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        const { data: taughtData, error: taughtError } = await supabase
          .from('courses')
          .select('*, chapters(id, lessons(id))')
          .eq('instructor', instructorName)
          .order('created_at', { ascending: false });

        if (ownedError) console.error('Error fetching owned courses:', ownedError);
        if (taughtError) console.error('Error fetching taught courses:', taughtError);

        // Merge and deduplicate
        const combined = [...(ownedData || [])];
        (taughtData || []).forEach((tc: any) => {
          if (!combined.find(c => c.id === tc.id)) {
            combined.push(tc);
          }
        });

        setRealCourses(combined);
      } else if (activeTab === 'exams') {
        const { data, error } = await supabase
          .from('exams')
          .select('*')
          .eq('user_id', userId)
          .is('chapter_id', null) // Filter out course-specific unit exams
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching exams:', error);
          // Fallback to standalone exams if user_id filter fails
          const { data: all } = await supabase.from('exams').select('*').is('chapter_id', null).limit(20);
          setRealExams(all || []);
        } else {
          setRealExams(data || []);
        }
      } else if (activeTab === 'lessons') {
        // 1. Get IDs of courses owned/taught by the user (Separate queries to avoid OR parser issues)
        const { data: ownedC } = await supabase.from('courses').select('id').eq('user_id', userId);
        const { data: taughtC } = await supabase.from('courses').select('id').eq('instructor', instructorName);

        const courseIds = [...new Set([
          ...(ownedC?.map(c => c.id) || []),
          ...(taughtC?.map(c => c.id) || [])
        ])];

        // 2. Get Chapter IDs for those courses
        let chapterIds: string[] = [];
        if (courseIds.length > 0) {
          const { data: instChapters, error: chErr } = await supabase
            .from('chapters')
            .select('id')
            .in('course_id', courseIds);

          if (chErr) console.error('Error fetching chapters for lessons:', chErr);
          chapterIds = instChapters?.map(c => c.id) || [];
        }

        // 3. Fetch lessons: either owned by user OR in those chapters
        let lessons: any[] = [];

        // Fetch lessons owned by user
        const { data: ownedLessons, error: olErr } = await supabase
          .from('lessons')
          .select('*, chapters(title, courses(title, instructor, user_id))')
          .eq('user_id', userId);

        if (olErr) console.error('Error fetching owned lessons:', olErr);
        lessons = [...(ownedLessons || [])];

        // Fetch lessons in chapters
        if (chapterIds.length > 0) {
          const { data: chapterLessons, error: clErr } = await supabase
            .from('lessons')
            .select('*, chapters(title, courses(title, instructor, user_id))')
            .in('chapter_id', chapterIds);

          if (clErr) console.error('Error fetching chapter lessons:', clErr);

          (chapterLessons || []).forEach((cl: any) => {
            if (!lessons.find(l => l.id === cl.id)) {
              lessons.push(cl);
            }
          });
        }

        setRealLessons(lessons.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
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
      setCoursePrice('0.00');
      setCourseTitle('');
      setCourseDescription('');
      setCourseCategory('Math');
      setCourseEducationLevel('High School');
      setCourseLevelSelection('Grade 10');
      setExamCreatedStatus(null);
      setView('create-course');
    } else if (type === 'exam') {
      setPreExamView(view); // Store where we came from
      const defaultQuestion: Question = {
        id: `q-${Date.now()}`,
        type: 'multiple-choice',
        text: '',
        points: 1,
        difficulty: 'Medium',
        options: [
          { id: 'A', text: '' },
          { id: 'B', text: '' },
          { id: 'C', text: '' },
          { id: 'D', text: '' }
        ],
        correctOptionId: 'A'
      };
      setExamQuestions([defaultQuestion]);
      setCurrentExamQuestionIndex(0);
      setView('create-exam');
    } else if (type === 'lesson') {
      setLessonBlocks([{ id: 'l-new', type: 'text', content: '' }]);
      setLessonImage(null);
      setLessonCategory('Math');
      setView('create-lesson');
    }
  };

  const startEditingArchitect = async (type: 'course' | 'exam' | 'lesson', item: any) => {
    setSelectedItem(item);
    if (type === 'course') {
      setLoading(true);
      const { data: chs, error: chsError } = await supabase.from('chapters').select('*').eq('course_id', item.id).order('order');
      console.log('Fetched chapters for course:', item.id, chs, chsError);

      if (chs && chs.length > 0) {
        // Fetch exams for these chapters to enable "Batch Edit"
        const { data: examsData } = await supabase.from('exams').select('*').in('chapter_id', chs.map((c: any) => c.id));

        setCourseChapters(chs.map((c: any) => {
          const blocks = Array.isArray(c.content_blocks) ? c.content_blocks : [];
          const chapterExam = examsData?.find((e: any) => e.chapter_id === c.id);
          return {
            ...c,
            blocks,
            exam: chapterExam ? {
              id: chapterExam.id,
              title: chapterExam.title,
              questions: chapterExam.questions || []
            } : undefined
          };
        }));
      } else {
        setCourseChapters([{ id: 'ch-new', title: 'Chapter 1: New Chapter', blocks: [{ id: 'b-new', type: 'text', content: '' }] }]);
      }
      setActiveChapterIndex(0);
      setCourseImage(item.image);
      setCoursePrice(item.price ? Number(item.price).toFixed(2) : '0.00');
      setCourseTitle(item.title || '');
      setCourseDescription(item.description || '');
      setCourseCategory(item.category || 'Math');
      setCourseEducationLevel(item.education_level || 'High School');
      setCourseLevelSelection(item.level || 'Grade 10');
      setLoading(false);
      setView('create-course');
    } else if (type === 'exam') {
      setPreExamView(view);
      setExamQuestions(item.questions || []);
      setCurrentExamQuestionIndex(0);
      setView('create-exam');
    } else if (type === 'lesson') {
      setLessonBlocks(item.content_blocks || []);
      setLessonImage(item.image_url);
      setLessonCategory(item.category || 'Math');
      setView('create-lesson');
    }
  };

  const handleTitleClick = async (item: any, type: 'view-course' | 'view-lesson' | 'view-exam') => {
    if (type === 'view-course') {
      await startEditingArchitect('course', item);
    } else if (type === 'view-lesson') {
      await startEditingArchitect('lesson', item);
    } else if (type === 'view-exam') {
      await startEditingArchitect('exam', item);
    }
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
        title: courseTitle || 'Untitled Course',
        description: courseDescription || '',
        image: courseImage,
        instructor: instructorName,
        price: Math.round(parseFloat(coursePrice) * 100) / 100 || 0,
        category: courseCategory,
        education_level: courseEducationLevel,
        level: courseLevelSelection,
        rating: selectedItem?.rating || 5,
        total_duration: selectedItem?.total_duration || '2h',
        user_id: user?.id
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

      for (let i = 0; i < courseChapters.length; i++) {
        const ch = courseChapters[i];
        const chData: any = {
          course_id: courseId,
          title: ch.title,
          content_blocks: ch.blocks,
          order: i
        };

        let chId = ch.id;
        const isNewChapter = !ch.id || ch.id.toString().includes('new') || ch.id.toString().includes('ch');

        if (!isNewChapter) {
          await supabase.from('chapters').update(chData).eq('id', ch.id);
        } else {
          const { data: newCh, error: insErr } = await supabase.from('chapters').insert(chData).select().single();
          if (!insErr && newCh) {
            chId = newCh.id;
          } else {
            console.error("Chapter insert failed, skipping exam save for this chapter", insErr);
            chId = null; // Prevent invalid UUID error in exam save
          }
        }

        // BATCH SAVE EXAM: Handle exams associated with this chapter
        if (ch.exam && chId) {
          const examData = {
            title: ch.exam.title,
            questions: ch.exam.questions,
            questions_count: ch.exam.questions.length,
            instructor: instructorName,
            user_id: user?.id,
            chapter_id: chId
          };

          if (ch.exam.id) {
            await supabase.from('exams').update(examData).eq('id', ch.exam.id);
          } else {
            await supabase.from('exams').insert(examData);
          }
        }
      }

      setView('list');
      fetchData();
    } catch (err: any) {
      console.error('Error synchronizing academic asset:', err);
      alert('Critical: Failed to synchronize academic asset with the master repository.');
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
        category: lessonCategory,
        content_blocks: lessonBlocks,
        image_url: lessonImage,
        user_id: user?.id
      };

      let error;
      if (selectedItem?.id) {
        const { error: err } = await supabase.from('lessons').update(lessonData).eq('id', selectedItem.id);
        error = err;
      } else {
        const { error: err } = await supabase.from('lessons').insert(lessonData);
        error = err;
      }

      if (error) {
        console.error('Error saving lesson:', error);
        alert(`Error saving lesson: ${error.message}`);
        setLoading(false);
        return;
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
    // For new exams, selectedItem might be null, so we check for title in the state/questions
    setLoading(true);
    const finalTitle = selectedItem?.title || 'New Professional Exam';
    const finalSubject = selectedItem?.subject || 'Math';

    // Choose color based on subject
    let finalColor = 'brand';
    if (['History', 'Art'].includes(finalSubject)) finalColor = 'orange';
    else if (['Chemistry', 'Geography', 'Biology'].includes(finalSubject)) finalColor = 'teal';
    else if (['Physics', 'Music'].includes(finalSubject)) finalColor = 'purple';

    const examData: any = {
      title: finalTitle,
      subject: finalSubject,
      color: finalColor,
      questions: examQuestions,
      questions_count: examQuestions.length,
      instructor: instructorName,
      user_id: user?.id,
      chapter_id: courseChapters[activeChapterIndex]?.id
    };

    // LOCAL BATCH MODE: If we are in the course architect, save to local state instead of Supabase
    if (preExamView === 'create-course') {
      const updatedChapters = [...courseChapters];
      updatedChapters[activeChapterIndex].exam = {
        id: selectedItem?.id, // Preserve ID if editing existing
        title: examData.title,
        questions: examQuestions
      };
      setCourseChapters(updatedChapters);

      setExamCreatedStatus({
        success: true,
        questionsCount: examQuestions.length,
        chapterIndex: activeChapterIndex
      });

      if (sourceCourse) {
        setSelectedItem(sourceCourse);
        setCourseTitle(sourceCourse.title || '');
        setCourseDescription(sourceCourse.description || '');
      }
      setSourceCourse(null);
      setView('create-course');
      setLoading(false);
      return;
    }

    try {
      if (selectedItem?.id) {
        const { error } = await supabase.from('exams').update(examData).eq('id', selectedItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('exams').insert(examData);
        if (error) throw error;
      }

      setExamCreatedStatus({
        success: true,
        questionsCount: examQuestions.length,
        chapterIndex: activeChapterIndex
      });

      // RESTORE COURSE STATE
      if (sourceCourse) {
        setSelectedItem(sourceCourse);
        setCourseTitle(sourceCourse.title || '');
        setCourseDescription(sourceCourse.description || '');
      }
      setSourceCourse(null);

      setView(preExamView);
      fetchData();
    } catch (err: any) {
      console.error('Error saving exam:', err);
      alert(`Critical: Exam Deployment Failed - ${err.message || 'Check database constraints'}`);
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
            <button onClick={() => {
              if (window.confirm("Confirm exit: Unsaved structural modifications will be discarded. Proceed?")) {
                setView('list');
              }
            }} className="material-symbols-outlined p-2 hover:bg-white rounded-xl transition-all shadow-sm text-slate-900 font-black">arrow_back</button>
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
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  placeholder="e.g. Advanced Quantum Mechanics"
                  className="w-full bg-slate-100 border-2 border-slate-200 p-6 rounded-[24px] outline-none font-bold text-lg text-slate-900 focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Education Level</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-black">school</span>
                    <select
                      value={courseEducationLevel}
                      onChange={(e) => {
                        const newEduLevel = e.target.value;
                        setCourseEducationLevel(newEduLevel);
                        // Reset specific level when education level changes
                        if (ACADEMIC_LEVELS[newEduLevel]) {
                          setCourseLevelSelection(ACADEMIC_LEVELS[newEduLevel][0]);
                        }
                      }}
                      className="w-full bg-slate-100 border-2 border-slate-200 pl-16 pr-6 py-6 rounded-[24px] outline-none font-bold text-lg text-slate-900 focus:border-brand-500 appearance-none transition-all cursor-pointer"
                    >
                      {Object.keys(ACADEMIC_LEVELS).map(level => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Course Level / Grade</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-black">grade</span>
                    <select
                      value={courseLevelSelection}
                      onChange={(e) => setCourseLevelSelection(e.target.value)}
                      className="w-full bg-slate-100 border-2 border-slate-200 pl-16 pr-6 py-6 rounded-[24px] outline-none font-bold text-lg text-slate-900 focus:border-brand-500 appearance-none transition-all cursor-pointer"
                    >
                      {(ACADEMIC_LEVELS[courseEducationLevel] || []).map(lvl => (
                        <option key={lvl} value={lvl}>{lvl}</option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Master Category (Subject)</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-black">category</span>
                  <select
                    value={courseCategory}
                    onChange={(e) => setCourseCategory(e.target.value)}
                    className="w-full bg-slate-100 border-2 border-slate-200 pl-16 pr-6 py-6 rounded-[24px] outline-none font-bold text-lg text-slate-900 focus:border-brand-500 appearance-none transition-all cursor-pointer"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Master Deployment Valuation (Price)</label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-black">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={coursePrice}
                    onChange={(e) => setCoursePrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-100 border-2 border-slate-200 pl-12 pr-6 py-6 rounded-[24px] outline-none font-bold text-lg text-slate-900 focus:border-brand-500"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Course Narrative (About Section)</label>
                <textarea
                  value={courseDescription}
                  onChange={(e) => setCourseDescription(e.target.value)}
                  placeholder="Provide a comprehensive overview of this academic course..."
                  className="w-full bg-slate-100 border-2 border-slate-200 p-6 rounded-[24px] min-h-[120px] outline-none font-bold text-slate-900 focus:border-brand-500"
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
                      <textarea value={block.content} onChange={(e) => updateBlock('course', block.id, e.target.value)} placeholder="Provide an institutional narrative for this academic segment..." className="w-full bg-slate-100 border-2 border-slate-200 p-8 rounded-[32px] min-h-[180px] outline-none focus:border-brand-500 font-medium text-slate-900 leading-relaxed" />
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
                <div className="pt-6 border-t border-slate-200 space-y-4">
                  {courseChapters[activeChapterIndex]?.exam ? (
                    <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-3xl flex flex-col gap-4 animate-scale-up">
                      <div className="flex items-center gap-3 text-emerald-700">
                        <span className="material-symbols-outlined font-black">check_circle</span>
                        <p className="text-[11px] font-black uppercase tracking-widest">
                          Successful Link: Assessment staged for deployment.
                        </p>
                      </div>
                      <button
                        onClick={async () => {
                          const activeCh = courseChapters[activeChapterIndex];
                          setSourceCourse({ ...selectedItem, title: courseTitle, description: courseDescription });
                          setPreExamView('create-course');
                          setSelectedItem(activeCh.exam);
                          setExamQuestions(activeCh.exam?.questions || []);
                          setView('create-exam');
                        }}
                        className="w-full py-4 bg-white text-emerald-600 border border-emerald-200 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                      >
                        Modify & Refine Assessment
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={async () => {
                        const activeCh = courseChapters[activeChapterIndex];
                        setSourceCourse({ ...selectedItem, title: courseTitle, description: courseDescription });
                        setPreExamView('create-course');

                        // Check if drafting a new exam or modifying a saved one from DB
                        setSelectedItem({ title: `${activeCh.title} Assessment` });
                        setExamQuestions([]);
                        setView('create-exam');
                      }}
                      className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:bg-brand-500 transition-all flex items-center justify-center gap-3"
                    >
                      <span className="material-symbols-outlined font-black">quiz</span>
                      Create Chapter Assessment Exam
                    </button>
                  )}
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
            {loading ? 'Saving...' : 'Save Lesson Content'}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Scientific Discipline (Subject)</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-black">category</span>
                    <select
                      value={lessonCategory}
                      onChange={(e) => setLessonCategory(e.target.value)}
                      className="w-full bg-slate-100 border border-slate-200 pl-16 pr-6 py-6 rounded-[24px] outline-none font-bold text-lg text-slate-900 focus:border-brand-500 appearance-none transition-all cursor-pointer"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
                  </div>
                </div>
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
    const currentQ = examQuestions[currentExamQuestionIndex];

    const updateQuestion = (updates: Partial<Question>) => {
      if (!currentQ) return;
      const updated = [...examQuestions];
      updated[currentExamQuestionIndex] = { ...updated[currentExamQuestionIndex], ...updates };
      setExamQuestions(updated);
    };

    const addQuestion = () => {
      const newQ: Question = {
        id: `q-${Date.now()}`,
        type: 'multiple-choice',
        text: '',
        points: 1,
        difficulty: 'Medium',
        options: [
          { id: 'A', text: '' },
          { id: 'B', text: '' },
          { id: 'C', text: '' },
          { id: 'D', text: '' }
        ],
        correctOptionId: 'A'
      };
      setExamQuestions([...examQuestions, newQ]);
      setCurrentExamQuestionIndex(examQuestions.length);
    };

    const deleteQuestion = () => {
      if (examQuestions.length <= 1) return;
      const updated = examQuestions.filter((_, i) => i !== currentExamQuestionIndex);
      setExamQuestions(updated);
      setCurrentExamQuestionIndex(Math.max(0, currentExamQuestionIndex - 1));
    };

    content = (
      <div className="min-h-full bg-[#f1f5f9] animate-fade-in flex flex-col items-center justify-center p-6 lg:p-12 pb-32">
        <div className="w-full max-w-4xl space-y-8">
          <header className="flex flex-col gap-6 bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm w-full">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-6">
                <button onClick={() => {
                  if (window.confirm("Are you sure you want to go back? All unsaved questions in this session will be permanently cleared.")) {
                    setView(preExamView);
                    // Clear questions after moving away to avoid race condition/render crash
                    setTimeout(() => setExamQuestions([]), 100);
                  }
                }} className="material-symbols-outlined w-12 h-12 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-xl transition-all text-slate-900 font-black">arrow_back</button>
                <div>
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Assessment Architect</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-pulse"></div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Designing Strategic Pipeline</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button onClick={handleSaveExam} disabled={loading} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/10 active:scale-95 flex items-center gap-2 transition-all">
                  <span className="material-symbols-outlined text-sm font-black">{loading ? 'sync' : 'publish'}</span>
                  {loading ? 'Committing...' : 'Finalize & Deploy'}
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 block">Professional Exam Title</label>
                <input
                  type="text"
                  placeholder="Enter a descriptive title for this examination..."
                  value={selectedItem?.title || ''}
                  onChange={(e) => setSelectedItem(prev => ({ ...(prev || {}), title: e.target.value }))}
                  className="w-full bg-slate-50 border-2 border-slate-100 p-6 rounded-2xl outline-none focus:border-brand-500 font-bold text-slate-900 text-lg shadow-inner"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 block">Scientific Discipline</label>
                <select
                  value={selectedItem?.subject || 'Math'}
                  onChange={(e) => setSelectedItem(prev => ({ ...(prev || {}), subject: e.target.value }))}
                  className="w-full bg-slate-50 border-2 border-slate-100 p-6 rounded-2xl outline-none focus:border-brand-500 font-bold text-slate-900 text-lg shadow-inner appearance-none cursor-pointer"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
          </header>

          {!currentQ ? (
            <div className="bg-white p-20 rounded-[40px] border border-slate-200 shadow-sm flex flex-col items-center justify-center space-y-6">
              <span className="material-symbols-outlined text-6xl text-slate-200 animate-pulse">database_off</span>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Repository Segment Empty. Initialize Pipeline Item.</p>
              <button onClick={addQuestion} className="bg-brand-500 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">Initialize Architect</button>
            </div>
          ) : (
            <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm space-y-10 w-full animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                <div className="space-y-1">
                  <span className="text-brand-500 text-[10px] font-black uppercase tracking-[0.2em]">Step {currentExamQuestionIndex + 1} of {examQuestions.length}</span>
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Question Core Engine</h3>
                </div>
                <div className="flex gap-2">
                  <button onClick={deleteQuestion} disabled={examQuestions.length <= 1} className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all disabled:opacity-30">
                    <span className="material-symbols-outlined font-black">delete</span>
                  </button>
                </div>
              </div>

              <div className="space-y-10">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Question Narrative</label>
                  <textarea
                    value={currentQ?.text || ''}
                    onChange={(e) => updateQuestion({ text: e.target.value })}
                    placeholder="Insert pedagogical inquiry or complex logical problem statement..."
                    className="w-full bg-slate-50 border-2 border-slate-100 p-8 rounded-[28px] min-h-[160px] outline-none focus:border-brand-500 font-bold text-slate-900 leading-relaxed text-lg shadow-inner"
                  />
                </div>

                <div className="space-y-6">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Response Candidate Architecture</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentQ?.options.map((opt, i) => {
                      const isCorrect = currentQ.correctOptionId === opt.id;
                      return (
                        <div key={opt.id} className={`group relative flex items-center gap-4 p-2 rounded-[22px] border-2 transition-all ${isCorrect ? 'border-brand-500 bg-brand-50/50' : 'border-slate-100 bg-white hover:border-slate-200'}`}>
                          <button
                            onClick={() => updateQuestion({ correctOptionId: opt.id })}
                            className={`w-10 h-10 rounded-xl font-black flex items-center justify-center shrink-0 border-2 transition-all ${isCorrect ? 'bg-brand-500 text-white border-brand-500' : 'bg-slate-50 text-slate-400 border-slate-100 group-hover:bg-brand-50 group-hover:text-brand-500 group-hover:border-brand-100'}`}
                          >
                            {opt.id}
                          </button>
                          <input
                            type="text"
                            value={opt.text}
                            onChange={(e) => {
                              if (!currentQ?.options) return;
                              const newOpts = [...currentQ.options];
                              newOpts[i].text = e.target.value;
                              updateQuestion({ options: newOpts });
                            }}
                            placeholder={`Option ${opt.id}...`}
                            className="flex-1 bg-transparent border-none py-4 pr-10 outline-none font-bold text-xs uppercase tracking-wider text-slate-900"
                          />
                          {isCorrect && (
                            <div className="absolute right-4 text-brand-500 animate-scale-up">
                              <span className="material-symbols-outlined font-black text-lg">check_circle</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-10 border-t border-slate-100">
                <div className="flex gap-3">
                  <button
                    onClick={() => setCurrentExamQuestionIndex(Math.max(0, currentExamQuestionIndex - 1))}
                    disabled={currentExamQuestionIndex === 0}
                    className="px-6 py-4 rounded-2xl bg-slate-100 text-slate-700 font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all disabled:opacity-0"
                  >
                    Previous Step
                  </button>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={addQuestion}
                    className="px-8 py-4 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                  >
                    + Add New Item
                  </button>
                  <button
                    onClick={() => setCurrentExamQuestionIndex(Math.min(examQuestions.length - 1, currentExamQuestionIndex + 1))}
                    disabled={currentExamQuestionIndex === examQuestions.length - 1}
                    className="px-10 py-4 rounded-2xl bg-brand-500 text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-brand-500/20 hover:bg-brand-600 transition-all disabled:opacity-0"
                  >
                    Next Logic Step
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
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
            { id: 'exams', label: 'Professional Exams', icon: 'terminal', count: realExams.length },
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
                    <span className="text-[10px] font-black text-slate-900">${Number(item.price).toFixed(2)}</span>
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

            {activeTab === 'exams' && realExams.map((item, idx) => {
              const examColor = item.color || 'brand';
              const colorMap: any = {
                brand: { bg: 'bg-brand-500', text: 'text-brand-500', light: 'bg-brand-50', border: 'border-brand-100' },
                purple: { bg: 'bg-purple-500', text: 'text-purple-500', light: 'bg-purple-50', border: 'border-purple-100' },
                teal: { bg: 'bg-teal-500', text: 'text-teal-500', light: 'bg-teal-50', border: 'border-teal-100' },
                orange: { bg: 'bg-orange-500', text: 'text-orange-500', light: 'bg-orange-50', border: 'border-orange-100' }
              };
              const theme = colorMap[examColor] || colorMap.brand;

              return (
                <div key={idx} className="bg-white rounded-[40px] p-10 border border-slate-200 shadow-sm hover:shadow-2xl hover:border-brand-500/20 transition-all duration-500 group relative flex flex-col min-h-[420px]">
                  <div className={`w-16 h-16 ${theme.light} rounded-[22px] flex items-center justify-center mb-10 border ${theme.border} shadow-inner`}>
                    <span className={`material-symbols-outlined text-3xl font-black ${theme.text}`}>terminal</span>
                  </div>

                  <h3 onClick={() => handleTitleClick(item, 'view-exam')} className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-4 group-hover:text-brand-500 transition-colors cursor-pointer leading-tight">
                    {item.title}
                  </h3>

                  <div className="flex flex-wrap gap-2 mb-auto">
                    <span className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${theme.light} ${theme.text} ${theme.border}`}>{item.subject || 'Strategic'}</span>
                    <span className="bg-slate-100 text-slate-500 px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest border border-slate-200">{item.questions_count || (Array.isArray(item.questions) ? item.questions.length : 0)} QUESTIONS</span>
                  </div>

                  <div className="flex items-center justify-between mt-10 pt-8 border-t border-slate-100">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Logic Model</span>
                      <span className="text-[10px] font-black text-slate-900 uppercase tracking-wider">{item.priority || 'Standard'}</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => startEditingArchitect('exam', item)} className="w-11 h-11 bg-slate-50 text-slate-900 rounded-xl hover:bg-brand-500 hover:text-white transition-all flex items-center justify-center border border-slate-100">
                        <span className="material-symbols-outlined text-lg font-black">edit</span>
                      </button>
                      <button onClick={() => handleDeleteClick(item.title, item.id)} className="w-11 h-11 bg-slate-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all flex items-center justify-center border border-slate-100">
                        <span className="material-symbols-outlined text-lg font-black">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {activeTab === 'lessons' && realLessons.map((item, idx) => (
              <div key={idx} className="bg-white rounded-[40px] border border-slate-200 p-10 shadow-sm hover:shadow-2xl hover:border-brand-500/30 transition-all duration-500 group relative flex flex-col min-h-[450px]">
                <div className="relative w-20 h-20 rounded-[28px] overflow-hidden mb-10 shadow-xl border-4 border-slate-50">
                  <img src={item.image_url || `https://api.dicebear.com/7.x/shapes/svg?seed=lesson-${idx}`} className="w-full h-full object-cover" alt={item.title} />
                </div>

                <h3 onClick={() => handleTitleClick(item, 'view-lesson')} className="text-xl font-black text-slate-900 uppercase tracking-tight mb-4 group-hover:text-brand-500 transition-colors cursor-pointer leading-tight">
                  {item.title}
                </h3>

                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Subject Category</p>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex-1">
                  <p className="text-[9px] font-black text-slate-700 uppercase tracking-[0.1em] mb-1">Assigned Discipline</p>
                  <p className="text-[11px] font-black text-slate-900 uppercase tracking-tighter truncate">{item.category || 'Mathematics'}</p>
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
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">List Empty</h3>
                  <p className="text-slate-500 font-medium max-w-sm mx-auto mt-2">No {activeTab} found in your account. Start creating now.</p>
                </div>
                <button
                  onClick={() => {
                    if (activeTab === 'courses') startNewArchitect('course');
                    else if (activeTab === 'exams') startNewArchitect('exam');
                    else startNewArchitect('lesson');
                  }}
                  className="bg-brand-50 text-brand-500 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-brand-500 hover:text-white transition-all active:scale-95"
                >
                  Create New Content
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

