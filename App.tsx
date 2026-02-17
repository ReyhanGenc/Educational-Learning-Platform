
import React, { useState } from 'react';
import { UserRole, Course } from './types';
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

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [view, setView] = useState<'landing' | 'login' | 'register' | 'pricing' | 'app' | 'public-lessons'>('landing');
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([
    { id: '1', title: 'Advanced Calculus II: Vector Space', instructor: 'Dr. Sarah Jenkins', category: 'Mathematics', progress: 65, total: 20, completed: 12, image: 'https://picsum.photos/seed/calc/800/1000', isPurchased: true, price: 49.99 },
    { id: '2', title: 'Molecular Genetics & DNA Structure', instructor: 'Prof. David Chen', category: 'Biology', progress: 0, total: 12, completed: 0, image: 'https://picsum.photos/seed/bio/800/1000', isPurchased: false, price: 59.99 },
    { id: '3', title: 'Advanced Data Structures & Algorithms', instructor: 'Eng. Michael Rose', category: 'Computer Science', progress: 88, total: 25, completed: 22, image: 'https://picsum.photos/seed/code/800/1000', isPurchased: true, price: 69.99 },
    { id: '4', title: 'Modern European History & Cold War', instructor: 'Dr. Helena Smith', category: 'History', progress: 0, total: 20, completed: 0, image: 'https://picsum.photos/seed/hist/800/1000', isPurchased: false, price: 39.99 },
  ]);
  const [cart, setCart] = useState<Course[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const addToCart = (course: Course) => {
    if (!cart.find(c => c.id === course.id)) {
      setCart([...cart, course]);
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

  const handlePaymentComplete = () => {
    // Update purchased status for courses in cart
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
  };

  const handleLogin = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setView('app');
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setRole(null);
    setView('landing');
    setCurrentPage('dashboard');
    setActiveCourseId(null);
  };

  const handleRegister = (selectedRole: UserRole, name: string) => {
    setRole(selectedRole);
    setView('app');
    setCurrentPage('dashboard');
    // In a real app, we would save the name too
  };

  const handleViewPublicLessons = () => {
    setView('public-lessons');
    setCurrentPage('lessons-list');
  };

  const handleSelectPublicLesson = (id: string) => {
    setView('public-lessons');
    setCurrentPage('lesson-view');
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

  if (view === 'login' && !role) {
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
              <LessonView onBack={() => setCurrentPage('lessons-list')} />
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
          onStartLesson={() => setCurrentPage('lesson-view')}
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
        return <LessonView onBack={() => setCurrentPage(activeCourseId ? 'course-details' : 'lessons-list')} />;
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
        <main className="flex-1 overflow-y-auto custom-scrollbar">
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

export default App;
