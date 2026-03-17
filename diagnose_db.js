const supabaseUrl = 'https://ltosxfpapsacxeulzcgj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0b3N4ZnBhcHNhY3hldWx6Y2dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0MDYxMDUsImV4cCI6MjA4Njk4MjEwNX0.TZqdOAVQwxgBpC64xYZcD-yxPrINOQ1NR_-a7Ltxsfk';

async function diagnose() {
  const headers = {
    'apikey': supabaseAnonKey,
    'Authorization': `Bearer ${supabaseAnonKey}`,
    'Content-Type': 'application/json'
  };
  
  console.log('--- Diagnosing exam_results ---');
  
  // 1. Try a broad select to see what's actually there
  const res = await fetch(`${supabaseUrl}/rest/v1/exam_results?limit=1`, { headers });
  const data = await res.json();
  if (data.length > 0) {
    console.log('Columns found:', Object.keys(data[0]));
  } else {
    console.log('No rows. Checking existence of specific columns via individual selects...');
    const candidates = ['user_id', 'exam_id', 'score', 'answers', 'total_questions', 'correct_answers', 'time_spent_seconds', 'created_at', 'id'];
    for (const c of candidates) {
       const r = await fetch(`${supabaseUrl}/rest/v1/exam_results?select=${c}&limit=1`, { headers });
       console.log(`Column [${c}]: ${r.ok ? 'EXISTS' : 'MISSING (' + r.status + ')'}`);
    }
  }
}

diagnose();
