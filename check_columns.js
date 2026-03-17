const supabaseUrl = 'https://ltosxfpapsacxeulzcgj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0b3N4ZnBhcHNhY3hldWx6Y2dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0MDYxMDUsImV4cCI6MjA4Njk4MjEwNX0.TZqdOAVQwxgBpC64xYZcD-yxPrINOQ1NR_-a7Ltxsfk';

async function checkColumns() {
  const headers = {
    'apikey': supabaseAnonKey,
    'Authorization': `Bearer ${supabaseAnonKey}`,
    'Content-Type': 'application/json'
  };
  
  // Try to get a single row with all columns
  const response = await fetch(`${supabaseUrl}/rest/v1/exam_results?limit=1`, {
    method: 'GET',
    headers: headers
  });

  const data = await response.json();
  if (data.length > 0) {
    console.log('Available columns in exam_results:', Object.keys(data[0]));
  } else {
    // If no data, try to fetch from postgrest / RPC if exists or just try common names
    console.log('No rows found. Attempting to inspect via a mock insert (aborting it)');
    // Just try common names via separate fetches
    const tries = ['created_at', 'inserted_at', 'timestamp', 'date', 'id'];
    for (const t of tries) {
      const res = await fetch(`${supabaseUrl}/rest/v1/exam_results?select=${t}&limit=1`, { headers });
      console.log(`Column ${t} exists:`, res.ok);
    }
  }
}

checkColumns();
