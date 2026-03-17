const supabaseUrl = 'https://ltosxfpapsacxeulzcgj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0b3N4ZnBhcHNhY3hldWx6Y2dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0MDYxMDUsImV4cCI6MjA4Njk4MjEwNX0.TZqdOAVQwxgBpC64xYZcD-yxPrINOQ1NR_-a7Ltxsfk';

async function verify() {
  const headers = { 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${supabaseAnonKey}` };
  const r = await fetch(`${supabaseUrl}/rest/v1/lessons?select=count`, { headers, method: 'GET' });
  const data = await r.json();
  console.log('Total lessons in DB:', data);
  
  const r2 = await fetch(`${supabaseUrl}/rest/v1/lessons?select=title&limit=10&order=created_at.desc`, { headers });
  const titles = await r2.json();
  console.log('Recent 10 lessons:', titles.map(t => t.title));
}
verify();
