const supabaseUrl = 'https://ltosxfpapsacxeulzcgj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0b3N4ZnBhcHNhY3hldWx6Y2dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0MDYxMDUsImV4cCI6MjA4Njk4MjEwNX0.TZqdOAVQwxgBpC64xYZcD-yxPrINOQ1NR_-a7Ltxsfk';

async function verify() {
  const headers = {
    'apikey': supabaseAnonKey,
    'Authorization': `Bearer ${supabaseAnonKey}`,
    'Content-Type': 'application/json'
  };
  
  // En son eklenen 5 kursu sorgula
  const response = await fetch(`${supabaseUrl}/rest/v1/courses?select=id,title,instructor,education_level&order=created_at.desc&limit=5`, {
    method: 'GET',
    headers: headers
  });

  if (!response.ok) {
    console.error('Error fetching courses:', await response.text());
    return;
  }

  const data = await response.json();
  
  // Toplam kurs sayısını sorgula
  const countResponse = await fetch(`${supabaseUrl}/rest/v1/courses?select=id`, {
    method: 'GET',
    headers: { ...headers, 'Prefer': 'count=exact' }
  });
  const totalCount = countResponse.headers.get('content-range')?.split('/')?.[1] || 'Unknown';

  console.log('--- Course Verification ---');
  console.log(`Total Courses in Database: ${totalCount}`);
  console.log(`\nMost recent 5 courses:`);
  data.forEach((course, i) => {
    console.log(`${i+1}. [${course.education_level}] ${course.title} by ${course.instructor}`);
  });
}

verify();
