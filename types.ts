
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
  lessonsCompleted: number;
  totalLessons: number;
  imageUrl: string;
  isPurchased?: boolean;
  price?: number;
}

export interface Lesson {
  id: string;
  title: string;
  duration: string;
  status: 'Completed' | 'Current' | 'Locked';
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
