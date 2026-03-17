const supabaseUrl = 'https://ltosxfpapsacxeulzcgj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0b3N4ZnBhcHNhY3hldWx6Y2dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0MDYxMDUsImV4cCI6MjA4Njk4MjEwNX0.TZqdOAVQwxgBpC64xYZcD-yxPrINOQ1NR_-a7Ltxsfk';

async function checkSchema() {
  const headers = {
    'apikey': supabaseAnonKey,
    'Authorization': `Bearer ${supabaseAnonKey}`,
    'Content-Type': 'application/json'
  };
  
  // Fetch one row from exam_results to see keys
  const response = await fetch(`${supabaseUrl}/rest/v1/exam_results?limit=1`, {
    method: 'GET',
    headers: headers
  });

  if (!response.ok) {
    console.error('Error fetching exam_results:', await response.text());
    return;
  }

  const data = await response.json();
  if (data.length > 0) {
    console.log('Columns in exam_results:', Object.keys(data[0]));
  } else {
    console.log('No rows in exam_results to check columns.');
  }
}

checkSchema();
