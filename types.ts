
export enum UserRole {
  STUDENT = 'STUDENT',
  INSTRUCTOR = 'INSTRUCTOR'
}

export interface Exam {
  id: string;
  title: string;
  subject: string;
  duration: number;
  questions: number;
  dateTime: string;
  priority: 'High' | 'Normal';
  color: string;
}

export interface Course {
  id: string;
  title: string;
  instructor: string;
  category: string;
  progress: number;
  completed: number;
  total: number;
  image: string;
  isPurchased?: boolean;
  price: number;

  // New fields from DB schema
  description?: string;
  level?: string;
  rating?: number;
  total_duration?: string;
  lesson_progress?: Record<string, { read: boolean; quiz_score?: number; scroll_percent?: number }>;
}

export interface Chapter {
  id: string;
  course_id: string;
  title: string;
  order: number;
  lessons?: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  duration: string;
  status: 'Completed' | 'Current' | 'Locked';

  // New fields from DB
  chapter_id?: string;
  order?: number;
  content?: string;
  video_url?: string;
  is_preview?: boolean;
}

export interface Result {
  id: string;
  subject: string;
  score: number;
  total: number;
  date: string;
  rank: string;
  status: 'Excellent' | 'Good' | 'Average';
  color: string;
}
