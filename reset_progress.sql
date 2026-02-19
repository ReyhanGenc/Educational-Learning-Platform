DO $$
BEGIN
    UPDATE enrollments 
    SET lesson_progress = '{}'::jsonb, 
        progress = 0, 
        completed_lesson_ids = ARRAY[]::uuid[],
        last_accessed_lesson_id = NULL;
END $$;
