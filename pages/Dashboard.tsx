
import React, { useState, useEffect } from 'react';
import { UserRole, Course } from '../types';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar, Cell } from 'recharts';
import { supabase } from '../src/lib/supabase';
import { useAuth } from '../src/contexts/AuthContext';

interface DashboardProps {
  role: UserRole;
  courses?: Course[];
  onNavigate: (page: string, courseId?: string, lessonId?: string) => void;
  cartCount?: number;
  onOpenCart?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ role, courses = [], onNavigate, cartCount = 0, onOpenCart }) => {
  const { user, userMetadata } = useAuth();
  const isInstructor = role === UserRole.INSTRUCTOR;

  // Real Data State
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    activeCourses: 0,
    lessonsPassed: 0,
    activeProgress: 0,
    completedCourses: 0,
    examsPassed: 0
  });
  const [activityData, setActivityData] = useState<any[]>([]);
  const [radarData, setRadarData] = useState<any[]>([]);
  const [recentLessons, setRecentLessons] = useState<any[]>([]);
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  useEffect(() => {
    if (!isInstructor && user) {
      fetchStudentData();
      fetchRecentLessons();
    } else if (isInstructor && user) {
      fetchInstructorData();
    }
  }, [user?.id, isInstructor]);

  const fetchRecentLessons = async () => {
    try {
      const { data } = await supabase
        .from('lessons')
        .select('id, title, chapters!inner(title, courses!inner(id, title, category, image))')
        .limit(3);

      if (data) {
        const flattened = (data as any[]).map(item => {
          const chapter = Array.isArray(item.chapters) ? item.chapters[0] : item.chapters;
          const course = chapter ? (Array.isArray(chapter.courses) ? chapter.courses[0] : chapter.courses) : null;
          return {
            id: item.id,
            title: item.title,
            courseId: course?.id || '',
            courseTitle: course?.title || '',
            category: course?.category || 'Educational',
            image: course?.image
          };
        });
        setRecentLessons(flattened);
      }
    } catch (err) {
      console.error('Error fetching recent lessons:', err);
    }
  };

  const fetchInstructorData = async () => {
    try {
      setLoading(true);
      const userId = user?.id;
      const instructorName = userMetadata?.full_name || 'Anonymous Instructor';

      // 1. Fetch Instructor's Courses
      const { data: instCourses, error: courseError } = await supabase
        .from('courses')
        .select('id')
        .or(`user_id.eq.${userId},instructor.eq."${instructorName}"`);

      if (courseError) throw courseError;
      const courseIds = instCourses?.map(c => c.id) || [];

      // 2. Fetch Enrollments
      let totalStudents = 0;
      if (courseIds.length > 0) {
        const { count, error: countError } = await supabase
          .from('enrollments')
          .select('*', { count: 'exact', head: true })
          .in('course_id', courseIds);
        if (!countError) totalStudents = count || 0;
      }

      // 3. Fetch Instructor's Exams
      const { data: instExams } = await supabase
        .from('exams')
        .select('id')
        .or(`user_id.eq.${userId},instructor.eq."${instructorName}"`);
      const examIds = instExams?.map(e => e.id) || [];

      // 4. Calculate Monthly Courses Added
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthlyCourseCounts: Record<string, number> = {};

      const { data: allInstCourses } = await supabase
        .from('courses')
        .select('created_at')
        .or(`user_id.eq.${userId},instructor.eq."${instructorName}"`);

      if (allInstCourses) {
        allInstCourses.forEach(c => {
          const date = new Date(c.created_at);
          const mName = months[date.getMonth()];
          monthlyCourseCounts[mName] = (monthlyCourseCounts[mName] || 0) + 1;
        });
      }

      const monthlyDeploymentData = months.map((m, idx) => ({
        month: m,
        courses: monthlyCourseCounts[m] || 0,
        index: idx
      })).filter(m => m.index <= new Date().getMonth()).slice(-6);

      // 5. Fetch Results for metrics
      let avgGrade = 0;
      let assessmentsDone = 0;

      if (examIds.length > 0) {
        const { data: results, error: resultsError } = await supabase
          .from('exam_results')
          .select('score')
          .in('exam_id', examIds);

        if (results && !resultsError) {
          assessmentsDone = results.length;
          const totalScore = results.reduce((acc, r) => acc + r.score, 0);
          avgGrade = assessmentsDone > 0 ? Math.round(totalScore / assessmentsDone) : 0;
        }
      }

      setActivityData(monthlyDeploymentData);
      setMetrics({
        activeCourses: courseIds.length,
        lessonsPassed: totalStudents,
        activeProgress: 0,
        completedCourses: 0,
        examsPassed: assessmentsDone
      });

    } catch (err) {
      console.error('Error fetching instructor data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentData = async () => {
    try {
      setLoading(true);

      const purchasedCourses = courses.filter(c => c.isPurchased);
      const activeCourses = purchasedCourses.filter(c => (c.progress || 0) < 100);
      const activeCoursesCount = activeCourses.length;
      const completedCoursesCount = purchasedCourses.filter(c => (c.progress || 0) >= 100).length;
      const lessonsPassed = courses.reduce((acc, c) => acc + (c.completed || 0), 0);
      
      let totalActiveProgress = 0;
      if (activeCoursesCount > 0) {
        totalActiveProgress = activeCourses.reduce((acc, c) => acc + (c.progress || 0), 0) / activeCoursesCount;
      }

      const { data: results } = await supabase
        .from('exam_results')
        .select('id, score, exam_id, total_questions, correct_answers, time_spent_seconds, exams(subject)')
        .eq('user_id', user!.id);

      let examsPassed = 0;
      let totalScore = 0;
      let completedExamsCount = 0;

      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const today = new Date();
      const activityMap: Record<string, number> = {};

      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        activityMap[days[d.getDay()]] = 0;
      }

      const subjectScores: Record<string, { total: number, count: number }> = {};

      if (results) {
        results.forEach(res => {
          if (res.score >= 50) examsPassed++;
          totalScore += res.score;
          completedExamsCount++;

          if ((res as any).created_at) {
            const resDate = new Date((res as any).created_at);
            const dayName = days[resDate.getDay()];
            if (activityMap[dayName] !== undefined) {
              activityMap[dayName]++;
            }
          }

          const examObj = Array.isArray(res.exams) ? res.exams[0] : res.exams;
          const subject = examObj?.subject || 'General';
          if (!subjectScores[subject]) subjectScores[subject] = { total: 0, count: 0 };
          subjectScores[subject].total += res.score;
          subjectScores[subject].count++;
        });
      }

      setMetrics({
        activeCourses: activeCoursesCount,
        lessonsPassed,
        activeProgress: Math.round(totalActiveProgress),
        completedCourses: completedCoursesCount,
        examsPassed
      });

      const finalActivityData = courses.filter(c => c.isPurchased).map(c => ({
        name: c.title.length > 12 ? c.title.substring(0, 12) + '...' : c.title,
        progress: c.progress || 0
      }));
      setActivityData(finalActivityData.length > 0 ? finalActivityData : [{ name: 'No Courses', progress: 0 }]);

      const categoryProgress: Record<string, { total: number, count: number }> = {};
      courses.filter(c => c.isPurchased).forEach(c => {
        const cat = c.category || 'General';
        if (!categoryProgress[cat]) categoryProgress[cat] = { total: 0, count: 0 };
        categoryProgress[cat].total += c.progress || 0;
        categoryProgress[cat].count++;
      });
      const finalRadarData = Object.keys(categoryProgress).map(cat => ({
        subject: cat,
        score: Math.round(categoryProgress[cat].total / categoryProgress[cat].count),
        fullMark: 100
      }));

      if (finalRadarData.length === 0) {
        setRadarData([
          { subject: 'Math', score: 0, fullMark: 100 },
          { subject: 'Science', score: 0, fullMark: 100 },
          { subject: 'History', score: 0, fullMark: 100 }
        ]);
      } else {
        while (finalRadarData.length < 3) {
          finalRadarData.push({ subject: `Other ${finalRadarData.length}`, score: 0, fullMark: 100 });
        }
        setRadarData(finalRadarData);
      }

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (isInstructor) {
    const dynamicClassMetrics = [
      { label: 'Total Students', value: metrics.lessonsPassed.toLocaleString(), icon: 'groups', color: 'indigo' },
      { label: 'Completed Courses', value: metrics.completedCourses.toString(), icon: 'military_tech', color: 'emerald' },
      { label: 'Active Courses', value: metrics.activeCourses.toString(), icon: 'menu_book', color: 'brand' },
      { label: 'Assessments Done', value: metrics.examsPassed.toLocaleString(), icon: 'fact_check', color: 'amber' }
    ];

    return (
      <div className="min-h-full p-6 lg:p-10 space-y-12 animate-fade-in max-w-[1600px] mx-auto pb-24">
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-brand-500 font-bold text-[10px] uppercase tracking-[0.3em] mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
              Faculty Dashboard
            </div>
            <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight uppercase">
              Welcome back, {userMetadata?.full_name || 'Instructor'}!
            </h1>
            <p className="text-slate-700 font-medium text-base">
              Overall institutional engagement is up <span className="text-emerald-700 font-bold">tracking real data</span>
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button className="bg-white border border-slate-300 p-3 rounded-xl hover:bg-slate-50 transition-all shadow-sm">
              <span className="material-symbols-outlined text-slate-700 text-xl">notifications</span>
            </button>
            <div className="w-12 h-12 rounded-xl bg-slate-900 shadow-lg cursor-pointer hover:scale-105 transition-transform flex items-center justify-center ring-2 ring-white overflow-hidden">
              <span className="text-white font-black text-sm tracking-tighter">
                {getInitials(userMetadata?.full_name || 'Instructor')}
              </span>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {dynamicClassMetrics.map((stat, i) => (
            <div key={i} className="bg-white p-14 rounded-[32px] border border-slate-200 shadow-sm transition-all group relative mt-4 min-h-[250px]">
              <div className={`absolute -top-6 left-10 w-12 h-12 rounded-xl shadow-lg transition-all group-hover:-translate-y-1 duration-300 flex items-center justify-center 
                ${stat.color === 'brand' ? 'bg-brand-500 text-white shadow-brand-500/20' :
                  stat.color === 'indigo' ? 'bg-indigo-600 text-white shadow-indigo-600/20' :
                    stat.color === 'emerald' ? 'bg-emerald-500 text-white shadow-emerald-500/20' :
                      'bg-amber-500 text-white shadow-amber-500/20'}`}>
                <span className="material-symbols-outlined text-xl">{stat.icon}</span>
              </div>
              <div className="pt-8">
                <p className="text-slate-700 text-[9px] font-bold uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                <h3 className="text-4xl font-black text-slate-900 tracking-tight">{stat.value}</h3>
                <p className="text-[10px] font-bold text-slate-600 mt-6 uppercase tracking-widest">Active Tracking</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 bg-white p-14 rounded-[32px] border border-slate-200 shadow-sm space-y-12 min-h-[550px]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">Institutional Growth</h3>
                <p className="text-slate-700 text-xs font-medium">Monthly Course Architect Deployments</p>
              </div>
            </div>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCourses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4850e5" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#4850e5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: '700', fill: '#475569' }} dy={15} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: '600', fill: '#475569' }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.08)', padding: '16px' }}
                  />
                  <Area type="monotone" dataKey="courses" stroke="#4850e5" strokeWidth={4} fillOpacity={1} fill="url(#colorCourses)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-slate-900 rounded-[32px] p-14 shadow-2xl relative overflow-hidden flex flex-col min-h-[550px]">
            <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/10 rounded-full -mr-40 -mt-40 blur-3xl"></div>
            <h3 className="text-xl font-black text-white tracking-widest uppercase mb-12 relative z-10">Unit Engagement</h3>
            <div className="space-y-10 relative z-10 flex-1 overflow-y-auto custom-scrollbar pr-2">
              {courses.filter(c => c.isPurchased).length > 0 ? (
                courses.filter(c => c.isPurchased).map((course, i) => (
                  <div key={i} className="space-y-3 cursor-pointer" onClick={() => onNavigate('course-details', course.id)}>
                    <div className="flex justify-between items-end mb-2">
                      <div className="flex flex-col">
                        <span className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{course.title}</span>
                        <div className="flex items-center gap-2">
                          <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-[8px] font-black text-brand-400 uppercase tracking-widest">{course.completed || 0} / {course.total || 0} UNITS COMPLETED</span>
                          <span className="text-slate-500 text-[8px] font-black uppercase tracking-widest">• {course.education_level} {course.level}</span>
                        </div>
                      </div>
                      <span className="text-white text-xs font-black">{course.progress}%</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <div className="h-full bg-brand-500 rounded-full transition-all duration-1000" style={{ width: `${course.progress}%` }}></div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                  <span className="material-symbols-outlined text-4xl text-white mb-4">school</span>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white">No active enrollments</p>
                </div>
              )}
            </div>
            <button onClick={() => onNavigate('content')} className="mt-12 w-full bg-white text-slate-900 font-black py-5 rounded-2xl shadow-xl hover:bg-slate-100 transition-all text-[10px] uppercase tracking-[0.3em]">
              Manage Repository
            </button>
          </div>
        </div>
      </div >
    );
  }

  return (
    <div className="min-h-full p-6 lg:p-10 space-y-12 animate-fade-in max-w-[1600px] mx-auto pb-24">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-brand-500 font-bold text-[10px] uppercase tracking-[0.3em] mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
            Academic Overview
          </div>
          <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight uppercase">
            Hi, {userMetadata?.full_name?.split(' ')[0] || 'Student'}! 👋
          </h1>
          <p className="text-slate-700 font-medium text-base">
            Your real-time academic progress and competency matrix
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={onOpenCart}
            className="bg-white border border-slate-300 p-3 rounded-xl hover:bg-slate-50 transition-all relative shadow-sm group"
          >
            <span className="material-symbols-outlined text-slate-700 text-xl group-hover:text-brand-500 transition-colors">shopping_cart</span>
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-brand-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                {cartCount}
              </span>
            )}
          </button>
          <div className="w-12 h-12 rounded-xl bg-brand-500 shadow-lg shadow-brand-500/10 cursor-pointer hover:scale-105 transition-transform flex items-center justify-center ring-2 ring-white overflow-hidden">
            <span className="text-white font-black text-sm tracking-tighter">
              {getInitials(userMetadata?.full_name || 'Student')}
            </span>
          </div>
        </div>
      </header>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { id: 'content', label: 'Active Courses', value: metrics.activeCourses.toString().padStart(2, '0'), icon: 'auto_stories', color: 'indigo', progress: metrics.activeProgress },
          { id: 'lessons-list', label: 'Lessons Passed', value: metrics.lessonsPassed.toString().padStart(2, '0'), icon: 'description', color: 'brand', progress: metrics.lessonsPassed > 0 ? 100 : 0 },
          { id: 'content', label: 'Completed Courses', value: (metrics as any).completedCourses?.toString().padStart(2, '0') || '00', icon: 'military_tech', color: 'emerald', progress: (metrics as any).completedCourses > 0 ? 100 : 0 },
          { id: 'exams', label: 'Exams Passed', value: metrics.examsPassed.toString().padStart(2, '0'), icon: 'quiz', color: 'amber', progress: (metrics.examsPassed / (metrics.examsPassed + 1 || 1)) * 100 }
        ].map((stat, i) => (
          <div
            key={i}
            onClick={() => onNavigate(stat.id)}
            className="bg-white p-14 rounded-[32px] border border-slate-200 shadow-sm transition-all group relative mt-4 min-h-[250px] cursor-pointer hover:border-brand-500"
          >
            <div className={`absolute -top-6 left-10 w-12 h-12 rounded-xl shadow-lg transition-all group-hover:-translate-y-1 duration-300 flex items-center justify-center 
              ${stat.color === 'brand' ? 'bg-brand-500 text-white shadow-brand-500/20' :
                stat.color === 'indigo' ? 'bg-indigo-600 text-white shadow-indigo-600/20' :
                  stat.color === 'emerald' ? 'bg-emerald-500 text-white shadow-emerald-500/20' :
                    'bg-amber-500 text-white shadow-amber-500/20'}`}>
              <span className="material-symbols-outlined text-xl">{stat.icon}</span>
            </div>

            <div className="pt-8">
              <p className="text-slate-700 text-[9px] font-bold uppercase tracking-[0.2em] mb-1">{stat.label}</p>
              <h3 className="text-4xl font-black text-slate-900 tracking-tight">{stat.value}</h3>
              <div className="mt-10 flex items-center gap-2">
                <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden p-[1px] border border-slate-200">
                  <div className={`h-full rounded-full transition-all duration-1000 ${stat.color === 'brand' ? 'bg-brand-500' : 'bg-' + stat.color + '-500'}`} style={{ width: `${stat.progress}%` }}></div>
                </div>
                <span className="text-[9px] font-black text-slate-600">{Math.round(stat.progress)}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Momentum & Competency charts... */}
        <div className="xl:col-span-2 bg-white p-14 rounded-[32px] border border-slate-200 shadow-sm space-y-12 min-h-[550px]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase tracking-wider">Course Progress</h3>
              <p className="text-slate-700 text-xs font-medium">Your progress across active courses</p>
            </div>
          </div>

          <div className="h-[400px] w-full min-h-[400px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={400}>
              <BarChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: '700', fill: '#475569' }} dy={15} />
                <YAxis domain={[0, 100]} allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: '600', fill: '#475569' }} />
                <Tooltip
                  cursor={{ fill: '#f1f5f9', radius: 12 }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.08)', padding: '16px' }}
                />
                <Bar dataKey="progress" radius={[8, 8, 0, 0]} barSize={48}>
                  {activityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.progress > 0 ? '#4850e5' : '#e2e8f0'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 rounded-[32px] p-14 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center min-h-[550px]">
          <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/10 rounded-full -mr-40 -mt-40 blur-3xl"></div>

          <div className="w-full text-center mb-12">
            <h3 className="text-xl font-black text-white tracking-widest uppercase">Competency Matrix</h3>
            <p className="text-slate-400 text-[10px] uppercase tracking-[0.25em] mt-1">Institutional Skill Index</p>
          </div>

          <div className="h-[320px] w-full min-h-[320px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={320}>
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fontWeight: '700', fill: 'rgba(255,255,255,0.6)' }} />
                <Radar name="Proficiency" dataKey="score" stroke="#4850e5" strokeWidth={2} fill="#4850e5" fillOpacity={0.3} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                  itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-12 w-full p-10 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-md">
            <p className="text-slate-400 text-[9px] font-bold uppercase tracking-[0.3em] mb-1">Elite Achievement</p>
            <p className="text-white font-black text-2xl tracking-tight">Advanced Analytics</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
