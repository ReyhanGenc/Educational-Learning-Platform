-- The following allows safe execution on existing tables without deleting data
-- Create Exams Table
CREATE TABLE IF NOT EXISTS public.exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    duration INTEGER DEFAULT 60 NOT NULL, -- in minutes
    questions INTEGER DEFAULT 10 NOT NULL,
    date_time VARCHAR(100), -- Display schedule string
    status VARCHAR(50),
    color VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure newly added columns exist if the table was previously created
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 60 NOT NULL;
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS questions INTEGER DEFAULT 10 NOT NULL;
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS date_time VARCHAR(100);
ALTER TABLE public.exams ALTER COLUMN date_time TYPE VARCHAR(100);
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS status VARCHAR(50);
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS color VARCHAR(20);

-- Create Exam Questions Table
CREATE TABLE IF NOT EXISTS public.exam_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    options JSONB NOT NULL, -- e.g., [{"id":"A", "label":"..."}, {"id":"B", "label":"..."}]
    correct_option_id VARCHAR(10) NOT NULL,
    order_num INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Exam Results Table
CREATE TABLE IF NOT EXISTS public.exam_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    correct_answers INTEGER NOT NULL,
    incorrect_answers INTEGER NOT NULL,
    time_spent_seconds INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure newly added columns exist if the exam_results table was previously created
ALTER TABLE public.exam_results ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE public.exam_results ADD COLUMN IF NOT EXISTS total_questions INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE public.exam_results ADD COLUMN IF NOT EXISTS correct_answers INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE public.exam_results ADD COLUMN IF NOT EXISTS incorrect_answers INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE public.exam_results ADD COLUMN IF NOT EXISTS time_spent_seconds INTEGER DEFAULT 0 NOT NULL;

-- RLS Policies
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;

-- Allow reading exams and questions to everyone (or authenticated)
DROP POLICY IF EXISTS "Allow public read access to exams" ON public.exams;
CREATE POLICY "Allow public read access to exams" ON public.exams FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access to exam questions" ON public.exam_questions;
CREATE POLICY "Allow public read access to exam questions" ON public.exam_questions FOR SELECT USING (true);

-- Allow authenticated users to view their own results and insert new results
DROP POLICY IF EXISTS "Users can insert their own results" ON public.exam_results;
CREATE POLICY "Users can insert their own results" ON public.exam_results FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own results" ON public.exam_results;
CREATE POLICY "Users can view their own results" ON public.exam_results FOR SELECT USING (auth.uid() = user_id);

-- Insert Sample Exams
INSERT INTO public.exams (id, title, subject, duration, questions, date_time, status, color) VALUES
('b19283e7-0335-41e9-9069-0268ecf9cfda', 'Advanced Calculus Final Assessment', 'Mathematics', 120, 5, 'Dec 12 • 09:00 AM', 'Priority', 'brand'),
('c5356ba6-2ce9-4f7f-afbd-ff31bf5f8fc5', 'Introduction to Behavioral Science', 'Psychology', 90, 5, 'Dec 14 • 01:30 PM', 'Upcoming', 'purple')
ON CONFLICT (id) DO NOTHING;

-- Clear existing sample questions to avoid duplicates on re-runs
DELETE FROM public.exam_questions WHERE exam_id IN ('b19283e7-0335-41e9-9069-0268ecf9cfda', 'c5356ba6-2ce9-4f7f-afbd-ff31bf5f8fc5');

-- Insert Sample Questions for Exam 1 (Advanced Calculus)
INSERT INTO public.exam_questions (exam_id, question_text, options, correct_option_id, order_num) VALUES
('b19283e7-0335-41e9-9069-0268ecf9cfda', 'A student is calculating the derivative of f(x) = sin(x) * cos(x). Which of the following rules should be applied first to find the correct derivative?', '[{"id": "A", "label": "Power Rule"}, {"id": "B", "label": "Product Rule"}, {"id": "C", "label": "Quotient Rule"}, {"id": "D", "label": "Chain Rule"}]', 'B', 1),
('b19283e7-0335-41e9-9069-0268ecf9cfda', 'What is the integral of 1/x dx?', '[{"id": "A", "label": "x^2/2"}, {"id": "B", "label": "1/x^2"}, {"id": "C", "label": "ln(|x|)"}, {"id": "D", "label": "e^x"}]', 'C', 2),
('b19283e7-0335-41e9-9069-0268ecf9cfda', 'Find the limit of (sin x)/x as x approaches 0.', '[{"id": "A", "label": "0"}, {"id": "B", "label": "1"}, {"id": "C", "label": "Undefined"}, {"id": "D", "label": "Infinity"}]', 'B', 3),
('b19283e7-0335-41e9-9069-0268ecf9cfda', 'The derivative of e^(2x) is:', '[{"id": "A", "label": "e^(2x)"}, {"id": "B", "label": "2e^(2x)"}, {"id": "C", "label": "e^x"}, {"id": "D", "label": "x*e^(2x)"}]', 'B', 4),
('b19283e7-0335-41e9-9069-0268ecf9cfda', 'Which theorem states that if a function f is continuous on [a, b] and differentiable on (a, b), there exists a point c in (a, b) such that f''(c) = (f(b) - f(a)) / (b - a)?', '[{"id": "A", "label": "Fundamental Theorem of Calculus"}, {"id": "B", "label": "Mean Value Theorem"}, {"id": "C", "label": "Rolle''s Theorem"}, {"id": "D", "label": "Intermediate Value Theorem"}]', 'B', 5);

-- Insert Sample Questions for Exam 2 (Psychology)
INSERT INTO public.exam_questions (exam_id, question_text, options, correct_option_id, order_num) VALUES
('c5356ba6-2ce9-4f7f-afbd-ff31bf5f8fc5', 'Who is considered the father of psychoanalysis?', '[{"id": "A", "label": "Carl Jung"}, {"id": "B", "label": "B.F. Skinner"}, {"id": "C", "label": "Sigmund Freud"}, {"id": "D", "label": "Ivan Pavlov"}]', 'C', 1),
('c5356ba6-2ce9-4f7f-afbd-ff31bf5f8fc5', 'Which part of the brain is primarily responsible for emotion processing, particularly fear?', '[{"id": "A", "label": "Hippocampus"}, {"id": "B", "label": "Amygdala"}, {"id": "C", "label": "Cerebellum"}, {"id": "D", "label": "Frontal Lobe"}]', 'B', 2),
('c5356ba6-2ce9-4f7f-afbd-ff31bf5f8fc5', 'Operant conditioning is a concept developed by:', '[{"id": "A", "label": "John B. Watson"}, {"id": "B", "label": "Albert Bandura"}, {"id": "C", "label": "B.F. Skinner"}, {"id": "D", "label": "Jean Piaget"}]', 'C', 3),
('c5356ba6-2ce9-4f7f-afbd-ff31bf5f8fc5', 'The "Big Five" personality traits include:', '[{"id": "A", "label": "Introversion, Extroversion, Neuroticism, Psychoticism, Openness"}, {"id": "B", "label": "Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism"}, {"id": "C", "label": "Id, Ego, Superego, Conscious, Unconscious"}, {"id": "D", "label": "None of the above"}]', 'B', 4),
('c5356ba6-2ce9-4f7f-afbd-ff31bf5f8fc5', 'Which of these is NOT a stage of sleep?', '[{"id": "A", "label": "REM"}, {"id": "B", "label": "Stage 1"}, {"id": "C", "label": "Alpha"}, {"id": "D", "label": "Deep Sleep (Slow-wave)"}]', 'C', 5);
