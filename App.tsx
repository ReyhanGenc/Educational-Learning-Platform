
import React, { useState, useEffect } from 'react';
import { UserRole, Course } from './types';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Pricing from './pages/Pricing';
import Dashboard from './pages/Dashboard';
import ExamList from './pages/ExamList';
import ExamTaker from './pages/ExamTaker';
import ContentCatalog from './pages/ContentCatalog';
import Management from './pages/Management';
import Bank from './pages/Bank';
import LessonView from './pages/LessonView';
import LessonsList from './pages/LessonsList';
import Analysis from './pages/Analysis';
import Settings from './pages/Settings';
import CourseDetails from './pages/CourseDetails';
import ResultView from './pages/ResultView';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import CartDrawer from './components/CartDrawer';
import Payment from './pages/Payment';
import TopicExplanationView from './pages/TopicExplanationView';
import { UNIT_EXAMS } from './src/data/unit_exams';
import { mockExams } from './pages/ExamList';
import { supabase } from './src/lib/supabase';
import AIChatPopup from './src/components/AIChatPopup';

const AppContent: React.FC = () => {
  const { user, role, loading: authLoading, signOut, signIn, signUp } = useAuth();
  const [view, setView] = useState<'landing' | 'login' | 'register' | 'pricing' | 'app' | 'public-lessons' | 'public-catalog' | 'public-course-preview'>('landing');
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<Course[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [activeExamLessonId, setActiveExamLessonId] = useState<string | null>(null);
  const [activeExamId, setActiveExamId] = useState<string | null>(null);
  const [activeResultId, setActiveResultId] = useState<string | null>(null);
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);
  const [featuredLessons, setFeaturedLessons] = useState<any[]>([]);
  const [lessonBackTarget, setLessonBackTarget] = useState<'course-details' | 'lessons-list'>('course-details');
  const [dynamicExamQuestions, setDynamicExamQuestions] = useState<any[]>([]);
  const [isExamLoading, setIsExamLoading] = useState(false);

  // Fetch user data and courses
  const fetchData = async () => {
    // Only show global loading on initial load or if we have no data
    if (courses.length === 0) setLoading(true);
    try {
      // 1. Fetch available courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .order('title');

      if (coursesError) throw coursesError;

      // 2. Fetch Chapters ONLY for these courses to be efficient and avoid limits
      let allChapters: any[] = [];
      if (coursesData && coursesData.length > 0) {
        const courseIds = coursesData.map(c => c.id);
        const { data: chaptersRes, error: chaptersError } = await supabase
          .from('chapters')
          .select('id, course_id')
          .in('course_id', courseIds);
        
        if (chaptersError) console.error('Error fetching chapters:', chaptersError);
        allChapters = chaptersRes || [];
      }

      // 3. Fetch user enrollments if logged in
      let userEnrollments: any[] = [];
      if (user) {
        const { data: enrollmentsData, error: enrollmentsError } = await supabase
          .from('enrollments')
          .select('*')
          .eq('user_id', user.id);

        if (enrollmentsError) console.error('Error fetching enrollments:', enrollmentsError);
        userEnrollments = enrollmentsData || [];
      }

      // 4. Merge data and calculate progress
      const mergedCourses: Course[] = (coursesData || []).map((course: any) => {
        const enrollment = userEnrollments.find(e => e.course_id === course.id);
        const progressMap = enrollment?.lesson_progress || {};
        const completedIds = enrollment?.completed_lesson_ids || [];

        const chapters = allChapters.filter(ch => ch.course_id === course.id);
        const totalChaptersCount = chapters.length || 1;
        let totalPointsEarned = 0;
        let completedChaptersCount = 0;

        chapters.forEach((ch: any) => {
          const introDone = progressMap[`intro-${ch.id}`]?.read;
          const examDone = progressMap[ch.id]?.quiz_score !== undefined;

          if (introDone) totalPointsEarned += 50;
          if (examDone) totalPointsEarned += 50;
          if (introDone && examDone) completedChaptersCount++;
        });

        const totalPointsPossible = chapters.length * 100 || 100;
        const dynamicProgress = Math.round((totalPointsEarned / totalPointsPossible) * 100);

        // Debug log to trace matching issues (removed in next step if confirmed)
        // console.log(`Course ${course.title}: ChID example: ${chapters[0]?.id}, Progress: ${dynamicProgress}%`);

        return {
          id: course.id,
          title: course.title,
          instructor: course.instructor,
          category: course.category,
          image: course.image,
          price: parseFloat(course.price),
          description: course.description,
          education_level: course.education_level,
          level: course.level,
          total_duration: course.total_duration,
          rating: parseFloat(course.rating),
          isPurchased: !!enrollment,
          progress: enrollment ? dynamicProgress : 0,
          completed: enrollment ? completedChaptersCount : 0,
          total: totalChaptersCount,
          lesson_progress: progressMap,
          completed_lesson_ids: completedIds
        };
      });

      setCourses(mergedCourses);

      // 4. Fetch featured lessons for landing page
      const { data: featuredData } = await supabase
        .from('lessons')
        .select('id, title, category, image_url, content_blocks, chapters(title, courses(id, title, category, image))')
        .limit(6);

      if (featuredData) {
        const flattenedFeatured = (featuredData as any[]).map(item => {
          const chapter = Array.isArray(item.chapters) ? item.chapters[0] : item.chapters;
          const course = chapter ? (Array.isArray(chapter.courses) ? chapter.courses[0] : chapter.courses) : null;

          let description = '';
          if (item.content_blocks && Array.isArray(item.content_blocks)) {
            const textBlock = item.content_blocks.find((b: any) => b.type === 'text');
            if (textBlock) {
              description = textBlock.content.replace(/<[^>]*>/g, '').substring(0, 100) + '...';
            }
          }

          return {
            id: item.id,
            title: item.title,
            description: description || 'Educational subject explanation.',
            chapterTitle: chapter?.title || '',
            courseId: course?.id || '',
            courseTitle: course?.title || 'Standalone Subject',
            category: item.category || course?.category || 'Educational',
            image: item.image_url || course?.image || `https://picsum.photos/seed/${item.id}/600/400`
          };
        });
        setFeaturedLessons(flattenedFeatured);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleRefresh = () => {
      fetchData();
    };
    window.addEventListener('refresh-progress', handleRefresh);
    return () => window.removeEventListener('refresh-progress', handleRefresh);
  }, [user?.id]);

  useEffect(() => {
    fetchData();
    if (view === 'app' && user && !role && !authLoading) {
      // Small delay to ensure DB role is propagated if just signed up
      const timer = setTimeout(() => fetchData(), 500);
      return () => clearTimeout(timer);
    }
  }, [user?.id, view]);

  // Handle Unit Exam Fetching
  useEffect(() => {
    const fetchUnitExam = async () => {
      if (currentPage === 'unit-exam' && activeExamLessonId && dynamicExamQuestions.length === 0 && !isExamLoading) {
        setIsExamLoading(true);

        const timeout = setTimeout(() => {
          setIsExamLoading((currentLoading) => {
            if (currentLoading) {
              console.warn('Exam load timeout, forcing fallback...');
              setDynamicExamQuestions(UNIT_EXAMS[activeExamLessonId!] || []);
              return false;
            }
            return currentLoading;
          });
        }, 4000);

        try {
          const { data, error } = await supabase.from('exams')
            .select('*')
            .eq('chapter_id', activeExamLessonId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          clearTimeout(timeout);

          if (error) {
            console.error('Supabase Exam Fetch Error:', error);
            setDynamicExamQuestions(UNIT_EXAMS[activeExamLessonId!] || []);
          } else if (data) {
            setDynamicExamQuestions(data.questions || []);
          } else {
            setDynamicExamQuestions(UNIT_EXAMS[activeExamLessonId!] || []);
          }
        } catch (err) {
          console.error('Catch Exam Fetch Error:', err);
          setDynamicExamQuestions(UNIT_EXAMS[activeExamLessonId!] || []);
        } finally {
          setIsExamLoading(false);
        }
      }
    };

    fetchUnitExam();
  }, [currentPage, activeExamLessonId, dynamicExamQuestions.length]);

  const addToCart = (course: Course) => {
    // 1. Check if already purchased
    if (course.isPurchased) {
      console.log('Course already purchased');
      return;
    }

    // 2. Check if already in cart
    if (!cart.find(c => c.id === course.id)) {
      setCart([...cart, course]);
      setIsCartOpen(true);
    } else {
      setIsCartOpen(true);
    }
  };

  const removeFromCart = (courseId: string) => {
    setCart(cart.filter(c => c.id !== courseId));
  };

  const handleCheckout = () => {
    setIsCartOpen(false);
    setCurrentPage('payment');
  };

  const handlePaymentComplete = async () => {
    try {
      // 1. Validation
      if (!user) {
        alert('Please sign in to complete purchase.');
        return;
      }

      // 2. Insert Payment Record
      const totalAmount = cart.reduce((sum, item) => sum + item.price, 0);
      const paymentItems = cart.map(c => ({ id: c.id, title: c.title, price: c.price }));

      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          user_id: user.id,
          amount: totalAmount,
          currency: 'USD',
          status: 'completed',
          items: paymentItems,
          payment_method: 'credit_card' // Placeholder, dynamic if needed later
        });

      if (paymentError) {
        console.error('Error recording payment:', paymentError);
        throw new Error('Payment recording failed.');
      }

      // 3. Update Instructor Balances and Record Transactions
      for (const item of cart) {
        // Find instructor ID for this course
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('user_id, price')
          .eq('id', item.id)
          .single();

        if (courseError) {
          console.error(`Error fetching instructor for course ${item.id}:`, courseError);
          continue;
        }

        const instructorId = courseData.user_id;
        const amount = parseFloat(courseData.price);

        if (instructorId) {
          // Update instructor balance
          const { error: balanceError } = await supabase.rpc('increment_balance', {
            user_id_param: instructorId,
            amount_param: Math.round(amount * 100) / 100
          });

          // Fallback if RPC doesn't exist yet (though we should assume SQL was run)
          if (balanceError) {
            console.warn('RPC increment_balance failed, falling back to manual update:', balanceError);
            const { data: profile } = await supabase.from('profiles').select('balance').eq('id', instructorId).single();
            const currentBalance = parseFloat(profile?.balance || '0');
            const newBalance = Math.round((currentBalance + amount) * 100) / 100;
            await supabase.from('profiles').update({ balance: newBalance }).eq('id', instructorId);
          }

          // Record transaction
          await supabase.from('instructor_transactions').insert({
            instructor_id: instructorId,
            student_id: user.id,
            course_id: item.id,
            amount: amount,
            description: `Sale of course: ${item.title}`
          });
        }
      }

      // 4. Create Enrollments (with check)
      const newEnrollments = cart.map(course => ({
        user_id: user.id,
        course_id: course.id,
        progress: 0,
        completed_lesson_ids: [],
        purchase_date: new Date().toISOString()
      }));

      // Upsert to handle potential race conditions or re-buys gracefully
      const { data: insertedEnrollments, error: enrollmentError } = await supabase
        .from('enrollments')
        .upsert(newEnrollments, { onConflict: 'user_id,course_id' })
        .select();

      if (enrollmentError) {
        console.error('Enrollment Insert Error:', enrollmentError);
        throw enrollmentError;
      }

      // 5. Update Local State & Force Re-fetch
      // Optimistic update
      const updatedCourses = courses.map(course => {
        if (cart.find(c => c.id === course.id)) {
          return { ...course, isPurchased: true, progress: 0, completed: 0 };
        }
        return course;
      });

      setCourses(updatedCourses);
      setCart([]);

      // 6. Refresh data manually
      await fetchData();

      setCurrentPage('dashboard');

      alert('Payment Successful! You can now access your new courses.');
    } catch (error: any) {
      console.error('Payment Error:', error);
      // specific error handling
      if (error.code === '23505') { // Postgres unique violation
        alert('You have already purchased one or more of these courses. Please check your dashboard.');
        setCart([]);
        setCurrentPage('dashboard');
      } else {
        alert('Payment failed: ' + error.message);
      }
    }
  };

  const handleLogin = async (selectedRole: UserRole, email?: string, password?: string, rememberMe?: boolean) => {
    try {
      if (email && password) {
        await signIn(email, password, selectedRole, rememberMe);
        setView('app');
        setCurrentPage('dashboard');
      }
    } catch (error: any) {
      if (error.message === "Email not confirmed") {
        alert("Giriş yapabilmeniz için e-posta adresinizi doğrulamanız gerekmektedir. Lütfen gelen kutunuzu (ve gerekiyorsa spam klasörünü) kontrol edip onay linkine tıklayın.");
      } else {
        alert(error.message);
      }
    }
  };

  const handleLogout = async () => {
    await signOut();
    setView('landing');
    setCurrentPage('dashboard');
    setActiveCourseId(null);
  };

  const handleRegister = async (selectedRole: UserRole, name: string, email?: string, password?: string) => {
    try {
      if (email && password) {
        await signUp(email, password, name, selectedRole);
        alert('Registration successful! Please sign in.');
        setView('login');
      }
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleViewPublicLessons = () => {
    setView('public-lessons');
    setCurrentPage('lessons-list');
  };

  const handleSelectPublicLesson = (courseId: string, lessonId: string) => {
    // This now handles standalone topic selection from the landing page
    setActiveTopicId(lessonId);
    setView('public-lessons');
    setCurrentPage('topic-view');
  };

  const handleUnitExamComplete = async (score: number, answers?: Record<number, string>, timeSpentSeconds?: number) => {
    if (!user || !activeExamLessonId || !activeCourseId) return;

    try {
      // 1. Fetch current enrollment
      const { data: enrollment, error: fetchError } = await supabase
        .from('enrollments')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', activeCourseId)
        .single();

      if (fetchError) throw fetchError;

      // 2. Update progress map
      const currentProgressMap = enrollment.lesson_progress || {};
      const lessonProgress = currentProgressMap[activeExamLessonId] || {};

      lessonProgress.quiz_score = score;
      lessonProgress.quiz_answers = answers;
      lessonProgress.time_spent_seconds = timeSpentSeconds || 0; // Ensure time is saved here too

      const newProgressMap = {
        ...currentProgressMap,
        [activeExamLessonId]: lessonProgress
      };

      // 3. Recalculate Global Progress (Course Level)
      // This logic must match LessonView logic to be consistent
      const { data: chaptersData } = await supabase
        .from('chapters')
        .select('*, lessons(*)')
        .eq('course_id', activeCourseId);

      let totalChapters = (chaptersData || []).length || 1;
      let totalPointsEarned = 0;
      let totalPointsPossible = totalChapters * 100;
      let completedChaptersCount = 0;
      let isCurrentLessonCompleted = false;

      (chaptersData || []).forEach((ch: any) => {
        const examDone = newProgressMap[ch.id]?.quiz_score !== undefined;

        if (ch.id === activeExamLessonId && examDone) {
          isCurrentLessonCompleted = true;
          // When unit exam is passed, ensure intro is also marked for robust progress
          newProgressMap[`intro-${ch.id}`] = { read: true };
          // Auto-mark any underlying lessons as read
          (ch.lessons || []).forEach((l: any) => {
            if (!newProgressMap[l.id]) newProgressMap[l.id] = {};
            newProgressMap[l.id].read = true;
          });
        }

        const introDone = (newProgressMap[`intro-${ch.id}`]?.read);

        if (introDone) totalPointsEarned += 50;
        if (examDone) totalPointsEarned += 50;

        if (introDone && examDone) {
          completedChaptersCount++;
        }
      });

      const newGlobalProgress = totalPointsPossible > 0 ? Math.round((totalPointsEarned / totalPointsPossible) * 100) : 0;

      const { error: updateError } = await supabase
        .from('enrollments')
        .update({
          lesson_progress: newProgressMap,
          progress: newGlobalProgress,
          completed_lesson_ids: isCurrentLessonCompleted
            ? [...new Set([...(enrollment.completed_lesson_ids || []), activeExamLessonId])]
            : (enrollment.completed_lesson_ids || [])
        })
        .eq('id', enrollment.id);

      if (updateError) throw updateError;

      // 4. Save to exam_results for historical tracking and analysis
      // IMPORTANT: activeExamLessonId is a chapter_id. We need to find the actual exam record ID if it exists.
      const { data: realExam } = await supabase
        .from('exams')
        .select('id')
        .eq('chapter_id', activeExamLessonId)
        .limit(1)
        .maybeSingle();

      let recordId = null;
      if (realExam) {
        const { data: recordData, error: recordError } = await supabase.from('exam_results').insert({
          user_id: user.id,
          exam_id: realExam.id,
          score: score,
          answers: answers,
          total_questions: dynamicExamQuestions.length,
          correct_answers: Math.round((score / 100) * dynamicExamQuestions.length),
          incorrect_answers: dynamicExamQuestions.length - Math.round((score / 100) * dynamicExamQuestions.length),
          time_spent_seconds: timeSpentSeconds || 0
        }).select("id").maybeSingle();

        if (recordError) console.error('Error saving historical record:', recordError);
        recordId = recordData?.id;
      }

      // 5. Navigate to Results View
      setActiveExamId('unit-' + activeExamLessonId); 
      setActiveResultId(recordId);
      setCurrentPage('exam-result');

      setDynamicExamQuestions([]);
      await fetchData(); // Force local state sync and refresh view

      // Force refresh of courses/enrollment data via useEffect dependency or implicit reload
    } catch (error) {
      console.error('Error saving exam result:', error);
      alert('Failed to save exam result.');
      setCurrentPage('lesson-view');
    }
  };

  // Only show global loading screen if we are totally fresh and have no user session yet.
  // If we have a user, we stay in the app and let sub-components handle their own loading states.
  if ((loading || authLoading) && !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-brand-500 rounded-xl flex items-center justify-center text-white animate-bounce shadow-xl shadow-brand-500/20">
            <span className="material-symbols-outlined text-[28px]">school</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-brand-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-brand-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-brand-500 rounded-full animate-bounce"></div>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Syncing Environment...</p>
        </div>
      </div>
    );
  }

  if (view === 'landing') {
    return (
      <LandingPage
        onStart={() => setView('login')}
        onRegister={() => setView('register')}
        onPricing={() => setView('pricing')}
        onViewLessons={handleViewPublicLessons}
        onSelectLesson={handleSelectPublicLesson}
        onExploreCourses={() => setView('public-catalog')}
        onPreviewCourse={(course) => {
          setActiveCourseId(course.id);
          setIsPreviewMode(true);
          setView('public-course-preview');
        }}
        featuredLessons={featuredLessons}
        featuredCourses={courses.slice(0, 3)}
      />
    );
  }

  // Guest/Visitor Views
  if (view === 'public-catalog') {
    return (
      <div className="flex h-screen overflow-hidden bg-[#f8fafc]">
        <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
          <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex items-center justify-between z-50">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('landing')}>
              <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center text-white">
                <span className="material-symbols-outlined text-[20px]">school</span>
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-900 uppercase">EduExam</span>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => setView('login')} className="text-sm font-bold text-slate-600 hover:text-brand-500 transition-colors">Sign In</button>
              <button onClick={() => setView('register')} className="bg-brand-500 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-brand-500/20 active:scale-95 transition-all">Join for Free</button>
            </div>
          </header>
          <div className="flex-1 overflow-y-auto">
            <ContentCatalog
              courses={courses}
              isVisitor={true}
              onBack={() => setView('landing')}
              onSelectCourse={() => setView('register')}
              cart={[]}
              onAddToCart={() => setView('register')}
              onOpenCart={() => setView('register')}
              onPreview={(course) => {
                setActiveCourseId(course.id);
                setIsPreviewMode(true);
                setView('public-course-preview');
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (view === 'public-course-preview') {
    const activeCourse = courses.find(c => c.id === activeCourseId);
    return (
      <div className="h-screen overflow-hidden bg-slate-100 flex flex-col">
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex items-center justify-between z-10">
          <button
            onClick={() => setView('public-catalog')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-black uppercase tracking-widest text-[10px]"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span> Back to Catalog
          </button>
          <button onClick={() => setView('register')} className="bg-brand-500 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest">Join to Enroll</button>
        </header>
        <div className="flex-1 overflow-y-auto">
          <CourseDetails
            course={activeCourse}
            previewMode={true}
            onBack={() => setView('public-catalog')}
            onStartLesson={() => setView('register')}
            onTakeExam={() => setView('register')}
          />
        </div>
      </div>
    );
  }

  if (view === 'register') {
    return <Register onRegister={handleRegister} onLogin={() => setView('login')} onBack={() => setView('landing')} />;
  }

  if (view === 'pricing') {
    return <Pricing onStart={() => setView('register')} onBack={() => setView('landing')} />;
  }

  if (view === 'login' && !user) {
    return <Login onLogin={handleLogin} onRegister={() => setView('register')} onBack={() => setView('landing')} />;
  }

  // Handle Public Lessons Viewer (Unauthenticated)
  if (view === 'public-lessons' && !role) {
    return (
      <div className="flex h-screen overflow-hidden bg-[#f8fafc]">
        <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
          <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex items-center justify-between z-50">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('landing')}>
              <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center text-white shadow-lg">
                <span className="material-symbols-outlined text-[18px]">school</span>
              </div>
              <span className="font-bold text-lg tracking-tight text-slate-900">EduExam</span>
            </div>
            <button
              onClick={() => setView('login')}
              className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
            >
              Sign In for Full Access
            </button>
          </header>
          <main className="flex-1 overflow-y-auto custom-scrollbar">
            {currentPage === 'topic-view' ? (
              <TopicExplanationView
                topicId={activeTopicId!}
                onBack={() => {
                  setCurrentPage('lessons-list');
                }}
              />
            ) : (
              <LessonsList
                onSelectTopic={(topicId: string) => {
                  setActiveTopicId(topicId);
                  setCurrentPage('topic-view');
                }}
                onBack={() => setView('landing')}
              />
            )}
          </main>
        </div>
      </div>
    );
  }

  // Handle Exam Mode specifically (no sidebar/nav)
  if (currentPage === 'exam-taker') {
    return <ExamTaker onExit={() => setCurrentPage('exams')} onSubmit={(resultId) => { setActiveResultId(resultId || null); setCurrentPage('exam-result'); }} examId={activeExamId} resultId={activeResultId} />;
  }

  const renderPage = () => {
    const isInstructor = role === UserRole.INSTRUCTOR;

    switch (currentPage) {
      case 'dashboard':
        return (
          <Dashboard
            role={role!}
            courses={courses}
            onNavigate={(page, cId, lId) => {
              setCurrentPage(page);
              if (cId) setActiveCourseId(cId);
              if (lId) setActiveLessonId(lId);
            }}
            cartCount={cart.length}
            onOpenCart={() => setIsCartOpen(true)}
          />
        );
      case 'content':
        return isInstructor
          ? <Management />
          : <ContentCatalog
            courses={courses}
            onSelectCourse={(id) => { setActiveCourseId(id); setCurrentPage('course-details'); setIsPreviewMode(false); }}
            cart={cart}
            onAddToCart={addToCart}
            onOpenCart={() => setIsCartOpen(true)}
            onPreview={(course) => { setActiveCourseId(course.id); setCurrentPage('course-details'); setIsPreviewMode(true); }}
          />;
      case 'bank':
        return <Bank />;
      case 'course-details':
        const activeCourse = courses.find(c => c.id === activeCourseId);
        return <CourseDetails
          course={activeCourse}
          previewMode={isPreviewMode}
          onBack={() => setCurrentPage('content')}
          onStartLesson={(lessonId) => {
            setLessonBackTarget('course-details');
            const updateLastAccessed = async () => {
              if (activeCourse && user && lessonId) {
                await supabase.from('enrollments').update({
                  last_accessed_lesson_id: lessonId
                }).eq('user_id', user.id).eq('course_id', activeCourse.id);
              }
              setCurrentPage('lesson-view');
            };
            updateLastAccessed();
          }}
          onTakeExam={(lessonId) => {
            setActiveExamLessonId(lessonId);
            setActiveLessonId(null);
            setCurrentPage('unit-exam');
          }}
        />;
      case 'exams':
        return <ExamList role={role!} onTakeExam={(id: string, resultId?: string) => { setActiveExamId(id); setActiveResultId(resultId || null); setCurrentPage('exam-taker'); }} onViewResults={(id: string, resultId?: string) => { setActiveExamId(id); setActiveResultId(resultId || null); setCurrentPage('exam-result'); }} />;
      case 'exam-result':
        const rExamId = activeExamLessonId ? `unit-${activeExamLessonId}` : activeExamId;
        return (
          <ResultView
            onBack={() => {
              if (activeExamLessonId) {
                if (activeLessonId) {
                  setCurrentPage('lesson-view');
                } else {
                  setCurrentPage('course-details');
                }
                setActiveExamLessonId(null);
              } else {
                setCurrentPage('exams');
              }
            }}
            examId={rExamId}
            resultId={activeResultId}
          />
        );
      case 'analysis':
        return <Analysis standalone={true} />;
      case 'settings':
        return <Settings role={role!} />;
      case 'lessons-list':
        return (
          <LessonsList
            onSelectTopic={(topicId: string) => {
              setActiveTopicId(topicId);
              setCurrentPage('topic-view');
            }}
            onBack={() => setCurrentPage('dashboard')}
          />
        );
      case 'topic-view':
        return (
          <TopicExplanationView
            topicId={activeTopicId!}
            onBack={() => {
              setCurrentPage('lessons-list');
            }}
          />
        );
      case 'lesson-view':
        return (
          <LessonView
            courseId={activeCourseId!}
            initialLessonId={activeLessonId}
            onBack={() => {
              setCurrentPage(lessonBackTarget);
              setActiveLessonId(null);
            }}
            onTakeExam={(lessonId) => {
              setActiveExamLessonId(lessonId);
              setCurrentPage('unit-exam');
            }}
            onComplete={() => {
              fetchData();
              window.dispatchEvent(new Event('refresh-progress'));
            }}
          />
        );
      case 'unit-exam':
        const currentCourse = courses.find(c => c.id === activeCourseId);
        const lessonProgressMap = currentCourse?.lesson_progress || {};
        const activeUnitProgress = lessonProgressMap[activeExamLessonId!];

        if (isExamLoading) {
          return (
            <div className="flex h-screen items-center justify-center bg-white">
              <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          );
        }

        if (dynamicExamQuestions.length === 0 && !isExamLoading) {
          return (
            <div className="flex flex-col h-screen items-center justify-center bg-white p-10 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300 mb-6">
                <span className="material-symbols-outlined text-4xl">inventory_2</span>
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">No Assessment Data</h3>
              <p className="text-slate-500 text-sm max-w-xs mb-8">This unit does not have a linked assessment model yet.</p>
              <button
                onClick={() => { setCurrentPage('course-details'); setActiveExamLessonId(null); setActiveLessonId(null); }}
                className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest"
              >
                Back to Content
              </button>
            </div>
          );
        }

        return (
          <ExamTaker
            onExit={() => { setCurrentPage('course-details'); setActiveExamLessonId(null); setActiveLessonId(null); setDynamicExamQuestions([]); }}
            onComplete={handleUnitExamComplete}
            examData={{
              title: 'Unit Knowledge Assessment',
              initialAnswers: activeUnitProgress?.quiz_answers,
              questions: dynamicExamQuestions,
              isCompleted: activeUnitProgress?.quiz_score !== undefined
            }}
          />
        );
      case 'payment':
        return <Payment cart={cart} onBack={() => setCurrentPage('dashboard')} onComplete={handlePaymentComplete} />;
      default:
        return <Dashboard role={role!} onNavigate={setCurrentPage} cartCount={cart.length} onOpenCart={() => setIsCartOpen(true)} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc]">
      <Sidebar
        role={role!}
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        onLogout={handleLogout}
      />
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <main id="main-content" className="flex-1 overflow-y-auto custom-scrollbar">
          {renderPage()}
        </main>
        <MobileNav
          role={role!}
          currentPage={currentPage}
          onNavigate={setCurrentPage}
        />
      </div>
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cart}
        onRemoveItem={removeFromCart}
        onCheckout={handleCheckout}
      />
      
      {user && role === UserRole.STUDENT && (
        <AIChatPopup 
          userName={user.user_metadata?.full_name || 'Öğrenci'} 
          currentPage={currentPage}
          currentLesson={courses.find(c => c.id === activeCourseId)?.title || undefined}
          courses={courses}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
