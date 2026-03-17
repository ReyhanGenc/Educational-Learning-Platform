const supabaseUrl = 'https://ltosxfpapsacxeulzcgj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0b3N4ZnBhcHNhY3hldWx6Y2dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0MDYxMDUsImV4cCI6MjA4Njk4MjEwNX0.TZqdOAVQwxgBpC64xYZcD-yxPrINOQ1NR_-a7Ltxsfk';

async function verify() {
  const headers = {
    'apikey': supabaseAnonKey,
    'Authorization': `Bearer ${supabaseAnonKey}`,
    'Content-Type': 'application/json'
  };
  
  const response = await fetch(`${supabaseUrl}/rest/v1/exams?select=id,title,subject&chapter_id=is.null&order=created_at.desc&limit=10`, {
    method: 'GET',
    headers: headers
  });

  if (!response.ok) {
    console.error('Error fetching exams:', await response.text());
    return;
  }

  const data = await response.json();
  console.log('--- Database Verification ---');
  console.log(`Found ${data.length} recent standalone exams:\n`);
  data.forEach((exam, i) => {
    console.log(`${i+1}. [${exam.subject}] ${exam.title} (ID: ${exam.id})`);
  });
}

verify();
