
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
import { supabase } from './src/lib/supabase';

const AppContent: React.FC = () => {
  const { user, role, signOut, signIn, signUp } = useAuth();
  const [view, setView] = useState<'landing' | 'login' | 'register' | 'pricing' | 'app' | 'public-lessons'>('landing');
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<Course[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [activeExamLessonId, setActiveExamLessonId] = useState<string | null>(null);

  // Fetch user data and courses
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Fetch available courses with nested chapters and lessons count
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select('*, chapters(id, lessons(id))')
          .order('title');

        if (coursesError) throw coursesError;

        // 2. Fetch user enrollments if logged in
        let userEnrollments: any[] = [];
        if (user) {
          const { data: enrollmentsData, error: enrollmentsError } = await supabase
            .from('enrollments')
            .select('*')
            .eq('user_id', user.id);

          if (enrollmentsError) console.error('Error fetching enrollments:', enrollmentsError);
          userEnrollments = enrollmentsData || [];
          console.log('User Enrollments:', userEnrollments);
        }

        // 3. Merge data
        console.log('Courses before merge:', coursesData?.length);
        const mergedCourses: Course[] = (coursesData || []).map((course: any) => {
          const enrollment = userEnrollments.find(e => {
            const match = e.course_id === course.id;
            if (match) console.log('Found enrollment for:', course.title);
            return match;
          });

          // Calculate total lessons
          const totalLessons = (course.chapters || []).reduce((acc: number, chapter: any) => {
            return acc + (chapter.lessons?.length || 0);
          }, 0);

          return {
            id: course.id,
            title: course.title,
            instructor: course.instructor,
            category: course.category,
            image: course.image,
            price: parseFloat(course.price),
            description: course.description,
            level: course.level,
            total_duration: course.total_duration,
            rating: parseFloat(course.rating),

            // Enrollment data
            isPurchased: !!enrollment,
            progress: enrollment ? enrollment.progress : 0,
            completed: enrollment ? (enrollment.completed_lesson_ids?.length || 0) : 0,
            total: totalLessons > 0 ? totalLessons : 0,
            lesson_progress: enrollment ? enrollment.lesson_progress : {},
          };
        });

        setCourses(mergedCourses);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, currentPage]); // Re-fetch when page changes to ensure data is fresh, especially after return from payment

  // Auto-switch to app if user is signed in
  useEffect(() => {
    if (user) {
      setView('app');
    }
  }, [user]);

  const addToCart = (course: Course) => {
    // 1. Check if already purchased
    if (course.isPurchased) {
      alert('You have already purchased this course.');
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

      // 3. Create Enrollments (with check)
      console.log('Creating enrollments for:', cart.map(c => c.id));

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

      console.log('Enrollments inserted successfully:', insertedEnrollments);

      // 4. Update Local State & Force Re-fetch
      // Optimistic update
      const updatedCourses = courses.map(course => {
        if (cart.find(c => c.id === course.id)) {
          return { ...course, isPurchased: true, progress: 0, completed: 0 };
        }
        return course;
      });

      setCourses(updatedCourses);
      setCart([]);
      setCurrentPage('dashboard');

      alert('Payment Successful! You can now access your new courses.');

      // Force page reload to ensure all states (like lesson viewers) are fresh
      // This is a bit heavy-handed but ensures 100% sync until we have a global store
      window.location.reload();

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
      alert(error.message);
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

  const handleSelectPublicLesson = (id: string) => {
    setView('public-lessons');
    setCurrentPage('lesson-view');
  };

  const handleUnitExamComplete = async (score: number) => {
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

      let totalPointsPossible = 0;
      let totalPointsEarned = 0;
      let isCurrentLessonCompleted = false;

      (chaptersData || []).forEach((ch: any) => {
        ch.lessons.forEach((l: any) => {
          totalPointsPossible += 100;
          const p = newProgressMap[l.id] || {};
          // Score = (Read ? 50 : 0) + (ExamPass ? 50 : 0)
          const rScore = p.read ? 50 : 0;
          const qScore = (p.quiz_score || 0) >= 50 ? 50 : 0;

          const lScore = rScore + qScore;
          totalPointsEarned += lScore;

          if (l.id === activeExamLessonId && lScore >= 95) {
            isCurrentLessonCompleted = true;
          }
        });
      });

      const newGlobalProgress = totalPointsPossible > 0
        ? Math.round((totalPointsEarned / totalPointsPossible) * 100)
        : 0;

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

      alert(`Exam Completed! Score: ${score}%`);

      // 4. Navigate back
      setCurrentPage('lesson-view');
      setActiveExamLessonId(null);

      // Force refresh of courses/enrollment data via useEffect dependency or implicit reload
    } catch (error) {
      console.error('Error saving exam result:', error);
      alert('Failed to save exam result.');
      setCurrentPage('lesson-view');
    }
  };

  if (view === 'landing') {
    return (
      <LandingPage
        onStart={() => setView('login')}
        onRegister={() => setView('register')}
        onPricing={() => setView('pricing')}
        onViewLessons={handleViewPublicLessons}
        onSelectLesson={handleSelectPublicLesson}
      />
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
            {currentPage === 'lessons-list' ? (
              <LessonsList onSelectLesson={() => setCurrentPage('lesson-view')} onBack={() => setView('landing')} />
            ) : (
              <LessonView
                courseId={activeCourseId || 'preview-mode'}
                onBack={() => setCurrentPage('lessons-list')}
              />
            )}
          </main>
        </div>
      </div>
    );
  }

  // Handle Exam Mode specifically (no sidebar/nav)
  if (currentPage === 'exam-taker') {
    return <ExamTaker onExit={() => setCurrentPage('exams')} onSubmit={() => setCurrentPage('exam-result')} />;
  }

  const renderPage = () => {
    const isInstructor = role === UserRole.INSTRUCTOR;

    switch (currentPage) {
      case 'dashboard':
        return <Dashboard role={role!} onNavigate={setCurrentPage} cartCount={cart.length} onOpenCart={() => setIsCartOpen(true)} />;
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
          onStartLesson={(lessonId) => { // Updated to accept lessonId
            // This needs to update the LAST ACCESSED lesson or just navigate to view?
            // Since App.tsx has "activeCourseId", LessonView figures out which lesson to show...
            // LessonView logic tries to find "last_accessed_lesson_id".
            // We should update that in DB first? Or pass it to LessonView?
            // Simplest: Update DB then navigate.
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
        />;
      case 'exams':
        return <ExamList role={role!} onTakeExam={() => setCurrentPage('exam-taker')} onViewResults={() => setCurrentPage('exam-result')} />;
      case 'exam-result':
        return <ResultView onBack={() => setCurrentPage('exams')} />;
      case 'analysis':
        return <Analysis standalone={true} />;
      case 'settings':
        return <Settings role={role!} />;
      case 'lessons-list':
        return <LessonsList onSelectLesson={() => setCurrentPage('lesson-view')} onBack={() => setCurrentPage('dashboard')} />;
      case 'lesson-view':
        const currentCourse = courses.find(c => c.id === activeCourseId);
        return (
          <LessonView
            courseId={activeCourseId!}
            onBack={() => setCurrentPage(activeCourseId ? 'course-details' : 'lessons-list')}
            onTakeExam={(lessonId) => {
              setActiveExamLessonId(lessonId);
              setCurrentPage('unit-exam');
            }}
            onComplete={() => {
              // Refresh data to update progress bars
              const userId = user?.id; // trigger re-fetch
            }}
          />
        );
      case 'unit-exam':
        return (
          <ExamTaker
            onExit={() => { setCurrentPage('lesson-view'); setActiveExamLessonId(null); }}
            onComplete={handleUnitExamComplete}
            examData={{ title: 'Unit Knowledge Assessment' }}
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
